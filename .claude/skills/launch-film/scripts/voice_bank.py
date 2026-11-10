"""The skill's bank of directed, checked voiceovers: list them, bank a new one, or put one into a film.

  python voice_bank.py list
  python voice_bank.py use VOICE PROJECT [--film example-launch]
  python voice_bank.py add VOICE --wav final.wav --captions captions.json --voice-id ID --name "Name"
         --gender female --accent en-nigerian [--verdict "..."] [--note "..."] [--film example-launch]

Every read in the bank was made for one film's script (voice.json names the film and fingerprints its script) and went
through the skill's chain: a directed take, audition, a pickup where one line needed it, tighten_vo.py, vo_check.py and
check_captions.py. `use` drops a read and its checked captions into PROJECT/public/films/<film>/vo.wav and
PROJECT/src/films/<film>/data/, then rescores the music to it (score_beds.py), so the film renders in that voice and
nothing else changes; the read it replaces is kept once as vo.previous.wav. It refuses when the film's script.txt is
not the one the read was made for, because the captions would not match. For a new script the bank still shows how
each voice takes direction: generate a new take with the voice_id in voice.json. `add` banks a finished read the
same way (lossless FLAC, its captions, its measurements and the listener's verdict) and rewrites the bank's README.
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
BANK = os.path.join(SKILL, "assets", "voice-bank")
STARTER = os.path.join(SKILL, "assets", "remotion-starter")
sys.path.insert(0, HERE)


def ffmpeg():
    return shutil.which("ffmpeg") or sys.exit("voice_bank: ffmpeg not found on PATH")


def script_print(path):
    """Fingerprint of a script's spoken lines (comments and blank lines ignored)."""
    with open(path, encoding="utf-8-sig") as fh:
        lines = [ln.strip() for ln in fh if ln.strip() and not ln.strip().startswith("#")]
    return hashlib.sha1("\n".join(lines).encode("utf-8")).hexdigest()[:12]


def voices():
    out = []
    if os.path.isdir(BANK):
        for d in sorted(os.listdir(BANK)):
            f = os.path.join(BANK, d, "voice.json")
            if os.path.isfile(f):
                with open(f, encoding="utf-8") as fh:
                    out.append(json.load(fh))
    return out


def write_readme():
    vs = voices()
    rows = "\n".join(
        f"| `{v['id']}` | {v['name']} | {v['gender']} | {v['accent']} | `{v['voice_id']}` | {v['length_s']} s | "
        f"{v['measured']['verdict']} | {v['verdict']} |" for v in vs)
    text = f"""# Voice bank

Directed, checked voiceovers the skill has made and a listener has kept. Each folder holds the read (`vo.flac`,
lossless), its checked captions (`captions.json`, `.srt`, `.vtt`) and `voice.json` (the voice ID to generate new takes
with, the film and script it was made for, its measurements and the verdict).

| Bank id | Voice | Gender | Accent | voice_id | Length | vo_check | Verdict |
|---|---|---|---|---|---|---|---|
{rows}

Put one into a film whose script it was made for (the example launch film for all of these):

```bash
python scripts/voice_bank.py use pastie <project>
```

It copies the read and its captions into the film and rescores the music to it; render as usual, under its own slug
(`finish.py finals <project> ExampleLaunch <out> --slug paidly_launch_naija_female`). For a different script, use the
voice_id for a new take with the same `vo-direction.txt` approach, then the usual chain. Bank a finished read with
`voice_bank.py add`.
"""
    with open(os.path.join(BANK, "README.md"), "w", encoding="utf-8") as fh:
        fh.write(text)


def cmd_list(_a):
    vs = voices()
    if not vs:
        print("the bank is empty")
        return
    for v in vs:
        m = v["measured"]
        print(f"{v['id']:<12} {v['name'][:34]:<34} {v['gender']:<7} {v['accent']:<12} {v['length_s']:>5} s  "
              f"{m['verdict']:<15} film {v['film']}")
        print(f"{'':<12} voice_id {v['voice_id']}; {v['verdict']}")


