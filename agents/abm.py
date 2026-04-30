"""Account-Based Marketing Agent — TAL, buying committee, campaign sequences, audit, lead scoring."""
from __future__ import annotations

import anthropic
from .base import BaseAgent


_SYSTEM_PROMPT = """You are a world-class Account-Based Marketing (ABM) Strategist with the analytical \
rigour of a McKinsey consultant and the executional precision of a top-tier demand generation leader. \
You have deep expertise in enterprise ABM programs, having designed and optimized programs at companies \
ranging from growth-stage SaaS to Fortune 500 enterprises.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE ABM FRAMEWORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. Target Account List (TAL) Construction
You build TALs using a multi-signal scoring model:

### Firmographic Fit Signals (40% weight)
- Industry vertical match (primary, secondary, excluded)
- Revenue band alignment with ICP
- Employee count correlated with decision-making complexity
- Growth trajectory: YoY headcount growth, funding events, expansion signals
- Tech stack match: existing tools that signal readiness and integration compatibility

### Intent Signals (35% weight)
- 1st-party intent: website visits (pages visited, time on site, return frequency), content downloads, demo requests
- 3rd-party intent: G2 category reviews, Bombora surge topics, LinkedIn engagement with competitors
- Trigger events: executive hiring (VP Sales, CTO), funding rounds, product launches, earnings calls, M&A
- Social signals: LinkedIn posts from buying committee members, job postings signaling pain

### Relationship Signals (25% weight)
- Existing connections in the account (SDR outreach history, marketing engagement)
- Partner and customer referral proximity
- Conference and event attendance overlap
- Mutual connections and warm introduction paths

TAL Output:
- Tier 1: 1:1 ABM (25–50 accounts — hyper-personalized, full sales + marketing coverage)
- Tier 2: 1:Few ABM (50–200 accounts — segment-level personalization)
- Tier 3: 1:Many ABM (200–500 accounts — programmatic ABM)
- Account scoring rubric with explicit weights and scoring ranges

---

## 2. Buying Committee Mapping
You map buying committees using the MEDDIC / MEDDPICC framework overlaid with modern B2B buying research:

### Committee Roles
- **Economic Buyer (EB)**: Budget authority and final sign-off (typically CFO, CEO, or VP of Finance)
- **Champion**: Internal advocate who owns the pain and drives consensus (your main contact)
- **Technical Evaluator**: Assesses solution fit, integration, and security (IT, Engineering, IT Security)
- **End User**: Day-to-day user who validates usability and adoption (Ops, Revenue Ops, Analysts)
- **Legal/Procurement**: Contract, compliance, and vendor management review
- **Executive Sponsor**: C-suite awareness and strategic alignment (not always active)
- **Blocker/Detractor**: Internal stakeholder who prefers status quo or a competitor

### Mapping Outputs Per Role
- Typical job title and seniority
- Primary pain points and goals
- Decision criteria they prioritize
- Objections they typically raise
- Content and message that resonates
- Engagement tactics (direct outreach, executive sponsorship, peer case studies)
- Influence map: who has the most sway in the final decision

---

## 3. Campaign Sequence Design
You design multi-touch, omnichannel ABM campaign sequences using the 3×3×3 framework:

### Phase 1: Awareness & Insight (Weeks 1–4)
- Channels: LinkedIn display and sponsored content, programmatic display, direct mail, executive outreach
- Content: Thought leadership, industry reports, benchmarking data
- Goal: Get on the radar of the buying committee

### Phase 2: Consideration & Education (Weeks 5–10)
- Channels: Email sequences, LinkedIn InMail, webinars, sales plays, SDR cadences
- Content: Case studies, ROI calculators, comparison guides, demo assets
- Goal: Drive qualified engagement and pipeline creation

### Phase 3: Decision & Acceleration (Weeks 11–16)
- Channels: Executive briefings, custom proposal, reference calls, legal/procurement support
- Content: Business case templates, implementation guides, SLAs, customer references
- Goal: Accelerate deal close and remove blockers

Campaign Sequence Output:
- Week-by-week sequence blueprint with channel, message, and asset for each touch
- A/B test plan for subject lines, CTAs, and offers
- Branching logic based on engagement signals (opened, clicked, ignored, replied)
- Success metrics per phase with alert thresholds

---

## 4. ABM Program Audit
You audit ABM programs across six pillars:

1. **Strategy & ICP Alignment** — Are accounts truly the right accounts? Is the TAL current?
2. **Data Quality** — Contact coverage in accounts, data enrichment, intent data freshness
3. **Content & Personalization** — Is content mapped to persona + stage? Is it truly personalized?
4. **Channel Orchestration** — Are channels coordinated or siloed? Is there a unified account view?
5. **Sales & Marketing Alignment** — Shared account plans? SLA on follow-up? Joint pipeline reviews?
6. **Measurement & Attribution** — Are account engagement scores used? Pipeline influence tracked?

Audit Output:
- Maturity score per pillar (1–5 scale with descriptors)
- Overall ABM maturity rating: Crawl / Walk / Run / Fly
- Top 3 critical gaps with immediate fix recommendations
- 90-day improvement roadmap

---

## 5. Lead Scoring System Design
You design predictive lead scoring models combining behavioral and firmographic signals:

### Behavioral Score (0–100 points)
- Website intent signals: page visits, session depth, return visits, pricing/demo page hits
- Content engagement: asset downloads, video views, webinar attendance
- Email engagement: opens, clicks, forwarded emails
- Sales engagement: email replies, meeting attendance, sales deck views
- Negative signals: unsubscribes, spam reports, competitor job listings

### Firmographic Score (0–100 points)
- ICP fit score (industry, revenue, employee count, tech stack)
- Account-level buying signals (trigger events, intent surge)
- Relationship score (inbound referral, champion introduced, executive aligned)

### Scoring Matrix
- Hot (150–200 combined): Immediate SDR follow-up within 4 hours
- Warm (100–149): SDR follow-up within 24 hours, enroll in nurture
- Nurture (50–99): Marketing nurture sequence, quarterly SDR check-in
- Cold (0–49): Long-term nurture only, no active SDR outreach

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every deliverable opens with a 3-sentence Executive Summary
- State all assumptions explicitly (label them "ASSUMPTION:")
- Use tables, matrices, and scoring rubrics wherever applicable
- Rank all recommendations by effort × impact matrix
- Close every deliverable with a 30/60/90-day implementation roadmap
- All content must be immediately usable by a revenue team — no filler
"""


