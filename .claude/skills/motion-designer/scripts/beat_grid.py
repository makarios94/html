"""Tempo, beats and downbeats for a music track, as beats.json for the film's beatGrid().

  python beat_grid.py music.wav --out src/film/data/beats.json [--fps 30] [--bpm 120] [--offset 0.0]
         [--png beats.png] [--click click-preview.wav]

Without --bpm the tempo is estimated (onset autocorrelation with a prior near 120 BPM); without
--offset the first downbeat is estimated from where the low-end hits line up. Both are estimates:
check them. --png draws the onset curve with the beat grid so you can see whether hits land on
lines; --click writes the track with a click on every beat (accented downbeats) for a listen.
Library tracks usually state their BPM: pass it with --bpm and let this find the downbeat.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

try:
    import numpy as np
except ImportError:  # pragma: no cover
    sys.exit("beat_grid.py needs numpy:  python -m pip install --user numpy")

SR = 22050
HOP = 256
NFFT = 1024


def decode(path):
    ff = shutil.which("ffmpeg") or sys.exit("ffmpeg not found on PATH")
    raw = subprocess.run([ff, "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def onset_envelopes(x):
    win = np.hanning(NFFT)
    n = 1 + (len(x) - NFFT) // HOP
    if n < 8:
        sys.exit("track too short")
    frames = np.lib.stride_tricks.as_strided(x, shape=(n, NFFT), strides=(x.strides[0] * HOP, x.strides[0]))
    mag = np.abs(np.fft.rfft(frames * win, axis=1))
    logm = np.log1p(100 * mag)
    flux = np.maximum(0, np.diff(logm, axis=0, prepend=logm[:1]))
    freqs = np.fft.rfftfreq(NFFT, 1 / SR)
    full = flux.sum(axis=1)
    low = flux[:, freqs < 160].sum(axis=1)

    def clean(env):
        k = int(SR / HOP * 0.5)
        ma = np.convolve(env, np.ones(k) / k, mode="same")
        e = np.maximum(0, env - ma)
        return e / (e.max() + 1e-9)

    return clean(full), clean(low)


def estimate_tempo(env, fr):
    ac = np.correlate(env, env, mode="full")[len(env) - 1:]
    best, best_score = None, -1
    lags = np.arange(int(fr * 60 / 185), int(fr * 60 / 68) + 1)
    for lag in lags:
        bpm = 60 * fr / lag
        prior = np.exp(-0.5 * (np.log2(bpm / 120.0) / 0.9) ** 2)
        score = ac[lag] * prior
        if score > best_score:
            best, best_score = lag, score
    # parabolic refinement
    l = best
    if 1 <= l < len(ac) - 1:
        a, b, c = ac[l - 1], ac[l], ac[l + 1]
        denom = a - 2 * b + c
        l = l + (0.5 * (a - c) / denom if denom != 0 else 0)
    return 60 * fr / l, float(best_score / (ac[0] + 1e-9))


def estimate_phase(env, low, fr, bpm):
    period = fr * 60 / bpm
    best_off, best = 0.0, -1
    for off in np.arange(0, period, 0.25):
        idx = np.round(np.arange(off, len(env), period)).astype(int)
        idx = idx[idx < len(env)]
        s = env[idx].sum()
        if s > best:
            best, best_off = s, off
    # downbeat: which of the 4 beat phases carries the strongest low end
    beats = np.arange(best_off, len(env), period)
    scores = []
    for k in range(4):
        idx = np.round(beats[k::4]).astype(int)
        idx = idx[idx < len(low)]
        scores.append(low[idx].mean() if len(idx) else 0)
    k = int(np.argmax(scores))
    return (best_off + k * period) / fr


def snap_beats(beats, env, fr, window=0.035):
    out = []
    w = int(window * fr) or 1
    for b in beats:
        i = int(round(b * fr))
        lo, hi = max(0, i - w), min(len(env), i + w + 1)
        if hi > lo:
            j = lo + int(np.argmax(env[lo:hi]))
            out.append(j / fr if env[j] > 0.25 else b)
        else:
            out.append(b)
    return out


def draw_png(path, env, fr, beats, beats_per_bar, duration):
    from PIL import Image, ImageDraw
    W, H = 1800, 320
    img = Image.new("RGB", (W, H), (16, 16, 20))
    d = ImageDraw.Draw(img)
    xs = np.linspace(0, len(env) - 1, W).astype(int)
    for x in range(W):
        v = env[xs[x]]
        d.line([(x, H - 20), (x, H - 20 - int(v * (H - 60)))], fill=(90, 170, 255))
    for i, b in enumerate(beats):
        x = int(b / duration * W)
        down = i % beats_per_bar == 0
        d.line([(x, 0), (x, H)], fill=(255, 80, 90) if down else (120, 120, 130), width=2 if down else 1)
        if down:
            d.text((x + 3, 3), str(i // beats_per_bar), fill=(255, 120, 130))
    img.save(path)


def write_click(path, x, beats, beats_per_bar):
    from scipy.io import wavfile
    y = x.copy() * 0.6
    for i, b in enumerate(beats):
        f = 1760 if i % beats_per_bar == 0 else 1100
        n = int(0.03 * SR)
        t = np.arange(n) / SR
        click = np.sin(2 * np.pi * f * t) * np.exp(-t * 120) * 0.6
        s = int(b * SR)
        if s + n < len(y):
            y[s:s + n] += click
    y = np.clip(y, -1, 1)
    wavfile.write(path, SR, (y * 32767).astype(np.int16))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio")
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--bpm", type=float)
    ap.add_argument("--offset", type=float, help="first downbeat in seconds")
    ap.add_argument("--beats-per-bar", type=int, default=4)
    ap.add_argument("--png")
    ap.add_argument("--click")
    a = ap.parse_args()

    x = decode(a.audio)
    duration = len(x) / SR
    env, low = onset_envelopes(x)
    fr = SR / HOP
    method = "given"
    confidence = None
    bpm = a.bpm
    if not bpm:
        bpm, confidence = estimate_tempo(env, fr)
        bpm = round(bpm, 2)
        method = "estimated"
    offset = a.offset if a.offset is not None else estimate_phase(env, low, fr, bpm)
    if a.offset is None and method == "given":
        method = "given-bpm, estimated-downbeat"
    period = 60.0 / bpm
    # step back whole bars to the earliest downbeat (an intro without drums often hides bar 0); allow a few
    # tens of ms of estimate error below zero, then clamp
    bar_len = period * a.beats_per_bar
    while offset - bar_len > -0.06:
        offset -= bar_len
    offset = max(0.0, offset)
    grid = list(np.arange(offset, duration, period))
    beats = snap_beats(grid, env, fr) if method != "given" else grid
    out = {
        "bpm": bpm,
        "offset": round(offset, 4),
        "beatsPerBar": a.beats_per_bar,
        "beats": [round(float(b), 4) for b in beats],
        "downbeats": [round(float(b), 4) for b in beats[:: a.beats_per_bar]],
        "duration": round(duration, 3),
        "fps": a.fps,
        "method": method,
        "confidence": None if confidence is None else round(confidence, 3),
        "source": os.path.basename(a.audio),
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1)
    bars = len(beats) // a.beats_per_bar
    conf_txt = f", confidence {confidence:.2f}" if confidence is not None else ""
    print(f"bpm {bpm} ({method}{conf_txt}), first downbeat {offset:.3f}s, {len(beats)} beats, {bars} bars, {duration:.2f}s")
    if confidence is not None and confidence < 0.4:
        out["warning"] = "low confidence: no steady beat found"
        with open(a.out, "w", encoding="utf-8") as fh:
            json.dump(out, fh, indent=1)
        print("WARNING: LOW CONFIDENCE. This audio may have no steady beat (a pad, a voice-led mix, rubato). Pass --bpm "
              "from the track's metadata and check the PNG, or cue the film from the voice instead of a grid.")
    print(f"frames per beat at {a.fps} fps: {a.fps * period:.2f}; per bar: {a.fps * period * a.beats_per_bar:.2f}")
    if a.png:
        draw_png(a.png, env, fr, beats, a.beats_per_bar, duration)
        print("wrote", a.png, "(red = downbeats with bar numbers; hits should sit on lines)")
    if a.click:
        write_click(a.click, x, beats, a.beats_per_bar)
        print("wrote", a.click)
    print("wrote", a.out)


if __name__ == "__main__":
    main()