def cmd_add(a):
    import vo_check  # noqa: E402
    from align_vo import write_subs  # noqa: E402
    vid = re.sub(r"[^a-z0-9-]+", "-", a.voice.lower()).strip("-")
    dest = os.path.join(BANK, vid)
    os.makedirs(dest, exist_ok=True)
    subprocess.run([ffmpeg(), "-y", "-v", "error", "-i", a.wav, "-ac", "1", "-ar", "48000", "-c:a", "flac", "-compression_level", "8",
                    os.path.join(dest, "vo.flac")], check=True)
    with open(a.captions, encoding="utf-8") as fh:
        cap = json.load(fh)
    cap["source"] = "vo.wav"
    with open(os.path.join(dest, "captions.json"), "w", encoding="utf-8") as fh:
        json.dump(cap, fh, indent=1, ensure_ascii=False)
    write_subs(os.path.join(dest, "captions"), cap["phrases"])
    m = vo_check.analyse(a.wav, a.captions)
    head, notes = vo_check.verdict(m)
    script = os.path.join(STARTER, "src", "films", a.film, "script.txt")
    meta = {
        "id": vid, "name": a.name, "voice_id": a.voice_id, "provider": a.provider, "gender": a.gender, "accent": a.accent,
        "film": a.film, "script_print": script_print(script) if os.path.isfile(script) else None,
        "direction": f"assets/remotion-starter/src/films/{a.film}/vo-direction.txt",
        "length_s": round(float(cap.get("duration") or 0), 1),
        "measured": {"verdict": head, "median_pitch_hz": m["median_pitch_hz"], "pitch_range_st": m["pitch_range"],
                     "melody_st": m["melody"], "register_st": m["register"], "pause_share": m["pause_share"],
                     "pace_wps": (m.get("pace") or {}).get("overall"), "level_range_db": m["level_range_db"],
                     "notes": [n.strip() for n in notes if "PASS" not in n]},
        "verdict": a.verdict, "note": a.note, "score_args": a.score_args,
        "banked": datetime.date.today().isoformat(),
    }
    with open(os.path.join(dest, "voice.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=1, ensure_ascii=False)
    write_readme()
    print(f"banked {vid}: {a.name}, {meta['length_s']} s, vo_check {head}")


def cmd_use(a):
    src = os.path.join(BANK, a.voice)
    meta_path = os.path.join(src, "voice.json")
    if not os.path.isfile(meta_path):
        sys.exit(f"voice_bank: no voice '{a.voice}' (have: {', '.join(v['id'] for v in voices())})")
    with open(meta_path, encoding="utf-8") as fh:
        meta = json.load(fh)
    film = a.film or meta["film"]
    pub = os.path.join(a.project, "public", "films", film)
    data = os.path.join(a.project, "src", "films", film, "data")
    script = os.path.join(a.project, "src", "films", film, "script.txt")
    if not os.path.isdir(data) or not os.path.isfile(script):
        sys.exit(f"voice_bank: {film} not found in {a.project} (src/films/{film}/script.txt and data/ are needed)")
    if meta.get("script_print") and script_print(script) != meta["script_print"] and not a.force:
        sys.exit(f"voice_bank: {film}'s script.txt is not the one this read was made for, so its captions would not match. "
                 f"Generate a new take with voice_id {meta['voice_id']} instead (or pass --force for a timing draft).")
    os.makedirs(pub, exist_ok=True)
    vo = os.path.join(pub, "vo.wav")
    if os.path.exists(vo):
        shutil.copy2(vo, os.path.join(pub, "vo.previous.wav"))
    subprocess.run([ffmpeg(), "-y", "-v", "error", "-i", os.path.join(src, "vo.flac"), "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", vo], check=True)
    stale = vo + ".words.json"
    if os.path.exists(stale):
        os.remove(stale)
    for ext in ("json", "srt", "vtt"):
        shutil.copy2(os.path.join(src, f"captions.{ext}"), os.path.join(data, f"captions.{ext}"))
    args = meta.get("score_args") or ["--turn", "turn", "--reveal", "reveal", "--cta", "cta", "--lead", "4"]
    subprocess.run([sys.executable, os.path.join(HERE, "score_beds.py"), os.path.join(data, "captions.json"), pub] + args, check=True)
    print(f"{film} now speaks in {meta['name']} ({meta['length_s']} s); music rescored. Render it under its own slug.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list")
    u = sub.add_parser("use")
    u.add_argument("voice")
    u.add_argument("project")
    u.add_argument("--film")
    u.add_argument("--force", action="store_true")
    d = sub.add_parser("add")
    d.add_argument("voice")
    d.add_argument("--wav", required=True)
    d.add_argument("--captions", required=True)
    d.add_argument("--voice-id", required=True)
    d.add_argument("--name", required=True)
    d.add_argument("--gender", required=True)
    d.add_argument("--accent", required=True)
    d.add_argument("--provider", default="ElevenLabs (creative connector), eleven_v4")
    d.add_argument("--verdict", default="")
    d.add_argument("--note", default="")
    d.add_argument("--film", default="example-launch")
    d.add_argument("--score-args", nargs=argparse.REMAINDER, default=["--turn", "turn", "--reveal", "reveal", "--cta", "cta", "--lead", "4"])
    a = ap.parse_args()
    {"list": cmd_list, "add": cmd_add, "use": cmd_use}[a.cmd](a)


if __name__ == "__main__":
    main()
