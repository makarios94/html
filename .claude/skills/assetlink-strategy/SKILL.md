---
name: assetlink-strategy
description: >
  Use this skill for ANY marketing, content, or social media strategy work on AssetLink, the decision-intelligence platform for wealth management distribution (advisor recruiters, asset managers, wholesalers, RIA aggregators). Covers ICP and persona development, competitive analysis against FINTRX, AdvizorPro, Discovery Data, RIA Database and other advisor-data platforms, positioning and messaging architecture, channel and content strategy, and general strategic analysis for the brand. Trigger this whenever the user asks about AssetLink's target audience, personas, ICP, competitors, competitive landscape, positioning, messaging, value proposition, content strategy, content calendar, social media strategy, channel strategy, or brand strategy, even if they only mention one piece such as just competitors or just a persona. This is the strategy layer; for producing static, carousel, or video content assets use assetlink-content-studio, and for SEO or blog and organic search work use assetlink-seo-organic.
---

# AssetLink Strategy

A go-to-market and content-strategy operating system for AssetLink, built to work the way the best B2B strategists in the wealth management and asset management space actually operate — loose enough to move fast, resourceful enough to fill gaps with sound judgment, and grounded in 15-20 years of pattern-recognition about how this specific industry buys.

The frameworks throughout draw on methodologies publicly associated with strategists who are well known specifically in financial-services/wealth-management marketing and adjacent B2B positioning work — among them **Michael Kitces** (Kitces.com — advisor-facing content authority and the economics of advisor attention), **Samantha Russell** (FMG Suite / Twenty Over Ten — marketing to financial advisors and RIAs at scale), **Stephanie Sammons** (WiredAdvisor — social/digital strategy for advisors and wealth firms), **Claire Akin** (Indigo Marketing Agency — RIA-specific positioning and growth marketing), and **April Dunford** (Obviously Awesome — B2B positioning methodology, applied here to a data/intelligence category that is still defining itself). These are referenced as well-known public approaches and philosophies, not verbatim quotes — they're scaffolding for AssetLink-specific strategy, not the deliverable itself.

## Read this first, every time

Before doing any strategy work, read `references/assetlink-context.md`. It captures AssetLink's actual product, positioning, personas, brand voice rules, and known constraints as they stand — so you're not reinventing or contradicting decisions already made. The product and market move fast (wealth management data/AI is a hot, shifting category), so re-fetch assetlink.ai directly when a request is positioning-sensitive or when the file's content might be stale, rather than treating it as permanently current.

## How to route a request

| The user is asking about... | Go to |
|---|---|
| Who to target, ICP, firmographics, persona detail, buying committee, JTBD | `references/icp-and-personas.md` |
| Competitors (FINTRX, AdvizorPro, Discovery Data, RIA Database, Dakota, etc.), competitive matrix, win/loss, market landscape | `references/competitive-analysis.md` |
| Positioning statement, value prop, message house, category definition, differentiation | `references/positioning-and-messaging.md` |
| Content strategy, content calendar architecture, channel mix, social media strategy (LinkedIn especially), format allocation, newsletter strategy | `references/content-and-social-strategy.md` |
| A full "build our strategy from scratch" request | Work through all four in the order above — ICP informs competitive framing, which informs positioning, which informs what content/channels should carry the message |

## Core operating principles

1. **This is a data/intelligence category still defining itself, not a mature software category.** "Decision intelligence for wealth management" is AssetLink's own category framing, not an established buyer search term — treat category-definition work (teaching the market what this even is) as a real, ongoing strategic task, not a one-time positioning exercise.
2. **Four personas, one spine, different depths.** Recruiters, Asset Managers, Wholesalers, and RIA Aggregators all rally around "compete on timing," but they are not interchangeable — a recruiter's buying trigger (a specific advisor is in play) is not a wholesaler's (territory coverage and meeting prep) is not an asset manager's (distribution partner fit). Never write strategy for "the AssetLink buyer" as a singular entity.
3. **RIA Aggregators is a constrained persona — respect the constraint.** Per `assetlink-context.md`, this persona is featured externally but held to category-education-only content internally until signal capability matures. Any strategy work touching this persona should default to educational/market-framing content, not AssetLink-specific capability claims, unless the user explicitly confirms that's changed.
4. **Methodology stays undisclosed.** Never build a strategy (or content plan, or competitive response) that requires disclosing which data sources AssetLink uses or how they're combined. Competitive differentiation has to be argued from outcomes and capability, not from revealing the "how."
5. **This is a financially sophisticated, skeptical, senior audience.** Wholesalers, asset managers, and recruiters have seen a decade of "AI-powered" claims. Strategy should assume the reader will discount hype and reward specificity, real data, and a point of view that sounds like it came from someone who's actually carried a bag or run a territory — not a generic SaaS marketing voice.
6. **Every strategic claim is a hypothesis or a sourced fact — label which.** Don't present an invented persona quote, an assumed pain point, or a fabricated competitive weakness as settled fact. Flag what's grounded (site copy, saved context, live research) versus what's a working hypothesis to validate with Devon/Andrew or real customer conversations.

## Typical workflows

**"Build/refine our ICP and personas"** → `icp-and-personas.md` → produce or sharpen persona docs for the four buyer types, including firmographic/situational fit, JTBD, and buying-committee mapping specific to how wealth management distribution teams are actually structured.

**"Who are our competitors / build a comp matrix"** → `competitive-analysis.md` → research the advisor-data/intelligence category (FINTRX, AdvizorPro, Discovery Data, RIA Database, Dakota, and any newer entrants — verify current positioning live rather than from memory, this space moves fast), build the comparison matrix, and identify AssetLink's genuine wedge versus where it's making claims that need stronger proof.

**"Fix/build our positioning and messaging"** → `positioning-and-messaging.md` → run the positioning process against the four competitive alternatives, build persona-specific message houses under the shared "compete on timing" spine, and produce draft copy respecting the standing brand-voice rules.

**"Build our content/social strategy"** → `content-and-social-strategy.md` → design the channel mix, format allocation, and content pillar architecture (this feeds directly into what assetlink-content-studio produces and what assetlink-seo-organic builds toward).

**"Full strategy audit/build"** → run all four in sequence, then synthesize into a single prioritized set of recommendations — don't just hand back four disconnected documents.

## Output format guidance

- Persona docs, competitive matrices, and message houses: clean markdown artifact or a real file (xlsx for matrices with scoring, docx for narrative positioning docs) since these get reused and shared with Devon/Andrew.
- Competitive/strategic analysis: lead with the 2-3 highest-impact findings in prose, don't bury insight under framework explanation.
- **Show every Markdown or PDF deliverable in the chat itself.** The user's app only downloads file cards. So paste the full content of every `.md` deliverable into the reply, and for a `.pdf`, paste its full text. Do this every time a file is created or meaningfully updated, without being asked. A file card is optional backup, never the only way to see it.
- Always apply the standing brand voice and copywriting rules from `assetlink-context.md` to any drafted copy, even at the strategy stage — a positioning statement or message house line should already sound like AssetLink, not need a rewrite pass later.
