"""Word and phrase timings for a voiceover: captions.json (+ .srt and .vtt) that the film's cues read.

  python align_vo.py VO.wav --script script.txt --out src/film/data/captions.json [--fps 30]
         [--words-from words.json] [--whisper PATH --model PATH] [--method auto|words|whisper|estimate]

Script file: one caption phrase per line. That line becomes one pill on screen and one cue in code.
An optional [id] prefix names the cue ("[hook] You're tired of applying for jobs"); otherwise ids are
p1, p2, ... Blank lines and lines starting with # are ignored. With a script, captions keep the
script's exact spelling (brand names stay right) and timings come from the audio.

Timing sources, best first (auto tries them in this order):
  1. --words-from: word timings you already have (tts_local.ps1 .words.json, ElevenLabs Scribe words,
     any aligner), as [{"text","start","end"}] or {"words": [...]}.
  2. whisper.cpp (whisper-cli + a ggml model): word-level segments, aligned to the script.
  3. estimate: speech/silence detection plus a proportional spread. Flagged "estimated" in the output.
Phrase edges are then snapped to real speech onsets/offsets from ffmpeg silencedetect.
"""
import argparse
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

KNOWN_WHISPER = [
    r"C:\Users\User\Desktop\reel-studio\whisper.cpp\build\bin\whisper-cli.exe",
    os.path.expanduser("~/whisper.cpp/build/bin/whisper-cli"),
]
DTW_PRESETS = ["tiny.en", "tiny", "base.en", "base", "small.en", "small", "medium.en", "medium", "large.v1", "large.v2", "large.v3", "large.v3.turbo"]


def die(msg):
    sys.exit(f"align_vo: {msg}")


def ffmpeg_bin(name="ffmpeg"):
    p = shutil.which(name)
    if not p:
        die(f"{name} not found on PATH")
    return p


