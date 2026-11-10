"""Synthesized sound for motion pieces. No samples, deterministic, numpy + scipy only.

  python sound_kit.py kit <outdir>
      Writes the UI/motion SFX library (pop, tap, click, tick, type-1..4, whoosh, swish, riser,
      impact, boom, chime, ding, success, sparkle, card, thud, send, nope, glitch, swell) plus
      manifest.json with each sound's duration and whether it ENDS on its hit (risers, swells).

  python sound_kit.py bed <out.wav> --bpm 120 --bars 8 [--mood drive] [--key D] [--sections "0:intro,1:main,6:lift,7:outro"]
      Writes a temp music bed locked to a tempo grid, so animation can be timed to bars and beats
      before a licensed or generated track exists. Moods: pulse (VO-friendly tech pulse), warm (keys
      and pad), drive (upbeat four-on-the-floor), tension (problem world), calm (pad only, near-silent bed).
      Sections by bar index: intro, main, lift, break, outro (final chord and tail), stop (silence).

Everything is a stand-in unless the user accepts it. Label it "temp music" in the delivery note.
"""
import argparse
import json
import math
import os
import sys

try:
    import numpy as np
    from scipy.io import wavfile
    from scipy.signal import lfilter
except ImportError:  # pragma: no cover
    sys.exit("sound_kit.py needs numpy and scipy:  python -m pip install --user numpy scipy")

SR = 48000
RNG = np.random.default_rng(11)


# ---------------------------------------------------------------- primitives
def n_of(seconds):
    return max(1, int(round(seconds * SR)))


def t_axis(n):
    return np.arange(n) / SR


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(n):
    return RNG.standard_normal(n)


