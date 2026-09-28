# AssetLink Context

Standing facts, decisions, and constraints. Status tags:

- **[INTERNAL]**: from an internal AssetLink doc (named below). These outrank public copy.
- **[PUBLIC]**: from assetlink.ai or trade press. May be aspirational or stale.
- **[DECISION]**: a standing rule this skill must respect.
- **[TO CONFIRM]**: a working assumption to validate with Devon / Ari / Andrew.

_Last reviewed: 2026-09-28._

## 0. The claims gate (read before writing anything external)

**The AssetLink SaaS Product Reality Document (v1.1, owner Ari, updated June 4, 2026) is the source of truth for what can be claimed.** If a capability isn't listed there as *live today*, it isn't represented as a current feature in sales, demo, marketing, social, or investor material. [DECISION]

Public site copy (e.g. "detects movement signals daily," "links stories … before they hit the filings," "relationship intelligence matching") runs **ahead** of the Product Reality doc. Where they conflict, the Product Reality doc wins. Treat the site language as aspirational or category framing, not as a feature claim. Flag the conflict to the user whenever it matters.

## 1. Sources on file

| Doc | Owner | Date | Use for |
|---|---|---|---|
| AssetLink SaaS Product Reality Document v1.1 | Ari | 2026-06-04 | What's live, personas, boundaries, customers |
| AssetLink_Product_Overview (external derivative of the above) | Devon | 2026-06-22 | External-safe product language |
| AssetLink Strategy & Competitive Analysis (from Future Proof 2026 meeting notes) | Devon | 2026-03-12 | Head-to-head competitors, pricing, kill sheet |
| Competitive Analysis: AssetLink.ai | Devon | 2025-01-30 | Generic AI/CRM adjacent landscape (older) |
| Market sizing doc | Devon | 2026-04-20 | Market sizing (internal only) |
| Product Idea Inventory v2 | Ari | 2026-08-03 | Roadmap backlog (internal only, NOT claimable) |
| **Not found:** a standalone ICP doc | | | Drafted in `icp-and-personas.md`; Devon and Ari to confirm |

## 2. Positioning (internal)

**One-liner [INTERNAL]:** AssetLink is a relationship intelligence platform that helps wealth management firms find, prioritize, and engage high-fit advisor and firm relationships using regulatory data and AI.

**Differentiation thesis [INTERNAL]:** regulatory-data accuracy **plus** advisor-specific workflows and intelligence. AssetLink is *not* a broad CRM or back-office replacement.

**Public category frame [PUBLIC]:** "Decision Intelligence for Wealth Management" serving teams "who compete on timing and precision." The skill's spine, **"compete on timing,"** comes from this. [DECISION: keep the spine, but only back it with live capabilities (§3). Today, "timing" means *daily-refreshed regulatory data + fast search + AI-drafted outreach*. Check the Product Reality doc's not-live list (internal) before tying the spine to any signal or prediction capability.]

**Market perception [INTERNAL, Future Proof 2026]:** "best-in-class but under-known." AssetLink wins on product superiority and loses on brand familiarity and price. Quote from a stakeholder: *"I didn't know what AssetLink did."* Brand awareness is a named strategic priority.

## 3. Product reality

### Live today [INTERNAL]
- **Advisor/firm search & screener** over **390,145 advisors** and **8,732 firms**. Filters include state, city, assets, custodian, and compliance. CSV/Excel export.
- **Advisor & firm profile pages:** registrations, disclosures, social activity, and firm asset breakdowns.
- **AI Insight chatbot:** RAG over the platform's data.
- **AI Profile Agent:** drafts personalized outreach emails directly into Gmail/Outlook drafts.
- **Manual ICP tagging:** Closed / Prospect / Not a Fit.
- **Integrations:** Gmail, Outlook, HubSpot (OAuth).
- Data is **batch-updated daily**, not real-time.
- Sold differentiators cited in the competitive brief: salary/GDC benchmarking, "Social Pulse" social-engagement signals, and sophisticated custom lists. [TO CONFIRM each against the Product Reality doc before claiming it.]

### Not live. Do not claim. [INTERNAL]
The not-live list lives in the Product Reality doc and is not reproduced here. **Anything not in the live list above is unclaimable until someone confirms it against that doc.**

