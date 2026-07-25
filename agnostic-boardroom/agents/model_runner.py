"""Live model inference via a headless coding-agent CLI, not a separate API key.

Resolution to the Phase 3/4 "needs live credentials" blocker: use the AI
model already available in the AI coding agent -- the same authenticated
`claude` CLI this session runs on -- via headless invocation, rather than a
raw Anthropic/OpenAI API call requiring its own key. This is the identical
mechanism `evals/run-headless.mjs` already uses and trusts elsewhere in this
repo; confirmed working live in this sandbox before this module was written
(a real `claude -p "..." --output-format json` call returned a real
session_id, real token usage, and a real $0.26 cost for a one-word reply).

Every call has a real dollar cost -- `RunResult.total_cost_usd` is read
directly from the CLI's own reported figure, never estimated, so callers can
log and sum real spend rather than a guess.

**Harness-agnosticism, honestly scoped**: `run_claude_headless` is
parameterized on the CLI binary via `WINGMAN_MODEL_CLI` (default `claude`)
so a second harness isn't architecturally hardcoded out -- but no second
adapter is shipped here. Adding a real Codex CLI / Gemini CLI / etc. adapter
without a way to actually run and verify it in this sandbox would mean
shipping untested code claiming to work, which is exactly the kind of
fabricated capability this project's own `verification-before-completion`
discipline exists to prevent. The parameterization is real and tested (the
`claude` path); a second harness's own output-format flag and JSON shape
would need to be confirmed against a real installation before landing here.

`WINGMAN_MODEL_CLI` is read fresh on every call, not cached at import time --
a module-level `os.environ.get(...)` would freeze whatever value existed
when `agents.model_runner` was first imported, silently ignoring a later
`os.environ["WINGMAN_MODEL_CLI"] = ...` set by a caller (a test, a
subprocess wrapper, a future harness adapter) after that point. Reading it
inside the function itself avoids that class of stale-env-var bug entirely.
"""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass


@dataclass
class RunResult:
    text: str
    total_cost_usd: float
    session_id: str
    is_error: bool


def run_claude_headless(prompt: str, timeout_s: int = 120, cli: str | None = None) -> RunResult:
    """Shells out to `<cli> -p <prompt> --output-format json` and parses the result.

    `cli` defaults to the `WINGMAN_MODEL_CLI` env var (read at call time, not
    import time -- see module docstring), falling back to `"claude"` --
    rather than a hardcoded `"claude"` literal. The parameterization is real
    and tested (the `claude` path); a second harness's own output-format
    flag and JSON shape would need to be confirmed against a real
    installation before landing here.

    Raises subprocess.TimeoutExpired if the model doesn't respond in time, and
    RuntimeError if the CLI itself reports an error (`is_error: true`) rather
    than silently returning an empty/garbage result.
    """
    cli = cli or os.environ.get("WINGMAN_MODEL_CLI", "claude")
    proc = subprocess.run(
        [cli, "-p", prompt, "--output-format", "json"],
        capture_output=True,
        text=True,
        timeout=timeout_s,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"{cli} -p exited {proc.returncode}: {proc.stderr[:500]}")

    data = json.loads(proc.stdout)
    if data.get("is_error"):
        raise RuntimeError(f"{cli} -p reported an error: {data.get('result', '')[:500]}")

    return RunResult(
        text=data.get("result", ""),
        total_cost_usd=data.get("total_cost_usd", 0.0),
        session_id=data.get("session_id", ""),
        is_error=bool(data.get("is_error", False)),
    )
