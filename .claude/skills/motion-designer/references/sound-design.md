# Sound design for a music-led motion ad

1. Audio first: the beat grid is the clock
2. Music
3. Sound effects
4. Mixing and mastering
5. Muted and unmuted

A film carried by a voice (narration, word-synced captions) is the launch-film skill's: it has the voice, alignment,
captions and a score timed to the words.

---

## 1. Audio first: the beat grid is the clock

Lock the clock before you animate. In a music-led ad the beat grid is the timeline: every scene cue is a bar or a beat
from `src/films/<id>/data/beats.json`, read through `beatGrid()` (see `example-motion/config.ts`), so when the track
changes you re-run one script and the whole film re-times. Animating to typed seconds and then "fixing the timing"
afterwards is how pieces end up out of sync.

- **A real track:** `python scripts/beat_grid.py public/films/<id>/music.wav --out src/films/<id>/data/beats.json
  --png out/beats.png --click out/click.wav`. Library tracks usually state their BPM: pass it with `--bpm` and let the
  script find the downbeat. Both tempo and downbeat are estimates without it: look at the PNG (hits should sit on the
  lines) and listen to the click preview when anyone can.
- **The temp bed** (section 2) is built on its own grid and writes `music.beats.json` beside the track; copy it to
  `data/beats.json`.
- **Length comes from the tempo:** bars x 4 x 60 / BPM. Eight bars run 16.0 s at 120 BPM and exactly 15.0 s at 128 BPM,
  so a 15 s ad is an 8-bar bed at 128 with no scene changes. The music must last at least the film's bars; the film
  checks it.

## 2. Music

- **Role.** The music is the lead and the clock: it sets the energy and the brand's feel, every move lands on it, and
  the logo lands on its last chord.
- **Choosing.** Upbeat motion ads sit at 100 to 128 BPM (120 gives clean 15-frame beats). A lift (a new section, a
  brighter chord) where the product or the payoff arrives; a resolved chord that rings under the end card.
- **Sources, best first** (the choice is a question in gate 2's card when it costs money or needs a licence; see
  SKILL.md, "Asking the user"):
  1. A track the user has licensed for advertising (a stock library licence that covers paid ads, not only organic posts).
  2. Generated music through the creative connector: `eleven_music_v2_5` (set instrumental and the exact duration), or
     the Video to Music node on the silent cut so the score follows the edit. Check that the user's plan covers
     commercial use, and run `estimate_only` first.
  3. A temp bed on the grid: `python scripts/sound_kit.py bed public/films/<id>/music.wav --bpm 120 --bars 8 --mood drive
     --key D --sections "0:intro,1:main,6:lift,7:outro" --tail 2` (moods: pulse, warm, drive, tension, calm; sections:
     intro, main, lift, break, outro, stop). The user's reel-editor already ships synthesized scores, so this can be
     final when the user accepts it; label it either way.
  4. No music: SFX-led sound design, a legitimate aesthetic for calm brands.
- **Never** a commercial song without a licence. In-app platform music libraries are usually licensed for organic
  posts only; check before using one in an ad.
- **Editing to music.** Cut on downbeats, put hits on accents, land the logo on the last chord. Start the track on a
  downbeat with `trimBefore`; fade the tail. `beat_grid.py --png` shows whether the hits sit on the grid, and the
  motion strips (`qa.py --strip`) show whether the moves land on them.

## 3. Sound effects

The kit (`public/sfx/`, made by `sound_kit.py kit`, peaks at -3 dBFS so volumes are comparable):

| Sound | For |
|---|---|
| `pop`, `pop-high`, `pop-low` | Pills, badges, props, words landing (vary them) |
| `tap`, `click` | Phone taps, mouse clicks, button presses |
| `tick`, `tick-soft` | Counters, clocks |
| `type-1` to `type-4` | Keystrokes (Typewriter cycles them) |
| `whoosh`, `whoosh-long`, `swish` | Cards and panels moving, camera pushes, fast swaps |
| `riser`, `riser-short`, `swell` | Builds into a reveal; they end on their hit |
| `impact`, `boom`, `thud` | The hero word, a hard cut, a heavy landing |
| `chime`, `ding`, `success`, `sparkle` | Resolution, notifications, done, the logo |
| `card`, `send`, `nope`, `glitch` | Paper and cards, sending, rejection, broken states |

Placement rules are in motion-language section 11. A music-led ad can be rich: a pop per element that lands on a beat,
a whoosh on every panel move, a riser that ends exactly on the payoff. Vary the pops so a run of them does not sound
like one sample. For a bespoke sound ("a basket landing on a counter"), the creative connector's sound-effects model
makes one from a description.

## 4. Mixing and mastering

House rules, shared with reel-editor (learned on real edits: the first mixes were too loud and distorted):

- **The music leads** and the SFX sit about 10 LU under it.
- **Mix in float through a limiter, then master with one static gain** to about -14 LUFS integrated, with the true peak
  at or under -1 dBTP measured on the encoded file. The AAC encode adds its own overshoot (a -1.5 dBFS sample limiter
  measured -0.4 dBTP after the encode in a test), so `finish.py` limits 4x oversampled, measures the encoded file and
  lowers the ceiling until it passes. No dynamic loudness normalisation: it re-lifts quiet passages and changes the mix
  you approved. Measure, never assume.
- **Stem levels are set per stem.** `mix` measures each stem as a whole, so a volume changed inside the film moves
  sounds against each other within that stem, not the stem against the music: raising one swell made every other SFX
  1.2 dB quieter in a test mix. Set stem balance with `--sfx-under`; set balance within a stem in the film.

```bash
# every deliverable in one go: stems once (the audio is the same in every aspect), a muted picture per aspect,
# the measured mix and master for each, then the covers
python scripts/finish.py finals <project> Film final --aspects 9x16,4x5 --stems music,sfx --lead music
# a quick pass on a preview: the film's own mix, mastered
python scripts/finish.py master out/raw.mp4 final/film_9x16.mp4
```

Extra props (a variant, a price) go in a JSON file passed with `--props`; `finals` and `stems` merge it into every
render. (PowerShell strips the double quotes out of inline JSON, so always use a file.) To redo one stem:
`finish.py stems ... --stems sfx --no-picture`. Then `qa.py` must show the loudness PASS. You cannot hear the mix, so
look at it: `ffmpeg -i final.mp4 -lavfi showspectrumpic=s=1600x400:legend=0 out/qa/spectrum.png` (the music's hits and
the SFX transients should read clearly, with nothing pinned at the top), and say plainly in the delivery note that the
mix was checked by measurement, and invite the user to listen.

## 5. Muted and unmuted

Check the contact sheet with no audio: does the story read from the type and the pictures alone? Most viewers meet a
motion ad muted, so it has to. Then check the soundtrack adds energy and feel without fighting the cards.
