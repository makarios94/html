"""Does the read perform? Measures a voiceover the way a listener hears it, because you cannot listen.

  python vo_check.py VO.wav [--captions captions.json] [--ref REF.mp3 --ref-captions ref_captions.json] [--json out.json]

A storytelling read moves: its pitch rises and falls inside each line, it changes register between lines (lower and
slower at the turn, brighter at the reveal), its pauses vary (a breath here, a held beat there), and its pace
changes with the meaning. A machine read is flat on all four. This reports, per read:

- pitch range: 5th to 95th percentile of the voice's pitch, in semitones
- melody: the median pitch span inside a line, in semitones (how much each line moves)
- register shifts: how far the lines' average pitch spreads, in semitones
- pauses: every gap between lines (from captions, else from the audio): shortest, median, longest, and how varied
- pace: words per second per line: slowest, fastest
- level: how much the lines' loudness differs, in dB
- designed silences: a gap of 1.5 s or more between lines (a logo drawing in, set with insert_pause.py) is set aside
  and reported on its own line; the pause and pace figures measure the read without it

and a verdict against floors measured on a directed human-style ad read. Pass --ref to print a reference read
(for example the ad the user pointed at) side by side. Pitch is tracked with YIN on voiced frames; music under a
voice blurs it, so measure a clean VO stem when you have one.
"""
import argparse
import json
import shutil
import subprocess
import sys

try:
    import numpy as np
except ImportError:  # pragma: no cover
    sys.exit("vo_check.py needs numpy:  python -m pip install --user numpy")

SR = 16000
HOP = 0.01
# Floors a directed ad read clears. Measured on a directed ElevenLabs read (clean), the Seeran ad's narrator (music
# under the voice) and the Windows scratch voice (clean). Pause, pace and level figures need a clean VO stem: music
# under a voice distorts the line timings (Seeran's pace spread of 0.41 is partly that), so pace variety is a weak
# signal; register, pauses, level and rushing separate a performance from a recital most clearly.
FLOORS = {"pitch_range": 7.0, "melody": 4.0, "register": 1.5, "pause_spread": 0.3, "pace_spread": 0.15, "level_range_db": 4.0}
RUSHED_WPS = 3.5  # words per second of speech time; the Seeran narrator runs 3.2, a calm read about 2.6
# A read that stops more than it flows: the Seeran narrator spends about 9 percent of the read in pauses, smooth
# directed takes 15 to 16 percent; a take the user rejected as halting spent 23 percent and ran 2.1 words per second.
HALTING_SHARE = 0.2
SLOW_WPS = 2.3  # words per second including pauses (the skill's floor for a voice-led film)
# A silence this long between two lines is an edit, not the reader's timing: the four banked reads hold their longest
# beat for 0.45 to 1.02 s, and the Coridr film inserts 2.6 s for its logo reveal. Counted in, one inserted gap made a
# flowing read measure SLOW (2.29 words/s) and lifted its pause variety from 0.40 to 1.36, enough to hide uniform pauses.
DESIGNED_GAP = 1.5


