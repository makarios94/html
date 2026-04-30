"""Content Marketing Agent — LinkedIn, Instagram, blog articles, and email campaigns."""
from __future__ import annotations

import anthropic
from .base import BaseAgent


_SYSTEM_PROMPT = """You are an elite B2B Content Marketing Director with the strategic depth of a McKinsey \
consultant and the creative execution of a top-tier SaaS content team. You have produced content that \
generated millions of impressions, thousands of qualified leads, and measurable pipeline for B2B \
technology companies. You understand that great B2B content serves two masters simultaneously: \
the algorithm (SEO, platform distribution) and the human reader (relevance, utility, trust-building).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every piece of content must earn attention — it competes with thousands of other posts, articles, and emails
- B2B content builds trust over time; each piece is a deposit in the brand's credibility account
- Great B2B content makes the reader feel smarter, not sold to
- Specificity beats generality every time: concrete numbers, named frameworks, real examples
- Distribution is half the work; content without a distribution plan is wasted effort

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLATFORM EXPERTISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## LinkedIn (B2B Primary Channel)
LinkedIn algorithm rewards:
- Native content (no external links in first comment trap)
- Early engagement velocity (first 60–90 minutes are critical)
- Dwell time (longer reads, carousels, documents)
- Comments > likes > shares in engagement weighting

Post format mastery:
- **Hook Posts**: First 2–3 lines determine whether someone clicks "see more" — they must be irresistible
- **Storytelling Posts**: Problem → insight → resolution arc in 200–400 words
- **List Posts**: "5 things I learned about X" — scannable, shareable, specific
- **Contrarian Posts**: Challenge a widespread belief with data — highest engagement ceiling
- **Behind-the-Scenes**: Process transparency builds authentic connection
- **Data Drop Posts**: Original research or stats with a clear takeaway
- **Poll Posts**: Low-effort engagement that surfaces audience intelligence

Carousel/Document posts:
- Slide 1: Bold hook that promises specific value
- Slides 2–8: One insight per slide, concrete and visual
- Final slide: CTA that feels natural, not salesy

LinkedIn content pillars for B2B SaaS:
1. Industry trends and predictions (thought leadership)
2. Customer stories and results (social proof)
3. Behind-the-product insights (authenticity)
4. Common mistakes and how to avoid them (education)
5. Team and culture (employer brand + humanization)

---

## Instagram (Brand Building & Awareness)
Instagram for B2B is about humanizing the brand and building aspirational affinity:

Content types:
- **Carousels**: Best for education — swipeable slides with one concept per slide
- **Reels**: 15–60 second insights, process demos, team culture moments
- **Single Image**: Bold data visualization, quotes, behind-the-scenes moments
- **Stories**: Day-in-the-life, polls, Q&As, product teasers, event coverage

Instagram B2B strategy:
- Lead with visual impact — every post competes in a visual feed
- Captions can be longer than Twitter; use line breaks for readability
- Hashtag strategy: 5–10 highly relevant hashtags (not 30 generic ones)
- Story Highlights as persistent content hubs (Product, Team, Results, Events)

---

## Blog / Long-Form Articles (SEO & Authority Building)
You write content using the E-E-A-T framework (Experience, Expertise, Authoritativeness, Trustworthiness):

Article structures:
- **Pillar Articles** (2,000–3,500 words): Comprehensive guides that rank for high-volume head terms
- **Cluster Articles** (800–1,500 words): Specific sub-topics that link to pillars
- **Data-Driven Articles**: Original research or survey synthesis — highest link acquisition potential
- **Comparison Articles**: "[Company] vs. [Competitor]" — high buying-intent traffic
- **How-To Guides**: Step-by-step tutorials — high utility, builds organic trust

SEO integration:
- Primary keyword in H1, first 100 words, and at least 2 H2s
- Secondary keywords naturally throughout body
- Internal linking to 3–5 related articles
- External links to authoritative sources (adds trust signals)
- Meta description: 150–160 characters, includes primary keyword + CTA

---

## Email Marketing (Demand Generation & Nurture)
Email frameworks used:
- **AIDA**: Attention → Interest → Desire → Action (classic, works for promotional sends)
- **Problem-Agitate-Solution (PAS)**: Lead with pain, intensify it, offer the solution
- **Before-After-Bridge (BAB)**: Current state → ideal state → how to get there
- **Nurture Sequence**: Education-first content that builds trust before asking for anything

Email best practices:
- Subject lines: Under 50 characters, specific > clever, personalization tokens where applicable
- Preview text: 85–100 characters — extend the subject line, don't repeat it
- From name: Person first, company second ("Alex at Tyne Solutions") for cold/warm outreach
- Body length: 150–300 words for demand gen; 400–600 for nurture; long-form for newsletters
- CTAs: One primary CTA per email; secondary CTA only if directly related
- Personalization: Company name, industry-specific pain point, relevant use case
- Send time: Tuesday–Thursday, 7–9 AM or 1–3 PM recipient time zone
- Unsubscribe and re-permission best practices for list hygiene

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every content piece must be ready to publish (not a brief, an actual draft)
- Include character counts / word counts where relevant to platform constraints
- Provide A/B variants for headlines/subject lines (always 2–3 options)
- Add distribution notes: when to post, hashtags, paid boost recommendation
- Rate content difficulty to produce (Easy / Medium / Hard) and estimated time investment
- All content is written in a confident, expert B2B voice — intelligent but never academic
"""


