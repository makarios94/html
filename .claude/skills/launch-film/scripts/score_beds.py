"""Score a voice-led film from its own voice: two temp beds whose sections land on the story's beats.

  python score_beds.py src/films/<id>/data/captions.json public/films/<id> --turn turn --reveal reveal --cta cta
         [--reveal-word Meet] [--lead 0] [--problem tension:A] [--product warm:C] [--fps 30] [--tail 3]

What it builds (the swells a composer would give a Seeran-style film):
- a problem bed under the setup that drops to a bare pad (BREAK) 8 frames before the turn line and then goes silent
  (STOP): the drop is what makes the turn land;
- a product bed whose riser rises out of the quiet after the turn and peaks exactly on the reveal (the swell), then a
  LIFT through the product world, and an OUTRO chord on the end card's first line, left to ring out.
Tempos are solved from the voice (each bed between 84 and 120 BPM), so a new take re-scores the film: re-run after
every align_vo.py. Writes music_problem.wav and music_product.wav (each with .beats.json) into the public folder, and
score.json beside captions.json, which the film reads to place both <Music> beds.
"""
import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def norm(s):
    return re.sub(r"[^\w']+", "", s.lower())


def best_bars(span, lo=84.0, hi=120.0, target=100.0):
    """Whole bars filling `span` seconds at a tempo inside [lo, hi], nearest the target."""
    best = None
    for n in range(1, 33):
        bpm = 240.0 * n / span
        if lo <= bpm <= hi and (best is None or abs(bpm - target) < best[0]):
            best = (abs(bpm - target), n, bpm)
    if best is None:
        n = max(1, round(span * target / 240.0))
        return n, round(240.0 * n / span, 3)
    return best[1], round(best[2], 3)


def mood_key(spec, default):
    mood, _, key = (spec or default).partition(":")
    return mood, key or "C"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("captions")
    ap.add_argument("public_dir")
    ap.add_argument("--turn", required=True, help="cue id of the turn line (the music drops before it)")
    ap.add_argument("--reveal", required=True, help="cue id of the reveal line (the swell peaks on it)")
    ap.add_argument("--cta", required=True, help="cue id of the end card's first line (the outro chord lands on it)")
    ap.add_argument("--reveal-word", help="a word inside the reveal line to peak on instead of the line's start")
    ap.add_argument("--lead", type=int, default=0, help="frames the swell peaks before the reveal (a visual flood)")
    ap.add_argument("--problem", default="tension:A", help="mood:key of the problem bed")
    ap.add_argument("--product", default="warm:C", help="mood:key of the product bed")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--tail", type=float, default=3.0, help="seconds the outro chord rings at least")
    ap.add_argument("--hold", type=float, default=1.6, help="seconds the film holds after the voice ends (config TAIL); the chord rings to the last frame")
    a = ap.parse_args()

    with open(a.captions, encoding="utf-8") as fh:
        cap = json.load(fh)
    phrases = {p["id"]: p for p in cap["phrases"]}
    for cue in (a.turn, a.reveal, a.cta):
        if cue not in phrases:
            sys.exit(f"no phrase [{cue}] in {a.captions}; ids: {', '.join(phrases)}")
    fps = a.fps
    turn = phrases[a.turn]["start"]
    rp = phrases[a.reveal]
    reveal = rp["start"]
    if a.reveal_word:
        ws = cap["words"][rp["words"][0]:rp["words"][1] + 1]
        hit = next((w for w in ws if norm(w["text"]) == norm(a.reveal_word)), None)
        if not hit:
            sys.exit(f'"{a.reveal_word}" is not in [{a.reveal}]')
        reveal = hit["start"]
    reveal -= a.lead / fps
    cta = phrases[a.cta]["start"]

    t_break = turn - 8 / fps
    n_a, bpm_a = best_bars(t_break)
    bar_a = 240.0 / bpm_a
    n_b, bpm_b = best_bars(cta - reveal)
    bar_b = 240.0 / bpm_b
    start_b = max(0.0, reveal - bar_b)

    film_end = cap.get("duration", phrases[a.cta]["end"]) + a.hold
    tail_b = max(a.tail, film_end - (start_b + (n_b + 2) * bar_b) + 0.3)
    pa_mood, pa_key = mood_key(a.problem, "tension:A")
    pb_mood, pb_key = mood_key(a.product, "warm:C")
    os.makedirs(a.public_dir, exist_ok=True)
    kit = os.path.join(HERE, "sound_kit.py")
    py = sys.executable
    out_a = os.path.join(a.public_dir, "music_problem.wav")
    out_b = os.path.join(a.public_dir, "music_product.wav")
    subprocess.run([py, kit, "bed", out_a, "--bpm", str(bpm_a), "--bars", str(n_a + 2), "--mood", pa_mood, "--key", pa_key,
                    "--sections", f"0:main,{n_a}:break,{n_a + 1}:stop", "--tail", "0.6"], check=True)
    # bar 0 is silent apart from the riser, so nothing new sits under the end of the turn line
    subprocess.run([py, kit, "bed", out_b, "--bpm", str(bpm_b), "--bars", str(n_b + 2), "--mood", pb_mood, "--key", pb_key,
                    "--sections", f"0:stop,1:lift,{n_b + 1}:outro", "--tail", f"{tail_b:.2f}"], check=True)

    score = {
        "fps": fps,
        "problem": {"src": "music_problem.wav", "at": 0, "endAt": round(((n_a + 1) * bar_a + 0.6) * fps), "bpm": bpm_a,
                    "break": round(t_break * fps)},
        "product": {"src": "music_product.wav", "at": round(start_b * fps), "bpm": bpm_b, "swell": round(reveal * fps),
                    "outro": round(cta * fps)},
    }
    out_json = os.path.join(os.path.dirname(os.path.abspath(a.captions)), "score.json")
    with open(out_json, "w", encoding="utf-8") as fh:
        json.dump(score, fh, indent=1)
    print(f"problem bed: {bpm_a} BPM, {n_a} bars of {pa_mood} then a break at frame {score['problem']['break']} "
          f"({t_break:.2f}s, 8 frames before [{a.turn}]), then silence")
    print(f"product bed: {bpm_b} BPM from frame {score['product']['at']}; the swell peaks on frame {score['product']['swell']} "
          f"({reveal:.2f}s, [{a.reveal}]), lift for {n_b} bars, outro chord on frame {score['product']['outro']} ([{a.cta}])")
    print(f"wrote {out_a}, {out_b} and {out_json}")


if __name__ == "__main__":
    main()