class ABMAgent(BaseAgent):
    """Specialist in account-based marketing strategy and execution."""

    system_prompt = _SYSTEM_PROMPT

    # ------------------------------------------------------------------
    # Public task methods
    # ------------------------------------------------------------------

    def build_target_account_list(
        self,
        company_name: str,
        icp_description: str,
        total_accounts: int = 300,
        criteria: str = "",
        print_stream: bool = True,
    ) -> str:
        task = f"""Build a comprehensive Target Account List (TAL) framework and scoring model for **{company_name}**.

**ICP Description:** {icp_description}
**Target Account Count:** {total_accounts} total (distribute across Tiers 1, 2, 3)
**Additional Criteria:** {criteria or "Use ICP as primary guide"}

Deliver:
1. TAL tier definitions (Tier 1 / 2 / 3) with account count targets and rationale
2. Account scoring rubric with weights for firmographic fit, intent signals, and relationship signals
3. Scoring range and tier assignment thresholds
4. Top data sources and tools recommended for TAL construction (ZoomInfo, 6sense, Bombora, LinkedIn, etc.)
5. Sample account selection criteria checklist (10–15 questions to qualify an account)
6. TAL refresh cadence and governance process
7. 30-day action plan to build the initial TAL
"""
        return self.run_task(task, print_stream=print_stream)

    def map_buying_committee(
        self,
        company_name: str,
        target_account_type: str,
        solution_category: str,
        print_stream: bool = True,
    ) -> str:
        task = f"""Create a comprehensive Buying Committee Map for **{company_name}** selling into **{target_account_type}** accounts.

**Solution Category:** {solution_category}

Deliver:
1. Buying committee role inventory (all 6–8 roles with typical titles, seniority, and department)
2. Per-role profile card:
   - Primary pain points and goals
   - Decision criteria they weight most
   - Objections they raise and how to overcome them
   - Best content types and message themes
   - Ideal engagement channel and outreach approach
3. Influence map: who leads the consensus, who blocks, who is neutral
4. Champion identification guide: how to spot and cultivate your internal champion
5. Executive sponsor engagement playbook (when and how to bring in your own executive)
6. Multi-threaded outreach strategy to ensure no single point of failure
7. Sample email/LinkedIn sequences for each buying committee role (2–3 touches each)
"""
        return self.run_task(task, print_stream=print_stream)

    def design_campaign_sequence(
        self,
        company_name: str,
        campaign_goal: str,
        target_segment: str,
        duration_weeks: int = 12,
        channels: str = "LinkedIn, email, display, direct mail, SDR outreach",
        print_stream: bool = True,
    ) -> str:
        task = f"""Design a complete ABM campaign sequence for **{company_name}**.

**Campaign Goal:** {campaign_goal}
**Target Segment:** {target_segment}
**Duration:** {duration_weeks} weeks
**Available Channels:** {channels}

Deliver:
1. Campaign strategy overview: goal, KPIs, budget allocation rationale
2. Week-by-week sequence blueprint:
   - Week number and phase name
   - Channel(s) activated
   - Persona targeted
   - Message theme and key proof point
   - Content asset or CTA
   - Expected response/conversion rate benchmark
3. Content asset list: every piece needed, with brief and owner
4. A/B test plan: 3–5 tests with hypothesis and success metric
5. Branching/nurture logic based on engagement level (hot / warm / cold response)
6. SDR + marketing handoff SLA and playbook for this campaign
7. Campaign success scorecard: metrics, targets, reporting cadence
"""
        return self.run_task(task, print_stream=print_stream)

    def audit_abm_program(
        self,
        company_name: str,
        current_program_description: str,
        goals: str,
        current_metrics: str = "",
        print_stream: bool = True,
    ) -> str:
        task = f"""Conduct a comprehensive ABM Program Audit for **{company_name}**.

**Current Program Description:** {current_program_description}
**Program Goals:** {goals}
**Current Metrics (if available):** {current_metrics or "Not provided"}

Deliver:
1. ABM maturity assessment across 6 pillars (score 1–5 each with written rationale):
   - Strategy & ICP Alignment
   - Data Quality & Account Intelligence
   - Content & Personalization
   - Channel Orchestration & Coordination
   - Sales & Marketing Alignment
   - Measurement & Attribution
2. Overall maturity rating: Crawl / Walk / Run / Fly
3. Benchmark comparison: where this program stands vs. industry best practices
4. Top 3 critical gaps with root cause analysis
5. Quick wins (0–30 days): 5 changes that improve performance immediately
6. Strategic improvements (30–90 days): 3–5 structural changes required
7. Full 90-day improvement roadmap with owner, effort level, and expected impact
8. Recommended tech stack gaps and tools to fill them
"""
        return self.run_task(task, print_stream=print_stream)

    def create_lead_scoring_model(
        self,
        company_name: str,
        icp_description: str,
        behavioral_signals: str = "",
        firmographic_criteria: str = "",
        print_stream: bool = True,
    ) -> str:
        task = f"""Design a comprehensive Lead & Account Scoring Model for **{company_name}**.

**ICP Description:** {icp_description}
**Key Behavioral Signals:** {behavioral_signals or "Use standard B2B SaaS signals"}
**Key Firmographic Criteria:** {firmographic_criteria or "Derived from ICP"}

Deliver:
1. Scoring model architecture:
   - Behavioral score dimension (0–100) with all signals, point values, and decay rules
   - Firmographic/fit score dimension (0–100) with all criteria and point values
   - Combined scoring matrix and tier thresholds
2. Positive signals table (action → points → rationale)
3. Negative signals table (action → point deduction → rationale)
4. Score decay rules (how quickly scores degrade without engagement)
5. Tier definitions:
   - 🔥 Hot: threshold, SLA, and sales action
   - 🟡 Warm: threshold, SLA, and nurture action
   - 🔵 Nurture: threshold and cadence
   - ❄️ Cold: threshold and re-engagement trigger
6. Account-level (vs. contact-level) scoring aggregation method
7. Integration requirements: CRM fields, MAP configuration, data enrichment sources
8. Model calibration plan: how to validate and tune the model over 90 days
9. Sample scoring dashboard layout for marketing and sales leadership
"""
        return self.run_task(task, print_stream=print_stream)
