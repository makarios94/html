"""Lengthen the silence before chosen lines of a VO read, and shift its word timings to match.

  python insert_pause.py VO.wav SCRIPT.txt --pause reveal:2.0 [--pause cta:1.2] [--words VO.wav.words.json]
         [--out-wav out.wav] [--out-words out.words.json] [--noise -38]

A read has the pauses it was read with (tts_local.ps1 puts one fixed pause between every line). A launch film often
wants one longer beat: the silence after the turn while a logo draws, a breath before the address. This finds the
real silence before each chosen line (ffmpeg silencedetect), inserts digital silence until the gap is the target in
seconds, and moves every later word timing by the same amount, so align_vo.py --words-from stays exact. Works on a
human read too (without --words it only edits the audio; run align_vo.py on the result).
"""
import argparse
import json
import re
import shutil
import subprocess
import sys

try:
    import numpy as np
    from scipy.io import wavfile
except ImportError:  # pragma: no cover
    sys.exit("insert_pause.py needs numpy and scipy:  python -m pip install --user numpy scipy")


def spoken_lines(script):
    out = []
    with open(script, encoding="utf-8") as fh:
        for raw in fh:
            s = raw.strip()
            if not s or s.startswith("#"):
                continue
            m = re.match(r"^\[([^\]]+)\]\s*(.*)$", s)
            cid, text = (m.group(1), m.group(2)) if m else (None, s)
            text = re.sub(r"\{([^|{}]*)\|([^{}]*)\}", r"\2", text)
            out.append((cid, text))
    return out


def silences(wav, noise):
    ff = shutil.which("ffmpeg") or sys.exit("ffmpeg not found on PATH")
    err = subprocess.run([ff, "-hide_banner", "-nostats", "-i", wav, "-af", f"silencedetect=noise={noise}dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    out, cur = [], None
    for line in err.splitlines():
        m = re.search(r"silence_start: (-?[\d.]+)", line)
        if m:
            cur = float(m.group(1))
        m = re.search(r"silence_end: ([\d.]+)", line)
        if m and cur is not None:
            out.append((max(0.0, cur), float(m.group(1))))
            cur = None
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("wav")
    ap.add_argument("script")
    ap.add_argument("--pause", action="append", required=True, help="CUE:SECONDS, the silence wanted before that line")
    ap.add_argument("--words", help="the read's word timings (tts_local.ps1 writes <wav>.words.json)")
    ap.add_argument("--out-wav")
    ap.add_argument("--out-words")
    ap.add_argument("--noise", type=float, default=-38.0, help="silence threshold in dB")
    a = ap.parse_args()

    lines = spoken_lines(a.script)
    ids = [c for c, _ in lines]
    counts = [len(t.split()) for _, t in lines]
    data = None
    words = None
    if a.words:
        with open(a.words, encoding="utf-8-sig") as fh:
            data = json.load(fh)
        words = data["words"] if isinstance(data, dict) else data
        if len(words) != sum(counts):
            sys.exit(f"word count mismatch: {len(words)} timed words vs {sum(counts)} in the script")

    sr, x = wavfile.read(a.wav)
    sil = silences(a.wav, a.noise)
    edits = []
    for item in a.pause:
        cue, _, secs = item.partition(":")
        if cue not in ids or not secs:
            sys.exit(f"--pause {item}: give CUE:SECONDS with a cue from {a.script} ({', '.join(i for i in ids if i)})")
        k = ids.index(cue)
        if k == 0:
            sys.exit(f"[{cue}] is the first line; there is no pause before it")
        if words is not None:
            line_start = words[sum(counts[:k])]["start"]
        else:
            # without word timings, the k-th long silence (one per line break) marks the line
            long_gaps = [s for s in sil if s[1] - s[0] >= 0.25 and s[0] > 0.05]
            if len(long_gaps) < k:
                sys.exit(f"found {len(long_gaps)} pauses in the read, need at least {k} to place [{cue}]; pass --words")
            line_start = long_gaps[k - 1][1]
        best = min(sil, key=lambda s: abs(s[1] - line_start)) if sil else None
        if not best or abs(best[1] - line_start) > 0.25:
            sys.exit(f"no silence found just before [{cue}] at {line_start:.2f}s")
        edits.append((best[1], best[1] - best[0], float(secs), cue))

    # every position below is in the original read's timeline; the cuts slice the original audio
    edits.sort()
    orig = [w["start"] for w in words] if words is not None else []
    shift = 0.0
    pieces, last = [], 0
    report = []
    for at, current, target, cue in edits:
        add = max(0.0, target - current)
        cut = int(round((at - 0.04) * sr))
        pieces += [x[last:cut], np.zeros((int(round(add * sr)),) + x.shape[1:], dtype=x.dtype)]
        last = cut
        for i, w in enumerate(words or []):
            if orig[i] >= at - 0.05:
                w["start"] = round(w["start"] + add, 3)
                w["end"] = round(w["end"] + add, 3)
        shift += add
        report.append(f"[{cue}] gap {current:.2f}s -> {max(current, target):.2f}s (+{add:.2f}s)")
    pieces.append(x[last:])
    y = np.concatenate(pieces)
    out_wav = a.out_wav or a.wav
    wavfile.write(out_wav, sr, y)
    print("\n".join(report))
    print(f"wrote {out_wav} ({len(y) / sr:.2f}s, +{shift:.2f}s)")
    if words is not None:
        if isinstance(data, dict):
            data["words"] = words
            data["edited"] = "; ".join(report)
        out_words = a.out_words or a.words
        with open(out_words, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=1)
        print(f"wrote {out_words}; now run align_vo.py with --words-from it")


if __name__ == "__main__":
    main()
