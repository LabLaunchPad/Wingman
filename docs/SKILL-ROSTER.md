# Wingman Tech-Stack & MCP Skill Roster (Candidate Catalog)

This is the catalog of tech-stack- and MCP-integration-specific skills Wingman knows how to activate. **Every row below is a candidate, not a file.** None of them exist as skills in a fresh Wingman install or in a founder's project until a real, matching signal is detected.

A skill only gets materialized into a founder's own `.claude/skills/` when `department-lead-activation` (see its Core Workflow) finds a genuine signal for it — a real dependency in `package.json`/a lockfile, or a real `.mcp.json` entry — and no matching skill exists there yet. This catalog exists so that materialization step has a named vocabulary to draw from instead of inventing skill content ad hoc, the same role `docs/AGENT-ROSTER.md` plays for specialist promotion.

**Status legend:** every row starts as `candidate`. Update a row to `active (<project>)` only when a real materialization happens for a specific project, with a link to the generated skill file.

**Runtime copy:** this file lives at the Wingman repo root, outside `plugins/wingman/` — the only directory `marketplace.json` actually installs into a founder's project. `plugins/wingman/skills/department-lead-activation/references/skill-roster.md` is the copy that ships with the installed plugin and is what `department-lead-activation` actually reads at runtime. Keep both in sync when either changes, same convention `evolve-promotion`/`docs/AGENT-ROSTER.md` already established.

---

## Frontend

| Skill | What it would teach | Activation signal | Status |
|---|---|---|---|
| `react-patterns` | Component structure, hooks discipline, state-lifting conventions for this codebase | `react` in `package.json` dependencies | candidate |
| `nextjs-app-router` | App Router file conventions, server/client component boundary, data-fetching patterns | `next` in `package.json` dependencies | candidate |
| `vue-composition` | Composition API conventions, single-file-component structure | `vue` in `package.json` dependencies | candidate |
| `svelte-patterns` | Reactive declarations, stores, SvelteKit routing conventions | `svelte` in `package.json` dependencies | candidate |
| `tailwind-design-tokens` | Using the project's existing token/theme setup instead of arbitrary values | `tailwindcss` in `package.json` dependencies | candidate |

## Backend

| Skill | What it would teach | Activation signal | Status |
|---|---|---|---|
| `express-conventions` | Route/middleware structure, error-handling patterns already established in the codebase | `express` in `package.json` dependencies | candidate |
| `fastapi-patterns` | Pydantic model conventions, dependency injection, async route patterns | `fastapi` in a Python requirements/lockfile | candidate |
| `django-conventions` | App structure, ORM query patterns, admin/URL conventions already in use | `django` in a Python requirements/lockfile | candidate |
| `hono-edge-patterns` | Edge-runtime request/response conventions, middleware chaining | `hono` in `package.json` dependencies | candidate |

## Database

| Skill | What it would teach | Activation signal | Status |
|---|---|---|---|
| `postgres-migrations` | Safe migration authoring (additive-first, backfill discipline) matching this project's existing migrations | `pg`/`postgres` dependency or a `**/migrations/**` directory with `.sql` files | candidate |
| `prisma-schema-conventions` | Schema modeling and migration workflow specific to this project's existing `schema.prisma` | a `schema.prisma` file present | candidate |
| `mongodb-patterns` | Document modeling and indexing conventions already established in the codebase | `mongodb`/`mongoose` in `package.json` dependencies | candidate |
| `supabase-conventions` | Row-level security patterns, client vs. service-role key usage | `@supabase/supabase-js` dependency or a Supabase `.mcp.json` entry | candidate |

## Auth

| Skill | What it would teach | Activation signal | Status |
|---|---|---|---|
| `nextauth-patterns` | Session/provider configuration conventions already in use in this project | `next-auth`/`@auth/core` in `package.json` dependencies | candidate |
| `clerk-conventions` | Client/server auth-check patterns, protected-route conventions | `@clerk/*` in `package.json` dependencies | candidate |
| `jwt-session-handling` | Token issuance/verification/rotation patterns matching this codebase | hand-rolled JWT code detected (`jsonwebtoken`/similar with no higher-level auth library) | candidate |

## DevOps / Deployment

| Skill | What it would teach | Activation signal | Status |
|---|---|---|---|
| `docker-conventions` | Multi-stage build patterns and layer-caching discipline matching this project's existing `Dockerfile` | a `Dockerfile` present | candidate |
| `github-actions-patterns` | Workflow structure, secret handling, and job-dependency conventions matching what's already in `.github/workflows/` | `.github/workflows/*.yml` present beyond a starter template | candidate |
| `vercel-deployment` | Environment/preview-deployment conventions specific to this project's Vercel config | a `vercel.json` file or Vercel-specific env vars in use | candidate |
| `cloudflare-workers-conventions` | Wrangler config, bindings, and edge-runtime constraints for this project | a `wrangler.toml`/`wrangler.jsonc` file present | candidate |

## MCP Integrations

Third-party MCP servers a founder's project might configure. Activation signal is always the same shape: a matching entry in the project's `.mcp.json`.

| Skill | What it would teach | Activation signal | Status |
|---|---|---|---|
| `supabase-mcp-usage` | Which Supabase MCP tools to reach for (schema inspection vs. direct SQL vs. the client library) and when not to use the MCP at all | an `.mcp.json` entry for a Supabase MCP server | candidate |
| `stripe-mcp-usage` | Safe use of Stripe's MCP tools for test-mode operations; hard rule against ever touching live-mode keys/data through it | an `.mcp.json` entry for a Stripe MCP server | candidate |
| `postgres-mcp-usage` | Read-only vs. mutating query conventions when a Postgres MCP server is available alongside direct driver access | an `.mcp.json` entry for a Postgres MCP server | candidate |
| `github-mcp-usage` | When to use the GitHub MCP server's tools vs. plain `git`/`gh` CLI commands already available | an `.mcp.json` entry for a GitHub MCP server | candidate |

---

Not exhaustive by design — new rows get added the same way `docs/AGENT-ROSTER.md` grows: when a real project's signal doesn't match anything here, add the row before materializing (or immediately after, if the signal was novel enough to justify it), not speculatively ahead of any real project needing it.
