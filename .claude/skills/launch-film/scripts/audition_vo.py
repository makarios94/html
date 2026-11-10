"""Audition voiceover takes: align each to the script, measure its delivery, rank them, install the best.

  python audition_vo.py TAKE1 [TAKE2 ...] --script src/films/<id>/script.txt
         [--install public/films/<id> src/films/<id>/data] [--fps 30]

Every take is converted to 48 kHz WAV, aligned with align_vo.py (script spelling, whisper timing, phrases fitted to
the real speech) and measured with vo_check.py. Takes are ranked by how many delivery floors they miss, then by how
much their lines move against each other (register, pause and pace variety), then by pace closest to a storytelling
2.9 words per second. With --install the winner becomes <public>/vo.wav and its captions.json, .srt and .vtt go into
<data>. Listen to the winner before it ships; the numbers catch a flat read, not a wrong reading of a line.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vo_check  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("takes", nargs="+")
    ap.add_argument("--script", required=True)
    ap.add_argument("--install", nargs=2, metavar=("PUBLIC_DIR", "DATA_DIR"))
    ap.add_argument("--fps", type=int, default=30)
    a = ap.parse_args()
    ff = shutil.which("ffmpeg") or sys.exit("ffmpeg not found on PATH")
    work = tempfile.mkdtemp(prefix="audition_")
    rows = []
    for k, take in enumerate(a.takes, 1):
        d = os.path.join(work, f"take{k}")
        os.makedirs(d)
        wav = os.path.join(d, "vo.wav")
        subprocess.run([ff, "-y", "-v", "error", "-i", take, "-ac", "1", "-ar", "48000", wav], check=True)
        cap = os.path.join(d, "captions.json")
        r = subprocess.run([sys.executable, os.path.join(HERE, "align_vo.py"), wav, "--script", a.script, "--out", cap, "--fps", str(a.fps)], capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(cap):
            print(f"take {k}: alignment failed\n{(r.stderr or r.stdout)[-800:]}")
            continue
        low_match = "LOW MATCH" in (r.stdout + r.stderr)
        # a phrase far off the read's own pace: its caption edge may sit on the wrong pause (align_vo prints CHECK)
        check = next((ln.strip() for ln in (r.stdout + r.stderr).splitlines() if ln.startswith("CHECK:")), "")
        with open(cap, encoding="utf-8") as fh:
            dur = float(json.load(fh).get("duration") or 0)
        m = vo_check.analyse(wav, cap)
        head, notes = vo_check.verdict(m)
        misses = sum(1 for n in notes if any(f in n for f in ("FLAT", "RUSHED", "HALTING", "SLOW")))
        movement = (m.get("register") or 0) / 1.5 + (m.get("pause_spread") or 0) / 0.3 + (m.get("pace_spread") or 0) / 0.25
        pace = (m.get("pace") or {}).get("overall") or 0
        rows.append({"k": k, "take": take, "wav": wav, "dir": d, "head": head, "notes": notes + ([f"  {check}"] if check else []),
                     "misses": misses + (5 if low_match else 0) + (1 if check else 0),
                     "movement": movement, "pace": pace, "low_match": low_match, "m": m, "dur": dur})
    if not rows:
        sys.exit("no take could be aligned")
    rows.sort(key=lambda x: (x["misses"], -x["movement"], abs(x["pace"] - 2.9)))
    for x in rows:
        m = x["m"]
        print(f"\ntake {x['k']}: {os.path.basename(x['take'])}  {x['head']}{'  LOW MATCH: the read differs from the script' if x['low_match'] else ''}")
        print(f"  register {m['register']} st, melody {m['melody']} st, range {m['pitch_range']} st, pauses {m['pauses']['min']} to {m['pauses']['max']} s "
              f"({round(100 * (m.get('pause_share') or 0))} percent of the read), pace {m['pace']['overall']} words/s, line levels {m['level_range_db']} dB, "
              f"length {x['dur']:.1f} s")
        for n in x["notes"]:
            if "PASS" not in n:
                print(n)
    best = rows[0]
    print(f"\nbest: take {best['k']} ({os.path.basename(best['take'])})")
    if best["head"] != "PERFORMS":
        print("WARNING: no take performs. Fine as a timing draft; before anything ships, re-direct the lines vo_check "
              "flagged (more contrast between tags, a longer beat at the turn, a slower pace) and take again.")
    if a.install:
        pub, data = a.install
        os.makedirs(pub, exist_ok=True)
        os.makedirs(data, exist_ok=True)
        shutil.copy2(best["wav"], os.path.join(pub, "vo.wav"))
        stale = os.path.join(pub, "vo.wav.words.json")
        if os.path.exists(stale):
            os.remove(stale)
        for ext in ("json", "srt", "vtt"):
            src = os.path.join(best["dir"], f"captions.{ext}")
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(data, f"captions.{ext}"))
        print(f"installed: {os.path.join(pub, 'vo.wav')} and captions in {data}. Next: score_beds.py, then render.")
    shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
