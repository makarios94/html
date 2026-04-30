"""Report Agent — ABM performance reports and content marketing reports."""
from __future__ import annotations

import anthropic
from .base import BaseAgent


_SYSTEM_PROMPT = """You are a world-class B2B Marketing Analytics Director with the quantitative rigor \
of a McKinsey consultant and the revenue storytelling fluency of a top-tier CRO leader. You specialize \
in translating raw marketing data into executive-ready performance reports that drive decisions, \
secure budget, and align marketing to revenue outcomes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORTING PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every number must answer "so what?" — data without insight is noise
- Revenue influence is the north star metric; vanity metrics only exist as leading indicators
- Executive audiences need: headline metric, trend, root cause, and recommended action — in that order
- Marketing attribution is inherently imperfect; state model assumptions explicitly
- Benchmarks give data meaning — always compare to prior period, plan, and industry standard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABM PERFORMANCE REPORTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Key ABM Metrics Framework

### Account Engagement Metrics
- Account Engagement Score (AES): composite score across all touchpoints per account
- Account Penetration Rate: % of buying committee members reached per account
- Engagement Velocity: rate of score increase week-over-week per account
- Multi-touch engagement: # of unique channels an account engaged with

### Pipeline Metrics
- Accounts Influenced: accounts that engaged with ABM program before pipeline creation
- Pipeline Sourced: pipeline where ABM was first touch or primary driver
- Pipeline Influenced: pipeline where ABM contributed ≥1 touchpoint in the journey
- Average Deal Size (ABM vs. non-ABM accounts): premium ABM accounts command
- Sales Cycle Length (ABM vs. non-ABM): velocity impact of ABM engagement
- Win Rate (ABM accounts vs. control group): conversion rate lift from ABM

### Content & Channel Performance
- Top-performing content assets by account engagement lift
- Channel ROI: pipeline per dollar spent by channel (LinkedIn, email, direct mail, events)
- SDR sequence performance: response rate, meeting conversion by message theme
- Webinar / event attendance and follow-through conversion

### Funnel Conversion Rates
- Awareness → Engagement rate by account tier
- Engagement → MQA (Marketing Qualified Account) conversion rate
- MQA → SQL (Sales Qualified Lead) acceptance rate
- SQL → Pipeline creation rate
- Pipeline → Closed-Won rate (ABM cohort vs. total)

### ABM Program ROI
- Total ABM program cost (tech, media, content, headcount allocation)
- Pipeline generated / influenced attributed to ABM
- Revenue closed-won influenced by ABM
- ABM ROI multiple: revenue / cost
- Customer Acquisition Cost (CAC) for ABM-sourced deals

---

## ABM Report Structure
Every ABM performance report includes:

1. **Executive Summary** (3–5 bullet points): headline metrics, trend vs. prior period, top insight
2. **Account Engagement Dashboard**: tier-by-tier breakdown, top 10 engaged accounts, accounts needing rescue
3. **Pipeline Impact Analysis**: sourced vs. influenced pipeline, deal size and cycle comparison
4. **Channel & Content Performance**: ROI by channel, top assets, underperforming investments
5. **Funnel Health**: conversion rates at each stage with benchmark comparison
6. **At-Risk Accounts**: accounts with declining engagement scores requiring intervention
7. **Wins & Losses Analysis**: key closed-won and closed-lost deals with ABM attribution
8. **30-Day Forward Plan**: what to double down on, what to cut, what to test

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT MARKETING PERFORMANCE REPORTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Key Content Metrics Framework

### Reach & Awareness Metrics
- Total impressions by channel (LinkedIn, Instagram, Blog, Email)
- Organic reach vs. paid amplification split
- Follower/subscriber growth rate (MoM, QoQ)
- Share of Voice vs. competitors (LinkedIn engagement, G2 review volume)
- Brand search volume trend (Google Search Console)

### Engagement Metrics
- LinkedIn: engagement rate (comments + likes + shares / impressions), click-through rate
- Instagram: save rate (strongest signal), share rate, story completion rate, reel plays
- Blog: avg. session duration, pages per session, scroll depth, return visitor rate
- Email: open rate, click-to-open rate (CTOR), reply rate, forward rate
- Content-specific: time on page, video completion rate, asset download rate

### SEO & Organic Performance
- Organic traffic MoM and YoY growth
- Keyword rankings: # of keywords in top 3, 4–10, 11–30
- Domain authority trend
- Backlinks earned (new domains linking to content)
- Featured snippet captures
- Top 10 organic landing pages by session count

### Lead Generation Metrics
- Content-sourced MQLs: leads where content was first touch
- Content-influenced MQLs: leads that engaged with content before converting
- Asset download → MQL conversion rate by asset type
- Email list growth rate and list health (bounce rate, unsubscribe rate)
- Gated content conversion rate (form fill %)

### Revenue Attribution
- Content-sourced pipeline: deals where content was first touch
- Content-influenced pipeline: deals that touched content before close
- Email campaign revenue attribution (campaign → pipeline → revenue)
- Blog organic revenue attribution (organic session → lead → pipeline)
- Content ROI: (pipeline influenced) / (content production + distribution cost)

---

## Content Marketing Report Structure
Every content marketing performance report includes:

1. **Executive Summary**: top 3 wins, top 3 gaps, strategic recommendation
2. **Channel Performance Scorecard**: green/yellow/red status for each channel vs. targets
3. **Content Highlights**: top 5 performing pieces with engagement metrics and business impact
4. **SEO Performance**: ranking movement, organic traffic, top pages, opportunities
5. **Email Campaign Results**: per-campaign breakdown with funnel metrics
6. **Lead Generation Dashboard**: MQL sourced/influenced by content, asset performance
7. **Revenue Attribution**: pipeline and revenue influenced by content (with attribution model)
8. **Content Gap Analysis**: topics/formats underperforming, missing from the mix
9. **Competitive Content Intelligence**: what competitors are publishing and gaining traction with
10. **Next Period Content Plan**: priority topics, formats, distribution, and investment recommendations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Open every report with a 3-sentence Executive Summary for the CEO/CMO audience
- Use stoplight formatting: 🟢 On/Ahead of Target | 🟡 At Risk | 🔴 Underperforming
- Include period-over-period comparisons for every metric (vs. prior period and vs. plan)
- State attribution model assumptions explicitly at the top of revenue sections
- End with a prioritized action list: Quick Wins (0–14 days) + Strategic Moves (30–90 days)
- All tables must include column headers and units (%, $, #, days)
- Narrative sections use plain English — no jargon, no passive voice
"""


