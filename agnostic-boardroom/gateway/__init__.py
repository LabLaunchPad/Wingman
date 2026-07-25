"""Stateless multi-provider routing library -- see `router.py`'s own docstring for
why this is a plain importable class, not a persistent gateway service.
"""

from gateway.router import Router, RunResult

__all__ = ["Router", "RunResult"]
