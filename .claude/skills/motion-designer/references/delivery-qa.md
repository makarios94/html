# Delivery and QA

1. Destinations and sizes
2. Encoding
3. Safe zones
4. Covers and thumbnails
5. Post copy
6. Caption files
7. The QA pass
8. The critique rubric
9. The delivery package
10. Names and versions

---

## 1. Destinations and sizes

| Destination | Aspect | Pixels | Notes |
|---|---|---|---|
| Instagram Reels, TikTok, YouTube Shorts, Stories, WhatsApp Status | 9:16 | 1080x1920 | Captions burned in; keep the bottom band and right edge clear |
| Instagram, Facebook and LinkedIn feeds | 4:5 | 1080x1350 | Tallest frame a feed shows in full |
| Square placements, carousels | 1:1 | 1080x1080 | |
| YouTube, LinkedIn landscape, X, web, presentations | 16:9 | 1920x1080 | Upload the .srt too |
| Landing page hero | 16:9 or 4:5 | as above | A muted 6 to 12 s loop as .webm + .mp4 (`finish.py web`), plus the full film |
| WhatsApp sharing | 9:16 or 16:9 | 720p export | WhatsApp recompresses hard and has a media size limit (historically 16 MB; check the current one): big type, high contrast, a 720p file under the limit |

Default package when nobody says: 9:16 and 4:5 (or 16:9 for a B2B audience), plus a 6 s cut if asked.

## 2. Encoding

The starter's defaults produce what platforms want: H.264 High, yuv420p, 30 fps constant, BT.709 tags, CRF 18 from
lossless frames. `finish.py` adds AAC 48 kHz 192 kbps and `+faststart`. Loudness about -14 LUFS integrated, true peak
at or under -1 dBTP measured on the encoded file (`finish.py` limits 4x oversampled and re-limits until the encoded
file passes). Flat-colour motion graphics compress well: the 28 s vertical example is 4.2 MB, the 17 s motion ad 2.9 MB.

## 3. Safe zones

House zones in design px (the same in `layout.ts` and `qa.py`): vertical top 250, bottom 440, left 72, right 150;
portrait 72/96/72/72; square 72/88/72/72; wide 72/84/112/112. They are deliberately conservative. For paid placements
check the platform's current spec and tighten if needed. Render `qa.py` sheets (they outline the zone) and one still
with `safeZones: true` per aspect.

## 4. Covers and thumbnails

- The `<NAME>-Cover-<aspect>` composition is the film frozen at `coverFrame` (usually the hook, at a frame where every
  element has landed): `npx remotion still <NAME>-Cover-9x16 final/<name>_cover_9x16.png`. `finish.py finals` renders
  them all. Check the cover is the frame you meant (it is the film's frame `coverFrame`, pixel for pixel).
- Instagram crops covers to a 3:4 grid tile: the title must sit inside the centre 1080x1440 of a 1080x1920 cover
  (y 240 to 1680). Check with `ffmpeg -i cover.png -vf "crop=1080:1440:0:240" grid.png`.
- YouTube thumbnail: 1280x720, three to five words, one face or object, high contrast.
- When covers matter, make two (a statement and a curiosity version), recommend one and say who each is for.

## 5. Post copy

`final/post-copy.md`: line 1 is the hook (the same idea as frame 0), then two to four short lines, then the action with
the real destination, then three to six hashtags (broad, niche, local). Two versions: A (medium, Instagram and LinkedIn)
and B (short, TikTok and X). Alt text for the video. House writing rules apply; claims only from the truth inventory.

## 6. Caption files

A motion ad has no voice, so there is nothing to caption: every word is on-screen type. Deliver no caption files,
write alt text in the post copy, and say so in the delivery note. (A voiced film's caption files: the launch-film
skill.)

## 7. The QA pass

Run on every delivered file:
`python scripts/qa.py final/<file>.mp4 --out out/qa/<file> --expect 1080x1920 --min-dur 6 --max-dur 20 --at 0,<bar>,<end> --strip <a>:<b>@10 --color <t>,<x>,<y>,#<brand>`
then open every image it lists. You cannot watch the video, so the images and numbers are how you see it.

**Technical:** resolution, fps and duration per destination; H.264, yuv420p, BT.709; loudness within 1 LU of -14 and
true peak at or under -1 dBTP; no black frames except intended ones; no frozen stretch outside the end card; sane size.

**Picture:** frame 0 is the hook; every word inside the safe zone and unclipped; contrast; type at legible sizes;
alignment and spacing consistent; no FontGuard banner anywhere (fonts loaded and every `GLYPHS` character drawn);
brand colours within dE 3 (`--color`, sampled from flat colour, never inside a glow); no debug overlays.

**Motion** (from strips): entrances decelerate (big steps first, small steps last), staggers in reading order, things
leave, no dead holds, the personality holds throughout, transitions mean something.

**Sound:** the music leads and its hits land on the film's beats (`beat_grid.py --png` shows the grid, the strips show
the moves landing); SFX on visible events, about 10 LU under the music; the logo lands on the last chord; no clipping;
the tail ends cleanly. A temp bed is labelled.

**Words:** every card matches `copy.md` word for word, six words or fewer, held long enough to read twice; names
spelled the owner's way; banned-word and em-dash grep clean; every claim on the truth inventory.

**Brand:** official logo with clear space, real faces, the palette, the vocabulary, the voice.

**Package:** every aspect, cover, post copy, the note.

## 8. The critique rubric

Score each 1 to 5 after every review render. Ship at 4 or above everywhere; fix the lowest score first.

| Dimension | A 5 looks like |
|---|---|
| Hook | Frame 0 stops the scroll and names the viewer's situation in under a second |
| Clarity | One viewing is enough to say who it is for and what it does |
| Rhythm | Varied pacing, every change on a word or beat, no dead frames, nothing rushed |
| Craft | Eased, staggered, overlapped; clean alignment; nothing clipped or jittering |
| Brand | Looks and sounds like the brand's best work, with real assets |
| Legibility | Every word readable on a phone at arm's length, held long enough |
| Sound | A voice that tells the story (it moves, it pauses, it lands the turn), music that drops and swells with it, SFX that make the motion feel physical, on-target loudness. A scratch voice caps this at 2 |
| CTA | One action, a destination people can type, held at least 2 s |
| Truth | Every claim sourced, demo data clearly fictional, nothing misrepresented |

## 9. The delivery package

```text
final/
  <brand>_<film>_9x16_v01.mp4        (and _4x5, _16x9, _1x1 as needed)
  <brand>_<film>_9x16_clean_v01.mp4  (no burned captions, when a platform adds its own)
  <brand>_<film>_v01.srt / .vtt
  <brand>_<film>_cover_9x16.png
  post-copy.md
  delivery-note.md                   (assets/templates/delivery-note.md)
```

The project folder is the source: anyone can change a line in `script.txt` or `Film.tsx` and re-render. The note says
what is in the box, what you decided on the user's behalf, every stand-in with its exact swap, what they need to
confirm, how to change and re-render, and any credits spent. Lead the message to the user with the result and a link
to the files, then the note's short version. Anything they need to
confirm goes out as gate 5's question card.

## 10. Names and versions

Never overwrite a delivered file: bump the version (`v02`). Keep `out/` for previews and QA images; `final/` holds only
what was delivered.