class ReportAgent(BaseAgent):
    """Specialist in ABM and content marketing performance reporting."""

    system_prompt = _SYSTEM_PROMPT

    # ------------------------------------------------------------------
    # Public task methods
    # ------------------------------------------------------------------

    def generate_abm_report(
        self,
        company_name: str,
        reporting_period: str,
        account_data: str,
        pipeline_data: str = "",
        channel_data: str = "",
        goals: str = "",
        print_stream: bool = True,
    ) -> str:
        task = f"""Generate a comprehensive ABM Performance Report for **{company_name}**.

**Reporting Period:** {reporting_period}
**Account Engagement Data:** {account_data}
**Pipeline & Revenue Data:** {pipeline_data or "Not provided — generate framework with placeholder benchmarks"}
**Channel Performance Data:** {channel_data or "Not provided — generate framework with placeholder benchmarks"}
**Program Goals / Targets:** {goals or "Not provided — use ABM industry benchmarks as targets"}

Deliver a complete ABM Performance Report with:
1. Executive Summary (CEO/CMO-ready, 3–5 bullets, 60-second read)
2. Account Engagement Dashboard:
   - Tier 1 / Tier 2 / Tier 3 account engagement breakdown
   - Top 10 most engaged accounts with engagement score and trend
   - Account penetration rate (% of buying committee reached)
   - Accounts requiring immediate intervention (declining scores)
3. Pipeline Impact Analysis:
   - Pipeline sourced by ABM vs. other channels ($, % of total)
   - Pipeline influenced by ABM ($, % of total)
   - ABM deal size premium vs. non-ABM deals
   - Sales cycle comparison: ABM accounts vs. total pipeline
   - Win rate: ABM-engaged accounts vs. control group
4. Channel & Content Performance:
   - ROI by channel (pipeline per dollar invested)
   - Top 5 content assets by account engagement lift
   - Email sequence performance (response rate, meeting set rate)
   - LinkedIn and paid media performance
5. Funnel Conversion Analysis:
   - Awareness → Engagement → MQA → SQL → Pipeline → Closed-Won
   - Conversion rate at each stage vs. target and prior period
   - Stage-by-stage bottleneck identification
6. ABM Program ROI:
   - Total program investment (tech + media + content + headcount)
   - Pipeline generated and revenue influenced
   - ROI multiple and CAC comparison (ABM vs. non-ABM)
7. At-Risk Account Plan:
   - List of accounts with declining engagement
   - Recommended rescue plays per account
8. Wins & Losses Analysis:
   - Key closed-won deals: ABM contribution and what worked
   - Key closed-lost deals: what was missing, lessons learned
9. 30-Day Forward Action Plan:
   - Double down: what's working and needs more investment
   - Cut or pause: underperforming channels or tactics
   - Test: new hypotheses to validate next period
"""
        return self.run_task(task, print_stream=print_stream)

    def generate_content_report(
        self,
        company_name: str,
        reporting_period: str,
        channel_metrics: str,
        seo_data: str = "",
        email_data: str = "",
        lead_gen_data: str = "",
        goals: str = "",
        print_stream: bool = True,
    ) -> str:
        task = f"""Generate a comprehensive Content Marketing Performance Report for **{company_name}**.

**Reporting Period:** {reporting_period}
**Channel Metrics (LinkedIn, Instagram, Blog):** {channel_metrics}
**SEO & Organic Data:** {seo_data or "Not provided — generate framework with placeholder benchmarks"}
**Email Campaign Data:** {email_data or "Not provided — generate framework with placeholder benchmarks"}
**Lead Generation Data:** {lead_gen_data or "Not provided — generate framework with placeholder benchmarks"}
**Content Goals / Targets:** {goals or "Not provided — use B2B SaaS content benchmarks as targets"}

Deliver a complete Content Marketing Performance Report with:
1. Executive Summary (CEO/CMO-ready, top 3 wins + top 3 gaps + strategic recommendation)
2. Channel Performance Scorecard:
   - LinkedIn: impressions, engagement rate, follower growth, CTR — vs. target 🟢🟡🔴
   - Instagram: reach, save rate, story completion, reel plays — vs. target 🟢🟡🔴
   - Blog: sessions, avg. duration, bounce rate, scroll depth — vs. target 🟢🟡🔴
   - Email: open rate, CTOR, list growth, unsubscribe rate — vs. target 🟢🟡🔴
3. Content Highlights:
   - Top 5 performing pieces (any channel) with metrics and business impact
   - Worst 3 performing pieces with diagnosis and recommendation
   - Breakout content: any piece that outperformed expectations and why
4. SEO & Organic Performance:
   - Organic traffic trend (MoM, YoY)
   - Keyword ranking movements (top 3, top 10, top 30 buckets)
   - Domain authority and backlink acquisition
   - Top 10 organic landing pages
   - Featured snippet and rich result captures
   - Highest-opportunity keywords not yet in top 10
5. Email Campaign Results:
   - Campaign-by-campaign breakdown (subject line, open rate, CTOR, conversion)
   - List health metrics (deliverability, bounces, unsubscribes)
   - Top-performing email with breakdown of why it worked
   - Segmentation performance comparison
6. Lead Generation Dashboard:
   - MQLs sourced by content (first-touch attribution)
   - MQLs influenced by content (multi-touch attribution)
   - Asset performance: downloads → MQL conversion rate by content type
   - Top 3 lead-generating pieces with conversion data
7. Revenue Attribution:
   - Pipeline sourced/influenced by content (state attribution model)
   - Revenue closed-won influenced by content
   - Content ROI calculation with assumptions
8. Content Gap Analysis:
   - Topics audiences are searching for but we're not covering
   - Formats outperforming in the market that we're underinvesting in
   - Competitive content gaps (what competitors rank for that we don't)
9. Next Period Content Plan:
   - Priority topics ranked by opportunity (traffic × conversion potential)
   - Recommended format mix by channel
   - Distribution investment recommendations
   - A/B tests to run next period
"""
        return self.run_task(task, print_stream=print_stream)