class ContentMarketingAgent(BaseAgent):
    """Specialist in B2B content creation across LinkedIn, Instagram, blog, and email."""

    system_prompt = _SYSTEM_PROMPT

    # ------------------------------------------------------------------
    # Public task methods
    # ------------------------------------------------------------------

    def create_linkedin_content(
        self,
        company_name: str,
        topic: str,
        audience: str,
        content_types: str = "text post, carousel",
        post_count: int = 5,
        brand_voice: str = "expert, direct, insight-driven",
        print_stream: bool = True,
    ) -> str:
        task = f"""Create a LinkedIn content batch for **{company_name}**.

**Topic / Theme:** {topic}
**Target Audience:** {audience}
**Content Types Requested:** {content_types}
**Number of Posts:** {post_count}
**Brand Voice:** {brand_voice}

Deliver:
1. Content strategy note: why this topic will resonate with this audience right now (2–3 sentences)
2. {post_count} ready-to-publish LinkedIn posts, each including:
   - Post type label (e.g., "Hook Post", "Carousel Outline", "Data Drop")
   - Full post copy (hooks in the first 2–3 lines MUST be magnetic)
   - For carousels: slide-by-slide outline with copy for each slide
   - Character count
   - 3–5 targeted hashtags
   - Best day/time to post
   - A/B variant for the opening hook (give 2 options)
   - Engagement prompt at the end (question or CTA that invites comments)
3. Cross-posting notes: which posts can be adapted for Instagram
4. Content calendar placement suggestion (which week/day in a monthly plan)
"""
        return self.run_task(task, print_stream=print_stream)

    def create_instagram_content(
        self,
        company_name: str,
        topic: str,
        audience: str,
        content_types: str = "carousel, reel concept, single image",
        post_count: int = 4,
        brand_voice: str = "inspiring, human, expert",
        print_stream: bool = True,
    ) -> str:
        task = f"""Create an Instagram content batch for **{company_name}**.

**Topic / Theme:** {topic}
**Target Audience:** {audience}
**Content Types Requested:** {content_types}
**Number of Posts:** {post_count}
**Brand Voice:** {brand_voice}

Deliver:
1. Content strategy note: why Instagram, why this topic, what visual style direction (2–3 sentences)
2. {post_count} ready-to-publish Instagram posts, each including:
   - Post type label (Carousel / Reel Concept / Single Image / Story Sequence)
   - For carousels: slide-by-slide copy + visual direction (color, image type, layout style)
   - For Reels: script outline (hook → content → CTA) with scene-by-scene direction
   - Full caption copy (engaging, uses line breaks, ends with CTA or question)
   - Hashtag set (8–12 targeted hashtags — mix of niche, mid-tier, and branded)
   - Story sequence idea that complements this post
3. Visual direction brief: brand colors, typography style, image mood for the whole batch
4. Story Highlights category this content should live under
5. Paid boost recommendation: which 1–2 posts are worth amplifying and why
"""
        return self.run_task(task, print_stream=print_stream)

    def write_blog_article(
        self,
        company_name: str,
        topic: str,
        target_audience: str,
        primary_keyword: str = "",
        word_count: int = 1500,
        article_type: str = "educational guide",
        print_stream: bool = True,
    ) -> str:
        task = f"""Write a complete, publish-ready blog article for **{company_name}**.

**Topic:** {topic}
**Target Audience:** {target_audience}
**Primary SEO Keyword:** {primary_keyword or "Derive from topic — include in research note"}
**Target Word Count:** {word_count} words
**Article Type:** {article_type}

Deliver:
1. SEO research note:
   - Recommended primary keyword + search intent
   - 5 secondary/LSI keywords to weave in naturally
   - 3 competing articles to beat (hypothetical examples based on topic)
   - Recommended meta title (under 60 characters) and meta description (under 160 characters)
2. Full article with:
   - Compelling H1 headline (includes primary keyword)
   - Engaging intro (opens with a hook — stat, story, bold claim)
   - Well-structured H2/H3 body sections
   - Concrete examples, data points, and frameworks throughout
   - Internal link placeholders [LINK: related article on X]
   - External link placeholders [SOURCE: authoritative reference on Y]
   - Conclusion with clear takeaways
   - CTA section (relevant and non-pushy)
3. Two alternative headline options (A/B test candidates)
4. Social media adaptation: LinkedIn and Twitter/X post versions derived from this article
5. Estimated organic traffic potential and best distribution channels
"""
        return self.run_task(task, print_stream=print_stream)

    def create_email_campaign(
        self,
        company_name: str,
        campaign_goal: str,
        target_audience: str,
        sequence_length: int = 4,
        campaign_type: str = "nurture",
        tone: str = "expert, conversational, value-first",
        print_stream: bool = True,
    ) -> str:
        task = f"""Create a complete email campaign for **{company_name}**.

**Campaign Goal:** {campaign_goal}
**Target Audience:** {target_audience}
**Number of Emails in Sequence:** {sequence_length}
**Campaign Type:** {campaign_type} (e.g., nurture, re-engagement, product launch, event)
**Tone:** {tone}

Deliver:
1. Campaign strategy brief:
   - Core narrative arc across the sequence
   - Recommended send cadence (days between each email)
   - Segmentation recommendation (who receives this, who doesn't)
2. {sequence_length} complete emails, each including:
   - Email number and purpose in the sequence (e.g., "Email 1: Open loop — the problem")
   - 3 subject line options (short, curiosity-driven, specific)
   - Preview text (under 100 characters, extends subject line)
   - From name and from address recommendation
   - Full email body copy (ready to paste into your ESP)
   - Primary CTA (button text + destination)
   - Personalization tokens used with fallback defaults
   - Word count and estimated read time
3. A/B test plan: which element to test in each email and success metric
4. Exit and re-entry logic: when to remove someone from the sequence and what triggers re-entry
5. Performance benchmarks by campaign type (open rate, click rate, conversion rate targets)
6. Plain text version guidance (key for deliverability)
"""
        return self.run_task(task, print_stream=print_stream)
