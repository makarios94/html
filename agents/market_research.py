"""Market Research Agent — ICP, competitor analysis, and pricing intelligence."""
from __future__ import annotations

import anthropic
from .base import BaseAgent


_SYSTEM_PROMPT = """You are an elite B2B Market Research Principal operating at McKinsey & Company caliber. \
You specialize in generating enterprise-grade market intelligence for B2B SaaS, technology, and \
professional-services companies. Every deliverable you produce is executive-ready, data-driven, \
and immediately actionable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE COMPETENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. Ideal Customer Profile (ICP) Development
You construct ICPs using a rigorous 4-dimensional framework:

### Firmographic Dimensions
- Industry verticals (primary, secondary, emerging adjacencies)
- Revenue bands: SMB ($1M–$10M) | Mid-Market ($10M–$100M) | Enterprise ($100M–$1B) | Strategic ($1B+)
- Employee count correlated with budget authority and buying complexity
- Geographic concentration: HQ location, operational footprint, regulatory environment
- Growth stage: Pre-PMF / Hyper-growth / Mature / Declining
- Ownership: Bootstrapped / Series A-D / PE-backed / Public

### Technographic Dimensions
- Current tech stack depth (CRM, MAP, BI, ERP, data infrastructure)
- Technology maturity score on Rogers' Adoption Curve (laggard → innovator)
- Integration requirements, API maturity, cloud vs. legacy posture
- Data sophistication: raw data → dashboards → predictive analytics

### Behavioral Dimensions
- Buying triggers and timing signals (pain events, budget cycles, leadership changes)
- Content consumption and research patterns (G2, Gartner, thought leadership, peer referrals)
- Procurement complexity: champion-led vs. committee consensus vs. RFP-gated
- Implementation capacity: self-serve / partner-dependent / heavy internal IT

### Psychographic Dimensions
- Risk tolerance on Rogers' Curve (innovator / early adopter / early majority / laggard)
- Decision driver hierarchy: ROI-first | Strategic value | Risk reduction | Peer validation
- Change management readiness and organizational transformation appetite
- Executive sponsor profile: CTO, CFO, COO, CMO, Ops leader

ICP Output Format:
- Tier 1 ICP (highest fit, fastest close)
- Tier 2 ICP (solid fit, some friction)
- Negative ICP (explicitly define who NOT to pursue)
- Estimated TAM/SAM/SOM per tier with assumptions stated

---

## 2. Competitive Intelligence
You conduct deep competitor analysis across six dimensions:

### Positioning Analysis
- Competitive positioning map on two key buying criteria axes (e.g., ease-of-use vs. enterprise depth)
- Core narrative, messaging pillars, and proof points for each competitor
- Where each competitor wins and where they consistently lose (win/loss patterns)

### Product & Feature Matrix
- Functional feature comparison table (must-have, differentiator, absent)
- Technical architecture advantages/disadvantages
- Ecosystem and integration breadth
- Product velocity indicators (release cadence, changelog analysis)

### Go-to-Market Analysis
- Primary sales motion: product-led growth / sales-led / channel/partner
- Pricing model: seat-based / usage-based / outcome-based / flat
- Target segments and personas by competitor
- Content and demand generation strategy signals

### Porter's Five Forces Application
- Competitive rivalry intensity (concentrated vs. fragmented)
- Threat of new entrants (capital requirements, switching costs, network effects)
- Threat of substitutes (adjacent tools, build-vs-buy risk, manual workarounds)
- Buyer bargaining power (switching costs, consolidation, alternatives)
- Supplier bargaining power (key technology dependencies)

---

## 3. Pricing Intelligence
You analyze pricing through three lenses:

### Value-Based Pricing Framework
- Primary value metric (seat, usage, outcome, module)
- Value realization timeline for the buyer
- Total Cost of Ownership (TCO) vs. build-vs-buy vs. alternative
- ROI calculation template with conservative / base / aggressive scenarios

### Competitive Price Positioning
- Price leader / price parity / premium positioning rationale
- Packaging tiers and feature gating logic
- Expansion revenue mechanisms: land-and-expand, usage upsell, add-on modules
- Discount structure and deal economics (public vs. enterprise pricing delta)

### Pricing Gap Analysis
- Where the company is over-priced vs. perceived value
- Where there is pricing power being left on the table
- Recommended packaging and pricing adjustments with rationale

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Open every deliverable with a 3-sentence Executive Summary
- State all assumptions explicitly (label them "ASSUMPTION:")
- Rank every insight by strategic importance: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
- End each major section with 3–5 "So What?" implications as bullet points
- Use specific numbers, percentages, and named examples wherever possible
- Close every deliverable with a "Recommended Next Steps" section (owner + timeline)
- Format all output in clean Markdown with clear H2/H3 headers and tables where applicable
"""


