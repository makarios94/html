# AssetLink.ai: ICP and ABM test run

Produced by the `marketing-agent` skill (Chain F, ICP, then Chain A, ABM). This is a test run, so nothing was sent or published.

Steps run: ICP → buying committee → target account list (TAL) → tiering → plays by tier → orchestration → metrics.
Steps skipped (no data): CRM lookalikes, intent data, verified contacts, Tier 1 research briefs on named people.

## 1. Assumptions and data used

- **Seller:** AssetLink ([assetlink.ai](https://www.assetlink.ai/)), New York. Founded 2021 (formerly DFD.ai) by Devon Drew (CEO, former Vanguard wholesaler) and Surfield Thomas (CTO).
- **Product:** AssetLink describes it as an AI "bidirectional" distribution platform. It matches financial advisors' information requests to asset managers' due-diligence documents. It also offers advisor intelligence, including screens on AUM, production, prior firm, channel and geography, plus movement signals from regulatory filings. A US patent (Aug 2025) covers product distribution, advisor recruiting and client relationship intelligence. Schwab Advisor Services lists it as a provider.
- **Business model:** Asset managers pay a license fee scaled by number of strategies and users. Advisors join free (assumed from launch coverage).
- **Scale:** At launch (Jan 2024) the platform had 67 managers and about 7,400 advisors. These are dated figures that AssetLink reported itself.
- **Funding:** Accelerator backed (Google for Startups Black Founders, Northwestern Mutual Black Founder Accelerator, gener8tor, Founders Arena). CB Insights reports about $100K raised; I could not verify that.
- **Assumed economics (please replace):** ACV about $25K–$100K for a manager license, sales-led, 3–6 month cycle, with a small founder-led sales team.
- **Gaps:** I could not reach the assetlink.ai site from this sandbox, so this uses search results only. There was no CRM, customer list, win/loss data or pipeline target. All account scores are hypotheses, and no contacts have been sourced.

## 2. Verdict

Lead with **alternative-investment managers pushing into the wealth channel** and **lean, advisor-sold ETF issuers**. Both groups need to find which of roughly 300K advisors will actually use a product, and both have wholesaler teams too small to cover them by hand. That is the gap the "bidirectional discovery plus advisor intelligence" product fills.

Use **RIA aggregators and breakaway platforms** as a second motion for the recruiting use case the patent covers. Treat it as a separate offer and message.

Success should be measured as licensed managers and pipeline from the 30-account list, not as advisor sign-ups.

## 3. ICP

| Dimension | Primary ICP: asset managers | Secondary ICP: RIA recruiters |
|---|---|---|
| Firm type | Alts sponsors (evergreen, interval, private credit), ETF issuers, mid-size active managers that sell through intermediaries | RIA aggregators, breakaway-advisor platforms, acquisitive RIAs |
| Size | About $5B–$500B AUM. Sweet spot is a 5–60 person wholesaler force | Active M&A or recruiting program |
| Triggers | New wealth-channel vehicle launch, a new head of distribution, wholesaler cuts or restructuring, an M&A integration, a new ETF lineup | Recruiting targets announced, PE recapitalization, new platform launch |
| Pains | Wholesaler coverage and productivity, advisor discovery for niche products, CRM data that goes stale, cost per new advisor relationship | Finding advisors who are likely to move before competitors do |
| Bad fit | Top-5 managers with in-house data science that buy Broadridge, Discovery Data or FINTRX enterprise-wide. Institutional-only managers | Firms with no recruiting budget |
| Competitive set | FINTRX, Discovery Data (ISS Market Intelligence), AdvizorPro, Broadridge Distribution Insight, Dakota | Same tools, plus recruiting firms |
| Wedge | AI matching on due-diligence documents and advisor intent (two-sided), not just a static database. Built by a former wholesaler | Daily movement signals combined with production proxies |

## 4. Buying committee (asset manager)

| Role | Cares about | Likely objection | First touch |
|---|---|---|---|
| Head of US Intermediary / Distribution (economic buyer) | Net flows per wholesaler, new advisor relationships | "We already pay for Discovery Data or FINTRX" | Business case: cost per new producing advisor |
| Head of Sales Strategy / Distribution Analytics (champion) | Better targeting, fresh data, CRM hygiene | Data quality and how it differs from what they have | Sample overlap test on their own territory |
| National Sales Manager / regional wholesalers (users) | Who to call this week | Adding another tool | 2-minute demo of next-best advisor |
| Head of Wealth / Private Wealth Solutions (alts) | Advisor adoption of evergreen funds | Compliance on distributing alts | Alts-allocating advisor segment |
| Marketing / Digital Distribution | Lead-to-meeting conversion | Attribution | Integration with the marketing stack |
| CRM / Salesforce owner, Information Security (technical evaluators) | Integration and security review | Data provenance, SOC 2 | Security pack and data lineage doc |
| Compliance, Procurement (blockers) | FINRA marketing rules, vendor risk | Small-vendor risk | Customer references and a pilot structure |

## 5. Target account list

The full list of 30 accounts is in `assetlink-tal.csv`. Each account is scored on fit (0–50), intent (0–30) and relationship (0–20), for 100 total. Scores are computed in code. Tiers: 1 is 60 or more, 2 is 50–59, 3 is under 50.

| Tier | Count | Clusters |
|---|---|---|
| 1 (1:1) | 9 | Hamilton Lane, StepStone, Ariel, Blue Owl, Pacer ETFs, KKR, Calamos, Apollo, Simplify |
| 2 (1:few) | 16 | ETF issuers, mid-size active managers, diverse-owned managers, RIA recruiting platforms |
| 3 (1:many) | 5 | Large RIAs, plus the ETF Central audience as a content channel |

Every intent score is a hypothesis based on public positioning, not measured signals. Validate each one before Tier 1 work starts: check job posts for distribution roles, product launches and leadership changes.

## 6. Plays by tier

- **Tier 1 alts ("Alts-to-wealth"):** a custom teardown for each account titled "Which 500 advisors in your territories already allocate to alts like yours". Exec outreach from Devon Drew, using the former-wholesaler angle. A closed-door roundtable for heads of private wealth distribution. LinkedIn ads to named contacts.
- **Tier 1 ETF and active managers:** a pilot offer for 2 strategies, 1 region and 60 days, with a before/after wholesaler meeting rate.
- **Tier 2 ETF issuers:** a cluster webinar, "How lean ETF issuers find advisors who will actually buy", with a peer issuer as speaker. Cluster email sequence plus LinkedIn matched audience.
- **Tier 2 mission fit (Ariel, Brown Capital):** a warm path through the Black founder accelerator networks and diverse-manager associations.
- **Tier 2 RIA recruiting:** a separate offer, "Breakaway-risk signals from daily filings", with its own sequence to heads of recruiting and M&A.
- **Tier 3:** persona sequences, recruiting-signal content, and repurposed ETF Central and ICE podcast clips.

## 7. Orchestration (6-week account sprint, per cluster)

| Week | Marketing | SDR / founder | Signal to advance |
|---|---|---|---|
| 1 | LinkedIn ads warm-up to the tier; champion content (a benchmark on wholesaler coverage) | none | Ad engagement |
| 2–4 | Webinar or roundtable invites | Multi-threaded email and LinkedIn to the champion and economic buyer | 2 or more engaged contacts, or one high-intent action |
| 4–6 | Retargeting with a pilot case | Founder outreach that references the engagement; pilot proposal | Meeting booked |

**Sales alignment:** follow up hot signals within 24 hours, review accounts weekly for 15 minutes, and have the founder own every Tier 1 account.

## 8. Metrics and thresholds

- **Coverage:** 3 or more known contacts per Tier 1–2 account by the end of week 2.
- **Engagement:** 30% or more of Tier 1 accounts with 2 or more engaged contacts by week 4.
- **Meetings:** at least 6 from Tier 1 and 8 from Tier 2 per 6-week sprint. These targets are mine and need checking against capacity.
- **Pipeline:** pilots opened, licenses closed, and win rate for the TAL against non-TAL deals.
- **Review:** weekly on Monday; first sprint retro 6 weeks after launch.

## 9. Action gate

Nothing has been sent, published or created in any CRM. Before outreach, three things are needed:
1. Confirmed ICP and economics from AssetLink.
2. Verified contacts. Apollo is connected but needs reauthorization.
3. Approval of the specific sequences.

FINRA rules on communications apply to AssetLink's own claims only if it is a member firm. Flag this for their compliance team.

## Sources

- AssetLink site: https://www.assetlink.ai/
- Launch (Jan 2024): https://www.businesswire.com/news/home/20240108367681/en/AssetLink-Launches-First-AI-Powered-Bidirectional-Platform-for-Investment-Discovery
- Patent (Aug 2025): https://www.businesswire.com/news/home/20250814521686/en/AssetLink-Secures-Groundbreaking-Patent-for-AI-Driven-Financial-Matchmaking
- Ten to Watch 2024: https://www.wealthmanagement.com/ria-news/the-ten-to-watch-in-2024-devon-drew
- Founder-as-wholesaler profile: https://www.wealthmanagement.com/people/former-wholesaler-says-data-platform-will-help-tackle-lack-diversity-asset-management
- Schwab listing: https://advisorservices.schwab.com/provider-solutions/Assetlink_For_advisors
- ETF Central podcast (2026): https://www.etfcentral.com/podcasts/inside-the-house-etf-central/how-devon-drew-is-transforming-asset-gathering-with-ai
- Funding: https://www.cbinsights.com/company/dfd-partners
- Competitor landscape: https://advizorpro.com/discoverydata-vs-fintrx and https://prospeo.io/s/fintrx-alternatives
