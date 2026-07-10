# Tech-Stack & MCP Skill Roster

The named vocabulary this skill materializes narrowly-scoped tech-stack/MCP skills from, so a materialized skill gets an established name/scope instead of one invented ad hoc. Every entry below is a **candidate**, not a file — none of these exist in a founder's `.claude/skills/` until a real project signal (see Core Workflow) justifies materializing exactly one.

**This file must stay in sync with `docs/SKILL-ROSTER.md` in the Wingman repo** — that file is the human-facing version (with the promotion-process narrative, aimed at repo browsers/contributors); this one is the runtime-facing version that actually ships inside the installed plugin (`docs/` at the Wingman repo root is not part of what `marketplace.json` installs — only `plugins/wingman/` is, which is why this copy exists here). When one changes, update the other.

## Frontend

| Skill | What it would teach | Activation signal |
|---|---|---|
| `react-patterns` | Component structure, hooks discipline, state-lifting conventions for this codebase | `react` in `package.json` dependencies |
| `nextjs-app-router` | App Router file conventions, server/client component boundary, data-fetching patterns | `next` in `package.json` dependencies |
| `vue-composition` | Composition API conventions, single-file-component structure | `vue` in `package.json` dependencies |
| `svelte-patterns` | Reactive declarations, stores, SvelteKit routing conventions | `svelte` in `package.json` dependencies |
| `tailwind-design-tokens` | Using the project's existing token/theme setup instead of arbitrary values | `tailwindcss` in `package.json` dependencies |

## Backend

| Skill | What it would teach | Activation signal |
|---|---|---|
| `express-conventions` | Route/middleware structure, error-handling patterns already established in the codebase | `express` in `package.json` dependencies |
| `fastapi-patterns` | Pydantic model conventions, dependency injection, async route patterns | `fastapi` in a Python requirements/lockfile |
| `django-conventions` | App structure, ORM query patterns, admin/URL conventions already in use | `django` in a Python requirements/lockfile |
| `hono-edge-patterns` | Edge-runtime request/response conventions, middleware chaining | `hono` in `package.json` dependencies |

## Database

| Skill | What it would teach | Activation signal |
|---|---|---|
| `postgres-migrations` | Safe migration authoring (additive-first, backfill discipline) matching this project's existing migrations | `pg`/`postgres` dependency or a `**/migrations/**` directory with `.sql` files |
| `prisma-schema-conventions` | Schema modeling and migration workflow specific to this project's existing `schema.prisma` | a `schema.prisma` file present |
| `mongodb-patterns` | Document modeling and indexing conventions already established in the codebase | `mongodb`/`mongoose` in `package.json` dependencies |
| `supabase-conventions` | Row-level security patterns, client vs. service-role key usage | `@supabase/supabase-js` dependency or a Supabase `.mcp.json` entry |

## Auth

| Skill | What it would teach | Activation signal |
|---|---|---|
| `nextauth-patterns` | Session/provider configuration conventions already in use in this project | `next-auth`/`@auth/core` in `package.json` dependencies |
| `clerk-conventions` | Client/server auth-check patterns, protected-route conventions | `@clerk/*` in `package.json` dependencies |
| `jwt-session-handling` | Token issuance/verification/rotation patterns matching this codebase | hand-rolled JWT code detected (`jsonwebtoken`/similar with no higher-level auth library) |

## DevOps / Deployment

| Skill | What it would teach | Activation signal |
|---|---|---|
| `docker-conventions` | Multi-stage build patterns and layer-caching discipline matching this project's existing `Dockerfile` | a `Dockerfile` present |
| `github-actions-patterns` | Workflow structure, secret handling, and job-dependency conventions matching what's already in `.github/workflows/` | `.github/workflows/*.yml` present beyond a starter template |
| `vercel-deployment` | Environment/preview-deployment conventions specific to this project's Vercel config | a `vercel.json` file or Vercel-specific env vars in use |
| `cloudflare-workers-conventions` | Wrangler config, bindings, and edge-runtime constraints for this project | a `wrangler.toml`/`wrangler.jsonc` file present |

## MCP Integrations

Third-party MCP servers a founder's project might configure. Activation signal is always the same shape: a matching entry in the project's `.mcp.json`.

| Skill | What it would teach | Activation signal |
|---|---|---|
| `supabase-mcp-usage` | Which Supabase MCP tools to reach for (schema inspection vs. direct SQL vs. the client library) and when not to use the MCP at all | an `.mcp.json` entry for a Supabase MCP server |
| `stripe-mcp-usage` | Safe use of Stripe's MCP tools for test-mode operations; hard rule against ever touching live-mode keys/data through it | an `.mcp.json` entry for a Stripe MCP server |
| `postgres-mcp-usage` | Read-only vs. mutating query conventions when a Postgres MCP server is available alongside direct driver access | an `.mcp.json` entry for a Postgres MCP server |
| `github-mcp-usage` | When to use the GitHub MCP server's tools vs. plain `git`/`gh` CLI commands already available | an `.mcp.json` entry for a GitHub MCP server |

Not exhaustive by design — new rows get added when a real project's signal doesn't match anything here, not speculatively ahead of any real project needing it.
