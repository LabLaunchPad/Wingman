"""Zero-cost regression tests for gateway.Router: dispatch-by-name and the
shim's parity with the pre-refactor `agents.model_runner.run_claude_headless` (now `models.model_runner`)
behavior. No real model calls -- `subprocess.run` is mocked throughout."""

import json
import subprocess

import pytest

from gateway.providers.claude_cli import ClaudeCliProvider, RunResult
from gateway.providers.opencode import OpenCodeProvider
from gateway.router import Router


def _fake_completed_process(returncode=0, stdout="", stderr=""):
    return subprocess.CompletedProcess(args=[], returncode=returncode, stdout=stdout, stderr=stderr)


def test_router_dispatches_to_the_named_provider(monkeypatch):
    payload = {"result": "hi", "total_cost_usd": 0.01, "session_id": "s1", "is_error": False}
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(stdout=json.dumps(payload))
    )
    router = Router({"claude-cli": ClaudeCliProvider()})
    result = router.run("hi", provider="claude-cli")
    assert isinstance(result, RunResult)
    assert result.text == "hi"


def test_router_uses_default_provider_when_none_named(monkeypatch):
    payload = {"result": "hi", "total_cost_usd": 0.01, "session_id": "s1", "is_error": False}
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(stdout=json.dumps(payload))
    )
    router = Router({"claude-cli": ClaudeCliProvider()}, default="claude-cli")
    result = router.run("hi")
    assert result.text == "hi"


def test_router_rejects_an_unknown_provider_name():
    router = Router({"claude-cli": ClaudeCliProvider()})
    with pytest.raises(ValueError, match="unknown provider"):
        router.run("hi", provider="does-not-exist")


def test_router_construction_rejects_a_default_not_in_providers():
    with pytest.raises(ValueError, match="not in providers"):
        Router({"claude-cli": ClaudeCliProvider()}, default="does-not-exist")


def test_router_dispatches_to_a_second_real_provider_opencode(monkeypatch):
    """Proves the Router genuinely dispatches by provider name across 2 real,
    different provider implementations (not just re-testing claude-cli twice)
    -- OpenCodeProvider parses newline-delimited JSON, a real, different wire
    format from ClaudeCliProvider's single JSON object, confirmed against real
    captured OpenCode output in test_opencode_provider.py."""
    success_stdout = (
        '{"type":"text","sessionID":"ses_1","part":{"type":"text","text":"hi"}}\n'
        '{"type":"step_finish","sessionID":"ses_1","part":{"type":"step-finish","cost":0}}\n'
    )
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(stdout=success_stdout)
    )
    router = Router(
        {
            "claude-cli": ClaudeCliProvider(),
            "opencode": OpenCodeProvider(config_dir="/tmp/fake-opencode-project"),
        },
        default="claude-cli",
    )
    result = router.run("hi", provider="opencode")
    assert isinstance(result, RunResult)
    assert result.text == "hi"
    assert result.session_id == "ses_1"


def test_shim_reproduces_pre_refactor_run_claude_headless_behavior(monkeypatch):
    """Parity check: the models.model_runner shim must return the exact same
    result shape as calling ClaudeCliProvider directly -- proving the move
    didn't silently change behavior."""
    from models.model_runner import run_claude_headless

    payload = {"result": "hello", "total_cost_usd": 0.05, "session_id": "sess-1", "is_error": False}
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(stdout=json.dumps(payload))
    )
    via_shim = run_claude_headless("hi")
    via_provider = ClaudeCliProvider().run("hi")
    assert via_shim == via_provider
