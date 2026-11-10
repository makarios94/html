# Brand and truth intake

1. Find the source of truth
2. Tokens into theme.ts
3. Fonts
4. Logos
5. Product UI
6. Vocabulary and claims
7. When there is no brand yet
8. Brand packs

---

## 1. Find the source of truth

Look in this order and stop when you have tokens, fonts, a logo and the vocabulary:

1. **A brand pack** in `assets/brand-packs/<brand>/` (read its `BRAND.md`; it points at the real sources).
2. **The workspace:** design-system files (HTML or CSS with `:root` variables, `tokens.json`, a Tailwind config), brand
   guideline PDFs, logo files (`*logo*.svg`), a vocabulary or messaging doc, the PRD. Useful searches: CSS variables
   `--[a-z-]+:\s*#[0-9a-fA-F]{3,8}`, `font-family`, `@font-face`.
3. **The live product or website**, opened in the browser: read computed styles of the body, headings and primary
   buttons (`getComputedStyle(el).fontFamily`, `.color`, `.backgroundColor`), copy the header logo's inline SVG.
4. **Screenshots** of the app: sample exact colours with Pillow (`Image.open(p).getpixel((x, y))`).
5. **The user**, for whatever is still missing, in one message.

Record where each token came from in a comment in `theme.ts`, so the next person can re-verify.

## 2. Tokens into theme.ts

| Theme key | Take from | Check |
|---|---|---|
| `bg`, `surface`, `surface2` | Page background and card surfaces | |
| `ink`, `muted`, `faint`, `line` | Text colours (primary, secondary, tertiary) and hairlines | ink on bg at least 7:1 |
| `brand`, `onBrand` | The primary action colour and its text | 4.5:1 |
| `accent`, `onAccent` | The one highlight colour; used for emphasis words | 4.5:1 if it is used for text, else graphics only |
| `night*` | The brand's dark theme, or a dark world derived from the brand ink (never a naive inversion) | nightInk on night 7:1 |
| `ok`, `warn`, `bad` | Status colours, if the brand reserves them | Respect reserved meanings |
| `fonts`, `weight`, `tracking`, `leading` | The type system | Real faces only |
| `radius`, `shadow` | Component radii and elevation | |
| `personality` | The brand's register: trust products `calm`, modern SaaS `crisp`, consumer and food `playful` | |

Check every text and ground pair: `python scripts/contrast.py "#1D74A8" "#FFFFFF" "#F2F6FC" "#030D24"`. A colour that
fails 4.5:1 can still carry large display type (3:1) or graphics; say which in a comment.

## 3. Fonts

- Identify the brand faces from the design system or computed styles. Google Fonts faces load through
  `@remotion/google-fonts`; licensed faces need the brand's own files (put them in `public/fonts/`, load with
  `@remotion/fonts`). Do not substitute a "similar" face silently: if the real face is unavailable, use the closest free
  one, label it in the delivery note, and ask for the files in the next gate's card.
- Prove the glyphs this film needs, per face: currency (₦), names with diacritics (Yoruba ẹ ọ ṣ), arrows, ticks. A
  subset's unicode range is not a promise (DM Sans's latin-ext range covers ₦, but DM Sans has no ₦). List them in
  `GLYPHS` for FontGuard, and for brand files on disk run `python scripts/glyph_check.py <font> "₦ẹọṣ"`. When a face
  lacks a glyph, change the copy ("NGN 450,000") or set that text in a face that has it; never let it fall back silently.
- Tabular figures for counters (`fontVariantNumeric: 'tabular-nums'`, which `Counter` sets) need a face that has them.
- FontGuard must be clean on every frame.

## 4. Logos

- Use the official vector. Copy its path data into `Logo.tsx` (`Mark` for the static mark, `Logo` for the lockup with its
  reveal). Never redraw, retrace, recolour outside the brand's own variants, add effects, or squash a mark.
- Variants: full colour on light, reversed on dark, mono. Clear space at least the height of the mark's main stroke,
  and never smaller than the brand's minimum size.
- An approved animated reveal is ported exactly (as the Coridr pack does), never improved. Without one, keep the reveal
  short and plain (`LogoReveal`, 1.5 to 2.5 s, at the end).

## 5. Product UI

- Rebuild screens from the design system's components (radii, borders, shadows, type) so they look like the product,
  then simplify to the part each beat needs and enlarge type for phone legibility.
- Match the real product: get screenshots or open it. Never show a feature that does not exist as if it does; a concept
  is labelled ("Coming soon") or left out.
- Demo data is synthetic, plausible and consistent across scenes. For regulated products (finance, health, legal,
  immigration, education records) never show real personal data, not even blurred.
- When several specs exist, use the newest and say which one in the delivery note; older mockups can carry wording
  the product has since dropped.
- Approved in-product copy still gets the marketing truth pass before it appears in an ad. A string fine inside the
  app can be a claim in public: a Coridr hi-fi screen carried "This exact gap has caused real refusals" (a refusal
  claim, ruled out for UK files), "about a minute" (a speed claim), a real customer's name and a real bank's name. Cut
  or swap them, and list what you dropped.
- No real third-party brands in demo data (banks, job boards, apps) unless the user asked for that integration to be
  shown: name a service in the voice or in plain text, never in its logo, colours or interface.

## 6. Vocabulary and claims

- Find the brand's vocabulary, messaging or claims document and build the truth inventory from it
  (creative-direction section 3). Its banned words are banned in the VO, captions, UI text on screen and post copy.
- Before the final render, grep the script, the Film.tsx strings and the post copy for the banned list and for em
  dashes. For Coridr:
  `Corridor|corridor|verif|fraud|genuine|authenticat|guarantee|ironclad|ensures approval|[0-9]+ ?%|minutes|faster`
  plus the em dash character. Fix every hit (some, like "minutes", need a human look: a duration in the UI is fine,
  a speed claim is not).
- Every number in the piece is either a scenario detail framed as "you", synthetic demo data, or a claim with a source.

## 7. When there is no brand yet

Build a provisional identity and say so: the name in one strong typeface, one brand colour with a neutral ramp, one
accent, a simple geometric mark built in SVG, a personality. Never echo another company's identity. Offer to swap in
the real brand later (the film is token-driven, so a swap is a `theme.ts` and `Logo.tsx` change).

## 8. Brand packs

A pack is a folder in `assets/brand-packs/<name>/` with `theme.ts` (exports `theme` and `FONTS`), `Logo.tsx` (exports
`Logo` with `{at, onBrand?, size?}` and `Mark`) and `BRAND.md` (sources and rules, read by you, not copied).
`new_project.py --brand <name>` copies the `.ts`/`.tsx` files into the film. In this repo:

- `assetlink`: the house brand of this repo. Navy, purple and blue sampled from shipped assets, calm personality,
  provisional faces and a stand-in logo (both named in its `BRAND.md`), and the truth inventory every script is checked
  against.
- `coridr`: tokens from the Coridr Design System, Saira / DM Sans / JetBrains Mono, the approved 4.6 s logo reveal ported
  frame for frame (`CoridrReveal`, `CoridrAtmosphere`, `Mark`), calm personality, vocabulary rules.
- `ground-up`: the podcast's lime on near-black, Anton titles, Inter, Instrument Serif, the lockup as a typographic
  recreation (swap in the real logo file when available).

Make a new pack once a brand is used twice: it saves the intake next time.
