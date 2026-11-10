# Art Basel throwback: delivery note

A 17-second, music-led throwback to AssetLink's 4th annual Art Basel event in Miami. There is no voiceover. The event
flyer builds itself line by line on the beat, pulls back into a printed poster (the memory), then a thank-you and the
AssetLink end card.

## Files (`final/`)

| File | Use |
|---|---|
| `art_basel_throwback_4x5_v01.mp4` | LinkedIn and Instagram feed (lead version) |
| `art_basel_throwback_9x16_v01.mp4` | Stories, Reels, Shorts |
| `art_basel_throwback_1x1_v01.mp4` | Square feeds |
| `art_basel_throwback_cover_*.png` | Thumbnails (the hook frame) |

All 1080 wide, 30 fps, H.264, BT.709, -14.6 LUFS, true peak -1.4 dBTP. QA passed on the 4:5 (no black or frozen frames).
There are no caption files because there is no voice; alt text is below.

## Beat sheet (120 BPM, 2 s per bar)

| Bar | On screen | Sound |
|---|---|---|
| 0 | THROWBACK / Art Basel, Miami (legible on frame 0) | impact, then a glitch as it rewinds out |
| 1 | 4TH ANNUAL, a white rule draws | pop, swish |
| 2 | ART, BASEL, EVENT, one per beat, second rule | three thuds, swish |
| 3 | DEC 4 / 5 PM - 7:30 PM | ticks |
| 4 | CASA NEOS / MIAMI, FLORIDA, the AssetLink logo | ticks, chime |
| 5 | The flyer pulls back into a tilted white-bordered poster | whoosh, card |
| 6 | Thank you to everyone who came. | pops |
| 7 | AssetLink logo, "Know who, why and when.", assetlink.ai | sparkle, last chord |

## Sources

Every word on screen comes from the event flyer in Drive ("Art Basel", a Canva PDF uploaded 17 Jul 2026), plus the
tagline and URL from the current positioning. The marble texture and the white AssetLink lockup are lifted from that
same flyer PDF. A reference copy is in `ref/`.

## Stand-ins (swap before posting if you can)

1. **Music:** a temp bed synthesized by `sound_kit.py` (warm, D, 120 BPM). It is ours to use, but a licensed track
   would lift it. Re-time with `scripts/beat_grid.py`; the film follows the new grid.
2. **Typeface:** the flyer uses Glacial Indifference Bold, which is not on Google Fonts. Montserrat Bold stands in.
   Drop the font file into `public/fonts/` to use the real face.
3. **No event photos.** Nothing from the night is in Drive, so the piece is built from the flyer alone. Photos would
   make it a true recap (a photo strip in bars 5 and 6).

## Please confirm

- **The year.** The flyer has no year, so the film shows none. Tell me if it should say "Dec 4, 2025".
- **The marble image** came from a Canva template. Canva's licence usually covers reuse in your own designs; check if
  the video will be used in paid ads.
- **"Thank you to everyone who came."** Fine if this goes out as a recap. Swap it for "See you this year." only if
  AssetLink is going back.

## Post copy (LinkedIn)

Throwback to our 4th annual Art Basel event at Casa Neos, Miami.

Thank you to everyone who came out on December 4.

#ArtBasel #MiamiArtWeek #WealthManagement

**Alt text:** Animated flyer on purple marble. "Throwback. Art Basel, Miami." Then "4th Annual Art Basel Event, Dec 4,
5 PM to 7:30 PM, Casa Neos, Miami, Florida." The flyer becomes a framed poster with "Thank you to everyone who came,"
followed by the AssetLink logo and "Know who, why and when. assetlink.ai."

## Change it

From this folder: `npx remotion studio` to preview, then from the repo root:
`python3 .claude/skills/motion-designer/scripts/finish.py finals films/art-basel-throwback ArtBaselThrowback films/art-basel-throwback/final --aspects 4x5,9x16,1x1 --stems music,sfx --lead music`