def onepole_lp(x, cutoff):
    """One-pole low-pass. `cutoff` may be a scalar or a per-sample array (block-updated)."""
    if np.isscalar(cutoff):
        a = math.exp(-2 * math.pi * float(cutoff) / SR)
        return lfilter([1 - a], [1, -a], x)
    y = np.empty_like(x)
    zi = np.zeros(1)
    block = 128
    cut = np.clip(cutoff, 20, 20000)
    for s in range(0, len(x), block):
        a = math.exp(-2 * math.pi * float(cut[min(s + block // 2, len(cut) - 1)]) / SR)
        y[s:s + block], zi = lfilter([1 - a], [1, -a], x[s:s + block], zi=zi)
    return y


def lp(x, cutoff, order=2):
    for _ in range(order):
        x = onepole_lp(x, cutoff)
    return x


def hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


def bp(x, lo, hi):
    return lp(hp(x, lo), hi)


def env_exp(n, rate):
    return np.exp(-t_axis(n) * rate)


def env_adsr(n, a=0.005, d=0.08, s=0.6, r=0.1):
    e = np.ones(n)
    a, d, r = n_of(a), n_of(d), n_of(r)
    a = min(a, n)
    e[:a] = np.linspace(0, 1, a)
    if a + d < n:
        e[a:a + d] = np.linspace(1, s, d)
        e[a + d:] = s
    r = min(r, n)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def chirp(f, n):
    """Sine whose frequency follows the array f (Hz per sample)."""
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def sine(freq, n, phase=0.0):
    return np.sin(2 * np.pi * freq * t_axis(n) + phase)


def saw(freq, n, detune=0.0):
    ph = (t_axis(n) * freq * (1 + detune)) % 1.0
    return 2 * ph - 1


def tri(freq, n):
    return 2 * np.abs(2 * ((t_axis(n) * freq) % 1.0) - 1) - 1


def comb_reverb(x, mix=0.25, decay=0.6):
    out = np.zeros_like(x)
    for tap in (0.0297, 0.0371, 0.0411, 0.0437, 0.0531):
        d = n_of(tap)
        a = np.zeros(d + 1)
        a[0], a[d] = 1, -decay
        out += lfilter([1.0], a, x)
    out /= 5
    return x * (1 - mix) + out * mix


def place(buf, x, at_seconds, gain=1.0):
    s = int(round(at_seconds * SR))
    if s >= len(buf):
        return
    if s < 0:
        x = x[-s:]
        s = 0
    e = min(len(buf), s + len(x))
    buf[s:e] += x[: e - s] * gain


def normalize(x, peak=0.708):
    m = float(np.max(np.abs(x))) if len(x) else 0.0
    return x if m < 1e-9 else x / m * peak


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 2:
        x = x.T  # (n, 2)
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


# ---------------------------------------------------------------- sound effects
def s_pop(pitch=1.0):
    n = n_of(0.16)
    t = t_axis(n)
    f = 260 * pitch + 640 * pitch * np.exp(-t * 55)
    body = chirp(f, n) * np.exp(-t * 34)
    click = hp(noise(n), 2500) * np.exp(-t * 900) * 0.25
    return body + click


def s_tap():
    n = n_of(0.07)
    t = t_axis(n)
    return lp(sine(1700, n) * np.exp(-t * 120) + 0.4 * hp(noise(n), 1500) * np.exp(-t * 400), 6000)


def s_click():
    n = n_of(0.08)
    x = np.zeros(n)
    for at, g in ((0.0, 1.0), (0.034, 0.55)):
        m = n_of(0.006)
        burst = bp(noise(m), 1800, 6500) * env_exp(m, 900)
        place(x, burst, at, g)
    return x


def s_tick(soft=False):
    n = n_of(0.035)
    t = t_axis(n)
    x = hp(noise(n), 3500) * np.exp(-t * 520) + 0.5 * sine(3100, n) * np.exp(-t * 260)
    return lp(x, 4500) * 0.6 if soft else x


def s_type(variant):
    r = np.random.default_rng(100 + variant)
    n = n_of(0.075)
    t = t_axis(n)
    center = r.uniform(1500, 3400)
    press = bp(noise(n), center * 0.6, center * 1.6) * np.exp(-t * 340)
    body = sine(r.uniform(170, 260), n) * np.exp(-t * 90) * 0.35
    release = np.zeros(n)
    place(release, bp(noise(n_of(0.004)), 2500, 7000), r.uniform(0.03, 0.045), 0.35)
    return press + body + release


def s_whoosh(length=0.45, bright=1.0):
    n = n_of(length)
    u = t_axis(n) / length
    cut = 500 + 4500 * bright * np.sin(np.pi * u) ** 1.2
    x = lp(hp(noise(n), 250), cut) * np.sin(np.pi * u) ** 1.6
    return x


def s_riser(length=1.5):
    n = n_of(length)
    u = t_axis(n) / length
    hiss = lp(hp(noise(n), 200), 300 + 7500 * u ** 2) * u ** 1.6
    tone = chirp(110 * 2 ** (u * 2.0), n) * u ** 2.2 * 0.45
    x = hiss + tone
    x[-n_of(0.004):] *= np.linspace(1, 0, n_of(0.004))
    return x


def s_impact():
    n = n_of(0.9)
    t = t_axis(n)
    f = 52 + 150 * np.exp(-t * 28)
    body = chirp(f, n) * np.exp(-t * 6.5)
    thump = lp(noise(n), 900) * np.exp(-t * 30) * 0.5
    return comb_reverb(body + thump, 0.18, 0.55)


def s_boom():
    n = n_of(1.4)
    t = t_axis(n)
    f = 34 + 52 * np.exp(-t * 10)
    return chirp(f, n) * np.exp(-t * 2.6)


def bell(freq, n, decay=3.0):
    t = t_axis(n)
    x = np.zeros(n)
    for k, (mult, g) in enumerate(((1, 1.0), (2.0, 0.35), (2.76, 0.18), (5.4, 0.07))):
        x += sine(freq * mult, n) * g * np.exp(-t * decay * (1 + k * 0.6))
    return x


def s_chime():
    n = n_of(1.8)
    x = np.zeros(n)
    for k, m in enumerate((79, 83, 86, 91)):  # G5 B5 D6 G6
        place(x, bell(midi_hz(m), n_of(1.6), 2.6) * (0.55 / (1 + k * 0.4)), k * 0.035)
    return comb_reverb(x, 0.3, 0.6)


def s_ding():
    n = n_of(0.7)
    x = np.zeros(n)
    place(x, bell(midi_hz(88), n_of(0.6), 6.0), 0.0, 0.8)   # E6
    place(x, bell(midi_hz(95), n_of(0.55), 6.5), 0.085, 0.7)  # B6
    return comb_reverb(x, 0.2, 0.5)


def s_success():
    n = n_of(0.6)
    x = np.zeros(n)
    for at, m in ((0.0, 84), (0.09, 91)):  # C6 then G6
        m_n = n_of(0.45)
        tone = (tri(midi_hz(m), m_n) * 0.5 + sine(midi_hz(m), m_n)) * env_adsr(m_n, 0.003, 0.12, 0.25, 0.25)
        place(x, lp(tone, 5000), at, 0.7)
    return comb_reverb(x, 0.2, 0.5)


def s_sparkle():
    r = np.random.default_rng(5)
    n = n_of(0.6)
    x = np.zeros(n)
    for k in range(9):
        m = n_of(0.12)
        f = r.uniform(3000, 6500)
        place(x, sine(f, m) * env_exp(m, 45), 0.02 + k * 0.055 + r.uniform(0, 0.02), r.uniform(0.25, 0.6))
    return comb_reverb(x, 0.35, 0.55)


def s_card():
    n = n_of(0.2)
    t = t_axis(n)
    return bp(noise(n), 400, 3200) * (1 - np.exp(-t * 300)) * np.exp(-t * 22)


def s_thud():
    n = n_of(0.28)
    t = t_axis(n)
    return sine(92, n) * np.exp(-t * 22) + lp(noise(n), 600) * np.exp(-t * 45) * 0.4


def s_send():
    up = s_whoosh(0.34, 1.3)
    up = up * np.linspace(0.6, 1.0, len(up))
    x = np.zeros(n_of(0.52))
    place(x, up, 0.0, 0.8)
    place(x, s_pop(1.5), 0.3, 0.9)
    return x


def s_nope():
    n = n_of(0.42)
    x = np.zeros(n)
    for at, m in ((0.0, 76), (0.13, 75)):  # E5 then D#5, a soft "no"
        m_n = n_of(0.28)
        tone = lp(saw(midi_hz(m), m_n) * 0.4 + sine(midi_hz(m), m_n), 1600) * env_adsr(m_n, 0.004, 0.1, 0.35, 0.12)
        place(x, tone, at, 0.6)
    return x


def s_glitch():
    r = np.random.default_rng(3)
    n = n_of(0.32)
    x = np.zeros(n)
    for _ in range(7):
        m = n_of(r.uniform(0.012, 0.04))
        sq = np.sign(sine(r.uniform(300, 2400), m))
        place(x, sq * env_exp(m, 60), r.uniform(0, 0.28), r.uniform(0.2, 0.45))
    return np.round(x * 6) / 6  # crushed


def s_swell(length=1.2):
    n = n_of(length)
    u = t_axis(n) / length
    x = hp(noise(n), 3000) * u ** 3 + 0.3 * hp(noise(n), 8000) * u ** 4
    x[-n_of(0.003):] *= np.linspace(1, 0, n_of(0.003))
    return x


KIT = {
    # name: (generator, ends_on_hit, description)
    "pop": (lambda: s_pop(1.0), False, "bubbly pop for pills, badges, props landing"),
    "pop-high": (lambda: s_pop(1.35), False, "higher pop, use for the 2nd/3rd item in a run"),
    "pop-low": (lambda: s_pop(0.75), False, "lower, rounder pop"),
    "tap": (s_tap, False, "soft UI tap on a button or card"),
    "click": (s_click, False, "mouse click (press and release)"),
    "tick": (lambda: s_tick(False), False, "counter or clock tick"),
    "tick-soft": (lambda: s_tick(True), False, "quiet tick for fast counters"),
    "type-1": (lambda: s_type(1), False, "keystroke variant 1"),
    "type-2": (lambda: s_type(2), False, "keystroke variant 2"),
    "type-3": (lambda: s_type(3), False, "keystroke variant 3"),
    "type-4": (lambda: s_type(4), False, "keystroke variant 4"),
    "whoosh": (lambda: s_whoosh(0.45), False, "card or panel moving through frame (start it 3-5 frames early)"),
    "whoosh-long": (lambda: s_whoosh(0.9, 0.8), False, "big camera move or scene push"),
    "swish": (lambda: s_whoosh(0.22, 1.4), False, "fast small move, text swap"),
    "riser": (lambda: s_riser(1.5), True, "build into a reveal; ENDS on its hit"),
    "riser-short": (lambda: s_riser(0.8), True, "short build; ENDS on its hit"),
    "impact": (s_impact, False, "weighty hit on a big word or reveal"),
    "boom": (s_boom, False, "sub drop under a hard cut or logo"),
    "chime": (s_chime, False, "resolution, logo settle, end card"),
    "ding": (s_ding, False, "notification arrives"),
    "success": (s_success, False, "task done, payment received, check mark"),
    "sparkle": (s_sparkle, False, "shine on a logo or premium moment"),
    "card": (s_card, False, "paper or card sliding in"),
    "thud": (s_thud, False, "soft landing of a heavy element"),
    "send": (s_send, False, "send button: whoosh up and pop"),
    "nope": (s_nope, False, "rejection or error, soft and descending"),
    "glitch": (s_glitch, False, "digital glitch, broken state"),
    "swell": (lambda: s_swell(1.2), True, "reverse-cymbal swell; ENDS on its hit"),
}


def build_kit(outdir):
    os.makedirs(outdir, exist_ok=True)
    manifest = {}
    for name, (gen, ends, desc) in KIT.items():
        x = normalize(gen(), 0.708)  # -3 dBFS peaks so volumes in the composition mean the same thing
        write_wav(os.path.join(outdir, f"{name}.wav"), x)
        manifest[name] = {"duration": round(len(x) / SR, 4), "endsOnHit": ends, "description": desc}
    with open(os.path.join(outdir, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(f"wrote {len(manifest)} sounds + manifest.json to {outdir}")


# ---------------------------------------------------------------- music beds
KEYS = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}

# Progressions as (chord root offset from key, chord intervals). Major-key moods use I-vi-IV-V family, minor moods i-VI-III-VII.
MOODS = {
    "pulse": {"prog": [(0, (0, 4, 7, 11)), (9, (0, 3, 7, 10)), (5, (0, 4, 7, 11)), (7, (0, 4, 7, 9))], "minor": False,
              "kick": "half", "hats": 8, "clap": False, "arp": True, "pad": 0.45, "keys": False, "bass": "root"},
    "warm": {"prog": [(0, (0, 4, 7, 11)), (9, (0, 3, 7, 10)), (5, (0, 4, 7, 11)), (7, (0, 4, 7, 9))], "minor": False,
             "kick": "soft", "hats": 4, "clap": False, "arp": False, "pad": 0.5, "keys": True, "bass": "root"},
    "drive": {"prog": [(0, (0, 4, 7, 14)), (9, (0, 3, 7, 10)), (5, (0, 4, 7, 11)), (7, (0, 4, 7, 9))], "minor": False,
              "kick": "four", "hats": 16, "clap": True, "arp": True, "pad": 0.38, "keys": True, "bass": "eighths"},
    "tension": {"prog": [(0, (0, 3, 7, 14)), (8, (0, 4, 7, 11))], "minor": True,
                "kick": "heart", "hats": 8, "clap": False, "arp": False, "pad": 0.4, "keys": False, "bass": "pedal"},
    "calm": {"prog": [(0, (0, 4, 7, 11)), (5, (0, 4, 7, 14))], "minor": False,
             "kick": None, "hats": 0, "clap": False, "arp": False, "pad": 0.55, "keys": False, "bass": None},
}


def pan(x, p):
    """Constant-power pan, p in [-1, 1]."""
    a = (p + 1) * math.pi / 4
    return np.vstack([x * math.cos(a), x * math.sin(a)])


def i_pad(notes, dur, cutoff=1200, gain=0.5):
    n = n_of(dur)
    left = np.zeros(n)
    right = np.zeros(n)
    for m in notes:
        f = midi_hz(m)
        left += saw(f, n, 0.0045) + 0.5 * saw(f * 2, n, -0.002)
        right += saw(f, n, -0.0045) + 0.5 * saw(f * 2, n, 0.002)
    e = env_adsr(n, 0.5, 0.4, 0.9, 0.7) * gain / (2.2 * len(notes))
    return np.vstack([lp(left, cutoff) * e, lp(right, cutoff) * e])


def i_keys(m, dur, gain=0.3):
    n = n_of(dur)
    f = midi_hz(m)
    x = sine(f, n) + 0.42 * sine(f * 2, n) + 0.12 * sine(f * 3, n)
    return x * env_adsr(n, 0.004, 0.25, 0.3, 0.25) * np.exp(-t_axis(n) * 1.6) * gain


def i_pluck(m, dur, gain=0.2, bright=3200):
    n = n_of(dur)
    f = midi_hz(m)
    x = tri(f, n) + 0.35 * saw(f * 2, n)
    return lp(x, bright) * env_adsr(n, 0.002, 0.07, 0.25, 0.06) * gain


def i_bass(m, dur, gain=0.45):
    n = n_of(dur)
    f = midi_hz(m)
    return (lp(saw(f, n), 260) * 0.55 + sine(f, n) * 0.6) * env_adsr(n, 0.004, 0.08, 0.85, 0.06) * gain


def i_kick(gain=0.9, soft=False):
    n = n_of(0.32)
    t = t_axis(n)
    f = 46 + 115 * np.exp(-t * 38)
    x = chirp(f, n) * np.exp(-t * (10 if soft else 6.5))
    if not soft:
        x += 0.25 * hp(noise(n), 1500) * np.exp(-t * 120)
    return x * gain


def i_hat(gain=0.12, length=0.045):
    n = n_of(length)
    return hp(noise(n), 7000) * np.exp(-t_axis(n) * (4 / length)) * gain


def i_clap(gain=0.3):
    n = n_of(0.22)
    x = np.zeros(n)
    for k in range(3):
        m = n_of(0.012)
        place(x, bp(noise(m), 900, 4000) * env_exp(m, 160), k * 0.011, 0.8)
    tail = bp(noise(n), 900, 3500) * np.exp(-t_axis(n) * 22) * 0.5
    return comb_reverb((x + tail) * gain, 0.3, 0.5)


def parse_sections(spec, bars):
    plan = ["main"] * bars
    if spec:
        marks = []
        for part in spec.split(","):
            k, v = part.split(":")
            marks.append((int(k), v.strip()))
        marks.sort()
        for i, (b0, name) in enumerate(marks):
            b1 = marks[i + 1][0] if i + 1 < len(marks) else bars
            for b in range(b0, min(b1, bars)):
                plan[b] = name
    return plan


def build_bed(out, bpm, bars, mood, key, sections, tail):
    spec = MOODS[mood]
    root = 48 + KEYS[key] + (0 if not spec["minor"] else 0)
    beat = 60.0 / bpm
    bar = beat * 4
    plan = parse_sections(sections, bars)
    total = bars * bar + tail
    n = n_of(total)
    mix = np.zeros((2, n))

    def put(stereo_or_mono, at, gain=1.0, p=0.0):
        x = stereo_or_mono if np.ndim(stereo_or_mono) == 2 else pan(stereo_or_mono, p)
        s = int(round(at * SR))
        if s >= n:
            return
        e = min(n, s + x.shape[1])
        mix[:, s:e] += x[:, : e - s] * gain

    for b in range(bars):
        sec_name = plan[b]
        if sec_name == "stop":
            continue
        t0 = b * bar
        off, ivs = spec["prog"][b % len(spec["prog"])]
        chord = [root + off + i for i in ivs]
        bright = sec_name == "lift"
        outro = sec_name == "outro"
        intro = sec_name == "intro"
        brk = sec_name == "break"
        # pad (always, except stop)
        hold = bar + (tail if outro else 0.35)
        put(i_pad([c + 12 for c in chord], hold, cutoff=2200 if bright else 1300, gain=spec["pad"] * (1.15 if brk or intro else 1.0)), t0)
        if outro:
            # final chord: keys + low root, then let it ring
            for c in chord:
                put(i_keys(c + 12, min(tail + bar, 3.5), 0.22), t0, p=-0.2)
            put(i_bass(root + off - 12, beat * 2, 0.4), t0)
            put(i_kick(0.7), t0)
            continue
        if brk or intro:
            if spec["keys"] and intro:
                for c in chord[:3]:
                    put(i_keys(c + 12, beat * 1.5, 0.16), t0, p=0.15)
            continue
        if spec["keys"]:
            for k in ((0, 1.5) if mood == "drive" else (0,)):
                for c in chord[:3]:
                    put(i_keys(c + 12, beat * 1.2, 0.17), t0 + k * beat, p=0.1)
        if spec["arp"]:
            notes = [c + 24 for c in chord]
            steps = 8
            for k in range(steps):
                m = notes[k % len(notes)] + (12 if bright and k % 4 == 2 else 0)
                put(i_pluck(m, beat / 2, 0.15 if not bright else 0.19), t0 + k * beat / 2, p=0.35 if k % 2 else -0.35)
        # bass
        if spec["bass"] == "root":
            put(i_bass(root + off - 12, beat * 1.8, 0.42), t0)
            put(i_bass(root + off - 12, beat * 0.9, 0.3), t0 + 2.5 * beat)
        elif spec["bass"] == "eighths":
            for k in range(8):
                put(i_bass(root + off - 12 + (12 if k % 4 == 3 else 0), beat * 0.45, 0.32), t0 + k * beat / 2)
        elif spec["bass"] == "pedal":
            put(i_bass(root - 12, bar, 0.38), t0)
        # drums
        kick = spec["kick"]
        if kick == "four":
            for k in range(4):
                put(i_kick(0.85), t0 + k * beat)
        elif kick == "half":
            put(i_kick(0.7), t0)
            put(i_kick(0.55), t0 + 2 * beat)
            if bright:
                put(i_kick(0.5), t0 + 2.5 * beat)
        elif kick == "soft":
            put(i_kick(0.55, soft=True), t0)
            put(i_kick(0.45, soft=True), t0 + 2 * beat)
        elif kick == "heart":
            for k in range(4):
                put(i_kick(0.6, soft=True), t0 + k * beat)
                put(i_kick(0.42, soft=True), t0 + k * beat + 0.17)
        hats = spec["hats"] * (2 if bright and spec["hats"] and spec["hats"] < 16 else 1)
        for k in range(hats):
            off_beat = (k % 2 == 1) if hats >= 8 else True
            put(i_hat(0.11 if off_beat else 0.07), t0 + k * bar / hats, p=0.25)
        if spec["clap"]:
            for k in (1, 3):
                put(i_clap(0.28), t0 + k * beat, p=-0.05)

    # lift into section changes: a short riser one bar before any "lift" or after a "break"
    for b in range(1, bars):
        if plan[b] in ("lift", "main") and plan[b - 1] in ("break", "intro") or (plan[b] == "lift" and plan[b - 1] != "lift"):
            r = s_riser(min(1.2, bar))
            put(r * 0.22, b * bar - len(r) / SR)
    # glue
    for ch in range(2):
        mix[ch] = comb_reverb(mix[ch], 0.14, 0.5)
    peak = float(np.max(np.abs(mix))) or 1.0
    mix = mix / peak * 0.8
    write_wav(out, mix)
    grid = {"bpm": bpm, "offset": 0.0, "beatsPerBar": 4, "bars": bars, "duration": round(total, 3),
            "sections": [{"bar": b, "section": s} for b, s in enumerate(plan)], "mood": mood, "key": key,
            "source": os.path.basename(out), "method": "generated"}
    with open(os.path.splitext(out)[0] + ".beats.json", "w", encoding="utf-8") as fh:
        json.dump(grid, fh, indent=2)
    print(f"wrote {out} ({total:.2f}s, {bpm} BPM, {bars} bars, mood {mood}, key {key}) + beat grid json")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    k = sub.add_parser("kit")
    k.add_argument("outdir")
    b = sub.add_parser("bed")
    b.add_argument("out")
    b.add_argument("--bpm", type=float, default=120)
    b.add_argument("--bars", type=int, default=8)
    b.add_argument("--mood", choices=sorted(MOODS), default="pulse")
    b.add_argument("--key", default="C", choices=sorted(KEYS))
    b.add_argument("--sections", default="", help='e.g. "0:intro,1:main,6:lift,7:outro"')
    b.add_argument("--tail", type=float, default=2.0, help="seconds of ring-out after the last bar")
    a = ap.parse_args()
    if a.cmd == "kit":
        build_kit(a.outdir)
    else:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        build_bed(a.out, a.bpm, a.bars, a.mood, a.key, a.sections, a.tail)


if __name__ == "__main__":
    main()
