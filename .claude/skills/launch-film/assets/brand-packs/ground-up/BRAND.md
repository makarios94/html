# Ground Up brand pack

For motion pieces about the podcast (teasers, episode announcements, guest cards) that are built from scratch.
Episode edits and clips cut from camera footage belong to the ground-up-editor and ground-up-clipper agents; this pack
is for code-rendered motion around them.

Source: `C:\Users\User\.claude\skills\reel-editor\references\style-guide.md` (sections 3, 5 and 6). Read it; this pack is a copy.

- One accent: lime `#D7FF40`. Near-black `#0B0B0C` ground, `#151517` cards (30 px radius), white and grey.
- Titles: Anton caps, revealed letter by letter (1 letter per frame, tiny drop-in). Labels: Inter 600 caps, wide tracking.
  Statements and 2 to 4 emphasis words per piece: Instrument Serif.
- Lockup: white Anton "GROUND UP", the lime square on the baseline after "UP", then "with Ayobami" in serif. `Logo.tsx` recreates
  it typographically; use the real logo file when it is available.
- Every graphic lands on its spoken word with an ease-out over about 8 to 10 frames. Small moves. Frame 0 shows the hook.
- Sound design always ships, about 15 dB under the voice; master to -14 LUFS with one static gain and a limiter.
- Names on screen are researched and spelled the way the subject spells them (reel-editor research rules apply).
