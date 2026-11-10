"""Word starts inside each caption phrase, placed on the waveform's own boundaries.

  python word_starts.py READ.wav captions.json [--ids turn,reveal]          print them beside whisper's
  python word_starts.py READ.wav captions.json --write captions.json        write them (phrase timings untouched)

Run it after align_vo.py when a scene moves on single words (a logo landing on the spoken name, a headline word by
word). Whisper's word starts inside one breath ran late on the Coridr reads, 0.1 to 0.3 s on one voice and up to
0.65 s on the other ("Coridr" heard at 16.20 s, said at 15.52 s), while the phrase edges, fitted to the read's pauses,
were right. So only the boundaries between words in one breath are placed here. Every 10 ms frame gets a boundary
strength from the waveform: speech resuming after a silence (strongest), a dip in level (a stop closure), or the
start of a hiss (an f, s or sh, an aspirated p, t or k). A dynamic programme picks one boundary per word, using the
strongest boundaries while each word's length stays near its share of the phrase (syllables; short function words
less), with whisper's own start as a soft guide that allows for its lateness.

Tested against 15 starts measured by hand on two voices (Sulbyee and Pastie, Coridr 30 s), all words that begin with a
consonant or follow a pause: 13 landed within 0.1 s (most within 0.05 s), two landed 0.12 and 0.20 s late ("student",
"problems"; whisper had them 0.16 and 0.28 s late). A vowel-initial function word run into the word before ("at" in
"one at a time") has no boundary to find and can be 0.35 s off: time a move to the next word with a clear start.
"""
import argparse
import json
import math
import re
import wave

import numpy as np

HOP = 0.01


def frames(path):
    w = wave.open(path, "rb")
    sr, n, sw, ch = w.getframerate(), w.getnframes(), w.getsampwidth(), w.getnchannels()
    a = np.frombuffer(w.readframes(n), dtype={2: np.int16, 4: np.int32}[sw]).astype(float)
    if ch > 1:
        a = a.reshape(-1, ch).mean(1)
    a /= 2 ** (8 * sw - 1)
    h = int(sr * HOP)
    nf = len(a) // h
    fr = a[: nf * h].reshape(nf, h)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    db -= np.percentile(db, 95)
    # zero crossings per 10 ms at 48 kHz scale (a hiss shows 100 and more, voiced speech under 40)
    zc = (np.diff(np.signbit(fr).astype(np.int8), axis=1) != 0).sum(1) * (48000 / sr)
    return db, zc


def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    return max(1, n)


def strength(db, zc, f):
    """How much frame f looks like the start of a word: the bottom of a dip, or where a hiss begins."""
    if f < 6 or f + 6 >= len(db):
        return 0.0
    s = 0.0
    if db[f] <= db[f - 1] and db[f] <= db[f + 1] and db[f] <= min(db[f - 2], db[f + 2]):
        depth = min(db[f - 6:f].max(), db[f + 1:f + 7].max()) - db[f]
        s = max(s, min(1.6, depth / 8.0))
    # a hiss begins (f, s, sh, an aspirated p, t, k): the next 40 ms hiss, the 40 ms before do not
    before = zc[f - 4:f].mean()
    after = zc[f:f + 4].mean()
    if after >= 70 and before < 30 and db[f:f + 4].max() > -45:
        s = max(s, min(1.5, (after - before) / 60.0))
    # speech resumes after a silence (a comma, a full stop): the strongest boundary there is
    if db[f - 8:f].mean() < -38 and db[f:f + 3].max() - db[f - 1] > 15:
        s = max(s, 2.2)
    return s


FUNCTION = {"a", "an", "at", "the", "to", "of", "in", "on", "for", "and", "its", "it", "with", "you're", "we", "is", "by"}


def share_of(word):
    w = re.sub(r"[^a-z']", "", word.lower())
    return 0.7 if w in FUNCTION else syllables(word) + 0.5


def heard_cost(f, h):
    """Whisper's own start as a soft guide. It runs late on these reads (0.1 to 0.65 s), so a boundary before it is
    cheap and one after it is not."""
    if h is None:
        return 0.0
    d = f * HOP - h
    return 0.35 * (d / 0.5) ** 2 if d < 0 else 0.35 * (d / 0.12) ** 2


def place(db, zc, start, end, words, weight=0.6, heard=None):
    """Starts for words 1..n-1 inside [start, end] (word 0 starts at the phrase start)."""
    n = len(words)
    heard = heard or [None] * n
    if n < 2:
        return [start]
    f0, f1 = int(round(start / HOP)), int(round(end / HOP))
    T = max(0.05, end - start)
    share = np.array([share_of(w) for w in words], dtype=float)
    share /= share.sum()
    exp = share * T
    cand = list(range(f0 + 4, f1 - 4))
    st = {f: strength(db, zc, f) for f in cand}
    INF = float("inf")
    # cost[i][f] = best cost with word i starting at frame f
    prev = {f0: 0.0}
    back = []
    for i in range(1, n):
        cur, bk = {}, {}
        for f in cand:
            best, arg = INF, None
            for g, c in prev.items():
                d = (f - g) * HOP
                if d < 0.06:
                    continue
                dev = math.log(d / exp[i - 1])
                cc = c + weight * dev * dev - st[f] + heard_cost(f, heard[i])
                if cc < best:
                    best, arg = cc, g
            if arg is not None:
                cur[f], bk[f] = best, arg
        back.append(bk)
        prev = cur
    # the last word runs to the phrase end
    best, arg = INF, None
    for g, c in prev.items():
        d = (f1 - g) * HOP
        if d < 0.06:
            continue
        dev = math.log(d / exp[-1])
        cc = c + weight * dev * dev
        if cc < best:
            best, arg = cc, g
    starts = [arg]
    for bk in reversed(back[1:]):
        starts.append(bk[starts[-1]])
    starts.append(f0)
    return [f * HOP for f in reversed(starts)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wav")
    ap.add_argument("captions")
    ap.add_argument("--ids")
    ap.add_argument("--write")
    a = ap.parse_args()
    db, zc = frames(a.wav)
    cap = json.load(open(a.captions, encoding="utf-8"))
    ids = a.ids.split(",") if a.ids else [p["id"] for p in cap["phrases"]]
    for p in cap["phrases"]:
        if p["id"] not in ids:
            continue
        i0, i1 = p["words"]
        ws = cap["words"][i0: i1 + 1]
        starts = place(db, zc, p["start"], p["end"], [w["text"] for w in ws], heard=[w["start"] for w in ws])
        print(f"{p['id']:9s} " + "  ".join(f"{w['text']}@{s:.2f}({w['start']:.2f})" for w, s in zip(ws, starts)))
        if a.write:
            for k, (w, s) in enumerate(zip(ws, starts)):
                w["start"] = round(s, 3)
                nxt = starts[k + 1] if k + 1 < len(starts) else p["end"]
                w["end"] = round(max(s + 0.04, nxt - 0.01), 3)
    if a.write:
        cap["word_starts"] = "word_starts.py: word starts placed on the waveform's own boundaries inside each phrase"
        with open(a.write, "w", encoding="utf-8") as fh:
            json.dump(cap, fh, indent=1, ensure_ascii=False)
        print("wrote", a.write)


if __name__ == "__main__":
    main()
