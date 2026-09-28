# ICP & Personas

Tags: **[INTERNAL]** means from the Product Reality doc (Ari, Jun 2026) or Devon's analyses. **[HYPOTHESIS]** means inference to validate. No standalone ICP doc exists yet. This file is the working draft. Devon and Ari should confirm it and turn it into its own doc.

## Method

1. **Weight by revenue priority** [INTERNAL]: Recruiter (primary) → RIA Aggregator (secondary) → Asset Manager / Distribution incl. wholesalers (tertiary).
2. **Situational fit beats firmographics.** An *active mandate* (recruiting, M&A, or territory) is the best-fit signal for every persona.
3. **Map the buying committee.** It's thin for recruiters and deep for enterprise asset managers.
4. **Write JTBD in the buyer's words.**
5. **Claims gate.** Persona "value" must map to *live* features (see `assetlink-context.md` §3).

## The common thread [INTERNAL]

All three personas currently stitch together **Salesforce/HubSpot + Power BI + LinkedIn + manual FINRA BrokerCheck / IAPD lookups**. AssetLink's fit is **replacing that fragmentation with one queryable source plus AI-drafted outreach.** All are **US-only**.

That's the most defensible, live-backed "compete on timing" story: *less time assembling, more time reaching out, ahead of the rep still toggling between five tabs.*

---

## Primary: Recruiter (RIA / BD / wirehouse)

- **Who [INTERNAL]:** Recruiting leaders at RIAs, broker-dealers, and wirehouses. [HYPOTHESIS: also independent recruiting firms and transition consultants.]
- **JTBD:** Source advisors open to moving, get **direct (not corporate-gatekept) contact info**, and filter against a specific mandate (e.g. "CFP in the Northeast managing $200M+"). Catch competitive moves before rivals do.
- **Critical data [INTERNAL]:** name, CRD, tenure at current firm, license type, production/AUM estimate, personal email/cell.
- **Best-fit signal [INTERNAL]:** has an active recruiting mandate and **pays for direct outreach data, not just a directory**.
- **Live features that serve them:** screener (credentials/geo/assets/custodian/compliance), profiles (registrations, disclosures, social activity), AI Profile Agent → Gmail/Outlook drafts, ICP tagging, export. Also salary/GDC benchmarking and Social Pulse (sold differentiators per the competitive brief).
- **Pains [HYPOTHESIS, Med]:** stale directory data, gatekept corporate emails, hours on BrokerCheck, generic outreach that gets ignored.
- **Objections:** "FINTRX is the standard." "AdvizorPro is a fifth of the price." "I have my network."
- **Gaps:** check the Product Reality doc's not-live list (internal) before promising any workflow feature.
- **Buying committee:** usually the recruiting leader (economic buyer + user). Sometimes the head of growth/business development.

## Secondary: RIA Aggregator / M&A buyer (CONSTRAINED)

- **Who [INTERNAL]:** PE-backed platforms and consolidators buying RIA books.
- **JTBD:** Identify targets by size (AUM, headcount) and growth trajectory. Spot firms likely to sell (smaller, aging founder, low growth). Reach owners directly.
- **Critical data [INTERNAL]:** firm name, AUM, AUM CAGR, ADV filing data, advisor count, owner name + contact.
- **Best-fit signal [INTERNAL]:** active or repeatable RIA buy-side mandates.
- **Live customers:** yes (due diligence / aggregator). Never name them publicly.
- **Constraint [DECISION]:** category-education content only. "Likely to sell" is a *prediction* capability, so don't claim it unless the Product Reality doc lists it as live. Content can teach *what precedes an RIA sale* without claiming AssetLink detects it.

## Tertiary: Asset Manager / Distribution (incl. Wholesalers)

- **Who [INTERNAL]:** wholesalers and distribution pros at ETF/SMA/mutual fund managers, Series 7 + 63/65/66. [HYPOTHESIS: plus distribution leadership and Sales Ops/CRM owners as enterprise buyers.]
- **JTBD:** Identify top-producing advisors by AUM/flows, get **compliant corporate contacts**, prioritize by state/territory, and track firm moves that reset relationships.
- **Critical data [INTERNAL]:** name, CRD, firm affiliation, license, AUM, corporate email/phone.
- **Best-fit signal [INTERNAL]:** manages a territory and needs to prioritize a large advisor universe, not just look up individuals.
- **Live customers:** yes, including an enterprise account. Never name them publicly.
- **Pricing tension [INTERNAL]:** power-user seat pricing is steep for wholesalers. A lower tier is under consideration.
- **Gaps:** check the Product Reality doc's not-live list (internal). Enterprise buyers will ask about Salesforce.
- **Buying committee [HYPOTHESIS]:** Head of Distribution (economic buyer) · Sales Ops/Distribution Analytics (champion) · CRM/Data (technical evaluator) · top wholesalers (influencers) · Procurement/InfoSec/Compliance (blockers).
- **Wholesaler note:** often a user/influencer, not the buyer. Wholesaler content builds bottom-up pull and champion enablement.

---

## Persona doc template

```
# [Persona]  — revenue priority: [primary/secondary/tertiary]
Confidence summary: [High/Med/Low] (based on: …)
Titles / where they sit:
JTBD (their words):
Best-fit signal / buying trigger:
Critical data they need:
Live AssetLink features that serve this (Product Reality ✓):
Gaps they'll hit (not live — do not promise):
Top 3 pains [confidence]:
Current stack being replaced:
Objections & responses:
Proof they need: [PROOF NEEDED]
Buying committee:
Channels they trust:
One-line message (brand voice):
Open questions for Devon/Ari:
```

## Validation questions

- Which persona produced the last 5 closed deals, and who signed?
- For recruiters: how much of the win is personal contact data vs. workflow (AI drafts)?
- Does a lower wholesaler tier change the tertiary persona into a volume play?
- Can aggregator content reference live firm-profile and ADV capabilities?
