"""
Tyne Solutions — Marketing Super Agent CLI
==========================================
CMO orchestrator powered by Claude claude-opus-4-7, delegating to four specialist sub-agents:
  • Market Research  • ABM  • Content Marketing  • Report
"""
from __future__ import annotations

import os
import sys
from dotenv import load_dotenv
import anthropic
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.rule import Rule
from rich import print as rprint

from agents import CMOOrchestrator
from config import COMPANY_NAME

load_dotenv()

console = Console()

# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------

_AGENT_LABELS = {
    # Market Research
    "research_icp": ("Market Research", "blue"),
    "analyze_competitors": ("Market Research", "blue"),
    "research_competitor_pricing": ("Market Research", "blue"),
    # ABM
    "build_target_account_list": ("ABM", "cyan"),
    "map_buying_committee": ("ABM", "cyan"),
    "design_campaign_sequence": ("ABM", "cyan"),
    "audit_abm_program": ("ABM", "cyan"),
    "create_lead_scoring_model": ("ABM", "cyan"),
    # Content Marketing
    "create_linkedin_content": ("Content Marketing", "magenta"),
    "create_instagram_content": ("Content Marketing", "magenta"),
    "write_blog_article": ("Content Marketing", "magenta"),
    "create_email_campaign": ("Content Marketing", "magenta"),
    # Reports
    "generate_abm_report": ("Report", "yellow"),
    "generate_content_report": ("Report", "yellow"),
}

_TOOL_DISPLAY_NAMES = {
    "research_icp": "ICP Research",
    "analyze_competitors": "Competitor Analysis",
    "research_competitor_pricing": "Pricing Intelligence",
    "build_target_account_list": "Target Account List",
    "map_buying_committee": "Buying Committee Map",
    "design_campaign_sequence": "Campaign Sequence",
    "audit_abm_program": "ABM Program Audit",
    "create_lead_scoring_model": "Lead Scoring Model",
    "create_linkedin_content": "LinkedIn Content",
    "create_instagram_content": "Instagram Content",
    "write_blog_article": "Blog Article",
    "create_email_campaign": "Email Campaign",
    "generate_abm_report": "ABM Performance Report",
    "generate_content_report": "Content Marketing Report",
}


def _print_banner() -> None:
    title = Text(f"  {COMPANY_NAME}  ", style="bold white on dark_blue")
    subtitle = Text("  Marketing Super Agent  —  CMO Orchestrator  ", style="italic dim")
    console.print()
    console.print(Panel(title, subtitle=str(subtitle), border_style="blue", padding=(0, 2)))
    console.print()


def _print_divider(label: str = "") -> None:
    console.print(Rule(label, style="dim"))


def _on_tool_call(tool_name: str, tool_input: dict) -> None:
    agent_label, color = _AGENT_LABELS.get(tool_name, ("Specialist", "white"))
    display_name = _TOOL_DISPLAY_NAMES.get(tool_name, tool_name)
    console.print()
    console.print(
        Panel(
            f"[bold {color}]▶ {agent_label} Agent[/bold {color}]\n"
            f"[dim]Task:[/dim] [white]{display_name}[/white]",
            border_style=color,
            expand=False,
            padding=(0, 2),
        )
    )
    console.print()


def _on_text(token: str) -> None:
    # Orchestrator synthesis text — print inline
    print(token, end="", flush=True)


def _get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not key:
        console.print(
            "[bold red]Error:[/bold red] ANTHROPIC_API_KEY is not set.\n"
            "Create a [bold].env[/bold] file with:\n"
            "  [dim]ANTHROPIC_API_KEY=your_api_key_here[/dim]"
        )
        sys.exit(1)
    return key


# ---------------------------------------------------------------------------
# Interactive loop
# ---------------------------------------------------------------------------

def _interactive_mode(orchestrator: CMOOrchestrator) -> None:
    console.print("[dim]Type your marketing request, or [bold]exit[/bold] / [bold]quit[/bold] to leave.[/dim]")
    console.print()

    while True:
        try:
            user_input = console.input("[bold green]CMO Request >[/bold green] ").strip()
        except (KeyboardInterrupt, EOFError):
            console.print("\n[dim]Session ended.[/dim]")
            break

        if not user_input:
            continue

        if user_input.lower() in {"exit", "quit", "q"}:
            console.print("[dim]Session ended.[/dim]")
            break

        _print_divider("Processing")
        console.print()

        try:
            orchestrator.run(
                user_request=user_input,
                on_tool_call=_on_tool_call,
                on_text=_on_text,
            )
        except anthropic.APIError as exc:
            console.print(f"\n[bold red]API Error:[/bold red] {exc}")

        console.print()
        _print_divider()
        console.print()


# ---------------------------------------------------------------------------
# Single-shot mode (request passed as CLI argument)
# ---------------------------------------------------------------------------

def _single_shot_mode(orchestrator: CMOOrchestrator, request: str) -> None:
    _print_divider("Processing")
    console.print()
    orchestrator.run(
        user_request=request,
        on_tool_call=_on_tool_call,
        on_text=_on_text,
    )
    console.print()
    _print_divider()
    console.print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    _print_banner()

    api_key = _get_api_key()
    client = anthropic.Anthropic(api_key=api_key)
    orchestrator = CMOOrchestrator(client)

    if len(sys.argv) > 1:
        # Request passed directly as a command-line argument
        request = " ".join(sys.argv[1:])
        _single_shot_mode(orchestrator, request)
    else:
        _interactive_mode(orchestrator)


if __name__ == "__main__":
    main()
