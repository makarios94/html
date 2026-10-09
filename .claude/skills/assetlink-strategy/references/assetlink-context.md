# AssetLink Context

Standing facts, decisions, and constraints. Status tags:

- **[INTERNAL]**: from an internal AssetLink doc (named below). These outrank public copy.
- **[PUBLIC]**: from assetlink.ai or trade press. May be aspirational or stale.
- **[DECISION]**: a standing rule this skill must respect.
- **[TO CONFIRM]**: a working assumption to validate with Devon / Ari / Ivan.

_Last reviewed: 2026-10-08._

## 0. The claims gate (read before writing anything external)

**Devon's *AssetLink Product Reality* (October 8, 2026) is the source of truth for what can be claimed.** It splits AssetLink into three groups: live on the platform, delivered through the managed service, and in development. Anything in development is never described as shipped. [DECISION]

Check every claim against it before it goes into a deck, email, demo or post. The full document is internal; the summary below is enough for most work.

## 1. Sources on file

| Doc | Owner | Date | Use for |
|---|---|---|---|
| **AssetLink Product Reality** | Devon | 2026-10-08 | What's live, the managed service, what's in development, claims to avoid |
| **AssetLink Ideal Customer Profile** | Devon | 2026-10-08 | Buyer lanes, use cases, titles, buying triggers, qualifying questions |
| **AssetLink Messaging and Marketing Kit** | Devon | 2026-10-08 | Official tagline, one-liner, boilerplate, message by buyer, outreach templates, demo flow, objections, words to use and avoid |
| Competitor reports: FINTRX, AdvizorPro, ISS Market Intelligence | Devon | 2026-06-02/03 | Website scans: coverage, features, limits, openings for AssetLink |
| AssetLink Strategy & Competitive Analysis (Future Proof 2026 notes) | Devon | 2026-03-12 | Competitor positions, kill sheet (older) |
| Competitive Analysis: AssetLink.ai | Devon | 2025-01-30 | Generic AI/CRM landscape (older) |
| Market sizing doc | Devon | 2026-04-20 | Market sizing (internal only) |
| Product Idea Inventory v2 | Ari | 2026-08-03 | Roadmap backlog (superseded where Product Reality differs) |

The June 2026 Product Reality v1.1 is **outdated**. Don't use its numbers (390K advisors, 8.7K firms) or its not-live list.

## 2. Positioning

