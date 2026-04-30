"""CMO Orchestrator — routes requests to specialist sub-agents via tool use."""
from __future__ import annotations

import json

import anthropic
from config import ORCHESTRATOR_MODEL, MAX_TOKENS_ORCHESTRATOR, COMPANY_NAME

from .market_research import MarketResearchAgent
from .abm import ABMAgent
from .content_marketing import ContentMarketingAgent
from .report import ReportAgent


_SYSTEM_PROMPT = f"""You are the Chief Marketing Officer (CMO) of **{COMPANY_NAME}**, a strategic B2B \
technology company. You operate at the intersection of McKinsey-grade strategic rigor and elite \
demand-generation execution. You lead a team of specialist agents — each world-class in their domain \
— and your role is to orchestrate their output into a coherent, revenue-driving marketing strategy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR LEADERSHIP MANDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Revenue first**: Every marketing activity must connect to pipeline, win rate, or deal size
- **Integrated strategy**: No channel or program operates in isolation; everything ladders to a unified GTM
- **Evidence-based decisions**: Strategy grounded in ICP data, competitive intelligence, and market signals
- **Execution excellence**: Strategy without execution is worthless — your team ships, not just plans
- **Measurement accountability**: Every program has a success metric, owner, and review cadence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR SPECIALIST TEAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Market Research Agent** — The intelligence layer. Conducts ICP research, competitive analysis, \
and pricing intelligence using rigorous 4-dimensional frameworks and Porter's Five Forces. \
Produces executive-ready market intelligence that drives positioning and targeting decisions.

**ABM Agent** — The account-targeting engine. Builds target account lists using multi-signal scoring, \
maps buying committees with MEDDIC/MEDDPICC, designs multi-phase campaign sequences, audits program \
effectiveness, and creates predictive lead scoring models. Drives enterprise pipeline.

**Content Marketing Agent** — The demand generation engine. Creates B2B content across LinkedIn, \
Instagram, blog, and email that earns attention, builds credibility, and converts prospects. \
Understands platform algorithms, SEO, and the psychology of B2B buying decisions.

**Report Agent** — The intelligence feedback loop. Generates ABM performance reports and content \
marketing analytics that surface what's working, what's not, and where to invest next.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORCHESTRATION PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Understand intent first**: Before calling any specialist, confirm you understand the business goal
2. **Choose the right specialist**: Match the task precisely to the agent best equipped to deliver it
3. **Sequence when needed**: Some tasks require outputs from one agent to inform another (e.g., ICP → ABM list)
4. **Synthesize, don't just relay**: When presenting specialist outputs, add your strategic POV as CMO
5. **Always recommend next steps**: Every deliverable should be followed by 2–3 recommended follow-on actions

When a user request is clear, immediately delegate to the appropriate specialist using a tool call. \
Do not ask unnecessary clarifying questions — make reasonable assumptions and state them. \
If multiple specialists are needed, sequence them logically and explain the plan upfront.
"""

# ---------------------------------------------------------------------------
# Tool definitions — one per sub-agent capability
# ---------------------------------------------------------------------------

