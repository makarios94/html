"""Hear every caption phrase on its own: transcribe each phrase's audio and compare it with the caption text.

  python check_captions.py VO.wav --captions captions.json [--min 0.6]

align_vo.py places the script on the read's own pauses and flags any phrase that runs far off the read's pace. This
is the check by ear, for a final read whose captions carry the story. It cuts every phrase out with a little silence
around it, transcribes them all in one whisper.cpp run and scores how much of each caption it heard. A caption edge on
the wrong pause shows at once: one phrase is missing its last words and the next starts with them (tested: it caught
"in your words," captioned with the next line, 0.9 s early, in a film that had passed every other check). One word
heard only on the wrong side of an edge is flagged too ("pass," on the Coridr read, 0.5 s early). It is slow
on a CPU (about 15 to 35 s per phrase with the medium model), so run it once on the final read. Very short phrases
("Meet Paidly.") can come back empty: those count as unheard, not wrong. Exits 1 when a phrase scores under --min.
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

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from align_vo import find_whisper  # noqa: E402


def words_of(s):
    return re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("’", "'")).split()


def score(text, heard):
    """Share of the caption heard, in order. A heard word spelled close to a caption word counts as that word:
    whisper writes a brand name its own way ("Meet Paidely." for "Meet Paidly." scored 0.5 before this)."""
    want = words_of(text)
    got = []
    for w in words_of(heard):
        if w == "dot" or not w:
            continue
        if w not in want:
            near = max(want, key=lambda x: difflib.SequenceMatcher(None, w, x).ratio(), default=None)
            if near and difflib.SequenceMatcher(None, w, near).ratio() >= 0.75:
                w = near
        got.append(w)
    return difflib.SequenceMatcher(None, want, got, autojunk=False).ratio() if got else 0.0


def _snap(words, vocab):
    out = []
    for w in words:
        if w in vocab or not vocab:
            out.append(w)
            continue
        near = max(vocab, key=lambda x: difflib.SequenceMatcher(None, w, x).ratio())
        out.append(near if difflib.SequenceMatcher(None, w, near).ratio() >= 0.75 else w)
    return out


def _overlap(a, b):
    """Longest n with a[-n:] == b[:n]."""
    return max([n for n in range(1, min(len(a), len(b)) + 1) if a[-n:] == b[:n]], default=0)


def edge_shift(text_a, heard_a, text_b, heard_b):
    """Words on the wrong side of the edge between captions a and b, as (early, late): early counts a's last words
    heard at the start of b's audio (b shows too soon), late counts b's first words heard at the end of a's audio
    (b shows too late). One word is normal where two lines share a breath; two or more is an edge on the wrong pause.
    A score alone misses it: "Paidly follows up on schedule, in your words," heard without its last three words still
    scores 0.62."""
    wa, wb = words_of(text_a), words_of(text_b)
    ha, hb = _snap(words_of(heard_a), wa + wb), _snap(words_of(heard_b), wa + wb)
    return _overlap(wa, hb), _overlap(ha, wb)


def displaced(text_a, heard_a, text_b, heard_b):
    """One word on the wrong side of the edge and missing from its own side, as (early, late): the caption changes
    before that word is said, or shows after its first word was said. A word heard on both sides is shared in a breath,
    which is normal. Tested: "Every check runs in one pass," changed 0.5 s before "pass" was said (heard "...in one
    part." and "Pass, with the evidence..."), and the one-shared-word allowance had passed it."""
    wa, wb = words_of(text_a), words_of(text_b)
    ha, hb = _snap(words_of(heard_a), wa + wb), _snap(words_of(heard_b), wa + wb)
    early = bool(wa) and hb[:1] == wa[-1:] and wa[-1] not in ha[-2:]
    late = bool(wb) and ha[-1:] == wb[:1] and wb[0] not in hb[:2]
    return early, late


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("wav")
    ap.add_argument("--captions", required=True)
    ap.add_argument("--min", type=float, default=0.6, help="lowest acceptable share of a caption heard (default 0.6)")
    ap.add_argument("--whisper")
    ap.add_argument("--model")
    a = ap.parse_args()
    cli, model = find_whisper(a.whisper, a.model)
    if not cli or not model:
        sys.exit("check_captions: whisper.cpp not found (pass --whisper and --model)")
    ff = shutil.which("ffmpeg") or sys.exit("check_captions: ffmpeg not found on PATH")
    with open(a.captions, encoding="utf-8") as fh:
        phrases = json.load(fh)["phrases"]
    tmp = tempfile.mkdtemp(prefix="capcheck_")
    clips = []
    for k, p in enumerate(phrases):
        clip = os.path.join(tmp, f"p{k:03d}.wav")
        subprocess.run([ff, "-y", "-v", "error", "-ss", f"{max(0.0, p['start'] - 0.04):.3f}", "-to", f"{p['end'] + 0.04:.3f}", "-i", a.wav,
                        "-af", "adelay=300,apad=pad_dur=0.3", "-ac", "1", "-ar", "16000", clip], check=True)
        clips.append(clip)
    cmd = [cli, "-m", model, "-l", "en", "-nt", "-np", "-otxt"]
    for c in clips:
        cmd += ["-f", c]
    subprocess.run(cmd, capture_output=True, text=True)
    bad, heard_all = [], []
    for p, clip in zip(phrases, clips):
        txt = clip + ".txt"
        heard = " ".join(open(txt, encoding="utf-8", errors="replace").read().split()) if os.path.exists(txt) else ""
        heard_all.append(heard)
        if not words_of(heard):
            print(f"  {p['id']:<10} unheard ({p['end'] - p['start']:.2f}s)  {p['text']}")
            continue
        s = score(p["text"], heard)
        mark = "OK  " if s >= a.min else "MISS"
        if s < a.min:
            bad.append(p["id"])
        print(f"  {mark} {p['id']:<10} {s:4.2f}  heard: {heard[:70]}")
    shutil.rmtree(tmp, ignore_errors=True)
    for k in range(len(phrases) - 1):
        if not words_of(heard_all[k]) or not words_of(heard_all[k + 1]):
            continue
        early, late = edge_shift(phrases[k]["text"], heard_all[k], phrases[k + 1]["text"], heard_all[k + 1])
        one_early, one_late = displaced(phrases[k]["text"], heard_all[k], phrases[k + 1]["text"], heard_all[k + 1])
        if early >= 2:
            bad.append(phrases[k + 1]["id"])
            print(f"  EDGE [{phrases[k + 1]['id']}] shows {early} words early: the end of [{phrases[k]['id']}] is heard under it")
        elif early == 1 and one_early:
            bad.append(phrases[k + 1]["id"])
            print(f"  EDGE [{phrases[k + 1]['id']}] shows 1 word early: the last word of [{phrases[k]['id']}] is heard only after the caption changes")
        if late >= 2:
            bad.append(phrases[k + 1]["id"])
            print(f"  EDGE [{phrases[k + 1]['id']}] shows {late} words late: its first words are heard under [{phrases[k]['id']}]")
        elif late == 1 and one_late:
            bad.append(phrases[k + 1]["id"])
            print(f"  EDGE [{phrases[k + 1]['id']}] shows 1 word late: its first word is heard only under [{phrases[k]['id']}]")
    if bad:
        print(f"MISS: {', '.join(dict.fromkeys(bad))}. A caption edge sits on the wrong pause, or the read differs from the "
              "script there. Re-run align_vo.py, or move the edge by hand in captions.json, and check again.")
        sys.exit(1)
    print("every caption heard where it is shown")


if __name__ == "__main__":
    main()
