"""Custom Agno `Model` subclass wrapping the subprocess-based `claude -p` CLI call.

Step 0 of the Agno-native loop/graph rewrite: no documented Agno precedent wraps a
subprocess CLI as a `Model` (every real provider under `agno.models.*` speaks an HTTP
client). This adapter is the concrete answer -- built directly against Agno 2.8.2's
real installed `Model` abstract base (confirmed via `inspect.getsource`, not the docs
alone, since the docs never showed a subprocess example): `invoke`/`ainvoke`/
`invoke_stream`/`ainvoke_stream`/`_parse_provider_response`/`_parse_provider_response_delta`
are the required abstract methods.

Delegates every call to the existing, unchanged `gateway.providers.claude_cli.ClaudeCliProvider`
-- this file adds zero new subprocess logic, only the Agno-shaped wrapper around it.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, AsyncIterator, Iterator, List, Optional

from agno.models.base import Model
from agno.models.message import Message
from agno.models.metrics import MessageMetrics
from agno.models.response import ModelResponse

from gateway.providers.claude_cli import ClaudeCliProvider


def _messages_to_prompt(messages: List[Message]) -> str:
    """Flattens an Agno message list into a single prompt string, since the `claude -p`
    CLI takes one prompt argument, not a chat-turn list. System messages are prefixed;
    user/assistant turns are concatenated in order. This is a deliberately simple
    flattening -- no multi-turn conversation state is preserved across separate CLI
    invocations, matching this repo's existing one-shot `run_claude_headless` usage.
    """
    parts = []
    for m in messages:
        content = m.content if isinstance(m.content, str) else str(m.content)
        if m.role == "system":
            parts.append(f"[System]\n{content}")
        elif m.role == "user":
            parts.append(content)
        elif m.role == "assistant":
            parts.append(f"[Assistant]\n{content}")
    return "\n\n".join(p for p in parts if p)


@dataclass
class AgnoClaudeCliModel(Model):
    """Agno `Model` implementation backed by the headless `claude -p` CLI subprocess.

    No streaming exists for a one-shot subprocess call -- `invoke_stream`/`ainvoke_stream`
    yield the single complete response as one chunk rather than raising `NotImplementedError`,
    since Agno's own `Agent` machinery may call the streaming path even for a non-streaming
    caller in some code paths; a real (if degenerate) generator is safer than an exception.
    """

    id: str = "claude-cli"
    name: str = "AgnoClaudeCliModel"
    provider: str = "claude-cli"
    timeout_s: int = 120
    cli: Optional[str] = None

    def __post_init__(self) -> None:
        super().__post_init__()
        self._provider = ClaudeCliProvider()

    def invoke(
        self,
        messages: List[Message],
        assistant_message: Message,
        response_format: Optional[Any] = None,
        tools: Optional[List[dict]] = None,
        tool_choice: Optional[Any] = None,
        run_response: Optional[Any] = None,
        compress_tool_results: bool = False,
    ) -> ModelResponse:
        prompt = _messages_to_prompt(messages)
        result = self._provider.run(prompt, timeout_s=self.timeout_s, cli=self.cli)
        return self._parse_provider_response(result)

    async def ainvoke(
        self,
        messages: List[Message],
        assistant_message: Message,
        response_format: Optional[Any] = None,
        tools: Optional[List[dict]] = None,
        tool_choice: Optional[Any] = None,
        run_response: Optional[Any] = None,
        compress_tool_results: bool = False,
    ) -> ModelResponse:
        # No real async subprocess path exists yet -- delegates to the sync call.
        # `subprocess.run` blocks the event loop for the duration of the CLI call;
        # acceptable for this repo's existing usage (no concurrent model calls today).
        return self.invoke(messages, assistant_message, response_format, tools, tool_choice, run_response, compress_tool_results)

    def invoke_stream(
        self,
        messages: List[Message],
        assistant_message: Message,
        response_format: Optional[Any] = None,
        tools: Optional[List[dict]] = None,
        tool_choice: Optional[Any] = None,
        run_response: Optional[Any] = None,
        compress_tool_results: bool = False,
    ) -> Iterator[ModelResponse]:
        yield self.invoke(messages, assistant_message, response_format, tools, tool_choice, run_response, compress_tool_results)

    async def ainvoke_stream(
        self,
        messages: List[Message],
        assistant_message: Message,
        response_format: Optional[Any] = None,
        tools: Optional[List[dict]] = None,
        tool_choice: Optional[Any] = None,
        run_response: Optional[Any] = None,
        compress_tool_results: bool = False,
    ) -> AsyncIterator[ModelResponse]:
        yield await self.ainvoke(messages, assistant_message, response_format, tools, tool_choice, run_response, compress_tool_results)

    def _parse_provider_response(self, response: Any, **kwargs) -> ModelResponse:
        """`response` is a `gateway.providers.claude_cli.RunResult`."""
        model_response = ModelResponse()
        model_response.role = "assistant"
        model_response.content = response.text
        model_response.response_usage = MessageMetrics()
        model_response.provider_data = {
            "total_cost_usd": response.total_cost_usd,
            "session_id": response.session_id,
        }
        return model_response

    def _parse_provider_response_delta(self, response: Any) -> ModelResponse:
        return self._parse_provider_response(response)
