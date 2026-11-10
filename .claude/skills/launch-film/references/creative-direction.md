# Creative direction: from brief to storyboard

1. The job of a short ad
2. The brief
3. The truth inventory
4. Choosing the format
5. Tearing down a reference (with the Seeran teardown)
6. Concepts
7. Hooks
8. Story spines
9. Writing the voiceover
10. On-screen copy
11. House writing rules
12. The storyboard
13. Art direction

---

## 1. The job of a short ad

A 15 to 45 second ad has to earn each next second. It works when one viewer recognises one situation, hears one
promise, and knows one action to take. Everything else is decoration, and decoration costs attention.

Most people meet the ad muted, mid-scroll, on a phone. So the piece has to stop the thumb on frame 0, make sense with
the sound off, and get better with the sound on.

Before anything else, answer two questions in writing: **who exactly is watching** (role, moment, mood: "an agency
reviewer at 9 pm in peak season", not "businesses") and **what should they do after** (one action, one destination).

## 2. The brief

Write `brief.md` from `assets/templates/brief.md` before scripting. Fill what you can from the conversation, the
brand folder and the product itself; put a sensible default in every other field and mark it "(assumed)".

| Field | What it holds | Default when nobody says |
|---|---|---|
| Product | One sentence in the user's words: what it does, for whom | Ask: this is the one thing you cannot invent |
| Audience | Who, where they will see it, what they feel right before | The product's primary user, on mobile, in feed |
| One message | The sentence a viewer should repeat | The product's core job, as a benefit |
| Action | Verb + real destination (URL, handle, store, "reply DEMO") | Visit the site shown in the brand sources |
| Success | The one result the asset must get, and how we will know | The action above, counted at its destination |
| Destinations | Platforms, so aspects follow (see delivery-qa) | Reels/TikTok 9:16 + feed 4:5 + 16:9 master |
| Length | Seconds per destination | Voice-led 30 s, music-led 15 s, plus a 6 s cut if asked |
| Format | Motion ad, launch film, hybrid | From the job (section 4) |
| Framework | The order of the argument (copywriting section 3) | PAS for a problem-aware audience |
| Personality | calm, crisp or playful (motion and voice) | From the brand's register: B2B trust = calm |
| Brand sources | Where tokens, logo, fonts, UI and vocabulary live | Search the workspace; ask only if nothing exists |
| Truth inventory | Section 3 | Nothing claimed beyond what the product visibly does |
| Constraints | Deadline, credit budget, music licence, voice and accent, language | Free local tools first; paid generation only within section "Tools" in SKILL.md |
| Fixed vs open | What the user already decided | Everything open is yours to decide, stated in the delivery note |

Before the concepts, send the copy questions as gate 1's question card (SKILL.md, "Asking the user";
`references/copywriting.md`, section 1): who it is for and how aware they are, what success looks like, how long,
where and how many versions, and which framework. Everything else you decide and record.

## 3. The truth inventory

Ads die on credibility, and some claims carry legal risk. Sort every statement the piece might make:

- **Claims** need a source the user gave you or a document says: numbers, comparisons ("faster", "fewer"), outcomes,
  customers, awards, "first", "only", "#1". No source, no claim. Show the product doing the job instead.
- **Scenario details** describe the viewer's situation and are fine when plausible and framed as theirs: "You've sent
  over 150 applications" (Seeran) is the viewer's experience, not a market statistic. Keep them clearly "you".
- **Demo data** is fictional and looks real: plausible names (diverse, local to the audience: Ada, Chiamaka, Musa,
  Kofi, Zainab), local currency (format naira as `₦450,000`), realistic dates. Never a real customer's data, never a
  real company's logo as a client.
