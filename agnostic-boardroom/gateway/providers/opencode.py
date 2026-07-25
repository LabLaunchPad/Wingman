"""OpenCode CLI provider -- the second real, live-verified `Router` provider
(alongside `claude_cli.py`'s `ClaudeCliProvider`).

Confirmed live before this file was written, not assumed from docs: `opencode run
--format json <prompt>` streams newline-delimited JSON events (NOT a single JSON
object the way `claude -p --output-format json` does). The event shapes actually
observed:

- `{"type": "text", ..., "part": {"text": "..."}}`  -- one or more text chunks
- `{"type": "step_finish", ..., "part": {"cost": 0, "tokens": {...}}}` -- the
  final cost/token accounting for the run
- `{"type": "error", ..., "error": {"name": ..., "data": {"message": ...}}}` --
  emitted (with a nonzero process exit code) on failure, e.g. an unrecognized
  `--model` value

**A real, non-obvious mechanic found by direct testing, not guessed**: OpenCode
resolves which provider config to use (and therefore whether `OPENCODE_ZEN_API_KEY`
substitution in a project's `opencode.json` actually applies) by reading the `PWD`
*environment variable* at process start, not simply the OS-level working directory
a subprocess is launched with. Confirmed by direct A/B test: `subprocess.run(...,
cwd=config_dir)` alone still silently fell through to a different default provider
(GitHub Copilot) and failed with a malformed-auth-header error; only setting
`env["PWD"] = config_dir` in addition to `cwd=config_dir` made it pick up the
project's real `opencode.json`. This provider sets both, since relying on `cwd=`
alone would silently misroute to the wrong backend rather than failing loudly.

**`config_dir` requirement, disclosed rather than hidden**: unlike `ClaudeCliProvider`
(which needs no project-local config), this provider requires a directory containing
an `opencode.json` that maps `OPENCODE_ZEN_API_KEY` (or whichever env var the caller
uses) into `provider.opencode.options.apiKey` via OpenCode's own `{env:...}`
substitution syntax -- see this module's own test fixture for a minimal example.
No API key is read, embedded, or defaulted by this file itself; the caller is
responsible for exporting the real key as a shell environment variable before
calling `run()`.

**Cost caveat, carried forward from the prior live OpenCode test** (see
`docs/PROJECT.md`'s decisions log): the `cost` field OpenCode's own `step_finish`
event reports was `0` in every live call made while building/verifying this
provider -- not independently confirmed against Zen's actual billing, so
`RunResult.total_cost_usd` should not be treated as a proven-accurate spend figure
for this provider the way `ClaudeCliProvider`'s `total_cost_usd` is (that one has
been cross-checked against a real non-zero cost in this repo's own history).
"""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass

from gateway.providers.claude_cli import RunResult

DEFAULT_MODEL = "opencode/claude-sonnet-5"


@dataclass
class OpenCodeProvider:
    """Shells out to `opencode run --format json -m <model> <prompt>` inside
    `config_dir` (a directory containing a real `opencode.json`) and parses the
    resulting JSONL event stream into a `RunResult`.
    """

    config_dir: str | None = None
    model: str = DEFAULT_MODEL

    def run(self, prompt: str, timeout_s: int = 120, cli: str | None = None) -> RunResult:
        config_dir = self.config_dir or os.environ.get("WINGMAN_OPENCODE_CONFIG_DIR")
        if not config_dir:
            raise RuntimeError(
                "OpenCodeProvider requires config_dir (a directory with a real "
                "opencode.json declaring the API key mapping) -- set it at "
                "construction time or via WINGMAN_OPENCODE_CONFIG_DIR. See this "
                "module's docstring for why: OpenCode has no project config to "
                "resolve its API key from otherwise."
            )
        cli = cli or os.environ.get("WINGMAN_OPENCODE_CLI", "opencode")

        env = os.environ.copy()
        # Confirmed by direct testing: OpenCode resolves its project config via
        # the $PWD env var, not merely the subprocess's OS-level cwd -- see the
        # module docstring. Setting both avoids a silent provider misroute.
        env["PWD"] = config_dir

        proc = subprocess.run(
            [cli, "run", "--format", "json", "-m", self.model, prompt],
            capture_output=True,
            text=True,
            timeout=timeout_s,
            cwd=config_dir,
            env=env,
        )

        text_parts: list[str] = []
        cost = 0.0
        session_id = ""
        error_message: str | None = None

        for line in proc.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            event = json.loads(line)
            session_id = event.get("sessionID") or session_id
            event_type = event.get("type")
            part = event.get("part", {})
            if event_type == "text":
                text_parts.append(part.get("text", ""))
            elif event_type == "step_finish":
                cost = part.get("cost", cost)
            elif event_type == "error":
                error = event.get("error", {})
                error_message = error.get("data", {}).get("message") or error.get("name")

        if proc.returncode != 0 or error_message:
            raise RuntimeError(
                f"{cli} run exited {proc.returncode}: {error_message or proc.stderr[:500]}"
            )

        return RunResult(
            text="".join(text_parts),
            total_cost_usd=cost,
            session_id=session_id,
            is_error=False,
        )
