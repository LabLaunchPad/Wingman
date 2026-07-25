"""Zero-cost regression test for the naming-audit fix: WINGMAN_MODEL_CLI
must be read fresh per call, not cached at import time (which would
silently ignore an env var set after `agents.model_runner` was first
imported -- a real bug a naming audit found in this module)."""

import json
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


def _fake_completed_process(returncode=0, stdout="", stderr=""):
    return subprocess.CompletedProcess(args=[], returncode=returncode, stdout=stdout, stderr=stderr)


def test_successful_response_is_parsed_into_a_run_result(monkeypatch):
    """Real coverage gap found via a coverage audit: every existing test
    raised TimeoutExpired before reaching the actual response-parsing code
    -- this covers the real parsing path (lines model_runner.py never
    exercised) with a mocked subprocess.run, no live model call needed."""
    payload = {"result": "hello", "total_cost_usd": 0.05, "session_id": "sess-1", "is_error": False}
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(stdout=json.dumps(payload))
    )
    result = run_claude_headless("hi")
    assert result.text == "hello"
    assert result.total_cost_usd == 0.05
    assert result.session_id == "sess-1"
    assert result.is_error is False


def test_nonzero_returncode_raises_runtime_error(monkeypatch):
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(returncode=1, stderr="boom")
    )
    with pytest.raises(RuntimeError, match="exited 1"):
        run_claude_headless("hi")


def test_cli_reported_error_raises_runtime_error_even_with_zero_returncode(monkeypatch):
    payload = {"result": "something went wrong internally", "total_cost_usd": 0.01, "is_error": True}
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(stdout=json.dumps(payload))
    )
    with pytest.raises(RuntimeError, match="reported an error"):
        run_claude_headless("hi")
