# Edition V throwback videos: delivery note (v4)

Built to the script in the Claude doc "ASSETLINK x Miami Art Week 2026, Event Promo Strategy" (Content plan tab,
section "Throwback motion videos"). Two music-led videos cut from the Edition I to IV recap footage, in the wall-label
style, ending on the shared end card. Formats per the doc: 9:16 for Reels and Stories, 1:1 for LinkedIn.

This replaces v01 (flyer only) and v02 (four-year montage), which are in git history.

## Files (`final/`)

| File | Post date in the plan |
|---|---|
| `four_decembers_9x16_v01.mp4`, `four_decembers_1x1_v01.mp4` | Throwback video 1, Fri Nov 14; Stories re-share Tue Dec 1 |
| `some_assets_9x16_v01.mp4`, `some_assets_1x1_v01.mp4` | Throwback video 2, Fri Nov 21 |
| `four_decembers_cover_*.png`, `some_assets_cover_*.png` | Thumbnails (the opening label) |

All 1080 wide, 30 fps, H.264, about -14.8 LUFS. Four Decembers runs 28 s, Some Assets 31 s (each script length
plus the 2-second end card hold).

## Video 1: "Four Decembers" (motion v2)

The year is the transition. Each edition opens on the year, huge, with that year's footage playing inside the
digits. On the beat the camera punches through the digits into the footage, the doc's line slams in a line at a
time with the key phrase on a purple bar, and a whip cut brings the second shot. The last digit rolls like an
odometer from one edition to the next, and 2026 lands in the brand gradient with the event details stacking under it.

| Time | On screen (from the doc) | Footage |
|---|---|---|
| 0-1.5 s | ASSETLINK, Miami / Art Basel / *Evening* (one card, the camera then flies through it) | River aerial |
| 1.5-3 s | One tradition, (rises out of the depth, then parts sideways) | River aerial |
| 3-5 s | FOUR DECEMBERS cuts in on the downbeat with the river inside the letters, then punches through | River aerial |
| 2-6 s | 2022 → It started / with one evening. | 2022: arrivals, then the room |
| 6-10 s | 2023 → Then it became / a tradition. | 2023: the rooftop crowd, then the talk under the ASSETLINK screen |
| 10-14 s | 2024 → We rebuilt the company. / We still came back. | 2024: guests on the terrace |
| 14-18 s | 2025 → Same city. Same week. / More friends in the room. | 2025: the widest crowd, then a toast |
| 18-22 s | 2026 (brand gradient) / Thursday, Dec 3 / 7–10 PM / Seaspice, on the Miami River | None |
| 22-25 s | End card | |

A purple "Art Basel · Edition I · 2022" tag marks each section, and 2026 lands with "5th Annual Art Basel Evening" under it.

## Video 2: "Some assets don't hang on walls" (motion v2)

The line acts itself out. It opens in a gallery with the evenings framed on the wall like artworks, a painting from
2022 in the centre frame. The camera pushes into that frame and the people break out of it full screen. Then it pulls
back to the same frame, now empty, and a museum label hangs where the art was: "Some assets don't hang on walls."

| Time | On screen (from the doc) | Footage |
|---|---|---|
| 0-5 s | EVERY DECEMBER, / MIAMI FILLS UP / WITH ART. (painted on the wall, a line per bar) | Three framed pieces: the river, a painting on an easel (2022), a 2024 crowd, in slow motion |
| 5-12 s | But some of the best / things that week | Push through the frame into faces mid-conversation, a cut every two beats |
| 12-16 s | happen in / conversations. | Laughter and toasts, whip cuts |
| 16-22 s | The empty frame and its label, typed slowly: Some assets don't hang on walls. / Medium: advisors, capital, five years of conviction | Pull back to the gallery wall, then the camera leans in to read the label |
| 22-28 s | ASSETLINK 5th Annual / Art Basel Evening, then Thursday, Dec 3 / 7–10 PM / Seaspice, on the Miami River, one at a time | Slow-motion champagne pour |
| 28-31 s | End card | |

Some Assets was re-paced (v4) to sit like Four Decembers: the score is extended by repeating six bars on a bar line
(`music-sa-el-ext.wav`), and every section has roughly twice the time it had.