def decode(path):
    ff = shutil.which("ffmpeg") or sys.exit("ffmpeg not found on PATH")
    raw = subprocess.run([ff, "-v", "error", "-i", path, "-map", "0:a:0", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def yin(x, fmin=65.0, fmax=420.0, win=0.04, thresh=0.15):
    """f0 (Hz, NaN when unvoiced) and frame RMS, every HOP seconds."""
    W, H = int(win * SR), int(HOP * SR)
    tmin, tmax = int(SR / fmax), int(SR / fmin)
    n = max(0, 1 + (len(x) - W - tmax) // H)
    f0 = np.full(n, np.nan)
    rms = np.zeros(n)
    nfft = 1 << int(np.ceil(np.log2(2 * W + tmax)))
    for i in range(n):
        fr = x[i * H:i * H + W + tmax]
        a = fr[:W]
        rms[i] = np.sqrt(np.mean(a * a) + 1e-12)
        corr = np.fft.irfft(np.fft.rfft(fr, nfft) * np.conj(np.fft.rfft(a, nfft)), nfft)[:tmax + 1]
        cs = np.concatenate([[0.0], np.cumsum(fr * fr)])
        e0 = cs[W]
        et = cs[W:W + tmax + 1] - cs[:tmax + 1]
        d = e0 + et - 2 * corr
        d[0] = 0
        cm = np.cumsum(d[1:])
        dn = np.ones_like(d)
        dn[1:] = d[1:] * np.arange(1, tmax + 1) / np.maximum(cm, 1e-12)
        below = np.where(dn[tmin:] < thresh)[0]
        if not len(below):
            continue
        t = tmin + below[0]
        while t + 1 <= tmax and dn[t + 1] < dn[t]:
            t += 1
        if 1 <= t < tmax:
            y0, y1, y2 = dn[t - 1], dn[t], dn[t + 1]
            den = y0 - 2 * y1 + y2
            t = t + (0.5 * (y0 - y2) / den if den != 0 else 0)
        f0[i] = SR / t
    return f0, rms


def speech_spans(rms, min_gap=0.15):
    """Speech segments from energy when there are no captions (seconds)."""
    if not len(rms):
        return []
    loud = np.percentile(rms, 95)
    on = rms > loud * 10 ** (-30 / 20)
    spans, start = [], None
    for i, v in enumerate(on):
        t = i * HOP
        if v and start is None:
            start = t
        elif not v and start is not None:
            spans.append([start, t])
            start = None
    if start is not None:
        spans.append([start, len(rms) * HOP])
    merged = []
    for s, e in spans:
        if merged and s - merged[-1][1] < min_gap:
            merged[-1][1] = e
        elif e - s > 0.12:
            merged.append([s, e])
    return merged


def analyse(path, captions=None):
    x = decode(path)
    f0, rms = yin(x)
    lines = []
    if captions:
        with open(captions, encoding="utf-8") as fh:
            cap = json.load(fh)
        for p in cap["phrases"]:
            nw = p["words"][1] - p["words"][0] + 1
            lines.append({"id": p["id"], "start": p["start"], "end": p["end"], "words": nw})
    else:
        lines = [{"id": f"s{k}", "start": s, "end": e, "words": None} for k, (s, e) in enumerate(speech_spans(rms))]
    loud = np.percentile(rms, 95) if len(rms) else 1.0
    voiced = ~np.isnan(f0) & (rms > loud * 10 ** (-35 / 20))
    if voiced.sum() < 20:
        sys.exit(f"{path}: too little voiced speech to measure")
    ref_hz = float(np.median(f0[voiced]))
    st = 12 * np.log2(np.where(voiced, f0, ref_hz) / ref_hz)
    allv = st[voiced]
    per = []
    for ln in lines:
        a, b = int(ln["start"] / HOP), int(ln["end"] / HOP)
        v = voiced[a:b]
        seg = st[a:b][v]
        lvl = 20 * np.log10(np.sqrt(np.mean(np.square(rms[a:b]))) + 1e-9) if b > a else -120
        dur = max(0.05, ln["end"] - ln["start"])
        per.append({
            "id": ln["id"],
            "span": float(np.percentile(seg, 90) - np.percentile(seg, 10)) if len(seg) > 8 else None,
            "mean": float(np.mean(seg)) if len(seg) > 8 else None,
            "level": float(lvl),
            "wps": (ln["words"] / dur) if ln["words"] else None,
        })
    pairs = [(lines[k + 1]["id"], lines[k + 1]["start"] - lines[k]["end"]) for k in range(len(lines) - 1)]
    designed = [(cue, g) for cue, g in pairs if g >= DESIGNED_GAP]
    gaps = [g for _, g in pairs if 0.05 < g < DESIGNED_GAP]
    # the read's own length: first word to last, without the designed silences
    read_len = max(0.1, lines[-1]["end"] - lines[0]["start"] - sum(g for _, g in designed)) if lines else 0.1
    spans = [p["span"] for p in per if p["span"] is not None]
    means = [p["mean"] for p in per if p["mean"] is not None]
    levels = [p["level"] for p in per]
    paces = [p["wps"] for p in per if p["wps"]]
    out = {
        "file": path,
        "median_pitch_hz": round(ref_hz, 1),
        "pitch_range": round(float(np.percentile(allv, 95) - np.percentile(allv, 5)), 1),
        "melody": round(float(np.median(spans)), 1) if spans else None,
        "register": round(float(np.std(means)), 2) if len(means) > 1 else None,
        "pauses": {"count": len(gaps), "min": round(min(gaps), 2) if gaps else None, "median": round(float(np.median(gaps)), 2) if gaps else None, "max": round(max(gaps), 2) if gaps else None},
        "pause_spread": round(float(np.std(gaps) / np.mean(gaps)), 2) if len(gaps) > 1 else None,
        "pace": {"min": round(min(paces), 2) if paces else None, "max": round(max(paces), 2) if paces else None, "overall": round(sum(ln["words"] or 0 for ln in lines) / sum(ln["end"] - ln["start"] for ln in lines), 2) if paces else None},
        "pace_spread": round(float(np.std(paces) / np.mean(paces)), 2) if len(paces) > 1 else None,
        "level_range_db": round(max(levels) - min(levels), 1) if levels else None,
        # how much of the read is pause: a smooth storyteller keeps moving (the Seeran narrator about 9 percent)
        "pause_share": round(sum(gaps) / read_len, 2) if lines else None,
        "span_wps": round(sum(ln["words"] or 0 for ln in lines) / read_len, 2) if lines and lines[0]["words"] else None,
        "designed_silences": [{"before": cue, "seconds": round(g, 2)} for cue, g in designed],
        "lines": per,
    }
    return out


def verdict(m):
    notes = []
    checks = [
        ("pitch_range", "pitch range", "st", "the voice barely rises or falls"),
        ("melody", "melody per line", "st", "each line is read on one note"),
        ("register", "register shifts", "st", "every line sits at the same height (no lower turn, no brighter reveal)"),
        ("pause_spread", "pause variety", "", "every pause is the same length, which is the giveaway of a machine read"),
        ("pace_spread", "pace variety", "", "every line runs at the same speed"),
        ("level_range_db", "level variety", "dB", "every line is delivered at the same strength (no soft line, no lift)"),
    ]
    # Pace variety is reported but does not fail a read: it is the weakest signal and the one most moved by caption
    # edges on the wrong pauses (tested: slipped edges took a read from 0.14 to 0.32), and a read the user approved by
    # ear ("sounds nice") measured 0.14 with correct captions.
    advisory = {"pace_spread"}
    fails = 0
    for key, label, unit, why in checks:
        v = m.get(key)
        if v is None:
            continue
        ok = v >= FLOORS[key]
        tag = "PASS" if ok else ("NOTE" if key in advisory else "FLAT")
        fails += 0 if ok or key in advisory else 1
        notes.append(f"  {tag}: {label} {v}{(' ' + unit) if unit else ''} (floor {FLOORS[key]}){'' if ok else ': ' + why}")
    wps = (m.get("pace") or {}).get("overall")
    if wps and wps > RUSHED_WPS:
        fails += 1
        notes.append(f"  RUSHED: {wps} words per second of speech (above {RUSHED_WPS}): slow the read, the words need room")
    share = m.get("pause_share")
    if share is not None and share > HALTING_SHARE:
        fails += 1
        notes.append(f"  HALTING: {round(100 * share)} percent of the read is pause (above {round(100 * HALTING_SHARE)}): it stops more than it "
                     "flows; keep one held beat at the turn and let the rest run on")
    span = m.get("span_wps")
    if span and span < SLOW_WPS:
        fails += 1
        notes.append(f"  SLOW: {span} words per second including pauses (below {SLOW_WPS}): too few words for the time")
    for d in m.get("designed_silences") or []:
        notes.append(f"  SET ASIDE: {d['seconds']} s of silence before {d['before']}, measured as a designed beat (a logo drawing "
                     "in), so the pause and pace figures leave it out; if the reader stalled there, tighten it")
    head ="PERFORMS" if fails == 0 else ("NEEDS DIRECTION" if fails <= 2 else "FLAT READ")
    return head, notes


def show(m, title):
    head, notes = verdict(m)
    p = m["pauses"]
    print(f"\n{title}: {m['file']}")
    print(f"  {head}")
    print(f"  median pitch {m['median_pitch_hz']} Hz; pauses {p['count']} (shortest {p['min']} s, median {p['median']} s, longest {p['max']} s, "
          f"{round(100 * (m.get('pause_share') or 0))} percent of the read); pace {m['pace']['overall']} words/s overall "
          f"({m['pace']['min']} to {m['pace']['max']} per line); line levels differ by {m['level_range_db']} dB")
    for n in notes:
        print(n)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("vo")
    ap.add_argument("--captions")
    ap.add_argument("--ref")
    ap.add_argument("--ref-captions")
    ap.add_argument("--json")
    a = ap.parse_args()
    m = analyse(a.vo, a.captions)
    show(m, "read")
    res = {"read": m}
    if a.ref:
        r = analyse(a.ref, a.ref_captions)
        show(r, "reference")
        res["reference"] = r
    if a.json:
        with open(a.json, "w", encoding="utf-8") as fh:
            json.dump(res, fh, indent=1)
        print(f"\nwrote {a.json}")


if __name__ == "__main__":
    main()
