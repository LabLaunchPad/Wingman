"""Zero-cost regression test for the naming-audit fix: WINGMAN_MODEL_CLI
must be read fresh per call, not cached at import time (which would
silently ignore an env var set after `agents.model_runner` was first
imported -- a real bug a naming audit found in this module)."""

import subprocess

import pytest

from agents.model_runner import run_claude_headless


def test_cli_defaults_to_claude_when_env_var_unset(monkeypatch):
    monkeypatch.delenv("WINGMAN_MODEL_CLI", raising=False)
    seen_cli = {}

    def fake_run(args, **kwargs):
        seen_cli["cli"] = args[0]
        raise subprocess.TimeoutExpired(cmd=args, timeout=1)

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(subprocess.TimeoutExpired):
        run_claude_headless("hi")
    assert seen_cli["cli"] == "claude"


def test_cli_reads_env_var_set_after_module_import(monkeypatch):
    """The real bug this test guards against: a module-level
    `os.environ.get(...)` at import time would freeze `cli` to whatever
    was set (or unset) when this module first loaded -- long before this
    test runs and sets the env var. Reading it inside the function avoids
    that entirely."""
    monkeypatch.setenv("WINGMAN_MODEL_CLI", "some-other-cli")
    seen_cli = {}

    def fake_run(args, **kwargs):
        seen_cli["cli"] = args[0]
        raise subprocess.TimeoutExpired(cmd=args, timeout=1)

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(subprocess.TimeoutExpired):
        run_claude_headless("hi")
    assert seen_cli["cli"] == "some-other-cli"


def test_explicit_cli_argument_overrides_env_var(monkeypatch):
    monkeypatch.setenv("WINGMAN_MODEL_CLI", "some-other-cli")
    seen_cli = {}

    def fake_run(args, **kwargs):
        seen_cli["cli"] = args[0]
        raise subprocess.TimeoutExpired(cmd=args, timeout=1)

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(subprocess.TimeoutExpired):
        run_claude_headless("hi", cli="explicit-cli")
    assert seen_cli["cli"] == "explicit-cli"