_TOOLS: list[dict] = [
    # ── Market Research ──────────────────────────────────────────────────
    {
        "name": "research_icp",
        "description": (
            "Research and develop a comprehensive Ideal Customer Profile (ICP) document for "
            "a B2B company. Produces Tier 1/2/3 ICP definitions, negative ICP, TAM/SAM/SOM "
            "sizing, buying triggers, and recommended next steps."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company to build ICP for"},
                "industry_context": {"type": "string", "description": "Industry and market context"},
                "pain_points": {"type": "string", "description": "Core pain points the solution addresses"},
                "current_customers": {"type": "string", "description": "Examples of current customers (optional)"},
                "research_depth": {
                    "type": "string",
                    "description": "Depth of research: 'quick', 'standard', or 'comprehensive'",
                    "default": "comprehensive",
                },
            },
            "required": ["company_name", "industry_context", "pain_points"],
        },
    },
    {
        "name": "analyze_competitors",
        "description": (
            "Conduct a deep competitive analysis covering positioning, product features, "
            "go-to-market motions, Porter's Five Forces, win/loss patterns, and strategic "
            "recommendations for how to position against each competitor."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company conducting the analysis"},
                "competitors": {"type": "string", "description": "Comma-separated list of competitors to analyze"},
                "competitive_aspects": {
                    "type": "string",
                    "description": "Aspects to cover (default: positioning, product, go-to-market, win-loss)",
                    "default": "positioning, product, go-to-market, win-loss",
                },
            },
            "required": ["company_name", "competitors"],
        },
    },
    {
        "name": "research_competitor_pricing",
        "description": (
            "Conduct pricing intelligence research for a product category. Covers pricing "
            "model comparisons, packaging analysis, TCO, where the company is over/under-priced, "
            "and recommended pricing strategy."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "competitors": {"type": "string", "description": "Competitors to include in pricing analysis"},
                "product_category": {"type": "string", "description": "The product category or market being analyzed"},
            },
            "required": ["company_name", "competitors", "product_category"],
        },
    },
    # ── ABM ──────────────────────────────────────────────────────────────
    {
        "name": "build_target_account_list",
        "description": (
            "Build a Target Account List (TAL) framework and scoring model. Produces tier "
            "definitions (Tier 1/2/3), account scoring rubric, data source recommendations, "
            "selection criteria checklist, and a 30-day build plan."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "icp_description": {"type": "string", "description": "Description of the Ideal Customer Profile"},
                "total_accounts": {
                    "type": "integer",
                    "description": "Total number of target accounts to build toward",
                    "default": 300,
                },
                "criteria": {"type": "string", "description": "Additional selection criteria beyond the ICP"},
            },
            "required": ["company_name", "icp_description"],
        },
    },
    {
        "name": "map_buying_committee",
        "description": (
            "Create a comprehensive Buying Committee Map for a solution category. Covers all "
            "6–8 roles (Economic Buyer, Champion, Technical Evaluator, etc.) with per-role "
            "profiles, influence maps, champion cultivation guide, and sample outreach sequences."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the selling company"},
                "target_account_type": {"type": "string", "description": "Description of the target account type"},
                "solution_category": {"type": "string", "description": "The solution category being sold"},
            },
            "required": ["company_name", "target_account_type", "solution_category"],
        },
    },
    {
        "name": "design_campaign_sequence",
        "description": (
            "Design a multi-touch, omnichannel ABM campaign sequence. Produces week-by-week "
            "blueprint, content asset list, A/B test plan, branching logic, SDR handoff SLA, "
            "and campaign success scorecard."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "campaign_goal": {"type": "string", "description": "Primary goal of the campaign"},
                "target_segment": {"type": "string", "description": "Target account segment description"},
                "duration_weeks": {
                    "type": "integer",
                    "description": "Campaign duration in weeks",
                    "default": 12,
                },
                "channels": {
                    "type": "string",
                    "description": "Available channels (default: LinkedIn, email, display, direct mail, SDR outreach)",
                    "default": "LinkedIn, email, display, direct mail, SDR outreach",
                },
            },
            "required": ["company_name", "campaign_goal", "target_segment"],
        },
    },
    {
        "name": "audit_abm_program",
        "description": (
            "Conduct a comprehensive ABM Program Audit across 6 pillars: Strategy & ICP Alignment, "
            "Data Quality, Content & Personalization, Channel Orchestration, Sales & Marketing "
            "Alignment, and Measurement & Attribution. Produces maturity scores, critical gaps, "
            "and a 90-day improvement roadmap."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "current_program_description": {
                    "type": "string",
                    "description": "Description of the current ABM program",
                },
                "goals": {"type": "string", "description": "ABM program goals"},
                "current_metrics": {
                    "type": "string",
                    "description": "Current performance metrics if available",
                },
            },
            "required": ["company_name", "current_program_description", "goals"],
        },
    },
    {
        "name": "create_lead_scoring_model",
        "description": (
            "Design a comprehensive Lead & Account Scoring Model with behavioral score dimension "
            "(0–100), firmographic score dimension (0–100), positive and negative signal tables, "
            "score decay rules, tier definitions with SLAs, and a 90-day calibration plan."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "icp_description": {"type": "string", "description": "Ideal Customer Profile description"},
                "behavioral_signals": {
                    "type": "string",
                    "description": "Key behavioral signals to score (optional)",
                },
                "firmographic_criteria": {
                    "type": "string",
                    "description": "Key firmographic criteria to score (optional)",
                },
            },
            "required": ["company_name", "icp_description"],
        },
    },
    # ── Content Marketing ─────────────────────────────────────────────────
    {
        "name": "create_linkedin_content",
        "description": (
            "Create a batch of ready-to-publish LinkedIn posts. Produces a content strategy note, "
            "full post copy (hook posts, carousels, data drops, etc.) with character counts, "
            "hashtags, posting times, A/B hook variants, and engagement prompts."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "topic": {"type": "string", "description": "Topic or theme for the content batch"},
                "audience": {"type": "string", "description": "Target audience description"},
                "content_types": {
                    "type": "string",
                    "description": "Content types to create (default: text post, carousel)",
                    "default": "text post, carousel",
                },
                "post_count": {
                    "type": "integer",
                    "description": "Number of posts to create",
                    "default": 5,
                },
                "brand_voice": {
                    "type": "string",
                    "description": "Brand voice style",
                    "default": "expert, direct, insight-driven",
                },
            },
            "required": ["company_name", "topic", "audience"],
        },
    },
    {
        "name": "create_instagram_content",
        "description": (
            "Create a batch of ready-to-publish Instagram posts. Produces carousels with slide-by-slide "
            "copy, Reel concepts with scripts, single image captions, hashtag sets, story sequences, "
            "visual direction briefs, and paid boost recommendations."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "topic": {"type": "string", "description": "Topic or theme for the content batch"},
                "audience": {"type": "string", "description": "Target audience description"},
                "content_types": {
                    "type": "string",
                    "description": "Content types to create (default: carousel, reel concept, single image)",
                    "default": "carousel, reel concept, single image",
                },
                "post_count": {
                    "type": "integer",
                    "description": "Number of posts to create",
                    "default": 4,
                },
                "brand_voice": {
                    "type": "string",
                    "description": "Brand voice style",
                    "default": "inspiring, human, expert",
                },
            },
            "required": ["company_name", "topic", "audience"],
        },
    },
    {
        "name": "write_blog_article",
        "description": (
            "Write a complete, publish-ready blog article with SEO optimization. Includes SEO "
            "research note, full article with H1/H2/H3 structure, internal and external link "
            "placeholders, CTA section, meta title/description, headline A/B variants, and "
            "social media adaptation."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "topic": {"type": "string", "description": "Article topic"},
                "target_audience": {"type": "string", "description": "Target reader audience"},
                "primary_keyword": {
                    "type": "string",
                    "description": "Primary SEO keyword to target (optional — will be derived if not provided)",
                },
                "word_count": {
                    "type": "integer",
                    "description": "Target word count",
                    "default": 1500,
                },
                "article_type": {
                    "type": "string",
                    "description": "Article type (e.g., educational guide, comparison, how-to, pillar)",
                    "default": "educational guide",
                },
            },
            "required": ["company_name", "topic", "target_audience"],
        },
    },
    {
        "name": "create_email_campaign",
        "description": (
            "Create a complete multi-email campaign sequence. Produces campaign strategy brief, "
            "full email copy for each email in the sequence (subject lines, preview text, body, "
            "CTAs), A/B test plan, exit/re-entry logic, and performance benchmarks."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "campaign_goal": {"type": "string", "description": "Primary goal of the email campaign"},
                "target_audience": {"type": "string", "description": "Target audience description"},
                "sequence_length": {
                    "type": "integer",
                    "description": "Number of emails in the sequence",
                    "default": 4,
                },
                "campaign_type": {
                    "type": "string",
                    "description": "Campaign type: nurture, re-engagement, product launch, event",
                    "default": "nurture",
                },
                "tone": {
                    "type": "string",
                    "description": "Tone and voice for the emails",
                    "default": "expert, conversational, value-first",
                },
            },
            "required": ["company_name", "campaign_goal", "target_audience"],
        },
    },
    # ── Reports ───────────────────────────────────────────────────────────
    {
        "name": "generate_abm_report",
        "description": (
            "Generate a comprehensive ABM Performance Report. Covers account engagement dashboard, "
            "pipeline impact analysis, channel ROI, funnel conversion rates, ABM program ROI, "
            "at-risk account interventions, and a 30-day forward action plan."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "reporting_period": {
                    "type": "string",
                    "description": "The reporting period (e.g., 'Q1 2025', 'January 2025')",
                },
                "account_data": {
                    "type": "string",
                    "description": "Account engagement data, metrics, or description of program status",
                },
                "pipeline_data": {
                    "type": "string",
                    "description": "Pipeline and revenue data (optional)",
                },
                "channel_data": {
                    "type": "string",
                    "description": "Channel performance data (optional)",
                },
                "goals": {
                    "type": "string",
                    "description": "Program goals and targets (optional)",
                },
            },
            "required": ["company_name", "reporting_period", "account_data"],
        },
    },
    {
        "name": "generate_content_report",
        "description": (
            "Generate a comprehensive Content Marketing Performance Report. Covers channel "
            "scorecards, top/bottom content analysis, SEO performance, email campaign results, "
            "lead generation dashboard, revenue attribution, content gap analysis, and "
            "next-period content plan."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "description": "Name of the company"},
                "reporting_period": {
                    "type": "string",
                    "description": "The reporting period (e.g., 'Q1 2025', 'March 2025')",
                },
                "channel_metrics": {
                    "type": "string",
                    "description": "Channel performance metrics across LinkedIn, Instagram, Blog",
                },
                "seo_data": {
                    "type": "string",
                    "description": "SEO and organic search data (optional)",
                },
                "email_data": {
                    "type": "string",
                    "description": "Email campaign performance data (optional)",
                },
                "lead_gen_data": {
                    "type": "string",
                    "description": "Lead generation and attribution data (optional)",
                },
                "goals": {
                    "type": "string",
                    "description": "Content program goals and targets (optional)",
                },
            },
            "required": ["company_name", "reporting_period", "channel_metrics"],
        },
    },
]

