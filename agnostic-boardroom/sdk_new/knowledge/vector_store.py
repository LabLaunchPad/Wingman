"""Real Agno-backed skill vector store (Pillar II of the confirmed rewrite plan).

Uses Agno's own `Knowledge` abstraction over an embedded LanceDB table (no
server, a single local directory -- the "lightest minimal runtime" property
that motivated choosing Agno) and a local FastEmbed model (ONNX, downloaded
once from Hugging Face, no Anthropic/OpenAI API key required). This is a
genuine choice, not a placeholder: it lets the A/B harness in `ab_harness.py`
measure real retrieval behavior without needing founder-provided model
credentials.

Indexes the real, already-shipped `plugins/wingman/skills/*/SKILL.md` files --
not synthetic content -- so retrieval-quality claims are checkable against
real skill text.
"""

from __future__ import annotations

from pathlib import Path

from agno.knowledge.chunking.fixed import FixedSizeChunking
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.reader.markdown_reader import MarkdownReader
from agno.vectordb.lancedb import LanceDb

# Agno's default chunk size (5000 chars) barely sub-divides a typical
# SKILL.md (~5-11k chars) -- confirmed empirically: at the default, a 3-chunk
# retrieval on a 2200-token skill file returned almost the entire document
# (2209 of 2211 tokens), giving no meaningful compression. 800 chars gives
# genuinely fine-grained, independently retrievable chunks.
CHUNK_SIZE = 800

DEFAULT_LANCEDB_URI = str(Path(__file__).parent / ".lancedb")
DEFAULT_TABLE_NAME = "wingman_skills"

# Wingman's real plugin skills live 3 levels above this file:
# agnostic-boardroom/knowledge/vector_store.py -> agnostic-boardroom/ -> Wingman/ -> plugins/wingman/skills
REPO_ROOT = Path(__file__).resolve().parents[2]
SKILLS_DIR = REPO_ROOT / "plugins" / "wingman" / "skills"


def build_skill_knowledge(
    lancedb_uri: str = DEFAULT_LANCEDB_URI,
    table_name: str = DEFAULT_TABLE_NAME,
    skills_dir: Path = SKILLS_DIR,
) -> Knowledge:
    """Index every real SKILL.md under `skills_dir` into a fresh Knowledge base.

    Returns the Knowledge instance so callers can also call `.search()` on it
    directly, or reuse an already-built one across multiple A/B runs.
    """
    vector_db = LanceDb(uri=lancedb_uri, table_name=table_name, embedder=FastEmbedEmbedder())
    kb = Knowledge(vector_db=vector_db)
    reader = MarkdownReader(chunking_strategy=FixedSizeChunking(chunk_size=CHUNK_SIZE))

    if not skills_dir.exists():
        raise FileNotFoundError(f"No skills directory found at {skills_dir}")

    for skill_file in sorted(skills_dir.glob("*/SKILL.md")):
        skill_name = skill_file.parent.name
        kb.add_content(name=skill_name, text_content=skill_file.read_text(), reader=reader)

    return kb


def load_full_skill_text(skill_name: str, skills_dir: Path = SKILLS_DIR) -> str:
    """The Variant-A baseline: the entire SKILL.md as-is, no retrieval."""
    path = skills_dir / skill_name / "SKILL.md"
    if not path.exists():
        raise FileNotFoundError(f"No SKILL.md for '{skill_name}' at {path}")
    return path.read_text()


def retrieve_top_k_chunks(kb: Knowledge, query: str, k: int = 3) -> list[str]:
    """The Variant-B context: only the top-k retrieved chunks for `query`."""
    results = kb.search(query, max_results=k)
    return [getattr(r, "content", str(r)) for r in results]