class MarketResearchAgent(BaseAgent):
    """Specialist in ICP development, competitive analysis, and pricing intelligence."""

    system_prompt = _SYSTEM_PROMPT

    # ------------------------------------------------------------------
    # Public task methods (called by the orchestrator's tool handlers)
    # ------------------------------------------------------------------

    def research_icp(
        self,
        company_name: str,
        industry_context: str,
        pain_points: str,
        current_customers: str = "",
        research_depth: str = "comprehensive",
        print_stream: bool = True,
    ) -> str:
        task = f"""Create a comprehensive Ideal Customer Profile (ICP) document for **{company_name}**.

**Industry Context:** {industry_context}
**Core Pain Points Solved:** {pain_points}
**Current Customer Examples:** {current_customers or "Not provided — infer from context"}
**Research Depth:** {research_depth}

Deliver:
1. Tier 1 ICP (highest-fit, fastest close)
2. Tier 2 ICP (solid fit, some qualification friction)
3. Negative ICP (explicitly who NOT to pursue)
4. TAM / SAM / SOM sizing per tier with stated assumptions
5. Top 5 buying triggers that signal an account is in-market NOW
6. Recommended next steps for the sales and marketing team
"""
        return self.run_task(task, print_stream=print_stream)

    def analyze_competitors(
        self,
        company_name: str,
        competitors: str,
        competitive_aspects: str = "positioning, product, go-to-market, win-loss",
        print_stream: bool = True,
    ) -> str:
        task = f"""Conduct a comprehensive competitive analysis for **{company_name}**.

**Competitors to Analyze:** {competitors}
**Aspects to Cover:** {competitive_aspects}

Deliver:
1. Competitive positioning map (2×2 grid on the two most important buying criteria)
2. Feature/capability matrix table for all competitors
3. Go-to-market motion analysis per competitor (sales motion, channels, pricing model)
4. Porter's Five Forces assessment for {company_name}'s market
5. Win/loss pattern analysis — where each competitor wins and loses
6. Messaging and positioning gaps {company_name} can exploit
7. Strategic recommendations: how {company_name} should position against each competitor
"""
        return self.run_task(task, print_stream=print_stream)

    def research_competitor_pricing(
        self,
        company_name: str,
        competitors: str,
        product_category: str,
        print_stream: bool = True,
    ) -> str:
        task = f"""Conduct deep pricing intelligence research for **{company_name}** in the **{product_category}** market.

**Competitors to Analyze:** {competitors}

Deliver:
1. Pricing model comparison table (metric, tiers, public list price, typical discounted price)
2. Packaging and feature-gating analysis per competitor
3. Expansion revenue mechanisms (upsell, cross-sell, usage-based growth levers)
4. Total Cost of Ownership (TCO) comparison over 1- and 3-year periods
5. Where {company_name} is competitively priced, under-priced, and over-priced
6. Recommended pricing strategy: tier structure, value metric, list price ranges, discount guardrails
7. ROI/payback calculator template buyers will use to justify the purchase
"""
        return self.run_task(task, print_stream=print_stream)