### Hard boundaries [INTERNAL]
Not a broker-dealer, custodian, or RIA. No investment advice, trade execution, or regulatory filing on customers' behalf. **No autonomous AI decision-making.** No guarantee of 100% data accuracy. **US-only** coverage.

### Roadmap backlog [INTERNAL: never claim as live, never date publicly]
Roadmap detail lives in the Product Idea Inventory (internal). Read it there when a request needs roadmap context. It is not reproduced here.

Strategy *can* plan content that previews a direction ("where advisor intelligence is heading") but it must never imply availability.

## 4. Personas: revenue priority [INTERNAL]

| Priority | Persona | Primary use case |
|---|---|---|
| **Primary** | Recruiter (RIA / BD / wirehouse recruiting leaders) | Source advisors open to moving; get personal contact info; filter by credentials/geography |
| **Secondary** | RIA Aggregator / M&A buyer (PE-backed, consolidators) | Find firms by size/growth; spot likely sellers; get owner contact info |
| **Tertiary** | Asset Manager / Distribution pro (wholesalers, Series 7 + 63/65/66) | Find top producers by AUM; prioritize by territory; track firm moves |

The skill's four-persona framing (Recruiters, Asset Managers, Wholesalers, RIA Aggregators) maps onto these three: **Wholesalers sit inside the Asset Manager / Distribution persona.** Weight effort by revenue priority, and don't split it evenly across four.

**RIA Aggregator constraint [DECISION]:** content stays category-education only, with no AssetLink-specific capability claims, until signal capability matures. Note: this persona is revenue-*secondary* and has live customers. The constraint limits *signal/prediction claims* ("spot likely sellers"), not necessarily the live search and profile capabilities. [TO CONFIRM with Devon: may aggregator content reference live screener and firm-profile capabilities?] Until that's confirmed, default to education-only as the skill states.

Full detail: `icp-and-personas.md`.

## 5. Customers [INTERNAL: do not name publicly without written approval]

Live customers span recruiting & due diligence, RIA aggregator due diligence, and one enterprise asset manager (distribution workflow). Names are listed in the Product Reality doc and are never used externally without written approval.

## 6. Pricing [INTERNAL: never publish]

Current pricing and tiering are in Devon's competitive brief (internal). Strategic takeaway: AssetLink prices at a **significant premium** to FINTRX and AdvizorPro, so messaging must justify that premium. Older press pricing figures are stale.

## 7. Market sizing

TAM/SAM/SOM figures live in Devon's market sizing doc (internal, Apr 2026). Read it there when sizing matters, and don't reproduce the figures in this skill or in external material.

## 8. Brand voice & copywriting rules

[TO CONFIRM: replace with the official voice guide if one exists. None was found in the sources above.]

1. **Talk like someone who's run a territory or a recruiting desk.** Use native vocabulary (CRD, U4/U5, BrokerCheck, IAPD, ADV, GDC, AUM, breakaway, book, territory) and never define it.
2. **Specific beats superlative.** No "revolutionary," "game-changing," "unlock," "supercharge."
3. **Treat "AI" as the means, not the headline.** Lead with the outcome. And never imply autonomous AI decisions (a hard boundary): AI *drafts*, *summarizes*, and *answers*, while humans decide and send.
4. **Use "intelligence layer / GPS," not "database / map."** (From the kill sheet.)
5. **Avoid real-time language.** Data is daily-refreshed, so avoid "real-time," "live signals," and "instant alerts."
6. **No fabricated proof.** Use `[PROOF NEEDED]` placeholders.
7. **Stay compliance-aware.** No investment advice, no performance promises, no accuracy guarantees.

## 9. Standing constraints (summary)

1. **Claims gate** (§0): only Product Reality "live today" features.
2. **Methodology stays undisclosed** [DECISION]. Don't explain which regulatory/public sources are combined or how. Saying "regulatory data" at the level of the one-liner is fine; itemizing the pipeline isn't.
3. **RIA Aggregators = category education** (§4).
4. **No customer names, pricing, TAM, or roadmap in external material** without approval.
5. **Competitor claims must be verifiable and dated.**

## 10. Stakeholders

- **Devon**: strategy, competitive analysis, market sizing, external product overview.
- **Ari**: product; owns Product Reality doc and Idea Inventory.
- **Andrew**: validates strategy/positioning. [TO CONFIRM: role]

## 11. Related skills

- `assetlink-content-studio`: asset production.
- `assetlink-seo-organic`: SEO/blog/organic.