- **Features**: show what ships. A roadmap feature is either labelled ("Coming soon") or left out.
- **Third-party names and marks**: naming a platform in text is fine when it is true ("from LinkedIn or any job
  board"); showing its logo implies endorsement, so use generic UI (a chat, a browser, a phone) unless the user has the
  right to the mark.
- **People**: no real person's face or voice without permission. Synthetic people or voices that look or sound real
  get disclosed the way the platform requires. Avoid anything that resembles a specific real person.

Write the inventory into the brief as three lists: may say (with source), may not say, fictional on purpose.

## 4. Choosing the format

| The job | Format | Why |
|---|---|---|
| A new category or a product that needs explaining | Launch film (voice-led) | A voice can make an argument: problem, cost, turn, how it works |
| Awareness for a product people already understand | Motion ad (music-led) | Energy and brand recall; no argument needed |
| One feature, one moment | Feature drop, 8 to 12 s, either driver | One idea fits one beat |
| Retargeting, people who visited | 6 to 15 s cut of the main piece | They know you; remind and give the action |
| Landing page hero | 45 to 90 s launch film + a silent 6 to 10 s loop | The long one explains, the loop decorates |
| Founder credibility, early-stage trust | Launch film telling the founder's story, in a generated voice | Trust comes from the story and the proof; a founder's own read only when they offer one |
| Brand moment (intro, outro, event) | Logo sting, 3 to 6 s | The signature, nothing else |

Length by destination: Reels and TikTok 7 to 30 s (hook by 1 s), YouTube pre-roll 15 to 30 s (brand by 5 s, before
the skip), LinkedIn 15 to 45 s, X 6 to 30 s, WhatsApp Status under 30 s, landing page any length with a loopable cut.

This skill makes the voice-led formats: the launch film, a film telling the founder's story, a landing page hero with its silent
loop. The music-led ones (a motion ad on the beat, a logo sting) are made with the motion-designer skill, on the same
kit.

## 5. Tearing down a reference

When the user shows a reference ("like this"), take it apart before designing. You are after its principles:
structure, pacing, colour story, type system, motion signature, sound. Its script, brand and assets stay with it.

1. **Frames, exactly timed:** `python scripts/qa.py IN.mp4 --out ref/qa --every 1.0 --at 0` gives a contact sheet with
   real timestamps (exact seeks) plus the true frame 0. Then 10 fps motion strips around every fast move
   (`--strip 17.3:19.1@10`): transitions, logo moments and match cuts only show up there. Do not build sheets with
   ffmpeg's `fps` filter and `tile`: each tile shows a frame up to half an interval later than its slot, which hides
   type-ons and makes a black frame 0 look like a finished hook (this happened on the Seeran teardown).
2. **Words:** extract audio (`ffmpeg -i IN.mp4 -vn -c:a libmp3lame -q:a 4 ref.mp3`), run
   `python scripts/align_vo.py ref.mp3 --out ref/captions.json` (transcribes), correct the names into a script file
   (the transcript mishears brands: Seeran came back as "SIREN"), then re-run with `--script` and
   `--words-from ref/captions.timing.json` for exact phrase times.
3. **Sound:** `finish.py loudness IN.mp4` (integrated LUFS, true peak), a spectrogram
   (`ffmpeg -i IN.mp4 -lavfi showspectrumpic=s=1600x400:legend=0 ref/spectrum.png`), and `beat_grid.py` on the audio to
   learn whether the music has a beat to cut to (a low confidence means a beatless pad or a voice-led mix). Read the
   spectrogram for where the music drops out, swells and hits, and where effects sit.
4. **Beat table:** time | words | visual | motion | transition | sound. Then measure: words per second, seconds per
   beat (problem beats versus product beats), where the turn and the name land, how long the logo and the CTA hold,
   what frame 0 shows.
5. **Write it up:** the structure in one line, the five signatures worth taking, what to leave behind, and how the
   user's brand changes each signature.

If the reference is on Instagram or TikTok, open it in the browser and capture frames there; downloading a post needs
the user's permission.

### Teardown: Seeran (voice-led launch film, 35.3 s, 16:9, 30 fps)

Measured with timestamped sheets, 10 fps strips around every move, the aligned VO and a spectrogram (an independent
test run caught and corrected the errors in a first, sheet-only version of this table):

| Time (s) | Words | Picture and motion |
|---|---|---|
| 0.00 to 1.40 | You're tired of applying for jobs | Frame 0 is empty near-black; the line types on word by word from 0.10 s, a little ahead of the voice, complete by 0.60 s |
| 1.45 to 4.25 | because you've sent over 150 applications, | A dark card rises onto a tilted plane; a counter eases from 1 to 150 and lands just after "150" |
| 4.30 to 8.00 | and each one comes back with the same "unfortunately"... | Rejection rows stack one at a time ("Unfortunately," in bold) while the card pushes toward camera |
| 8.10 to 10.90 | and some of them don't even reply at all. | The stack defocuses; a small "Inbox, No new messages" card in empty black; a low swell in the gap |
| 10.90 to 13.20 | The problem is, you're invisible. | The music drops almost to silence; "invisible." lands huge, then fades nearly into the ground: the word does what it says |
| 13.30 to 16.00 | You're just one CV in a pile of hundreds, | One grey face scales up out of the word into a wall of greyscale faces; the camera pulls back and tilts |
| 16.00 to 17.40 | so you need a way to stand out. | That face lifts out in colour (the first colour in the film), labelled "You" |
| 17.40 to 19.30 | And that's why you need Seeran. | Match move: the wall fades, the "You" tile shrinks into the logo position, turns purple and becomes the app icon; the wordmark "seeran" blurs in letter by letter |
| 19.30 to 20.30 | To get seen. | A soft-edged purple wipe crosses left to right on the spoken name; the wordmark drops "ra" and the "n" slides in: "seeran" becomes "seen" |
| 21.00 to 29.90 | Paste any job / from LinkedIn / It finds the person hiring / researches the company / and writes the email | White product cards on purple and lavender, rising with motion blur: an input with a cursor, a job card, a people list with a sliding highlight and a "Decision maker" badge, stacked browser windows, an email typing itself; whips with a flash between some cards |
| 29.90 to 31.00 | so all you have to do is send it. | One huge "Send" pill; it presses, defocuses and expands to fill the frame with purple: the button becomes the end card |
| 31.00 to 35.30 | Try it out for free at seeranhq.com | The icon builds from a black square, the wordmark blurs in, a white dot grows into the URL pill at about 32.9 s; the URL is readable for about 2.4 s |

Numbers: 100 words in about 34.6 s of speech, so **2.9 words per second** (brisk). Problem beats run 2.8 to 3.7 s,
product beats 1 to 2 s: the film speeds up after the reveal. Turn at 12.2 s, name at about 19.3 s. Sound: a beatless
pad under the voice (nothing to cut to: onsets follow the voice), mixed at -16 LUFS integrated.

Signatures worth taking: a greyscale problem world that the brand colour replaces on the spoken name; one reframe word
at hero size that acts out its meaning; a metaphor carried into the logo by match moves (a face from the pile becomes
the icon; the name turns into the promise); product UI on tilted planes with depth of field and motion-blur whips; the
CTA button expanding into the end card; caption pills styled per world. Worth leaving: the empty frame 0 (the house
rule wants the hook legible on frame 0 for thumbnails and feeds), a URL held under 2.5 s, the face wall for any product
that handles personal documents.

### Teardown: Mano

The Mano reel (music-led, no voice) is torn down in the motion-designer skill's creative direction.

## 6. Concepts

Write three directions, one line each: **hook / spine / visual world**. Then pick one on four tests: is the message
clear in one viewing, is it distinct from category clichés, does it fit the brand's register, can you build it to the
bar with what exists. Say why the winner won in one sentence.

Example for a fictional invoicing app:
- "Weeks ago." / PAS: chasing is a second job, Paidly does the chasing / night-world UI cards, brand flood at "Meet Paidly". **Chosen: clearest pain, strongest turn.**
- "Your Friday, minus the follow-ups." / day in the life / a calendar that clears itself.
- "3 reminders. 0 replies." / numbers to relief / counters and a single notification.

## 7. Hooks

Frame 0 shows the hook, fully legible. Text hooks read in under a second (6 words or fewer for the first card).

| Hook type | Use when | Example shape |
|---|---|---|
| Pain call-out | The viewer has a felt, specific problem | "You're tired of applying for jobs" |
| Number shock | A true, surprising number exists, or a relatable scenario count | "150 applications. 0 replies." |
| Question | A daily need the product answers | "Out of groceries?" |
| Pattern interrupt | The product's output is visually striking | The finished result, then "made in 30 seconds" (only if true) |
| Before / after split | The change is visible | Messy inbox left, one tidy card right |
| POV | The audience shares a moment | "POV: it's 9 pm and the file is still incomplete" |
| Demo first | The product is its own proof | The magic moment, then the brand |
| Callback | A series, or retargeting | The last ad's end card, continued |

The first words of the VO and the first card say the same thing. Never open with the logo or "Introducing".

## 8. Story spines

| Spine | Beats (30 s budget) | Best for |
|---|---|---|
| Problem, agitate, solution (PAS) | Problem 0-8, agitate 8-14, turn 14-17, reveal 17-20, how it works 20-27, CTA 27-30 | Launch films; new categories |
| Before, after, bridge | Before 0-8, after 8-14, bridge (the product) 14-27, CTA | Visible transformation |
| Old way, new way | Old way as a montage, a hard cut, new way at speed, CTA | Workflow tools |
| Day in the life | Morning to night with the product in each moment | Consumer apps |
| Three reasons | Hook, reason 1, 2, 3 (one per beat), CTA | Feature-rich products, music-led |
| Feature parade | Hook (bar 0), promise (bar 1), features one per bar, payoff, logo | Music-led motion ads |
| One feature, one moment | The moment, the feature, the brand | 6 to 12 s drops |
| Objection flip | The objection in their words, the answer shown, CTA | Retargeting |

Each spine is a copywriting framework laid out in time. Choosing one with the user, and what each stage says:
`references/copywriting.md`.

The turn is the most important line in a voice-led film: short, plain, true, given the biggest type and a beat of
silence around it.

## 9. Writing the voiceover

Word budget at a natural ad pace (2.3 to 2.9 words per second with room to breathe; calm, trust-first brands sit
near 2.4, a brisk launch like Seeran runs at 2.9):

| Length | Words |
|---|---|
| 15 s | 30 to 38 |
| 30 s | 65 to 80 |
| 45 s | 100 to 115 |
| 60 s | 130 to 150 |

- One idea per line, and one line is one caption pill, so keep lines to about 38 characters (42 at most).
- Second person, present tense. Concrete nouns ("the same 'unfortunately'", "invoice #1042") beat abstractions.
- Rhythm: vary line length; put the stressed word at the end of the line, where the visual lands.
- The product name gets a line, or a beat, of its own. If the name invites a natural pun, use it once (Seeran: "To
  get seen"). Never force one.
- Capabilities are verbs, one per beat: "finds", "researches", "writes", "send".
- The CTA is a verb and a destination people can type: "Try it free at paidly.app".
- Read it aloud with a timer. Anything you stumble on, the voice will too.
- Pronunciation: write `{display|spoken}` in `script.txt` where they differ (`{paidly.app|paidly dot app}`,
  brand names spelled phonetically). Captions show the first form, the voice reads the second. Confirm how the brand says its own name in
  gate 2's question card; never guess it.

`script.txt` format (one caption phrase per line, optional cue id, `#` comments):

```text
[hook] You did the work weeks ago.
[turn] Chasing payments is a second job.
[url] Try it free at {paidly.app|paidly dot app}.
```

## 10. On-screen copy

A launch film's on-screen words are its headlines, kinetic words and caption pills: one idea per pill (section 9),
headlines that state the situation (section 11), every word on screen long enough to read twice. Card-by-card copy
for a music-led ad lives in the motion-designer skill.

## 11. House writing rules

From the user's writing directive; they apply to VO, captions, cards, post copy and delivery notes.

| Instead of | Write |
|---|---|
| "It's not a tool, it's a teammate." | "It follows up for you." |
| "Effortless invoicing, finally." (self-praise) | "Add an invoice once. Paidly follows up." |
| "Revolutionize your workflow" | Name the actual change: "Every reminder, sent on schedule." |
| "When a file doesn't belong." (aphorism) | "3 files set aside" (a fact or a count) |
| "Seamless, gentle, powerful" | Show it; let the viewer feel it |

Also: no em dashes anywhere; plain declarative sentences; the brand's vocabulary file outranks everything here.

## 12. The storyboard

`storyboard.md` (template in `assets/templates/storyboard.md`) is the build spec. One row per beat:

| # | Cue | VO / card | Visual | Motion | Out | Sound | Build |
|---|---|---|---|---|---|---|---|
| 1 | hook (frame 0) | You did the work weeks ago. | White line on night, glow | On screen at frame 0; underline draws on "weeks" | cut on "You've" | music bed in | `KineticText` emphasis underline |
| 5 | turn | Chasing payments is a second job. | Small grey setup, huge white "a second job." | Words on their syllables, blur in | circle flood | impact on "second" | two `KineticText`, `Sfx impact` |

Cue names are the `[ids]` in `script.txt` or bar numbers for music-led pieces, never seconds.

## 13. Art direction

- **Worlds.** A voice-led film usually has two: a desaturated problem world and the brand world, joined by one
  transition at the reveal (a colour flood from the logo point). A music-led ad usually has one world and one hero
  moment.
- **Colour.** Neutrals carry most of the frame, the brand colour a confident share, the accent the one thing to look
  at. Ration the accent: if everything is accent, nothing is.
- **Type.** Two families at most (display + body), mono only for codes and amounts. Big type gets tight tracking and
  tight leading. One size jump per frame. Sizes in `TYPE` (layout.ts) are a starting point, then judge by eye on a
  full-size still.
- **Composition.** One focal point per frame. On vertical, the sweet spot is the upper-middle of the safe zone; keep
  the bottom third for captions and platform UI. Depth: background (blurred), subject (sharp), foreground accents.
- **A metaphor carried through.** Seeran: invisible, then a pile, then "You", then seen. Find the thread and pay it
  off at the reveal or the end card.
- **Imagery.** Product UI rebuilt in code from the design system (crisp at any size, animatable, true). Illustrated
  props for finals: the kit's code-drawn `Sticker` props (free), generated 3D renders with the background removed, or
  a licensed set; emoji only in drafts.
  Generated imagery is for props and backgrounds, never for fake people, fake testimonials or fake screens.
