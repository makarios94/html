# Creative direction: from brief to storyboard

1. The job of a short ad
2. The brief
3. The truth inventory
4. Choosing the format
5. Tearing down a reference (with the Mano teardown)
6. Concepts
7. Hooks
8. Story spines
9. Voiceover (the launch-film skill)
10. On-screen copy for motion ads
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

This skill makes the music-led formats: the motion ad, a feature drop on the beat, a logo sting, a silent loop. The
voice-led ones (launch film, a film telling the founder's story, landing page hero) are made with the launch-film skill, on the same
kit.

## 5. Tearing down a reference

When the user shows a reference ("like this"), take it apart before designing. You are after its principles:
structure, pacing, colour story, type system, motion signature, sound. Its script, brand and assets stay with it.

1. **Frames, exactly timed:** `python scripts/qa.py IN.mp4 --out ref/qa --every 1.0 --at 0` gives a contact sheet with
   real timestamps (exact seeks) plus the true frame 0. Then 10 fps motion strips around every fast move
   (`--strip 17.3:19.1@10`): transitions, logo moments and match cuts only show up there. Do not build sheets with
   ffmpeg's `fps` filter and `tile`: each tile shows a frame up to half an interval later than its slot, which hides
   type-ons and makes a black frame 0 look like a finished hook (this happened on the Seeran teardown).
2. **Words:** list the on-screen words card by card with their times from the sheet. If the reference is carried by
   a voice, it is a launch film: take it apart with the launch-film skill, which aligns the voice to its own words.
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

### Teardown: Seeran

The Seeran launch film (voice-led) is torn down beat by beat in the launch-film skill's creative direction.

### Teardown: Mano (music-led motion ad, 9:16)

Observed in the browser (not frame-timed): red brand world, "all in one app" in kinetic type with "one app" in the
brand red, a phone mockup of the real app, category pills (Pharmacy, Food, Groceries) springing in one per beat,
hand-drawn red swooshes and arcs drawing on, food props floating around "out of groceries?", the logo on red to close.
Its creator states it was made entirely in code with Claude: no AI video, no stock footage, no editing timeline.
Signatures worth taking: one brand colour doing all the work; springy, playful entrances on the beat; hand-made accents
on clean type; props as illustration; the app's real UI as the proof.

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

## 9. Voiceover (the launch-film skill)

A motion ad carries its words on screen (section 10). When the piece needs a voice to make its case, it becomes a
launch film: the launch-film skill has the word budget, the script format, voice direction and casting.

## 10. On-screen copy for motion ads

- Six words or fewer per card, one idea per card, at most one emphasis word or phrase per card.
- Hold every card at least `readFrames(text)` (read it twice, never under 1 s) unless the voice carries it. At 120 BPM a
  bar is 2 s, which holds about 4 words by that rule once the next card's entrance starts before the bar line: keep a
  one-bar card to four words, or give it two bars.
- One jump in size per card (a small setup line and one big line), never three sizes fighting.
- No orphan: a single short word alone on a line only when it is the emphasis.
- Write `copy.md` as a beat sheet: bar, beat, card text, emphasis, motion, sound.

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
