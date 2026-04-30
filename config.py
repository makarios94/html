import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

# Model used by the CMO orchestrator (needs strong reasoning for coordination)
ORCHESTRATOR_MODEL: str = "claude-opus-4-7"

# Model used by all sub-agents (high quality for deliverable generation)
SUBAGENT_MODEL: str = "claude-opus-4-7"

# Token limits
MAX_TOKENS_ORCHESTRATOR: int = 4096   # orchestrator mainly delegates; few direct tokens
MAX_TOKENS_SUBAGENT: int = 16000      # sub-agents produce full marketing documents

# Company context injected into every sub-agent call
COMPANY_NAME: str = "Tyne Solutions"
