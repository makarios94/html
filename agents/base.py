"""Base agent class shared by all sub-agents."""
from __future__ import annotations

import anthropic
from config import SUBAGENT_MODEL, MAX_TOKENS_SUBAGENT


class BaseAgent:
    """
    Lightweight base for all marketing sub-agents.

    Each subclass overrides `system_prompt` with its specialist identity.
    `run_task` streams a Claude response and returns the full text.
    The system prompt is sent with `cache_control` so repeated calls within
    a session benefit from prompt caching.
    """

    system_prompt: str = ""  # override in each subclass

    def __init__(self, client: anthropic.Anthropic) -> None:
        self.client = client
        self.model = SUBAGENT_MODEL

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run_task(
        self,
        task: str,
        context: dict | None = None,
        print_stream: bool = True,
    ) -> str:
        """
        Run a marketing task with this specialist agent.

        Args:
            task: Natural-language description of what to produce.
            context: Optional dict of extra context injected before the task.
            print_stream: Whether to echo tokens to stdout as they arrive.

        Returns:
            Full response text as a string.
        """
        user_content = self._build_user_content(task, context)

        chunks: list[str] = []
        with self.client.messages.stream(
            model=self.model,
            max_tokens=MAX_TOKENS_SUBAGENT,
            system=[
                {
                    "type": "text",
                    "text": self.system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_content}],
        ) as stream:
            for text in stream.text_stream:
                chunks.append(text)
                if print_stream:
                    print(text, end="", flush=True)

        if print_stream:
            print()  # trailing newline after streamed output

        return "".join(chunks)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_user_content(task: str, context: dict | None) -> str:
        if not context:
            return task
        ctx_lines = "\n".join(f"  - **{k}**: {v}" for k, v in context.items())
        return f"{task}\n\n**Additional Context:**\n{ctx_lines}"
