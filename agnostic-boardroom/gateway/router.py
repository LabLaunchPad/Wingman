"""A stateless, in-process multi-provider router -- not a persistent gateway service.

Modeled on LiteLLM's own `router.py` (a stateless-per-call `Router` class handling
provider selection) as distinct from LiteLLM's `proxy/` (the actual always-on HTTP
gateway server, only needed for cross-process auth/spend-tracking/observability).
This project needs the former, not the latter: `docs/ARCHITECTURE.md` §2's "no
persistent runtime" rule rules out an always-on daemon for the shipped Claude Code
plugin, and nothing here requires one -- `Router.run()` is a plain method call with
no background thread, no listening socket, the same lifecycle as importing and
calling `agents.model_runner.run_claude_headless` directly, which this replaces.

Only one provider exists today (`claude-cli`), so there is deliberately no
retry/fallback-on-failure logic in this first version -- adding failover logic
against a single-provider router would be untested, speculative code with nothing
real to fail over to. That's the natural next increment once a second provider
actually exists and can be verified against a real installation (see
`gateway/providers/claude_cli.py`'s own docstring on why an unverified second
adapter isn't shipped speculatively).
"""

from __future__ import annotations

from gateway.providers.claude_cli import ClaudeCliProvider, RunResult

__all__ = ["Router", "RunResult"]


class Router:
    """Dispatches a prompt to one of its registered providers by name.

    `providers` maps a provider name (e.g. "claude-cli") to an object exposing a
    `run(prompt, timeout_s=..., **kwargs) -> RunResult` method -- `ClaudeCliProvider`
    today, a future second adapter later. `default` picks which provider `run()`
    uses when the caller doesn't name one explicitly.
    """

    def __init__(self, providers: dict[str, ClaudeCliProvider], default: str = "claude-cli"):
        if default not in providers:
            raise ValueError(f"default provider {default!r} not in providers: {list(providers)}")
        self.providers = providers
        self.default = default

    def run(self, prompt: str, provider: str | None = None, timeout_s: int = 120) -> RunResult:
        """Route `prompt` to `provider` (or `self.default` if unset) and return its RunResult."""
        name = provider or self.default
        if name not in self.providers:
            raise ValueError(f"unknown provider {name!r}: registered providers are {list(self.providers)}")
        return self.providers[name].run(prompt, timeout_s=timeout_s)