# ---------------------------------------------------------------------------
# Tool name → agent method mapping
# ---------------------------------------------------------------------------

def _dispatch(
    tool_name: str,
    tool_input: dict,
    market_research: MarketResearchAgent,
    abm: ABMAgent,
    content: ContentMarketingAgent,
    report: ReportAgent,
) -> str:
    """Route a tool call to the correct specialist agent method."""
    dispatch_map = {
        # Market Research
        "research_icp": lambda i: market_research.research_icp(**i),
        "analyze_competitors": lambda i: market_research.analyze_competitors(**i),
        "research_competitor_pricing": lambda i: market_research.research_competitor_pricing(**i),
        # ABM
        "build_target_account_list": lambda i: abm.build_target_account_list(**i),
        "map_buying_committee": lambda i: abm.map_buying_committee(**i),
        "design_campaign_sequence": lambda i: abm.design_campaign_sequence(**i),
        "audit_abm_program": lambda i: abm.audit_abm_program(**i),
        "create_lead_scoring_model": lambda i: abm.create_lead_scoring_model(**i),
        # Content Marketing
        "create_linkedin_content": lambda i: content.create_linkedin_content(**i),
        "create_instagram_content": lambda i: content.create_instagram_content(**i),
        "write_blog_article": lambda i: content.write_blog_article(**i),
        "create_email_campaign": lambda i: content.create_email_campaign(**i),
        # Reports
        "generate_abm_report": lambda i: report.generate_abm_report(**i),
        "generate_content_report": lambda i: report.generate_content_report(**i),
    }
    handler = dispatch_map.get(tool_name)
    if handler is None:
        return f"[ERROR] Unknown tool: {tool_name}"
    return handler(tool_input)


