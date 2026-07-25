"""Backward-compatible shim over `gateway.providers.claude_cli`.

The real logic (subprocess shelling, JSON parsing, the `WINGMAN_MODEL_CLI`
env-var handling) moved to `gateway/providers/claude_cli.py` when the
`gateway/` routing library was added -- see that module's own docstring for
the full rationale and history. This module is kept, not deleted, because
every real caller in this codebase (`agents/loop.py`, `agents/boardroom_engine.py`,
`agents/pipeline.py`, `agents/boardroom/cto_evaluator.py`,
`agents/departments/engineering_maker.py`, `eval/live_ab_run.py`,
`eval/checker_rubric_ab.py`) already imports `run_claude_headless`/`RunResult`
from here as an injected default-argument callable -- keeping this shim alive
means zero forced import changes anywhere, while `gateway.Router` is adopted
by individual callers only when they're ready to route across more than one
provider.
"""

from __future__ import annotations

from gateway.providers.claude_cli import ClaudeCliProvider, RunResult

__all__ = ["RunResult", "run_claude_headless"]

_provider = ClaudeCliProvider()


def run_claude_headless(prompt: str, timeout_s: int = 120, cli: str | None = None) -> RunResult:
    """Unchanged public signature and behavior -- delegates to `ClaudeCliProvider.run`."""
    return _provider.run(prompt, timeout_s=timeout_s, cli=cli)
