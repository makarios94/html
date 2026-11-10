# Coridr brand pack

Applied with `new_project.py ... --brand coridr`: copies `theme.ts` (tokens, fonts) and `Logo.tsx` (the approved
reveal, `Mark`, `CoridrAtmosphere`) into the film. This file is not copied; read it before writing any Coridr copy.

## Sources of truth (read them; this pack is a copy and can go stale)
All in `C:\Users\User\Desktop\Coridr design system\`:
- `coridr-design-system.html`: tokens, light and dark (the `:root` blocks near the top).
- `coridr-logo-reveal-prompt.md` and `coridr-logo-reveal.html`: the approved 4.6 s reveal. `Logo.tsx` ports it frame for frame.
- `product-vocabulary.md`: section 0 writing style, 1 naming, 2 banned terms, 3 approved terms, 6 voice, 7 claims by destination.

## Rules that shape a Coridr video
- The name is **Coridr**, never "Corridor". The destination-route concept is "Destination", never "corridor".
- Banned in any copy, VO or caption: verify / verified / verification, fraud / fraud detection, authenticate, genuine / genuineness,
  guarantee / guaranteed / ironclad / ensures approval, any % or score shown as confidence, any speed claim ("in X minutes"),
  any "X% fewer round-trips" or "Y times faster".
- Lead with the ownable phrases: "pre-submission audit", "application readiness". Approved words: check, audit, review, pre-check,
  readiness, consistency, completeness, flag, severity, issue, needs review, blocked.
- Claims split by destination (vocabulary section 7): UK = efficiency and productivity only, never refusal prevention. Canada = efficiency
  plus funds-risk reduction. Never claim fraud detection anywhere.
- Product voice is a neutral system, not an assistant: no "I", "me", "let me" on any product surface shown in the video.
- Writing style binds VO, captions and post copy: no em dashes, no "it's not X, it's Y", plain declarative sentences, headlines that state
  facts and counts, no product self-praise ("seamless", "gentle", "effortless").
- Pan-African ambition, but never imply coverage of countries not yet supported.

## Glyphs: what each face can draw (tested)
FontGuard's glyph check on the Google Fonts versions, every available subset loaded: **Saira draws ₦, ẹ, ọ and ṣ.
JetBrains Mono draws ẹ and ọ but not ₦ or ṣ. DM Sans draws none of the four** (it has no Vietnamese subset). The WOFF2
files embedded in the design system HTML lack them too. This answers the open "diacritics in DM Sans and Saira" verify
item: Saira passes, DM Sans fails. In films, write amounts as "NGN 450,000" in DM Sans and mono (the product's flag
notes already do), set any ₦ figure or a Yoruba name with dot-below letters in Saira, and list every special character
a face must draw in `GLYPHS` so a gap shows as a red banner instead of a silent fallback.

## The logo reveal needs its full 4.6 s
`Logo` is the approved reveal and takes 4.6 s (outline draw, fill, door opens, wordmark resolves, settle). Give it
the end card, or a reveal scene at least 4.6 s long; cutting away earlier shows only a half-drawn C. To make the
wordmark resolve as the voice says the name, start it 2.55 s early: the letters begin at 2.55 s into the reveal and
land by about 3.5 s, so `at={vo.at('Coridr', {in: 'reveal'}) - Math.round(2.55 * FPS)}` puts the first letters on the
spoken name (scope the word: "Coridr" is usually spoken twice in a film). Where the logo
appears a second time (an end card after an earlier reveal), show the static `Lockup` (the reveal's final frame, held)
with a plain fade, or start the reveal about 18 frames before the scene so the card opens on a mostly drawn mark.

Never change the reveal's own timing, layers or colours (`speed` only for a cutdown the founder agreed to). A
transition out of it (a flood, a wipe, a push) starts after the settle at 4.6 s and acts around the lockup, never on it.

**A mid-film reveal in a voice-led film, worked through.** The draw (outline, fill, door) is the moment, so no voice
runs over its first 2.5 s; the name lands with the letters.
- End the turn line, then leave about 2.6 s with no voice while the mark draws (music or a swell only). On a TTS read,
  `insert_pause.py ... --pause reveal:2.6`; for a human read, direct the gap ("two seconds of silence after the turn").
- "Meet Coridr." starts at 2.55 s into the reveal, as the letters rise. The category line can follow about 0.6 s after
  the name, over the settle.
- The flood (or any move out) starts after 4.6 s. From the end of the turn line to the category line is about 3.8 s:
  budget it when you write a 30 s script (about 6 words fewer than a film without a reveal).
- The reveal plays in the dark theme in the night world it was authored on; the end card, a second appearance, uses
  the static `Lockup` in whichever world the film ends in (full colour on white, or Reversed on Deep Navy).

## Logo cuts and grounds
The design system (section 05, "Four cuts, four jobs") gives each cut its own ground:
- **Full colour**: navy body #042154, Blue Bell door #2D9AD6, on light grounds. The default for `Mark`, `Lockup` and
  `CoridrReveal`.
- **Reversed**: snow body #F7F7F7, Blue Bell door, on dark surfaces and Deep Navy #042154 (door on navy 4.96:1).
  `dark` on `Mark`, `Lockup` and `CoridrReveal`; `onBrand` on `Logo`. A Deep Navy end card is on brand.
- **Mono navy**: navy only, the formal cut (report headers, stamps, one-colour print).
- **Mono snow**: #F7F7F7 only, on ink grounds and over photography.
The animated reveal is approved in two themes: light on #FFFFFF and dark on #030D24 (`coridr-logo-reveal-prompt.md`).
Play the reveal on those grounds; on a Deep Navy card, use the static reversed `Lockup`.

## Product truth for on-screen UI
- The current product spec is `coridr-app-build-brief.md` (it calls itself the latest spec; updated 2026-08-03). Ask
  for screenshots of the current build in gate 2's question card, before building product scenes: shipped screens outrank every spec on disk.
  Until they arrive, rebuild from the build brief and say so in the delivery note.
- Flag review in that spec: two unselected options, "Confirmed" and "False positive". Choosing "False positive" (or
  clearing a flag) reveals a required reason field, and each decision is saved with the reviewer's name and time
  ("Confirmed · resolved by context · by You · Today 09:14").
- Older files (`lovable-brief.md` and `hifi-app.html`, 30 July) show a three-option card that includes "It adds up,
  I'll note why". That is first person on a product surface: do not show it.
- `hifi-app.html` and `lowfi-ecosystem-simple.html` carry the line "This exact gap has caused real refusals." Keep it
  out of films: it reads as a refusal claim, and UK claims are efficiency only.
- A standing rule from the product-design work (July 2026): no unsolicited UI mockups. Product frames in a film are
  ad frames rebuilt from the spec or screenshots; present them that way, never as UI proposals.

## Contrast traps (measured with contrast.py)
- Verdict amber #9A6B12 on its own tint #F7EFDB is **4.08:1**: large text and graphics only. The design system's amber
  chip (`.chip-amber`, for example "Needs review · 3") uses exactly this pair at small size, which is worth telling
  the founder. In films, keep amber for rings, strokes, dots and large type, and set small text on the amber tint in
  ink. Green on its tint is 4.58:1 and red on its tint 5.44:1 (both AA); amber on white is 4.68:1.
- Raw Blue Bell #2D9AD6 is never text on light (3.13:1 on white). Accent text on light is #1D74A8 (5.10:1), which is
  the pack's `accent`.
- The `faint` token (ink at 52 percent, about #80858E on white) is 3.71:1: fine for hairlines and texture, not for
  text a viewer must read on a phone. Small text in films uses `muted` (5.90:1).
- Bell text #1D74A8 on the Bell 100 tint #E4F2FA (the "what's next" card) is 4.47:1, just under AA for small text: set
  small labels on that tint in navy (13.61:1).

## Visual register (founder direction)
- Quiet beats decorated: flat, hairline borders, white canvas, giant light display type (Saira 300), one ink with alpha steps,
  depth only where something genuinely floats (the document). Navy does the authority work; Dodger Blue is for the logo and
  marketing hero moments only; Blue Bell is the single accent (graphics and large type on white).
- Real faces only: fallback fonts read as "not commercial" to this founder. FontGuard must be clean on every frame.
- Verdict green / amber / red are reserved for verdict meaning; never use them as decoration.
- Motion personality `calm`: strong ease-outs, overlap, no bounce anywhere.
- Dark scenes derive from navy (#030D24 ground, #061633 surfaces), never a naive inversion; documents shown in dark scenes sit on a
  dark surround, never a blinding white well.
- Show realistic, synthetic documents only (no real candidate data). Names on screen: diverse Nigerian names; check diacritics render.
