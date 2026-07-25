"""Zero-cost regression tests for gateway.providers.opencode.OpenCodeProvider.

Fixtures below are the *actual* raw JSONL stdout captured from real, live
`opencode run --format json` calls made while building this provider (see
`gateway/providers/opencode.py`'s module docstring and `docs/PROJECT.md`'s
decisions log for the full account) -- not synthetic/fabricated data. The live
end-to-end round-trip through this class itself was blocked partway through by
a real OpenCode Zen workspace billing wall ("No payment method"), disclosed
honestly rather than glossed over; these tests prove the parsing logic against
genuinely-captured real output instead, at zero cost and no dependency on a
live account.
"""

from __future__ import annotations

import subprocess

import pytest

from gateway.providers.opencode import OpenCodeProvider

# Captured verbatim from a real `opencode run --format json "Reply with exactly
# one word: hi"` call against OpenCode Zen.
_REAL_SUCCESS_STDOUT = (
    '{"type":"step_start","timestamp":1784968825792,"sessionID":"ses_0679144eaffeYfaqgu5DkCK3Xi",'
    '"part":{"id":"prt_f986ecbb6001iHiUCUlUYmKRuo","messageID":"msg_f986ebd5e00105dS3SJ7Jsk0m2",'
    '"sessionID":"ses_0679144eaffeYfaqgu5DkCK3Xi","type":"step-start"}}\n'
    '{"type":"text","timestamp":1784968826234,"sessionID":"ses_0679144eaffeYfaqgu5DkCK3Xi",'
    '"part":{"id":"prt_f986ecca2001mJP971U28ZKn8u","messageID":"msg_f986ebd5e00105dS3SJ7Jsk0m2",'
    '"sessionID":"ses_0679144eaffeYfaqgu5DkCK3Xi","type":"text","text":"hi",'
    '"time":{"start":1784968826018,"end":1784968826104}}}\n'
    '{"type":"step_finish","timestamp":1784968826234,"sessionID":"ses_0679144eaffeYfaqgu5DkCK3Xi",'
    '"part":{"id":"prt_f986eccff001N00ZPsCj9ewlTl","reason":"stop",'
    '"messageID":"msg_f986ebd5e00105dS3SJ7Jsk0m2","sessionID":"ses_0679144eaffeYfaqgu5DkCK3Xi",'
    '"type":"step-finish","tokens":{"total":10380,"input":58,"output":4,"reasoning":14,'
    '"cache":{"write":0,"read":10304}},"cost":0}}\n'
)

# Captured verbatim from a real `opencode run --format json -m
# "opencode/definitely-not-a-real-model-xyz" "hi"` call -- a genuine error event,
# not a fabricated one.
_REAL_ERROR_STDOUT = (
    '{"type":"error","timestamp":1784968844308,"sessionID":"ses_06790ee62ffeYzRvucVpTBoDMU",'
    '"error":{"name":"UnknownError","data":{"message":"Unexpected server error. '
    'Check server logs for details.","ref":"err_c497c54b"}}}\n'
)


def _fake_completed_process(returncode=0, stdout="", stderr=""):
    return subprocess.CompletedProcess(args=[], returncode=returncode, stdout=stdout, stderr=stderr)


def test_run_requires_a_config_dir():
    provider = OpenCodeProvider()  # no config_dir, and assumed no env var set in test env
    with pytest.raises(RuntimeError, match="requires config_dir"):
        provider.run("hi")


def test_parses_a_real_captured_successful_response(monkeypatch):
    monkeypatch.setattr(
        subprocess, "run", lambda *a, **k: _fake_completed_process(stdout=_REAL_SUCCESS_STDOUT)
    )
    provider = OpenCodeProvider(config_dir="/tmp/fake-opencode-project")
    result = provider.run("Reply with exactly one word: hi")
    assert result.text == "hi"
    assert result.total_cost_usd == 0
    assert result.session_id == "ses_0679144eaffeYfaqgu5DkCK3Xi"
    assert result.is_error is False


def test_a_real_captured_error_response_raises_with_the_real_message(monkeypatch):
    monkeypatch.setattr(
        subprocess,
        "run",
        lambda *a, **k: _fake_completed_process(returncode=1, stdout=_REAL_ERROR_STDOUT),
    )
    provider = OpenCodeProvider(config_dir="/tmp/fake-opencode-project")
    with pytest.raises(RuntimeError, match="Unexpected server error"):
        provider.run("hi")


def test_sets_both_cwd_and_pwd_env_to_the_config_dir(monkeypatch):
    """Regression test for the real, non-obvious mechanic this provider's
    docstring documents: OpenCode resolves its project config via the $PWD env
    var, not merely the subprocess's OS-level cwd -- confirmed by a live A/B
    test where cwd= alone silently misrouted to a different default provider."""
    captured = {}

    def fake_run(*args, **kwargs):
        captured["cwd"] = kwargs.get("cwd")
        captured["pwd_env"] = kwargs.get("env", {}).get("PWD")
        return _fake_completed_process(stdout=_REAL_SUCCESS_STDOUT)

    monkeypatch.setattr(subprocess, "run", fake_run)
    provider = OpenCodeProvider(config_dir="/tmp/fake-opencode-project")
    provider.run("hi")
    assert captured["cwd"] == "/tmp/fake-opencode-project"
    assert captured["pwd_env"] == "/tmp/fake-opencode-project"
