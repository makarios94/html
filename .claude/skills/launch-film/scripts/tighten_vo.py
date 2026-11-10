"""Close the slack in a VO read: shorten the pauses between lines in proportion, keep the beats, cut only silence.

  python tighten_vo.py VO.wav --captions captions.json [--gap 0.24] [--keep turn:0.45] [--floor 0.15]
         [--out tight.wav] [--out-captions tight.json] [--silence-db -60]

An edited ad read keeps moving. The editor closes the gaps between lines and leaves the longer silences where the
story needs a beat, before and after the turn. TTS takes and human reads both arrive looser: a smooth ElevenLabs take
paused for 15 percent of its read, with about 0.3 s between ordinary lines and 0.6 s either side of the turn.

This shortens every pause between caption phrases by the same factor, chosen so the median pause lands on --gap. One
factor keeps the read's rhythm: long beats stay long, short breaths stay short, and the pauses keep their variety.
Setting every gap to one length makes them uniform, which vo_check.py flags as a machine read. --keep CUE:SECONDS
pins the pause before that line at a set length instead. Pauses at or
under --floor are left alone, and none is cut below it. Only true silence is removed: frames far below the read's own
speech level, minus a margin at each side, so word tails, breaths and onsets stay whole. A pause that holds a breath
is left whole, and a beat (a pause half again the median or longer) ends at least 0.1 s longer than any such pause
that was shorter in the read, so the beats stay the longest pauses. Every cut is crossfaded, and
every word and phrase timing moves by exactly the silence removed before it, so no re-alignment is needed
(insert_pause.py lengthens a pause). Without --out the read is edited in place and the original is kept once beside it
as <name>.untightened.wav, the captions as <name>.untightened.json. Measure pauses on the dry read: under a music bed
the silence is gone and whisper timings blur the gaps.

Next: vo_check.py on the result, score_beds.py (the music follows the new timing), then render.
"""
import argparse
import json
import os
import shutil
import sys

try:
    import numpy as np
    from scipy.io import wavfile
except ImportError:  # pragma: no cover
    sys.exit("tighten_vo.py needs numpy and scipy:  python -m pip install --user numpy scipy")

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from align_vo import write_subs  # noqa: E402

HOP = 0.005     # analysis frame, seconds
MARGIN = 0.04   # silence left untouched at each edge of a pause
FADE = 0.006    # crossfade across each cut
WIDEN = 0.06    # caption edges are fitted to speech at -38 dB; look this far past them for the silence
BEAT_LEAD = 0.1  # a beat ends at least this much longer than any shorter pause that had to be left whole


def to_float(x):
    if np.issubdtype(x.dtype, np.integer):
        return x.astype(np.float64) / float(np.iinfo(x.dtype).max)
    return x.astype(np.float64)


def from_float(y, dtype):
    if np.issubdtype(dtype, np.integer):
        info = np.iinfo(dtype)
        return np.clip(np.round(y * info.max), info.min, info.max).astype(dtype)
    return y.astype(dtype)


def frame_db(mono, sr):
    h = max(1, int(round(sr * HOP)))
    n = len(mono) // h
    fr = mono[: n * h].reshape(n, h)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9), h


def silent_runs(db, h, sr, thr, t0, t1):
    """(start, end) in seconds of the runs of frames under thr between t0 and t1."""
    f0, f1 = max(0, int(t0 * sr / h)), min(len(db), int(np.ceil(t1 * sr / h)))
    runs, cur = [], None
    for f in range(f0, f1):
        if db[f] < thr:
            if cur is None:
                cur = f
        elif cur is not None:
            runs.append((cur * h / sr, f * h / sr))
            cur = None
    if cur is not None:
        runs.append((cur * h / sr, f1 * h / sr))
    return runs


