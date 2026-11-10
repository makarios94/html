"""Re-voice one line of a read you like: splice a pickup take over it, matched to its neighbours, inside the pauses.

  python pickup_line.py VO.wav --captions captions.json --cue silence --take pick1.mp3 [--take pick2.mp3]
         [--out fixed.wav] [--out-captions fixed.json] [--gain-db 0]

A take that lands everywhere except one line (a whisper the direction did not want, a misread word, a flat button) is
worth keeping. Voice actors fix that with a pickup: the same voice reads just that line again and the editor drops it
in. TTS works the same way: generate the line alone with the same voice, model and tag as the lines around it (a few
credits instead of a full take), then run this.

It finds the line's speech between the pauses that frame it, ranks the pickup takes by how close their pitch sits to
the neighbouring lines, trims each take's own silence, sets the chosen take's speech level to the neighbours' (plus
--gain-db) and swaps it in with short fades inside the pauses, so both pauses keep their length. It prints the old
line, each take and the neighbours side by side: level and median pitch are what make a line sound hushed (tested:
the Paidly line heard as a whisper measured as voiced as its neighbours, but 2.7 dB quieter and 8 semitones lower).
Later captions move by the change in length and the line's own words are spread over the new read. Then: align_vo.py
on the result for exact word cues, tighten_vo.py, vo_check.py and score_beds.py as usual. Listen to the join.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

try:
    import numpy as np
    from scipy.io import wavfile
except ImportError:  # pragma: no cover
    sys.exit("pickup_line.py needs numpy and scipy:  python -m pip install --user numpy scipy")

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vo_check  # noqa: E402  (decode, yin: the same pitch tracker the read was measured with)
from align_vo import write_subs  # noqa: E402

HOP = 0.005    # analysis frame for edges and levels, seconds
PAD = 0.012    # silence kept at each end of the pickup
FADE = 0.005   # fade at each end of the pickup


def to_float(x):
    if np.issubdtype(x.dtype, np.integer):
        return x.astype(np.float64) / float(np.iinfo(x.dtype).max)
    return x.astype(np.float64)


def from_float(y, dtype):
    if np.issubdtype(dtype, np.integer):
        info = np.iinfo(dtype)
        return np.clip(np.round(y * info.max), info.min, info.max).astype(dtype)
    return y.astype(dtype)


def decode_at(path, sr):
    ff = shutil.which("ffmpeg") or sys.exit("ffmpeg not found on PATH")
    raw = subprocess.run([ff, "-v", "error", "-i", path, "-map", "0:a:0", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def frame_db(mono, sr):
    h = max(1, int(round(sr * HOP)))
    n = len(mono) // h
    fr = mono[: n * h].reshape(n, h)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9), h


def longest_quiet(db, h, sr, thr, t0, t1):
    """The longest run of frames under thr between t0 and t1, as (start, end) seconds, or None."""
    f0, f1 = max(0, int(t0 * sr / h)), min(len(db), int(np.ceil(t1 * sr / h)))
    best, cur = None, None
    for f in range(f0, f1 + 1):
        quiet = f < f1 and db[f] < thr
        if quiet and cur is None:
            cur = f
        elif not quiet and cur is not None:
            if best is None or f - cur > best[1] - best[0]:
                best = (cur, f)
            cur = None
    return (best[0] * h / sr, best[1] * h / sr) if best else None


def speech_level(seg, sr):
    """RMS level in dBFS of the voiced part of a segment (frames within 20 dB of its loud end)."""
    db, _ = frame_db(seg, sr)
    if not len(db):
        return -120.0
    loud = db[db > np.percentile(db, 90) - 20]
    return float(10 * np.log10(np.mean(10 ** (loud / 10)))) if len(loud) else -120.0


def median_pitch(seg16):
    f0, _ = vo_check.yin(seg16)
    voiced = f0[~np.isnan(f0)]
    return float(np.median(voiced)) if len(voiced) else float("nan")


def trim(take, sr):
    db, h = frame_db(take, sr)
    thr = np.percentile(db, 90) - 45
    on = np.where(db > thr)[0]
    if not len(on):
        return take
    a = max(0, on[0] * h - int(PAD * sr))
    b = min(len(take), (on[-1] + 1) * h + int(PAD * sr))
    return take[a:b]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("wav")
    ap.add_argument("--captions", required=True, help="captions.json written by align_vo.py for this read")
    ap.add_argument("--cue", required=True, help="the [id] of the line to replace")
    ap.add_argument("--take", action="append", required=True, help="a pickup take of that line alone (any audio format)")
    ap.add_argument("--out", help="output wav (default: edit in place, the original kept as <name>.before-pickup.wav)")
    ap.add_argument("--out-captions", help="output captions.json (default: in place); srt and vtt are written beside it")
    ap.add_argument("--gain-db", type=float, default=0.0, help="level of the pickup against its neighbours (default 0)")
    a = ap.parse_args()

    with open(a.captions, encoding="utf-8") as fh:
        cap = json.load(fh)
    phrases, words = cap.get("phrases") or [], cap.get("words") or []
    ids = [p.get("id") for p in phrases]
    if a.cue not in ids:
        sys.exit(f"--cue {a.cue}: not in the captions ({', '.join(i for i in ids if i)})")
    k = ids.index(a.cue)
    line = phrases[k]
    prev = phrases[k - 1] if k > 0 else None
    nxt = phrases[k + 1] if k + 1 < len(phrases) else None

    sr, x = wavfile.read(a.wav)
    xf = to_float(x)
    mono = xf.mean(axis=1) if xf.ndim > 1 else xf
    dur = len(mono) / sr
    db, h = frame_db(mono, sr)
    inside = [db[int(p["start"] * sr / h): int(p["end"] * sr / h)] for p in phrases]
    inside = [s for s in inside if len(s)]
    thr = max(float(np.percentile(np.concatenate(inside), 90)) - 45.0, float(np.percentile(db, 5)) + 4.0)

    # the line runs from the end of the pause before it to the start of the pause after it
    if prev:
        q = longest_quiet(db, h, sr, thr, prev["end"] - 0.05, line["start"] + 0.08)
        if not q or q[1] - q[0] < 0.05:
            sys.exit(f"[{a.cue}] runs straight on from [{prev['id']}] with no pause: pick up the sentence that holds both")
        on = q[1]
    else:
        on = max(0.0, line["start"] - 0.02)
    if nxt:
        q = longest_quiet(db, h, sr, thr, line["end"] - 0.08, nxt["start"] + 0.05)
        if not q or q[1] - q[0] < 0.05:
            sys.exit(f"[{a.cue}] runs straight into [{nxt['id']}] with no pause: pick up the sentence that holds both")
        off = q[0]
    else:
        off = min(dur, line["end"] + 0.05)

    x16 = vo_check.decode(a.wav)
    cut16 = lambda t0, t1: x16[int(t0 * vo_check.SR): int(t1 * vo_check.SR)]  # noqa: E731
    neigh = [p for p in (prev, nxt) if p]
    n_pitch = [median_pitch(cut16(p["start"], p["end"])) for p in neigh]
    n_pitch = float(np.nanmean(n_pitch)) if neigh else float("nan")
    n_level = float(np.mean([speech_level(mono[int(p["start"] * sr): int(p["end"] * sr)], sr) for p in neigh])) if neigh else -20.0
    o_pitch = median_pitch(cut16(on, off))
    o_level = speech_level(mono[int(on * sr): int(off * sr)], sr)
    print(f"[{a.cue}] now: {off - on:.2f}s, level {o_level:.1f} dBFS, median pitch {o_pitch:.0f} Hz "
          f"(neighbours: {n_level:.1f} dBFS, {n_pitch:.0f} Hz)")

    rows = []
    for path in a.take:
        t = trim(decode_at(path, sr), sr)
        p = median_pitch(vo_check.decode(path))
        lvl = speech_level(t, sr)
        dist = abs(12 * np.log2(p / n_pitch)) if p == p and n_pitch == n_pitch else 99.0
        rows.append({"path": path, "audio": t, "pitch": p, "level": lvl, "dist": dist})
        print(f"  take {os.path.basename(path)}: {len(t) / sr:.2f}s, median pitch {p:.0f} Hz "
              f"({dist:.1f} semitones from the neighbours), level {lvl:.1f} dBFS before matching")
    rows.sort(key=lambda r: r["dist"])
    best = rows[0]
    gain = n_level - best["level"] + a.gain_db
    take = best["audio"] * 10 ** (gain / 20)
    f = max(1, int(FADE * sr))
    take[:f] *= np.linspace(0, 1, f)
    take[-f:] *= np.linspace(1, 0, f)
    peak = float(np.max(np.abs(take)))
    if peak > 0.99:
        take *= 0.99 / peak
        print(f"  (pickup peak held to -0.1 dBFS; {20 * np.log10(peak / 0.99):.1f} dB of the gain was given up)")
    if xf.ndim > 1:
        take = np.repeat(take[:, None], xf.shape[1], axis=1)

    s0, s1 = int(round(on * sr)), int(round(off * sr))
    y = np.concatenate([xf[:s0], take, xf[s1:]])
    delta = (len(take) - (s1 - s0)) / sr
    new_on, new_off = on, on + len(take) / sr

    def remap(t):
        if t <= on:
            return t
        if t >= off:
            return t + delta
        return new_on + (t - on) * (new_off - new_on) / max(1e-6, off - on)

    i0, i1 = line["words"]
    for i, w in enumerate(words):
        if i0 <= i <= i1 or w["start"] >= off - 1e-6:
            w["start"], w["end"] = round(remap(w["start"]), 3), round(remap(w["end"]), 3)
    for p in phrases[k:]:
        p["start"], p["end"] = round(remap(p["start"]), 3), round(remap(p["end"]), 3)
    cap["duration"] = round(len(y) / sr, 3)

    out_wav, out_cap = a.out or a.wav, a.out_captions or a.captions
    if not a.out:
        bak = os.path.splitext(a.wav)[0] + ".before-pickup.wav"
        if not os.path.exists(bak):
            shutil.copy2(a.wav, bak)
    else:
        cap["source"] = os.path.basename(out_wav)
    if not a.out_captions:
        bak = os.path.splitext(a.captions)[0] + ".before-pickup.json"
        if not os.path.exists(bak):
            shutil.copy2(a.captions, bak)
    wavfile.write(out_wav, sr, from_float(y, x.dtype))
    with open(out_cap, "w", encoding="utf-8") as fh:
        json.dump(cap, fh, indent=1, ensure_ascii=False)
    write_subs(os.path.splitext(out_cap)[0], phrases)
    print(f"used {os.path.basename(best['path'])}: gain {gain:+.1f} dB to the neighbours' level; "
          f"the read is {delta:+.2f}s longer ({len(y) / sr:.2f}s)")
    print(f"wrote {out_wav} and {out_cap}; next: align_vo.py on it for exact word cues, then tighten_vo.py and vo_check.py")


if __name__ == "__main__":
    main()