**End card for both (the CTA):** an admission ticket (ASSETLINK, Miami · Edition V / ART BASEL EVENING / The 5th Annual ·
Thursday, Dec 3 / ADMIT ONE) flips in and a foil shine crosses it; "Registration closes Dec 2" follows; then a
"Save your spot now" button rises, a cursor taps it (ripple and click), a shine sweeps across and a ring keeps pulsing.
"Free to attend" is left off on purpose (client direction, Nov 16): it read as cheap.

**Event details:** date, time and venue each get their own beat and card (DATE: Thursday, Dec 3 / TIME: 7–10 PM /
VENUE: Seaspice, on the Miami River), one replacing the next.

## Footage choices

- Every clip is muted; each video has its own score.
- The 2024 opening shot was trimmed past a sponsor backdrop that shows a bank's name. One 2025 moment was dropped
  because it shows a sponsor wall. No third-party brand is on screen.
- The 2023 rooftop shot shows the old DFD Partners logo on the stage screen. It is company history, so I kept it.
  Say if you want it swapped.
- The 2023 stage clip is a re-shared story. I cropped out the sharer's handle and the @dfdpartners tag.
- Footage pass (v4): every clip was denoised, upscaled 2x (Lanczos), sharpened and colour-matched to the night
  palette (`c2hd/`, made from `c2/`). Framing never magnifies a source more than 2.2x: when a wide shot can't fill
  the tall frame cleanly, it plays sharp across the middle over a blurred, darkened copy of itself instead of being
  blown up.
- The 2025 reel came in at 640x316, so its shots are still the softest. The original export would sharpen them most.
- Guests on screen come from ASSETLINK's own event posts. Check you're happy for them to appear again, especially
  before any paid boost.

## Music and stand-ins

1. **Music:** ElevenLabs Music v2.5, generated for these films (instrumental, 120 BPM): Four Decembers is celebratory house,
   Some Assets is gallery-to-party nu-disco. Each is trimmed to its first downbeat so the cuts land on the bar. Both are
   on the ElevenLabs canvas "ASSETLINK Edition V throwback music". Cost: 720 credits.
2. **Type:** Raleway ExtraBold for the big type and Inter for the labels, the brand pack's provisional faces.

## Please confirm

- **The year lines.** The doc says the year-by-year lines are placeholders to swap for what actually happened each
  year. The videos use them as written; "We rebuilt the company" (2024) matches Devon's post.
- **The registration link.** The end card says "link in bio". Make sure the form is in the bio before Nov 14.

## Post copy (from the doc)

**Video 1:** "Four Decembers in Miami. The fifth is next month. Join us for our 5th Annual Art Basel Evening,
Thursday, Dec 3, 7–10 PM, at Seaspice on the Miami River. Registration closes Dec 2. Save your spot now:
[link]"

**Video 2:** "Art Week is about what hangs on the walls. Our evening is about who's in the room. Five years of
advisors, firm leaders, investors and friends. Join us Thursday, Dec 3, 7–10 PM, at Seaspice on the Miami River. Registration
closes Dec 2. Save your spot now: [link]"

**Alt text, video 1:** Footage from four ASSETLINK Art Basel evenings in Miami, one year at a time, with a large year
flipping from 2022 to 2026 and a museum-style label for each edition. It ends on "Edition V, 2026, Thursday, Dec 3,
7 to 10 PM, Seaspice, on the Miami River" and an end card: an Art Basel Evening admission ticket, registration closes Dec 2, save your spot now.

**Alt text, video 2:** Quick cuts of guests talking, laughing and toasting at past ASSETLINK Art Basel evenings, with
labels reading "Every December, Miami fills up with art. But some of the best things that week happen in
conversations. Some assets don't hang on walls." It ends on the event details and the end card.

## Change it

Source: `src/films/four-decembers/` (with `shared.tsx`, the wall label, year flip and end card) and
`src/films/some-assets/`. Clips: `public/films/art-basel-throwback/c2hd/` (enhanced from `c2/`). From the repo root:
`python3 .claude/skills/motion-designer/scripts/finish.py finals films/art-basel-throwback FourDecembers films/art-basel-throwback/final --aspects 9x16,1x1 --stems music,sfx --lead music`
(and the same with `SomeAssets`).