def shifter(removed):
    def shift(t):
        out = t
        for r0, r1 in removed:
            if t >= r1:
                out -= r1 - r0
            elif t > r0:
                out -= t - r0
        return round(max(0.0, out), 3)
    return shift


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("wav")
    ap.add_argument("--captions", required=True, help="captions.json written by align_vo.py for this read")
    ap.add_argument("--gap", type=float, default=0.24,
                    help="median pause wanted between lines in seconds (default 0.24); every pause is scaled by the same factor")
    ap.add_argument("--keep", action="append", default=[], help="CUE:SECONDS, a beat: the pause before that line is set to this length")
    ap.add_argument("--floor", type=float, default=0.15, help="pauses this short are left alone, and none is cut below it (default 0.15)")
    ap.add_argument("--out", help="output wav (default: edit in place, the original kept as <name>.untightened.wav)")
    ap.add_argument("--out-captions", help="output captions.json (default: in place); srt and vtt are written beside it")
    ap.add_argument("--silence-db", type=float, help="silence threshold in dBFS (default: 45 dB under the read's speech level)")
    a = ap.parse_args()

    with open(a.captions, encoding="utf-8") as fh:
        cap = json.load(fh)
    phrases, words = cap.get("phrases") or [], cap.get("words") or []
    if len(phrases) < 2:
        sys.exit("the captions need two or more phrases (run align_vo.py with --script first)")
    ids = [p.get("id") for p in phrases]
    keep = {}
    for item in a.keep:
        cue, _, secs = item.partition(":")
        if cue not in ids or not secs:
            sys.exit(f"--keep {item}: give CUE:SECONDS with a cue from the captions ({', '.join(i for i in ids if i)})")
        if ids.index(cue) == 0:
            sys.exit(f"[{cue}] is the first line; there is no pause before it")
        keep[cue] = float(secs)

    sr, x = wavfile.read(a.wav)
    xf = to_float(x)
    mono = xf.mean(axis=1) if xf.ndim > 1 else xf
    db, h = frame_db(mono, sr)
    inside = [db[int(p["start"] * sr / h): int(p["end"] * sr / h)] for p in phrases]
    inside = [s for s in inside if len(s)]
    level = float(np.percentile(np.concatenate(inside) if inside else db, 90))
    noise = float(np.percentile(db, 5))
    thr = a.silence_db if a.silence_db is not None else max(level - 45.0, noise + 4.0)

    gaps = [phrases[k + 1]["start"] - phrases[k]["end"] for k in range(len(phrases) - 1)]
    free = [g for k, g in enumerate(gaps) if g > a.floor and phrases[k + 1].get("id") not in keep]
    scale = min(1.0, a.gap / float(np.median(free))) if free else 1.0
    if free:
        report_head = f"pauses scaled by {scale:.2f} (median {float(np.median(free)):.2f}s -> {float(np.median(free)) * scale:.2f}s)"
    else:
        report_head = "no free pauses to scale"

    targets = [keep[phrases[k + 1].get("id")] if phrases[k + 1].get("id") in keep
               else (g if g <= a.floor else max(a.floor, g * scale)) for k, g in enumerate(gaps)]

    def plan(k, target):
        """The cuts that bring pause k toward its target, and how much silence they take."""
        need = gaps[k] - target
        if need < 0.02:
            return [], 0.0
        runs = silent_runs(db, h, sr, thr, phrases[k]["end"] - WIDEN, phrases[k + 1]["start"] + WIDEN)
        spans = sorted(((r0 + MARGIN, r1 - MARGIN) for r0, r1 in runs if r1 - r0 > 2 * MARGIN + 0.01),
                       key=lambda s: s[1] - s[0], reverse=True)
        out, took = [], 0.0
        for s0, s1 in spans:
            c = min(need - took, s1 - s0)
            if c < 0.01:
                break
            mid = (s0 + s1) / 2
            out.append((mid - c / 2, mid + c / 2))
            took += c
            if need - took < 0.01:
                break
        return out, took

    # A pause that holds a breath is left whole, and a beat scaled by the common factor can come out shorter than it:
    # on Pastie's 30 s Coridr read the beat before the turn (0.74 s) came out 0.45 s, under two breaths left whole at
    # 0.49 and 0.52 s, so the turn no longer came after the read's longest pause. So a beat (a pause half again the
    # median or longer) ends at least BEAT_LEAD longer than every pause left whole that was shorter in the read.
    first = [plan(k, t) for k, t in enumerate(targets)]
    whole = [(g, g - first[k][1]) for k, g in enumerate(gaps) if g - targets[k] - first[k][1] > 0.03]
    plans, raised = list(first), {}
    if free and whole:
        beat = 1.5 * float(np.median(free))
        for k, g in enumerate(gaps):
            if phrases[k + 1].get("id") in keep or g < beat:
                continue
            least = min(g, max((fin + BEAT_LEAD for orig, fin in whole if orig < g), default=0.0))
            if least > g - first[k][1] + 0.03:
                plans[k] = plan(k, least)
                raised[k] = g - first[k][1]

    cuts, report = [], [report_head]
    for k in range(len(phrases) - 1):
        q, cur, target = phrases[k + 1], gaps[k], targets[k]
        out, took = plans[k]
        if k in raised:
            cuts += out
            report.append(f"[{q.get('id')}] pause {cur:.2f}s -> {cur - took:.2f}s (a beat, held longer than the pauses "
                          f"left whole; the common factor gave {raised[k]:.2f}s)")
            continue
        need = cur - target
        if need < 0.02:
            if cur > 0.05:
                report.append(f"[{q.get('id')}] pause {cur:.2f}s kept (target {target:.2f}s)")
            continue
        cuts += out
        line = f"[{q.get('id')}] pause {cur:.2f}s -> {cur - took:.2f}s"
        if need - took > 0.03:
            line += f" (target {target:.2f}s; the rest of this pause is breath or sound, left whole)"
        report.append(line)

    if not cuts:
        print("\n".join(report))
        print("nothing to tighten: every pause is at or under its target")
        return

    f = max(1, int(round(FADE * sr)))
    ramp = np.linspace(0.0, 1.0, f, endpoint=False)
    if xf.ndim > 1:
        ramp = ramp[:, None]
    pieces, last, removed = [], 0, []
    for c0, c1 in sorted(cuts):
        s0, s1 = int(round(c0 * sr)), int(round(c1 * sr))
        if s1 - s0 < f or s1 + f > len(xf):
            continue
        pieces.append(xf[last:s0])
        pieces.append(xf[s0:s0 + f] * (1 - ramp) + xf[s1:s1 + f] * ramp)
        last = s1 + f
        removed.append((s0 / sr, s1 / sr))
    pieces.append(xf[last:])
    y = np.concatenate(pieces)
    shift = shifter(removed)
    for w in words:
        w["start"], w["end"] = shift(w["start"]), shift(w["end"])
    for p in phrases:
        p["start"], p["end"] = shift(p["start"]), shift(p["end"])
    total = sum(r1 - r0 for r0, r1 in removed)
    cap["duration"] = round(len(y) / sr, 3)  # no new keys: the films cast this file to the kit's Captions type

    out_wav, out_cap = a.out or a.wav, a.out_captions or a.captions
    if not a.out:
        bak = os.path.splitext(a.wav)[0] + ".untightened.wav"
        if not os.path.exists(bak):
            shutil.copy2(a.wav, bak)
    else:
        cap["source"] = os.path.basename(out_wav)
    if not a.out_captions:
        bak = os.path.splitext(a.captions)[0] + ".untightened.json"
        if not os.path.exists(bak):
            shutil.copy2(a.captions, bak)
    wavfile.write(out_wav, sr, from_float(y, x.dtype))
    with open(out_cap, "w", encoding="utf-8") as fh:
        json.dump(cap, fh, indent=1, ensure_ascii=False)
    write_subs(os.path.splitext(out_cap)[0], phrases)
    side = a.wav + ".words.json"  # word timings a local TTS wrote beside the read: same take, so shift them too
    if os.path.exists(side):
        with open(side, encoding="utf-8-sig") as fh:
            data = json.load(fh)
        for w in (data["words"] if isinstance(data, dict) else data):
            w["start"], w["end"] = shift(w["start"]), shift(w["end"])
        with open(out_wav + ".words.json", "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=1)

    print("\n".join(report))
    print(f"silence under {thr:.0f} dBFS (speech level {level:.0f} dBFS): {len(removed)} cut(s), {total:.2f}s removed")
    print(f"wrote {out_wav} ({len(y) / sr:.2f}s) and {out_cap} with srt and vtt beside it")
    print("next: vo_check.py on it, then score_beds.py so the music follows the new timing, then render")


if __name__ == "__main__":
    main()