**Current positioning: v5 (Oct 9, 2026), following Devon's Messaging and Marketing Kit.** Full version: the private page listed in the repo's `CLAUDE.md`. Summary in `positioning-and-messaging.md`.
- **Tagline:** Know who, why and when.
- **One-liner:** AssetLink is a decision intelligence platform for wealth management that finds the right advisors and firms for your criteria, shows why they fit, and signals when to act.
- **Spine:** "compete on timing," backed by who (lists built to the client's profile), why (the reason each name fits, and a source for every field) and when (news signals in about a day, versus about 30 days for filings).

**Market perception [INTERNAL, Future Proof 2026]:** "best-in-class but under-known." Quote: *"I didn't know what AssetLink did."* Brand awareness is a named priority.

## 3. Product reality [INTERNAL, Oct 8 2026]

### Live on the platform
The platform finds and filters advisors and firms, surfaces signals, and drafts outreach. **It does not rank advisors.**
- **Coverage:** 600K+ advisor profiles, 20K+ firm profiles, about 41K advisor teams. [TO CONFIRM with Ari and Ivan; decks still say 500K+ and 10K+]
- **Search and lists:** filters (state, city, firm, age, experience), saved lists, exports with chosen columns.
- **Insight agent:** plain-English questions: build lists, trend analysis, lookalikes from a firm's hires, and why a name fits.
- **Signals:** change detection, news with sentiment, leaderboards, hotspots, fast- and slow-growing firms, firm movement and tenure. **News appears in about a day, versus about 30 days for filings.**
- **Advisor profiles:** personal and work contact details, education, exams, disclosures, team and office, historical AUM, social activity, allocations.
- **Your profile and ICP:** each user uploads an ideal advisor profile and customer lists, and can load outcomes. Private to the client.
- **Curated reports** shaped by each user's usage.
- **Drafted outreach** into the user's drafts folder. Nothing sends automatically. Native Microsoft, Google and HubSpot.
- **Security:** SOC 2 report available. Type II re-exam in progress.

**Known limits:** no A–Z sort yet, metro filters only (no regions), some firm names miss, the Insight agent can fail simple tasks (rehearse demos), AUM isn't available for everyone.

### Delivered through the managed service (not self-serve)
Calibrated scoring against a client's ideal profile, market intelligence reports, modeling on a client's own outcomes, and data unification in the client's environment. **An 8-week scoring pilot produced strong results** (details in the internal doc). Use pilot figures only with their context.

### In development. Never describe as shipped.
A–Z sorting, regional filters, self-serve checkout, conversation capture, always-on agents, estimated individual AUM, a recommendation engine.

### Claims to avoid
| Don't claim | Say instead |
|---|---|
| "AssetLink ranks advisors" | "Finds advisors who match your criteria and shows why" |
| "It's an MVP" | "Generally available and actively developed" |
| Pilot accuracy figures as a guarantee | Use the pilot figure only with its context |
| "Predicts who will move" | "Signals who may be moving" |
| "Always-on agents hunt for firms" | "On the roadmap" |
| Individual AUM estimates | Don't mention them |

### To confirm with Ari and Ivan
Coverage counts · how many profiles carry personal cell numbers and team AUM · which data refreshes daily · how curated reports are generated · Dynamics, API and MCP options · SOC 2 status.

### Hard boundaries
Not a broker-dealer, custodian or RIA. No investment advice or trade execution. **Nothing sends or decides automatically:** AI drafts, people decide. No accuracy guarantee. US-only.

## 4. Who we sell to [INTERNAL, Ideal Customer Profile, Oct 8 2026]

**Growth, recruiting and distribution leaders at wealth firms that already pay for advisor data and feel its gaps.** Core universe: about 4,000 firms with $1–20B of AUM.

**Three lanes, by firm size:** Enterprise (wirehouses, large BD networks, insurer-owned wealth arms), Mid-market (regional BDs, RIA platforms, asset managers' distribution teams), Starter (smaller RIAs, boutique managers, fintechs). Pricing per lane is internal.

**Three use cases on the same data:** recruit advisors (**the wedge**, fastest growing) · sell to advisors · acquire firms.

**Buyer titles:** Chief Growth Officer, Head of Business/Corporate Development, Head of Advisor Recruiting, Head of Revenue/RevOps, Head of Sales Enablement; the founder at smaller firms. The CFO signs but doesn't buy.

**Buying triggers:** a data contract up for renewal (e.g. FINTRX, AdvizorPro, MarketPro) · opening a new market or office · contact-accuracy complaints · too few people to work the list · an industry event that frees advisors · an acquisition push.

**Acquire-firms constraint: lifted (Oct 9, 2026).** Devon's Messaging Kit gives Corporate Development its own message ("See which RIAs and wealth firms are growing, shrinking or in play") and outreach template, backed by live leaderboards, hotspots and fast-growing firm lists. Acquirer content may now reference those live capabilities. Prediction claims ("likely to sell") stay off-limits.

Full detail: `icp-and-personas.md`.

## 5. Customers [INTERNAL: never name publicly without written approval]

Customers and active evaluations span all three lanes. Names are in the internal ICP and never appear externally without written approval.

## 6. Pricing [INTERNAL: never publish]

Pricing by lane is in the internal ICP. AssetLink is still priced above AdvizorPro, so messaging justifies it with outcomes (the pilot), not feature lists. Self-serve plans aren't launched.

## 7. Market sizing

TAM/SAM/SOM figures live in Devon's market sizing doc (internal, Apr 2026). Don't reproduce them in this skill or in external material.

## 8. Brand voice & copywriting rules

[TO CONFIRM: replace with the official voice guide if one exists.]

1. **Plain words, short sentences.** Leadership and buyers read these. Use industry terms buyers use (BrokerCheck, IAPD, ADV, AUM, breakaway), but no marketing jargon.
2. **Specific beats superlative.** No "revolutionary," "game-changing," "unlock," "supercharge."
3. **AI is the means, not the headline.** AI drafts, summarizes and answers; people decide and send.
4. **Timing language:** "within a day of the news," "see the move sooner." Never "real-time" or "predicts."
5. **No fabricated proof.** Use `[PROOF NEEDED]` placeholders. Pilot results always carry their context.
6. **Compliance-aware.** No investment advice, no performance promises, no accuracy guarantees.

## 9. Standing constraints (summary)

1. **Claims gate** (§0): live features only, and the claims-to-avoid list.
2. **Methodology stays undisclosed** [DECISION]. The kit's boilerplate names the source types (regulatory filings, advisor websites, social activity, news); go no further than that.
3. **Acquire-firms content** may use live firm-growth capabilities, never prediction claims (§4).
4. **No customer names, pricing, TAM, or roadmap in external material** without approval.
5. **No individual advisors named in public content.** Firm-level trends from public filings are a decision pending with leadership.
6. **Competitor claims must be verifiable and dated.**

## 10. Stakeholders

- **Devon**: strategy, Product Reality and ICP owner, competitive analysis, market sizing.
- **Ari** and **Ivan**: product and data; confirm counts and capability details.
- **Andrew**: validates strategy/positioning. [TO CONFIRM: role]

## 11. Strategy documents

Positioning (v4), content strategy (v2) and competitive analysis are private pages listed in the repo's `CLAUDE.md`.

## 12. Related skills

- `assetlink-content-studio`: asset production.
- `assetlink-seo-organic`: SEO/blog/organic.
