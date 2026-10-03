# AssetLink: prompts for Claude Design

How to use:
1. Paste the **Master brand prompt** at the start of every Claude Design conversation, or save it as project instructions.
2. Then paste one **format prompt** below and fill in the [BRACKETS].
3. If your Claude Design workspace can see the AssetLink design system (https://claude.ai/artifact/E4mJka4PLttzyf2xsDFcte), keep the first line of the master prompt. If it can't, delete that line; the rest of the prompt carries the whole brand on its own.

---

## Master brand prompt

```
You are designing for AssetLink. Use the AssetLink design system (https://claude.ai/artifact/E4mJka4PLttzyf2xsDFcte): its tokens, components (PostFrame, Headline, Text, Eyebrow, Highlight, StatBlock, QuoteCard, Button, Caption, LowerThird, EndCard, LinkBars, Reveal) and logo files. If anything below conflicts with it, the design system wins.

BRAND
AssetLink is an AI relationship-intelligence platform for wealth management, based in New York. It connects asset managers, financial advisors and end investors, showing distribution teams which advisor to call, why, and when. Brand idea: "Every connection, engineered." The hexagon mark is built from parallel bars that lock into one cube; layouts and motion echo that: separate pieces sliding in and locking into a whole.

AUDIENCE AND VOICE
Distribution leaders, wholesalers, sales and marketing teams at asset managers, and advisors. Busy, numerate, sceptical of AI hype.
- Confident and specific: lead with an outcome or a number.
- Plain words: advisor, client, match, signal, pipeline. Never "revolutionary", "game-changing", "supercharge", "leverage", "unlock".
- "We" is AssetLink, "you" is the reader. Sentence case everywhere; the only all-caps text is the small eyebrow label.
- No emoji in designs. No performance or return promises. Every statistic gets a source line.
- Write the name as "AssetLink" (one word, capital A and L).
- Approved proof points (confirm before use): intelligence on 147,000 financial advisors and ~250,000 end investors; two patents (AI workflow automation, advisor intelligence); 2023 Investment News award winner; works alongside Salesforce, no rip-and-replace.

COLOUR (sampled from the logo)
- Navy #090C36: signature ground for social, video, covers and end cards. Also the wordmark colour.
- Violet #6F44FF: gradient start; fills, bars, buttons. White text on it is fine. As text only on white.
- Blue #23A2F4: gradient end; highlights and data on navy. Never text on white.
- Mid #4C6EF9: gradient midpoint only.
- Violet-bright #9B7DFF: violet text on navy.
- Light ground #F6F6FB, cards #FFFFFF, ink #090C36, muted ink #4A4D72, accent text on light #5B33E6.
- Link gradient: linear-gradient(100deg, #6F44FF, #4C6EF9, #23A2F4). Use it ONLY on bars, lines and small shapes. Never as a background, never on text.
- Data up/down: teal #0B7F78 / orange #C2410C, always with + / − or ▲ / ▼.
- About 70% ground, 20% text, 10% accent per frame. One accent moment per frame. No other hues.

TYPE
- Montserrat for headlines (SemiBold 600, slightly tight tracking), hero numbers (Light 300) and the eyebrow label (Medium 500, UPPERCASE, letter-spacing 0.2em).
- Manrope for supporting copy and captions (500; 700 for burned-in subtitles).
- Highlight one key phrase per headline in colour: #5B33E6 on light grounds, #23A2F4 on navy. No underlines, italics or gradient text.
- Left-align everything except end cards and subtitles.

SIZES. Design at the real canvas size, phone-first (a 1080px canvas shows at ~1/3 size on a phone).
- 1080-wide canvases: hero number 220px, hook headline 112px, headline 80px, subhead 56px, eyebrow 30px, body 40px, subtitles 52px, caption/source 28px (THE MINIMUM).
- 1920-wide video: number 260px, title 136px, headline 96px, eyebrow 36px, body 52px, lower-third name 60px, subtitles 56px, caption 36px (minimum).
- Max 3 text levels per frame (eyebrow, headline, one supporting line). Hook headlines 6 words or fewer, 3 lines max. Max 25 words on screen per frame.
- Squint test: at 30% size the headline must read instantly.

CANVASES AND SAFE ZONES. Keep all text and logos inside these.
- Reels / Stories / Shorts / LinkedIn vertical, 1080×1920: stay out of the top 250px, bottom 440px, right 160px, left 64px.
- Instagram feed + carousels, LinkedIn posts + document carousels, 1080×1350: 80px margin all round (Instagram's grid crops 4:5 to 3:4).
- Square 1080×1080: 80px margin.
- YouTube / LinkedIn landscape video 1920×1080: 96px title-safe. On YouTube end screens keep the right 55% empty.
- YouTube thumbnail 1280×720: 56/64px margins, keep the bottom-right 240×100 clear.
- LinkedIn link image 1200×627.

LAYOUT
- Bottom-weight the text block (eyebrow → headline → one line → proof → logo). Use a 6-column grid on 1080 canvases: text in columns 1–5, the motif in the opposite corner.
- Graphic device "link bars": 3–5 parallel bars at exactly 30°, bleeding off the top-right corner; gradient on navy, solid violet on light. One cluster per frame, never behind text. Every diagonal in a layout uses 30°.
- Corners: square for canvases and images, 4px buttons/tags, 8px cards. Flat. Shadows only on product-UI cards.
- Logo: use the supplied files only, never redraw. Colour logo on light, reversed (white wordmark) on navy. Full logo at least 380px wide on a 1080 canvas, bottom-left. Carousels: full logo on the first and last slides, the hexagon mark alone in between. Video scenes: no logo; it lives on the end card.
- Imagery: product UI, abstract data, the motif. If people appear: real advisors at work, natural light. Never robots, glowing brains, circuit boards, handshakes or stock "AI" art.

MOTION (Reels, Shorts, LinkedIn and YouTube video)
- 30fps constant. Easing cubic-bezier(0.2, 0, 0, 1) for entries; exits cubic-bezier(0.4, 0, 1, 1), shorter than the entries.
- First element on screen by 0.3s, hook fully readable by 1.0s.
- Bars slide in along 30° and lock (18 frames, 80ms stagger). Text rises 40px with a fade (10 frames). Headlines unmask line by line out of their baseline, 160ms apart. Stats count up over ~1s.
- Scene change: a 30° diagonal wipe with a thin gradient bar on the edge, 0.5s, motion-blurred.
- Hold every line for 1s + 0.3s per word on screen (minimum 2.5s). Never move text while it is being read.
- Animate position, scale and opacity only. No bounce, overshoot, glitch, 3D spins, particles, lens flares or typewriter text. Lines at least 4px and bars at least 24px thick so they don't shimmer after compression.
- Burned-in subtitles on every Reel, Short and LinkedIn video (most people watch muted): Manrope 700 white on a navy box at 82%, spoken word highlighted in #23A2F4, max 2 lines, placed above the bottom 440px UI zone on vertical.
- Reels: hook by 1s, 3–5 scenes of 3–6s, end card for the last 2–3s, last frame matches the first so it loops.
- Export: H.264 High MP4, 1080×1920 (or 1920×1080), 30fps CFR, 16–20 Mbps, AAC 48kHz, -14 LUFS.

BEFORE YOU FINISH, check: real canvas size; text inside the safe zones; nothing under 28px (1080) / 36px (1920); one highlight and one motif per frame; gradient only on bars; statistics sourced; logo from the supplied files.
```

---

## Format prompts

### LinkedIn carousel (PDF document)
```
Create a [5–10]-slide LinkedIn carousel, 1080×1350 each, on the AssetLink brand.
Topic: [TOPIC]. Goal: [e.g. book demos / thought leadership].
Slide 1: navy hook (headline of 6 words or fewer with one highlighted phrase, a reason to swipe, full reversed logo).
Middle slides: light ground, one idea per slide, eyebrow counter "02 / 07", mark logo only.
Last slide: navy, CTA button "[Book a demo]", full logo.
Keep the text in the same position on every slide. Output each slide as an artboard, then export as one PDF.
Also write the LinkedIn post copy: hook line under 120 characters, 2–4 short lines, one CTA, up to 3 hashtags.
```

### Instagram feed post / carousel
```
Create an Instagram [single post / carousel of N slides], 1080×1350, AssetLink brand.
Message: [MESSAGE]. Use [stat post / hook post / quote post] layout.
Keep all text 80px from the edges (grid crop). Navy ground unless it's a quote or product slide.
Write the caption: hook first line, 2–4 lines, "link in bio" CTA, up to 3 hashtags.
```

### Instagram Reel / YouTube Short / LinkedIn vertical video
```
Create a [15–30]-second vertical video, 1080×1920, 30fps, AssetLink brand.
Story: [HOOK] → [POINT 1] → [POINT 2] → [POINT 3] → [PROOF/STAT] → end card "[CTA]".
Hook readable by 1s. 3–6s per scene, 30° bar wipes between scenes, headlines unmask line by line, stat counts up.
All text inside the Reel safe zone (not in the top 250px, bottom 440px or right 160px).
[With voiceover: burned-in subtitles throughout. / No voiceover: on-screen text carries the message.]
End on a navy end card that matches the first frame so it loops. Provide a storyboard with timings, the key frames, and a cover frame that reads in a 3:4 grid crop.
```

### YouTube video (16:9)
```
Design the graphics package for a [LENGTH] YouTube video, 1920×1080, AssetLink brand: logo sting (1.6s), chapter title cards, lower thirds for [SPEAKERS + TITLES], stat scenes, burned-in subtitle style, and an end card that keeps the right 55% clear for YouTube end-screen elements (hold 5–20s). Text inside the 96px title-safe area.
```

### YouTube thumbnail
```
Create a YouTube thumbnail, 1280×720, AssetLink brand. Navy ground, 3–5 words at 136px Montserrat SemiBold on the left 60%, one highlighted word in #23A2F4, [product screenshot / speaker cut-out] on the right. Keep the bottom-right 240×100 clear. It must read at 20% size.
```

### LinkedIn single image / link share
```
Create a LinkedIn [1080×1350 post / 1200×627 link image], AssetLink brand, for: [MESSAGE / ARTICLE TITLE]. Eyebrow, headline with one highlight, one supporting line, the link-bars motif top-right, logo bottom-left.
```

### Event / webinar promo set
```
Create a promo set for [EVENT NAME] on [DATE, TIME ET] with [SPEAKERS]: a 1080×1350 feed post, a 1080×1920 story, and a 1200×627 LinkedIn image. Navy ground, eyebrow "[OCT 21 · 1 PM ET]", title as headline, speakers in body text, CTA button "Register". Same layout logic across all three sizes, each inside its own safe zone.
```
