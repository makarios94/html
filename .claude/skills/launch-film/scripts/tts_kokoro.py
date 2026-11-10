"""A directed read with Kokoro, a local neural voice: no queue, no credits, runs on the CPU.

  python tts_kokoro.py src/films/<id>/vo-direction.txt src/films/<id>/script.txt public/films/<id>/vo.wav
         [--voice am_michael] [--list] [--home C:\\Users\\User\\Desktop\\reel-studio\\kokoro]

It reads the same performance script the cloud voice reads (vo-direction.txt: tags, pauses, ellipses). Kokoro itself
takes no tags, so the direction is performed in the edit, the way a VO editor shapes a read:
- every line, and every part of a line split by a tag or an ellipsis, is generated on its own at the pace its tags
  ask for ([slowly], [softly], [upbeat] ...);
- each part is moved in register (lower for [serious], [tired], [softly]; brighter for [upbeat], [happy], [confident])
  and set at its own strength;
- parts are joined with the pause the direction asks for ([short pause] 0.35 s, [pause] 0.7 s, [long pause] 1.4 s,
  an ellipsis 0.45 s, a line break 0.5 s).
Writes vo.wav (48 kHz mono) and vo.wav.words.json (each part's exact span, words spread inside it). Then run
align_vo.py (whisper gives the best word cues) and vo_check.py. Kokoro has no per-word stress: CAPITALS are read as
plain words, and the line's register and pace carry the emphasis. Setup (once): a venv with kokoro-onnx and the
model files kokoro-v1.0.onnx and voices-v1.0.bin in <home>/models (see the skill's audio reference).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HOME = os.environ.get("KOKORO_HOME", r"C:\Users\User\Desktop\reel-studio\kokoro")

# tag -> (speed factor, pitch in semitones, gain in dB); stacked tags multiply speed and add the rest
TAGS = {
    "warmly": (0.96, 0.0, 0.0), "warm": (0.96, 0.0, 0.0), "tired": (0.92, -0.8, -1.0), "dryly": (0.97, -0.4, -0.5),
    "softly": (0.92, -0.6, -4.0), "slowly": (0.84, 0.0, 0.0), "serious": (0.95, -1.5, 0.0), "confident": (1.0, 0.7, 1.5),
    "upbeat": (1.06, 0.9, 1.0), "happy": (1.03, 1.2, 1.0), "excited": (1.08, 1.6, 2.0), "sad": (0.9, -1.2, -2.0),
    "curious": (1.0, 0.8, 0.0), "whispers": (0.9, 0.0, -9.0), "dramatically": (0.88, -0.6, 1.0), "calm": (0.95, -0.3, -1.0),
    "cautiously": (0.92, -0.3, -2.0), "nervous": (1.04, 0.6, -1.0), "surprised": (1.0, 1.6, 1.0), "sarcastic": (0.97, 0.3, 0.0),
}
PAUSES = {"short pause": 0.35, "pause": 0.7, "long pause": 1.4}
ELLIPSIS, MID_TAG, LINE_BREAK = 0.45, 0.12, 0.5


def norm(s):
    return re.sub(r"[^\w']+", "", s.lower())


def spoken_lines(script):
    out = []
    with open(script, encoding="utf-8") as fh:
        for raw in fh:
            s = raw.strip()
            if not s or s.startswith("#"):
                continue
            m = re.match(r"^\[([^\]]+)\]\s*(.*)$", s)
            cid, text = (m.group(1), m.group(2)) if m else (None, s)
            text = re.sub(r"\{([^|{}]*)\|([^{}]*)\}", r"\1", text)
            out.append((cid, [w for w in text.split() if norm(w)]))
    return out


def tokens(direction):
    with open(direction, encoding="utf-8") as fh:
        text = " ".join(line for line in fh.read().splitlines() if not line.lstrip().startswith("#"))
    text = text.replace("\u2026", "...")
    out = []
    for m in re.finditer(r"\[([^\]]+)\]|\.\.\.|[^\s\[\]]+", text):
        t = m.group(0)
        if m.group(1) is not None:
            out.append(("tag", m.group(1).strip().lower()))
        elif t == "...":
            out.append(("ellipsis", t))
        else:
            for k, piece in enumerate(t.split("...")):
                if k:
                    out.append(("ellipsis", "..."))
                if piece:
                    out.append(("word", piece))
    return out


def plan(direction, script):
    lines = spoken_lines(script)
    toks = tokens(direction)
    state, last_was_tag = [], False
    li, wi = 0, 0
    parts = []  # dicts: line, words, tags, gap_before
    gap = 0.0
    cur = None
    for kind, val in toks:
        if kind == "tag":
            if val in PAUSES:
                gap = max(gap, PAUSES[val])
                cur = None
                last_was_tag = False
                continue
            state = state + [val] if last_was_tag else [val]
            last_was_tag = True
            if cur is not None and cur["words"]:
                gap = max(gap, MID_TAG)
                cur = None
            continue
        last_was_tag = False
        if kind == "ellipsis":
            gap = max(gap, ELLIPSIS)
            cur = None
            continue
        if li >= len(lines):
            sys.exit(f'vo-direction.txt has more words than script.txt (extra: "{val}")')
        cid, words = lines[li]
        if norm(val) != norm(words[wi]):
            sys.exit(f'vo-direction.txt and script.txt differ at [{cid}] word {wi + 1}: "{val}" vs "{words[wi]}". Keep the words identical.')
        if cur is None:
            cur = {"line": li, "id": cid, "words": [], "tags": list(state), "gap_before": gap}
            parts.append(cur)
            gap = 0.0
        cur["words"].append(val)
        wi += 1
        if wi == len(lines[li][1]):
            li, wi = li + 1, 0
            cur = None
            gap = 0.0
            pending_line_gap = True  # noqa: F841 (documented default below)
    if li < len(lines):
        sys.exit(f"vo-direction.txt stops before the end of script.txt (at [{lines[li][0]}])")
    for k in range(1, len(parts)):
        if parts[k]["line"] != parts[k - 1]["line"] and parts[k]["gap_before"] == 0.0:
            parts[k]["gap_before"] = LINE_BREAK
    return parts


def delivery(tags):
    speed, pitch, gain = 1.0, 0.0, 0.0
    for t in tags:
        s, p, g = TAGS.get(t, (1.0, 0.0, 0.0))
        speed *= s
        pitch += p
        gain += g
    return max(0.7, min(1.3, speed)), max(-3.0, min(3.0, pitch)), gain


def say_text(words):
    out = []
    for w in words:
        out.append(w.lower() if len(norm(w)) > 1 and w.upper() == w and any(c.isalpha() for c in w) else w)
    return " ".join(out)


def ensure_kokoro():
    try:
        import kokoro_onnx  # noqa: F401
        return
    except ImportError:
        venv_py = os.path.join(HOME, "venv", "Scripts", "python.exe")
        if not os.path.isfile(venv_py):
            venv_py = os.path.join(HOME, "venv", "bin", "python")
        if os.path.isfile(venv_py) and os.path.abspath(sys.executable) != os.path.abspath(venv_py):
            sys.exit(subprocess.run([venv_py, os.path.abspath(__file__)] + sys.argv[1:]).returncode)
        sys.exit(f"kokoro-onnx is not installed (looked for a venv in {HOME}). Set it up: see the skill's audio reference.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("direction", nargs="?")
    ap.add_argument("script", nargs="?")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--lang", default="en-us")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    ensure_kokoro()
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro

    models = os.path.join(HOME, "models")
    k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
    if a.list:
        print(" ".join(sorted(k.get_voices())))
        return
    if not (a.direction and a.script and a.out):
        sys.exit("give DIRECTION SCRIPT OUT (or --list)")
    parts = plan(a.direction, a.script)
    ff = shutil.which("ffmpeg") or sys.exit("ffmpeg not found on PATH")
    tmp = tempfile.mkdtemp(prefix="kokoro_")
    sr_out = 24000
    pieces = [np.zeros(int(0.15 * sr_out), dtype=np.float32)]
    t = 0.15
    words_out = []
    for n, p in enumerate(parts):
        speed, pitch, gain = delivery(p["tags"])
        audio, sr = k.create(say_text(p["words"]), voice=a.voice, speed=speed, lang=a.lang)
        audio = np.asarray(audio, dtype=np.float32)
        if abs(pitch) > 0.05:
            src = os.path.join(tmp, f"p{n}.wav")
            dst = os.path.join(tmp, f"p{n}s.wav")
            sf.write(src, audio, sr)
            r = 2 ** (pitch / 12)
            subprocess.run([ff, "-y", "-v", "error", "-i", src, "-af", f"asetrate={sr * r:.1f},aresample={sr},atempo={1 / r:.5f}", dst], check=True)
            audio, sr = sf.read(dst, dtype="float32")
        if sr != sr_out:
            sys.exit(f"unexpected sample rate {sr}")
        audio = audio * (10 ** (gain / 20))
        # trim the model's own edge silence so the direction's pauses are the pauses
        env = np.abs(audio)
        on = np.where(env > env.max() * 0.02)[0]
        if len(on):
            audio = audio[max(0, on[0] - int(0.02 * sr)):on[-1] + int(0.06 * sr)]
        gap = p["gap_before"] if n else 0.0
        pieces.append(np.zeros(int(gap * sr_out), dtype=np.float32))
        t += gap
        start, dur = t, len(audio) / sr_out
        chars = [max(1, len(norm(w))) + 1 for w in p["words"]]
        acc = 0.0
        for w, c in zip(p["words"], chars):
            ws = start + dur * acc / sum(chars)
            acc += c
            words_out.append({"text": w, "start": round(ws, 3), "end": round(start + dur * acc / sum(chars) - 0.02, 3)})
        pieces.append(audio)
        t += dur
        print(f"[{p['id']}] {' '.join(p['words'])!r}  speed {speed:.2f}, pitch {pitch:+.1f} st, gain {gain:+.1f} dB, pause before {gap:.2f}s")
    pieces.append(np.zeros(int(0.4 * sr_out), dtype=np.float32))
    y = np.concatenate(pieces)
    y = y / (np.max(np.abs(y)) or 1.0) * 0.7
    raw = os.path.join(tmp, "vo24.wav")
    sf.write(raw, y, sr_out)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    subprocess.run([ff, "-y", "-v", "error", "-i", raw, "-ar", "48000", "-ac", "1", a.out], check=True)
    with open(a.out + ".words.json", "w", encoding="utf-8") as fh:
        json.dump({"source": "kokoro", "voice": a.voice, "words": words_out}, fh, indent=1)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"wrote {a.out} ({len(y) / sr_out:.2f}s, voice {a.voice}) and {a.out}.words.json")
    print("LOCAL VOICE: listen before it ships; run align_vo.py and vo_check.py next.")


if __name__ == "__main__":
    main()