# ---------------------------------------------------------------------------
# CMOOrchestrator
# ---------------------------------------------------------------------------

class CMOOrchestrator:
    """
    CMO-level orchestrator that routes marketing tasks to specialist sub-agents
    via Claude tool use and a manual agentic loop.
    """

    def __init__(self, client: anthropic.Anthropic) -> None:
        self.client = client
        self.model = ORCHESTRATOR_MODEL
        # Instantiate all specialist agents
        self.market_research = MarketResearchAgent(client)
        self.abm = ABMAgent(client)
        self.content = ContentMarketingAgent(client)
        self.report = ReportAgent(client)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(
        self,
        user_request: str,
        on_tool_call: "callable[[str, dict], None] | None" = None,
        on_text: "callable[[str], None] | None" = None,
    ) -> str:
        """
        Run the CMO orchestration loop for a user request.

        Args:
            user_request: The marketing task or question from the user.
            on_tool_call: Optional callback invoked when the orchestrator calls a tool.
                          Receives (tool_name, tool_input).
            on_text: Optional callback invoked for each text token from the orchestrator.
                     Receives (token_str,).

        Returns:
            Final text response from the orchestrator as a string.
        """
        messages: list[dict] = [{"role": "user", "content": user_request}]
        final_text_chunks: list[str] = []

        while True:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=MAX_TOKENS_ORCHESTRATOR,
                system=_SYSTEM_PROMPT,
                tools=_TOOLS,
                messages=messages,
            )

            # Collect any text blocks from this turn
            turn_text = ""
            for block in response.content:
                if block.type == "text":
                    turn_text += block.text
                    if on_text:
                        on_text(block.text)

            if turn_text:
                final_text_chunks.append(turn_text)

            # Check stop reason
            if response.stop_reason == "end_turn":
                break

            if response.stop_reason != "tool_use":
                # Unexpected stop reason — surface as text and exit
                final_text_chunks.append(f"\n[Stop reason: {response.stop_reason}]")
                break

            # Process tool calls
            tool_results: list[dict] = []
            for block in response.content:
                if block.type != "tool_use":
                    continue

                tool_name = block.name
                tool_input = block.input

                if on_tool_call:
                    on_tool_call(tool_name, tool_input)

                result_text = _dispatch(
                    tool_name,
                    tool_input,
                    self.market_research,
                    self.abm,
                    self.content,
                    self.report,
                )

                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result_text,
                    }
                )

            # Append assistant turn + tool results and continue the loop
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        return "".join(final_text_chunks)
