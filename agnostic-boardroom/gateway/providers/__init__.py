"""Provider adapters -- one module per model-provider CLI/API this gateway can route to.

Today: `claude_cli.ClaudeCliProvider` only (the existing, tested `claude -p` headless
invocation). A second provider (Codex CLI, Gemini CLI, a raw API key) would live here
as its own module, added only once it can actually be run and verified in a real
environment -- see `claude_cli.py`'s own docstring for why an unverified second adapter
isn't shipped speculatively.
"""
