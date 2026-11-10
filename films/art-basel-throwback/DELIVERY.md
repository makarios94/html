# Art Basel throwback: delivery note (v02)

A 17-second, music-led throwback to four years of AssetLink Art Basel events in Miami (2022 to 2025). There is no
voiceover. v02 replaces the flyer-only v01 with real footage from the five event reels the user uploaded.

## Files (`final/`)

| File | Use |
|---|---|
| `art_basel_throwback_4x5_v02.mp4` | LinkedIn and Instagram feed (lead version) |
| `art_basel_throwback_9x16_v02.mp4` | Stories, Reels, Shorts |
| `art_basel_throwback_1x1_v02.mp4` | Square feeds |
| `art_basel_throwback_cover_*.png` | Thumbnails (the hook frame) |

All 1080 wide, 30 fps, H.264, BT.709, -14.6 LUFS, true peak -1.3 dBTP. QA passed on all three (no black frames).
v01 (flyer only) is in git history.

## Beat sheet (120 BPM, 2 s per bar)

| Bar | On screen | Footage |
|---|---|---|
| 0 | THROWBACK / Art Basel, Miami (legible on frame 0) | 2024 crowd, tinted purple |
| 1 | Four Decembers in Miami. | flyer marble |
| 2 | 2022: a framed print lands, cuts on beat 3 | 2022 reel (DFD Partners): crowd at the product screen, guests by the pool |
| 3 | 2023 (the year digit rolls) | 2023 reels: rooftop stage, then the talk under the AssetLink screen |
| 4 | 2024 | 2024 reel: guest groups on the terrace |
| 5 | 2025 | the 4th annual flyer, then the Casa Neos crowd |
| 6 | Thank you to everyone who came. | 2024 guests at the AssetLink step-and-repeat |
| 7 | AssetLink logo, Know who, why and when., assetlink.ai | flyer marble |

## How the years were set

From the reel captions and titles: the 2025 reel thanks guests for the "4th Annual" event (Casa Neos, matching the
flyer, so the flyer is Dec 4, 2025), and the 2024 reel opens on "3rd Annual Art Basel Event". 2023 and 2022 follow by
counting back, and match the post dates. The film shows years only, not "1st" or "2nd annual".

## Footage notes

- Every clip is muted; the film runs on its own score.
- The 2023 stage clip comes from a re-shared story. I cropped out the sharer's handle at the top and the
  @dfdpartners tag at the bottom.
- One 2023 rooftop shot shows the old DFD Partners mark on the screen, and the 2022 clips are from the DFD
  Partners era. I kept them as history. Say if you want AssetLink-only footage and I'll swap them.
- The 2025 reel came in at 640x316, so its clip is the softest in the film. The original export would sharpen it.
- People in the clips are guests from AssetLink's own event posts. Check you're happy for the ones shown to appear
  again, especially if this runs as a paid ad.

## Stand-ins

1. **Music:** a temp bed synthesized by `sound_kit.py` (warm, D, 120 BPM). A licensed track would lift it; run
   `scripts/beat_grid.py` on it and the film re-times.
2. **Typeface:** Montserrat Bold stands in for the flyer's Glacial Indifference Bold.

## Please confirm

- The marble image comes from a Canva template. Check its licence for paid use.
- The closing line is "Thank you to everyone who came." Swap it for "See you this December." if AssetLink is going
  back in 2026.

## Post copy (LinkedIn)

Four Decembers in Miami. A throwback to every AssetLink Art Basel event, from 2022 to our 4th annual at Casa Neos.

Thank you to everyone who came.

#ArtBasel #MiamiArtWeek #WealthManagement

**Alt text:** "Throwback. Art Basel, Miami." over footage of a rooftop party. Then "Four Decembers in Miami." Framed
clips from AssetLink's Art Basel events land one per year, labelled 2022, 2023, 2024 and 2025, the last starting with
the 4th annual event flyer. Guests pose at an AssetLink backdrop under "Thank you to everyone who came," followed by
the AssetLink logo, "Know who, why and when." and assetlink.ai.

## Change it

From this folder: `npx remotion studio` to preview. From the repo root:
`python3 .claude/skills/motion-designer/scripts/finish.py finals films/art-basel-throwback ArtBaselThrowback films/art-basel-throwback/final --aspects 4x5,9x16,1x1 --stems music,sfx --lead music`
Clips live in `public/films/art-basel-throwback/clips/`; swap a file and re-render.