def duration_of(path):
    out = subprocess.run([ffmpeg_bin("ffprobe"), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
                         capture_output=True, text=True).stdout.strip()
    return float(out)


def to_wav16k(src, dst):
    subprocess.run([ffmpeg_bin(), "-y", "-v", "error", "-i", src, "-af", "aresample=async=1:first_pts=0", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", dst], check=True)


def speech_segments(path, duration, noise_db=-38.0, min_sil=0.12):
    """Non-silent intervals [(start, end)] in seconds."""
    err = subprocess.run([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", path, "-af", f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    sil = []
    cur = None
    for line in err.splitlines():
        m = re.search(r"silence_start: (-?[\d.]+)", line)
        if m:
            cur = max(0.0, float(m.group(1)))
        m = re.search(r"silence_end: ([\d.]+)", line)
        if m and cur is not None:
            sil.append((cur, float(m.group(1))))
            cur = None
    if cur is not None:
        sil.append((cur, duration))
    segs = []
    t = 0.0
    for s, e in sil:
        if s - t > 0.02:
            segs.append((t, s))
        t = e
    if duration - t > 0.02:
        segs.append((t, duration))
    return segs


def norm(w):
    w = w.lower().replace("\u2019", "'").replace("\u2018", "'")
    return re.sub(r"[^\w']+", "", w, flags=re.UNICODE).strip("'")


PRON = re.compile(r"\{([^|{}]*)\|([^{}]*)\}")


def split_line(text):
    """Display tokens, each with the spoken words it covers. {display|spoken} sets both."""
    tokens = []  # (display_token, [spoken words])
    pos = 0
    for m in PRON.finditer(text):
        chunk = text[pos:m.start()]
        if tokens and chunk and not chunk[0].isspace():  # punctuation glued after a previous pair
            glue = chunk.split()[0]
            d, sp = tokens[-1]
            tokens[-1] = (d + glue, sp[:-1] + [sp[-1] + glue])
            chunk = chunk[len(glue):]
        for w in chunk.split():
            tokens.append((w, [w]))
        disp, spoken = m.group(1).split(), m.group(2).split()
        if disp and spoken:
            # spread spoken words across display tokens in contiguous chunks
            for k, d in enumerate(disp):
                a = round(k * len(spoken) / len(disp))
                b = round((k + 1) * len(spoken) / len(disp))
                tokens.append((d, spoken[a:max(b, a + 1)]))
        pos = m.end()
    rest = text[pos:]
    if tokens and rest and not rest[0].isspace():
        glue = rest.split()[0]
        d, sp = tokens[-1]
        tokens[-1] = (d + glue, sp[:-1] + [sp[-1] + glue])
        rest = rest[len(glue):]
    for w in rest.split():
        tokens.append((w, [w]))
    return tokens


def load_script(path):
    phrases = []
    with open(path, encoding="utf-8-sig") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"^\[([A-Za-z0-9_-]+)\]\s*(.*)$", line)
            pid, text = (m.group(1), m.group(2).strip()) if m else (None, line)
            if text:
                phrases.append({
                    "id": pid,
                    "text": PRON.sub(lambda x: x.group(1), text),
                    "spoken": PRON.sub(lambda x: x.group(2), text),
                    "tokens": split_line(text),
                })
    for i, p in enumerate(phrases):
        if not p["id"]:
            p["id"] = f"p{i + 1}"
    ids = [p["id"] for p in phrases]
    dup = {x for x in ids if ids.count(x) > 1}
    if dup:
        die(f"duplicate phrase ids in script: {', '.join(sorted(dup))}")
    return phrases


def load_words(path):
    with open(path, encoding="utf-8-sig") as fh:
        data = json.load(fh)
    words = data["words"] if isinstance(data, dict) else data
    if isinstance(words, dict):
        words = [words]
    if not isinstance(words, list):
        die(f"{path}: expected a list of {{text, start, end}} word objects")
    out = []
    for w in words:
        if not isinstance(w, dict):
            die(f"{path}: word entries must be objects with text/start/end")
        text = str(w.get("text", w.get("word", ""))).strip()
        if not text:
            continue
        out.append({"text": text, "start": float(w["start"]), "end": float(w.get("end", w["start"]))})
    out.sort(key=lambda w: w["start"])
    return out


def find_whisper(cli_arg, model_arg):
    cands = [cli_arg, os.environ.get("WHISPER_CLI"), shutil.which("whisper-cli"), shutil.which("whisper-cli.exe")] + KNOWN_WHISPER
    cli = next((c for c in cands if c and os.path.isfile(c)), None)
    if not cli:
        return None, None
    model = model_arg or os.environ.get("WHISPER_MODEL")
    if not model:
        models_dir = os.path.normpath(os.path.join(os.path.dirname(cli), "..", "..", "models"))
        if os.path.isdir(models_dir):
            pref = ["medium.en", "small.en", "base.en", "medium", "small", "base", "large-v3-turbo", "large-v3", "tiny.en"]
            files = [f for f in os.listdir(models_dir) if f.startswith("ggml-") and f.endswith(".bin") and not f.startswith("for-tests")]
            for p in pref:
                hit = [f for f in files if f == f"ggml-{p}.bin"]
                if hit:
                    model = os.path.join(models_dir, hit[0])
                    break
    if not model or not os.path.isfile(model):
        return cli, None
    return cli, model


def whisper_words(wav16, cli, model, lang, prompt):
    tmp = tempfile.mkdtemp(prefix="align_")
    base = os.path.join(tmp, "out")
    cmd = [cli, "-m", model, "-f", wav16, "-l", lang, "-ml", "1", "-sow", "-ojf", "-of", base, "-np"]
    if prompt:
        cmd += ["--prompt", prompt[:600]]
    name = os.path.basename(model).replace("ggml-", "").replace(".bin", "").replace("-", ".")
    if name in DTW_PRESETS:
        cmd += ["-dtw", name]
    r = subprocess.run(cmd, capture_output=True, text=True)
    jpath = base + ".json"
    if r.returncode != 0 or not os.path.exists(jpath):
        # retry without DTW (older builds)
        cmd = [c for c in cmd if c not in ("-dtw", name)]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(jpath):
            raise RuntimeError(f"whisper-cli failed: {r.stderr[-400:]}")
    with open(jpath, encoding="utf-8", errors="replace") as fh:
        data = json.load(fh)
    words = []
    for seg in data.get("transcription", []):
        text = seg.get("text", "").strip()
        if not text or not norm(text):
            if words and text:
                words[-1]["text"] += text  # trailing punctuation
            continue
        s = seg["offsets"]["from"] / 1000.0
        e = seg["offsets"]["to"] / 1000.0
        toks = [t for t in seg.get("tokens", []) if t.get("text", "").strip() and not t.get("text", "").startswith("[_")]
        if toks and toks[0].get("t_dtw", -1) not in (-1, None) and toks[0]["t_dtw"] >= 0:
            s = min(max(toks[0]["t_dtw"] / 100.0, s - 0.3), e)
        words.append({"text": text, "start": s, "end": max(e, s + 0.04)})
    shutil.rmtree(tmp, ignore_errors=True)
    return words


# whisper.cpp loses its place across a silence this long, and no word straddles one, so the read is cut there and each
# piece transcribed on its own. Tested on the Coridr film's 2.6 s logo-reveal silence: transcribed whole, whisper
# stretched the turn line over 15 s ("finding" at 15.5 s, "time." at 25.8 s), never wrote the 34 words after the
# silence, and the captions after it were placed by word length, one caption edge 0.5 s early.
LONG_SILENCE = 1.5


def whisper_words_all(wav16, cli, model, lang, prompt, segs, notes):
    """Transcribe the read, in pieces cut inside every silence of LONG_SILENCE or more. Each piece starts 0.25 s before
    its speech: from the middle of that 2.6 s silence, whisper timed the first words a second early ("Meet" at 13.9 s,
    spoken at 14.85 s); from just before the speech, at 14.9 s."""
    gaps = [(a[1], b[0]) for a, b in zip(segs, segs[1:]) if b[0] - a[1] >= LONG_SILENCE]
    if not gaps:
        return whisper_words_run(wav16, cli, model, lang, prompt, segs, notes)
    cuts = [(a + b) / 2 for a, b in gaps]
    starts = [0.0] + [b - 0.25 for _, b in gaps]
    ends = [a + 0.3 for a, _ in gaps] + [None]
    words = []
    for t0, t1 in zip(starts, ends):
        tmp = tempfile.mkdtemp(prefix="align_part_")
        chunk = os.path.join(tmp, "part.wav")
        cmd = [ffmpeg_bin(), "-y", "-v", "error", "-ss", f"{t0:.3f}", "-i", wav16] + (["-t", f"{t1 - t0:.3f}"] if t1 is not None else [])
        subprocess.run(cmd + ["-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", chunk], check=True)
        part_segs = [(s - t0, e - t0) for s, e in segs if s >= t0 and (t1 is None or e <= t1)]
        part = whisper_words_run(chunk, cli, model, lang, prompt, part_segs, notes, offset=t0)
        shutil.rmtree(tmp, ignore_errors=True)
        words += [{"text": w["text"], "start": w["start"] + t0, "end": w["end"] + t0} for w in part]
    notes.append(f"transcribed in {len(cuts) + 1} pieces, cut inside the long silence{'s' if len(cuts) > 1 else ''} at "
                 f"{', '.join(f'{c:.2f}s' for c in cuts)} (whisper loses its place across a silence of {LONG_SILENCE} s or more)")
    return words


def whisper_words_run(wav16, cli, model, lang, prompt, segs, notes, offset=0.0):
    """whisper.cpp can stop transcribing after a long pause (a directed read's held beat after the turn does it) and
    leave the rest of the read untranscribed. When detected speech runs on well past the transcript's last word, the
    remaining audio is transcribed on its own and merged on the same timeline.

    Its timing can also derail partway through: words 1 to 1.4 s long, the rest piled on one time, the last one running
    to the end of whisper's 30 s window (seen on the Coridr read, in the piece after the logo silence; transcribed again
    without the prompt, the same piece came back within whisper's usual scatter, and the caption break then landed on
    the waveform's own pause, 22.71 s). That signature, a last word ending over a second past the speech, gets one
    more transcription without the prompt."""
    words = whisper_words(wav16, cli, model, lang, prompt)
    speech_end = segs[-1][1] if segs else None
    if words and speech_end is not None and words[-1]["end"] > speech_end + 1.0:
        again = whisper_words(wav16, cli, model, lang, "")
        kept = bool(again) and again[-1]["end"] <= speech_end + 1.0
        notes.append(f"whisper's timing derailed in the piece from {offset:.2f}s (its last word ran to {words[-1]['end'] + offset:.2f}s, "
                     f"past the speech at {speech_end + offset:.2f}s); transcribed it again, "
                     + ("and the second pass is on time" if kept else "and the second pass derailed too: check the phrase table"))
        if kept:
            words = again
    for _ in range(4):
        last = words[-1]["end"] if words else 0.0
        rest = [(s, e) for s, e in segs if e > last + 0.25]
        if sum(e - max(s, last) for s, e in rest) < 1.0:
            break
        cut = max(0.0, max(last, rest[0][0]) - 0.2)
        tmp = tempfile.mkdtemp(prefix="align_tail_")
        chunk = os.path.join(tmp, "tail.wav")
        subprocess.run([ffmpeg_bin(), "-y", "-v", "error", "-ss", f"{cut:.3f}", "-i", wav16, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", chunk], check=True)
        more = whisper_words(chunk, cli, model, lang, prompt)
        shutil.rmtree(tmp, ignore_errors=True)
        more = [{"text": w["text"], "start": w["start"] + cut, "end": w["end"] + cut} for w in more if w["start"] + cut > last - 0.05]
        if not more:
            break
        notes.append(f"whisper stopped at {last + offset:.2f}s with speech still to come; transcribed from {cut + offset:.2f}s on separately")
        words += more
    return words


def seg_align(script_words, word_phrase, segs, times=None):
    """Put the script's spoken words on the read's speech segments, then time each word inside its segment.

    A dynamic programme over segments and words: every segment takes a run of consecutive words whose spoken length
    (letters plus a constant per word) fits the segment at the read's own pace, and a run prefers to end where readers
    pause (a full stop, a comma, the end of a caption line). A segment may take no words (a breath, a click). Working
    word by word, it can split a caption line across a pause, or hold the end of one line and the start of the next in
    one breath, which fitting whole phrases to segments cannot. Tested on a read that pauses after "schedule," and runs
    "in your words, and tells you the moment you're paid." together: phrase fitting captioned "in your words," with
    the next line, 0.8 s early; whisper's own word times had drifted 2.8 s late by then. Inside a segment, words keep
    the transcript's relative timing when it is sane (in order, not stacked), otherwise they are spread by length.
    Returns [(start, end)] per script word, or None."""
    n, m = len(script_words), len(segs)
    if not n or not m:
        return None
    units = [max(1, len(re.sub(r"[^\w]", "", w, flags=re.UNICODE))) + 1.5 for w in script_words]
    cum = [0.0]
    for u in units:
        cum.append(cum[-1] + u)
    seglen = [e - s for s, e in segs]
    rate = sum(seglen) / cum[-1]

    def end_pen(k):  # a pause after word k-1
        if k >= n or word_phrase[k - 1] != word_phrase[k]:
            return 0.0
        w = script_words[k - 1]
        if re.search(r"[.!?\u2026][\"'\u201d\u2019)]*$", w):
            return 0.0
        if re.search(r"[,;:\u2014\u2013-][\"'\u201d\u2019)]*$", w):
            return 0.05
        return 0.35

    INF = float("inf")
    dp = [[INF] * (n + 1) for _ in range(m + 1)]
    bk = [[None] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = 0.0
    for j in range(m):
        L = seglen[j]
        skip = (0.1 + 0.5 * L) if L < 0.35 else (0.6 + L)
        for i in range(n + 1):
            base = dp[j][i]
            if base == INF:
                continue
            if base + skip < dp[j + 1][i]:
                dp[j + 1][i], bk[j + 1][i] = base + skip, i
            for k in range(i + 1, min(n, i + 45) + 1):
                want = (cum[k] - cum[i]) * rate
                r = (L - want) / max(want, 0.4)
                c = base + r * r + end_pen(k)
                if c < dp[j + 1][k]:
                    dp[j + 1][k], bk[j + 1][k] = c, i
    if dp[m][n] == INF:
        return None
    runs, k = [None] * m, n
    for j in range(m, 0, -1):
        i = bk[j][k]
        runs[j - 1] = (i, k) if i < k else None
        k = i
    out = [None] * n
    for j, run in enumerate(runs):
        if not run:
            continue
        i, k = run
        s, e = segs[j]
        tw = [times[w] for w in range(i, k)] if times else None
        sane = bool(tw) and k - i > 1 and all(b[0] - a[0] > 0.03 for a, b in zip(tw, tw[1:])) and tw[-1][1] > tw[0][0]
        if sane:
            t0, t1 = tw[0][0], max(tw[-1][1], tw[-1][0] + 0.05)
            starts = [s + (t[0] - t0) * (e - s) / (t1 - t0) for t in tw]
        else:
            starts = [s + (e - s) * (cum[w] - cum[i]) / (cum[k] - cum[i]) for w in range(i, k)]
        for q, w in enumerate(range(i, k)):
            st = starts[q]
            en = starts[q + 1] - 0.01 if q + 1 < len(starts) else e
            out[w] = (st, max(en, st + 0.04))
    if any(t is None for t in out):
        return None
    return out


def envelope(wav16, hop=0.01):
    """Mean square level every hop seconds of a 16-bit mono WAV (standard library only)."""
    import array
    import wave
    with wave.open(wav16, "rb") as wf:
        sr, n = wf.getframerate(), wf.getnframes()
        a = array.array("h", wf.readframes(n))
    if sys.byteorder == "big":
        a.byteswap()
    h = max(1, int(sr * hop))
    return [sum(v * v for v in a[i:i + h]) / h for i in range(0, len(a) - h + 1, h)]


def spread(words, ids, t0, t1):
    """Time the words ids over t0..t1 in proportion to their length."""
    ids = list(ids)
    units = [len(re.sub(r"\W", "", words[i]["text"], flags=re.UNICODE)) + 1.5 for i in ids]
    acc, tot = t0, sum(units)
    for i, u in zip(ids, units):
        words[i]["start"] = round(acc, 3)
        acc += (t1 - t0) * u / tot
        words[i]["end"] = round(max(acc - 0.01, words[i]["start"] + 0.04), 3)


def quietest(env, t, reach=0.2, hop=0.01):
    """The quietest moment within reach of t (three-frame average): where a reader breathes between words."""
    if not env:
        return t
    i0, i1 = max(1, int((t - reach) / hop)), min(len(env) - 2, int((t + reach) / hop))
    if i1 <= i0:
        return t
    j = min(range(i0, i1 + 1), key=lambda i: env[i - 1] + env[i] + env[i + 1])
    return (j + 0.5) * hop


def align_to_script(script_words, timed):
    """Give every script word a start/end from the timed words (spelling from the script)."""
    a = [norm(w) for w in script_words]
    b = [norm(w["text"]) for w in timed]
    times = [None] * len(script_words)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    matched = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (timed[j1 + k]["start"], timed[j1 + k]["end"])
                matched += 1
        elif tag == "replace":
            s, e = timed[j1]["start"], timed[j2 - 1]["end"]
            lens = [max(1, len(script_words[i])) for i in range(i1, i2)]
            tot = sum(lens)
            t = s
            for k, i in enumerate(range(i1, i2)):
                d = (e - s) * lens[k] / tot
                times[i] = (t, t + d)
                t += d
    # interpolate words the audio did not give us
    known = [i for i, x in enumerate(times) if x is not None]
    if not known:
        return None, 0
    for i in range(len(times)):
        if times[i] is not None:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        if prev is None:
            st = max(0.0, times[nxt][0] - 0.3 * (nxt - i))
            times[i] = (st, st + 0.25)
        elif nxt is None:
            st = times[prev][1] + 0.05 * (i - prev)
            times[i] = (st, st + 0.25)
        else:
            gap_s, gap_e = times[prev][1], times[nxt][0]
            span = max(0.0, gap_e - gap_s)
            n = nxt - prev - 1
            k = i - prev
            st = gap_s + span * (k - 1) / n
            times[i] = (st, st + span / n)
    return times, matched


def estimate(script_words, segs):
    """Spread script words over speech time in proportion to their length (pauses are skipped)."""
    total = sum(e - s for s, e in segs)
    if total <= 0:
        die("no speech found in the audio")
    weights = [max(1, len(w)) + 1.5 for w in script_words]
    W = sum(weights)

    def at(speech_t):
        acc = 0.0
        for s, e in segs:
            d = e - s
            if acc + d >= speech_t:
                return s + (speech_t - acc)
            acc += d
        return segs[-1][1]

    times = []
    cum = 0.0
    for w in weights:
        st = at(cum / W * total)
        cum += w
        en = at(cum / W * total)
        times.append((st, max(en - 0.02, st + 0.05)))
    return times


def spoken_end(words, i0, i1, segs=()):
    """When the last word of a phrase stops sounding. A TTS word list (SAPI ends each word at the next word's start)
    or a transcript often runs that end on through the pause after the line. If a detected speech segment ends inside
    the word's reported span, that is the real end (word times from the same audio, as tts_local.ps1 writes them);
    otherwise it is estimated from the phrase's own speaking rate and never trusted past the reported end."""
    def nchars(w):
        return max(1, len(re.sub(r"[^\w]", "", w["text"], flags=re.UNICODE)))
    last = words[i1]
    for s, e in segs:
        if s - 0.1 <= last["start"] <= e and last["start"] + 0.08 < e <= last["end"] + 0.05:
            return e
    if i1 > i0:
        dur = sum(min(words[w]["end"], words[w + 1]["start"]) - words[w]["start"] for w in range(i0, i1))
        rate = dur / sum(nchars(words[w]) for w in range(i0, i1))
    else:
        rate = 0.075
    return min(last["end"], last["start"] + min(1.2, max(0.15, rate * nchars(last) + 0.05)))


def group_align(phrases, segs, words, duration, est_weight=0.25):
    """Give every phrase whole speech segments (or a share of one when phrases run together), with a
    monotonic DP scored on (a) how long the phrase takes to say versus the speech it is given and
    (b) a light pull toward the transcript's own estimate. Then rescale each phrase's words into its
    span. Fixes transcription drift (whisper can slide seconds late over long pauses) and turns a
    proportional estimate into real phrase edges whenever the read has pauses."""
    n, m = len(phrases), len(segs)
    if not n or not m:
        return 0
    chars = [max(1, len(re.sub(r"[^\w]", "", p["text"], flags=re.UNICODE))) + 1.5 * len(p["text"].split()) for p in phrases]
    speech = sum(e - s for s, e in segs)
    exp = [c / sum(chars) * speech for c in chars]
    est = [words[p["words"][0]]["start"] for p in phrases]
    seglen = [e - s for s, e in segs]
    INF = float("inf")
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    bk = [[None] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0

    def dur_cost(have, want):
        r = (have - want) / max(want, 0.4)
        return 2.0 * r * r

    for i in range(n + 1):
        for j in range(m + 1):
            base = dp[i][j]
            if base == INF:
                continue
            if i < n:
                for k in (1, 2, 3):
                    if j + k > m:
                        break
                    c = dur_cost(sum(seglen[j:j + k]), exp[i]) + 0.15 * (k - 1) + est_weight * abs(segs[j][0] - est[i])
                    if base + c < dp[i + 1][j + k]:
                        dp[i + 1][j + k], bk[i + 1][j + k] = base + c, ("take", k)
                if i + 1 < n and j < m:
                    c = dur_cost(seglen[j], exp[i] + exp[i + 1]) + 0.6 + est_weight * abs(segs[j][0] - est[i])
                    if base + c < dp[i + 2][j + 1]:
                        dp[i + 2][j + 1], bk[i + 2][j + 1] = base + c, ("share", 1)
            if j < m:  # a breath, click or stray noise that belongs to no phrase
                c = (0.1 + 0.5 * seglen[j]) if seglen[j] < 0.35 else (0.6 + seglen[j])
                if base + c < dp[i][j + 1]:
                    dp[i][j + 1], bk[i][j + 1] = base + c, ("skip", 1)
    if dp[n][m] == INF:
        return 0
    spans = [None] * n
    i, j = n, m
    while i > 0 or j > 0:
        how = bk[i][j]
        if how is None:
            return 0
        if how[0] == "take":
            k = how[1]
            spans[i - 1] = (segs[j - k][0], segs[j - 1][1])
            i, j = i - 1, j - k
        elif how[0] == "share":
            s, e = segs[j - 1]
            share = chars[i - 2] / (chars[i - 2] + chars[i - 1])
            # Two lines in one breath: the break goes where the word times put it, as a share of the two lines'
            # span, and the letter count is only the fallback. A TTS word list or a transcript shifted by
            # insert_pause.py knows where the next line starts; letters do not (on the Coridr read, split by letters,
            # the break went 0.25 s early, before the "s" of "pass,"). A share far from the letter count means the
            # word times are wrong there (stacked or drifted), so the letters win.
            a0, b0, b1 = phrases[i - 2]["words"][0], phrases[i - 1]["words"][0], phrases[i - 1]["words"][1]
            t0, t1 = words[a0]["start"], spoken_end(words, b0, b1, segs)
            if t1 - t0 > 0.3:
                rel = (words[b0]["start"] - t0) / (t1 - t0)
                if 0.15 <= rel <= 0.85 and abs(rel - share) <= 0.25:
                    share = rel
            cut = s + (e - s) * share
            spans[i - 2], spans[i - 1] = (s, cut), (cut, e)
            i, j = i - 2, j - 1
        else:
            j -= 1
    moved = 0
    for k, p in enumerate(phrases):
        ns, ne = spans[k]
        i0, i1 = p["words"]
        old_s, old_e = words[i0]["start"], spoken_end(words, i0, i1, segs)
        if abs(ns - old_s) > 0.05 or abs(ne - old_e) > 0.05:
            moved += 1
        span_old = max(1e-3, old_e - old_s)
        scale = (ne - ns) / span_old
        starts = [ns + (words[w]["start"] - old_s) * scale for w in range(i0, i1 + 1)]
        if any(b - a < 0.005 for a, b in zip(starts, starts[1:])):
            # the transcript stacked several words on one time (whisper does this near the end of a file):
            # spread the phrase's words over its real speech by length instead
            weights = [max(1, len(re.sub(r"[^\w]", "", words[w]["text"], flags=re.UNICODE))) + 1.5 for w in range(i0, i1 + 1)]
            acc, starts = 0.0, []
            for wt in weights:
                starts.append(ns + (ne - ns) * acc / sum(weights))
                acc += wt
            ends = starts[1:] + [ne]
            for k, w in enumerate(range(i0, i1 + 1)):
                words[w]["start"], words[w]["end"] = round(starts[k], 3), round(min(duration, max(ends[k] - 0.02, starts[k] + 0.04)), 3)
        else:
            for k, w in enumerate(range(i0, i1 + 1)):
                ws = min(max(0.0, starts[k]), ne - 0.04)
                we = ne if w == i1 else ns + (min(words[w]["end"], words[w + 1]["start"]) - old_s) * scale
                words[w]["start"], words[w]["end"] = round(ws, 3), round(min(duration, ne, max(we, ws + 0.04)), 3)
        p["start"], p["end"] = round(ns, 3), round(min(ne, duration), 3)
    return moved


def snap(phrases, segs, words):
    """Move phrase edges onto real speech: the onset of the segment holding the first word, and the
    end of the segment holding the last word (unless speech runs on without a pause)."""
    def seg_of(t, tol=0.15):
        for s, e in segs:
            if s - tol <= t <= e + tol:
                return s, e
        return None

    for p in phrases:
        i0, i1 = p["words"]
        first, last = words[i0], words[i1]
        s0, e0 = first["start"], last["end"]
        seg = seg_of(first["start"] + 0.02)
        if seg and -0.4 <= seg[0] - first["start"] <= 0.25:
            s0 = seg[0]
            first["start"] = s0
        seg = seg_of(last["start"] + 0.02)
        if seg and last["start"] + 0.05 <= seg[1] <= last["end"] + 0.4:
            e0 = seg[1]
            last["end"] = e0
        p["start"], p["end"] = round(s0, 3), round(max(e0, s0 + 0.2), 3)
    for k in range(len(phrases) - 1):
        if phrases[k]["end"] > phrases[k + 1]["start"]:
            mid = (phrases[k]["end"] + phrases[k + 1]["start"]) / 2
            phrases[k]["end"] = round(min(phrases[k]["end"], max(mid, phrases[k]["start"] + 0.2)), 3)
            phrases[k + 1]["start"] = round(max(phrases[k + 1]["start"], phrases[k]["end"]), 3)


BREAK_BEFORE = {"and", "but", "so", "because", "or", "then", "which", "that", "to", "when", "while", "if", "from", "with"}


def split_phrases(words, max_chars=38):
    """No script: break words into caption phrases at sentence punctuation, pauses, and before
    conjunctions, keeping each phrase readable (about max_chars). Write a script and re-run for finals."""
    phrases = []
    cur = []

    def emit(idx):
        phrases.append({"id": f"p{len(phrases) + 1}", "text": " ".join(words[k]["text"] for k in idx), "words": [idx[0], idx[-1]]})

    for i, w in enumerate(words):
        cur.append(i)
        text = " ".join(words[k]["text"] for k in cur)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 1
        punct = bool(re.search(r"[.,!?;:]$", w["text"]))
        long_enough = len(cur) >= 2 and len(text) >= 12
        if not nxt or (punct and long_enough) or (gap >= 0.28 and long_enough):
            emit(cur)
            cur = []
            continue
        if len(text) >= max_chars:
            # break before the last conjunction inside the phrase, else here
            cut = None
            for j in range(len(cur) - 1, 0, -1):
                if norm(words[cur[j]]["text"]) in BREAK_BEFORE and len(" ".join(words[k]["text"] for k in cur[:j])) >= 12:
                    cut = j
                    break
            if cut:
                emit(cur[:cut])
                cur = cur[cut:]
            else:
                emit(cur)
                cur = []
    if cur:
        emit(cur)
    return phrases


def ts(t, vtt=False):
    t = max(0.0, t)
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = t % 60
    sep = "." if vtt else ","
    return f"{h:02d}:{m:02d}:{int(s):02d}{sep}{int(round((s - int(s)) * 1000)) % 1000:03d}"


def write_subs(base, phrases):
    with open(base + ".srt", "w", encoding="utf-8") as fh:
        for i, p in enumerate(phrases, 1):
            end = p["end"] + 0.25
            if i < len(phrases):
                end = min(end, phrases[i]["start"] - 0.02)
            fh.write(f"{i}\n{ts(p['start'])} --> {ts(end)}\n{p['text']}\n\n")
    with open(base + ".vtt", "w", encoding="utf-8") as fh:
        fh.write("WEBVTT\n\n")
        for i, p in enumerate(phrases, 1):
            end = p["end"] + 0.25
            if i < len(phrases):
                end = min(end, phrases[i]["start"] - 0.02)
            fh.write(f"{ts(p['start'], True)} --> {ts(end, True)}\n{p['text']}\n\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio", nargs="?")
    ap.add_argument("--out", help="captions.json path (srt/vtt written beside it)")
    ap.add_argument("--script", help="one caption phrase per line, optional [id] prefix")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--words-from", help="existing word timings JSON")
    ap.add_argument("--whisper", help="path to whisper-cli")
    ap.add_argument("--model", help="path to a ggml model")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--method", choices=["auto", "words", "whisper", "estimate"], default="auto")
    ap.add_argument("--silence-db", type=float, default=-38.0)
    ap.add_argument("--max-chars", type=int, default=38)
    ap.add_argument("--print-spoken", action="store_true", help="print the script as it should be read (for TTS prompts) and exit")
    a = ap.parse_args()

    phrases_in = load_script(a.script) if a.script else None
    if a.print_spoken:
        if not phrases_in:
            die("--print-spoken needs --script")
        print("\n".join(p["spoken"] for p in phrases_in))
        return
    if not a.out:
        die("--out is required")
    if not a.audio or not os.path.isfile(a.audio):
        die(f"audio not found: {a.audio}")
    duration = duration_of(a.audio)
    # spoken words drive alignment; display tokens (what the captions show) take their times
    script_words, word_phrase, display = [], [], []  # display: (text, phrase index, first spoken idx, last spoken idx)
    if phrases_in:
        for pi, p in enumerate(phrases_in):
            for disp, spoken in p["tokens"]:
                first = len(script_words)
                for w in spoken:
                    script_words.append(w)
                    word_phrase.append(pi)
                display.append((disp, pi, first, len(script_words) - 1))

    tmp = tempfile.mkdtemp(prefix="vo16k_")
    wav16 = os.path.join(tmp, "vo16k.wav")
    to_wav16k(a.audio, wav16)
    segs = speech_segments(wav16, duration, a.silence_db)
    method, timed, notes = None, None, []
    on_segments, heard = False, None

    if a.method in ("auto", "words") and a.words_from:
        timed, method = load_words(a.words_from), "words"
        with open(a.words_from, encoding="utf-8-sig") as fh:
            src = json.load(fh)
        if isinstance(src, dict) and src.get("method") == "whisper":
            method = "whisper"  # a cached transcript (captions.timing.json) is treated like a fresh one
    if timed is None and a.method in ("auto", "whisper"):
        cli, model = find_whisper(a.whisper, a.model)
        if cli and model:
            try:
                prompt = " ".join(p["text"] for p in phrases_in) if phrases_in else ""
                timed, method = whisper_words_all(wav16, cli, model, a.lang, prompt, segs, notes), "whisper"
            except Exception as exc:  # noqa: BLE001
                notes.append(f"whisper failed, falling back: {exc}")
        elif a.method == "whisper":
            die("whisper-cli or a ggml model was not found (pass --whisper and --model)")
        else:
            notes.append("whisper.cpp not found; using the estimate")
        if timed and method == "whisper":
            cache = os.path.splitext(a.out)[0] + ".timing.json"
            os.makedirs(os.path.dirname(os.path.abspath(cache)), exist_ok=True)
            with open(cache, "w", encoding="utf-8") as fh:
                json.dump({"words": timed, "method": "whisper", "source": os.path.basename(a.audio)}, fh, indent=1, ensure_ascii=False)
            notes.append(f"raw whisper timings saved to {cache} (re-run with --words-from it after script edits to skip transcription)")

    if phrases_in:
        if timed:
            times, matched = align_to_script(script_words, timed)
            if times is None:
                notes.append("no words matched the script; using the estimate")
                times, method = estimate(script_words, segs), "estimate"
            else:
                heard = times  # the transcript's own word times, a second opinion for the breaks inside a breath
                rate = matched / max(1, len(script_words))
                notes.append(f"{matched}/{len(script_words)} script words matched the audio ({rate:.0%})")
                if rate < 0.6:
                    notes.append("LOW MATCH: the read may differ from the script. Check the phrases below by eye, or fix the script to match the take.")
                method = f"{method}+script"
        else:
            if a.method == "words":
                die("--method words needs --words-from")
            times, method = estimate(script_words, segs), "estimate"
        # a transcript or an estimate is placed word by word on the read's own pauses; exact TTS word lists are kept
        if not method.startswith("words") and len(segs) >= max(3, len(phrases_in) // 2):
            placed = seg_align(script_words, word_phrase, segs, times)
            if placed:
                times, on_segments = placed, True
                notes.append(f"placed the script's words on {len(segs)} speech segments (each pause found where it falls in the script)")
        words = [{"text": d, "start": round(times[s0][0], 3), "end": round(times[s1][1], 3)} for d, _, s0, s1 in display]
        phrases = []
        for pi, p in enumerate(phrases_in):
            idx = [i for i, x in enumerate(display) if x[1] == pi]
            phrases.append({"id": p["id"], "text": p["text"], "words": [idx[0], idx[-1]]})
    else:
        if not timed:
            die("without --script, timings must come from whisper or --words-from")
        words = [{"text": w["text"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in timed]
        phrases = split_phrases(words, a.max_chars)
        method = method or "whisper"

    for w in words:  # nothing past the end of the audio
        w["start"], w["end"] = min(w["start"], duration), min(w["end"], duration)
    if on_segments:
        for p in phrases:
            p["start"], p["end"] = words[p["words"][0]]["start"], words[p["words"][1]]["end"]
        # Two caption lines read in one breath: put the break on the quietest moment near it (the comma). Inside a
        # breath the placed word times are the transcript's stretched to fill it, and a transcript that drifts can
        # leave them 0.2 to 0.5 s off: on the Coridr read the break went to where the "s" of "pass," begins and, with a
        # stalled transcript, onto the "p" closure in it. So the search spans both estimates of the break (placed and heard) and
        # stays between the start of the last word and the end of the next one by either; the deepest dip there is the
        # comma (tested: the "s" ends at 22.72 s, the dip is at 22.71 s, the next words run on with no dip).
        env = envelope(wav16)
        for k in range(len(phrases) - 1):
            p, q = phrases[k], phrases[k + 1]
            if q["start"] - p["end"] < 0.05:
                wa, wb = words[p["words"][1]], words[q["words"][0]]
                est = [(p["end"] + q["start"]) / 2]
                lo, hi = wa["start"] + 0.08, wb["end"] - 0.08
                if heard:  # trusted only when it falls inside the same breath, near the placed estimate
                    ia, ib = display[p["words"][1]][3], display[q["words"][0]][2]
                    hb = (heard[ia][1] + heard[ib][0]) / 2
                    breath = next(((s, e) for s, e in segs if s - 0.05 <= est[0] <= e + 0.05), None)
                    if breath and breath[0] < hb < breath[1] and abs(hb - est[0]) < 0.6:
                        est.append(hb)
                        # whisper often gives a word 0.04 s, so its end is no bound, and both estimates can sit 0.3 s
                        # early together: allow a word past the next word's heard start, and search wider
                        lo, hi = min(lo, heard[ia][0] + 0.08), max(hi, heard[ib][1] - 0.08, heard[ib][0] + 0.3)
                reach = min(0.45, 0.3 + abs(est[0] - est[-1]) / 2) if len(est) > 1 else 0.2
                t = quietest(env, sum(est) / len(est), reach=reach)
                if lo < t < hi:
                    p["end"] = words[p["words"][1]]["end"] = round(t, 3)
                    q["start"] = words[q["words"][0]]["start"] = round(t + 0.01, 3)
                    # words the break moved over keep their order, spread by length up to the first word it left
                    # alone (on the Coridr read "with" and "the" had come out on one time)
                    a0, a1 = p["words"]
                    i = a1
                    while i > a0 and words[i]["start"] > t - 0.06:
                        i -= 1
                    if i < a1:
                        spread(words, range(i, a1 + 1), words[i]["start"], t)
                    b0, b1 = q["words"]
                    j = b0 + 1
                    while j <= b1 and words[j]["start"] < t + 0.06:
                        j += 1
                    if j > b0 + 1:
                        spread(words, range(b0, j), t + 0.01, (words[j]["start"] if j <= b1 else q["end"]) - 0.01)
    elif len(segs) >= max(2, int(0.7 * len(phrases))):
        moved = group_align(phrases, segs, words, duration)
        notes.append(f"fitted phrases to {len(segs)} detected speech segments ({moved} phrase(s) re-timed)")
    else:
        notes.append(f"only {len(segs)} speech segment(s) detected (music under the voice, or no pauses): kept the transcript's timings")
    snap(phrases, segs, words)
    # keep words inside their phrase window and monotonic
    for p in phrases:
        for i in range(p["words"][0], p["words"][1] + 1):
            words[i]["start"] = round(min(max(words[i]["start"], p["start"]), p["end"]), 3)
            words[i]["end"] = round(min(max(words[i]["end"], words[i]["start"] + 0.04), p["end"] + 0.3), 3)

    out = {
        "fps": a.fps,
        "duration": round(duration, 3),
        "method": method,
        "source": os.path.basename(a.audio),
        "words": words,
        "phrases": [{"id": p["id"], "text": p["text"], "start": p["start"], "end": p["end"], "words": p["words"]} for p in phrases],
    }
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1, ensure_ascii=False)
    base = os.path.splitext(a.out)[0]
    write_subs(base, out["phrases"])
    shutil.rmtree(tmp, ignore_errors=True)

    print(f"method: {method}   duration: {duration:.2f}s   speech segments: {len(segs)}")
    for n in notes:
        print("note:", n)
    if method == "estimate":
        print("ESTIMATED timings: check phrase starts against the waveform or a contact sheet before locking animation.")
    print(f"{'id':<12}{'start':>8}{'end':>8}{'frame':>7}  text")
    # Pace in letters per second, not words: a line of long words ("Coridr. Application readiness.", 3 words and 10
    # syllables) read at the usual speed measured 1.3 words/s against 2.8 and was flagged for nothing.
    paces = [sum(c.isalnum() for c in p["text"]) / max(0.05, p["end"] - p["start"]) for p in out["phrases"]]
    usual = sorted(paces)[len(paces) // 2] if paces else 14.0
    slipped = []
    for p, lps in zip(out["phrases"], paces):
        dur = p["end"] - p["start"]
        flag = "  <- short" if dur < 0.6 else ""
        if len(p["text"].split()) >= 3 and not 0.6 * usual <= lps <= 1.75 * usual:
            flag += f"  <- {lps:.1f} letters/s against {usual:.1f}: CHECK"
            slipped.append(p["id"])
        print(f"{p['id']:<12}{p['start']:8.2f}{p['end']:8.2f}{round(p['start'] * a.fps):7d}  {p['text']}{flag}")
    if slipped:
        print(f"CHECK: {', '.join(slipped)} run far off this read's own pace, so a caption edge may sit on the wrong pause "
              "(or music under the voice blurred the timing). Hear each phrase on its own: check_captions.py.")
    print(f"wrote {a.out}, {base}.srt, {base}.vtt")


if __name__ == "__main__":
    main()
