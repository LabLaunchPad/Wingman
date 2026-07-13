---
name: platform-native-reference
description: Use when about to add a new dependency or write custom code during /wingman:build — consult this reference to check if the platform already ships the feature. Covers HTML elements, CSS capabilities, JS/Browser APIs, Node.js stdlib, Python stdlib, and database features.
---

<!--
Adapted from DietrichGebert/ponytail (MIT License, Copyright (c) 2026
DietrichGebert) — docs/platform-native.md. The cross-layer reference
mapping "what you think you need" to "what the platform ships" is
condensed here for Wingman's build-time use.
-->

# Platform-Native Reference

The lazy senior dev's first question: *does the platform already do this?*

This reference answers that question for the most common cases. Before reaching for a package, check here. The platform ships with your app for free, doesn't break on updates, and was written by people whose job is exactly that problem.

## How To Use

Consult the relevant layer below when `engineering-minimalism`'s decision ladder hits rungs 3-4 (stdlib / native platform). If the platform covers it, use it. If the native solution is genuinely insufficient (old browser support, edge cases it doesn't handle, ergonomics that matter at scale), the library earns its place — install it then, not before.

---

## HTML Elements

| You think you need | What the platform has |
|---|---|
| Date picker library | `<input type="date">` |
| Time picker library | `<input type="time">` |
| Color picker library | `<input type="color">` |
| Range slider library | `<input type="range">` |
| Progress bar component | `<progress value="70" max="100">` |
| Meter/gauge component | `<meter value="0.7">` |
| Modal/dialog library | `<dialog>` + `dialog.showModal()` |
| Accordion/FAQ component | `<details><summary>Title</summary>…</details>` |
| Tooltip library | `title` attribute + CSS `::before`/`::after` |
| Searchable dropdown | `<input list="id"> <datalist id="id">` |
| Auto-growing textarea | `field-sizing: content` (CSS) |
| Sticky header | `position: sticky; top: 0` (CSS) |

---

## CSS Capabilities

| You think you need JS for | What CSS has |
|---|---|
| Responsive font size | `font-size: clamp(1rem, 2.5vw, 2rem)` |
| Fluid spacing | `padding: clamp(1rem, 5vw, 3rem)` |
| Dark mode | `@media (prefers-color-scheme: dark)` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` |
| Responsive layout | `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))` |
| Container queries | `@container` queries |
| Design tokens / theming | CSS custom properties (`--color-primary: #7c3aed`) |
| Smooth scroll | `scroll-behavior: smooth` |
| Scroll-snap carousel | `scroll-snap-type: x mandatory` + `scroll-snap-align: start` |
| Aspect ratio | `aspect-ratio: 16 / 9` |
| Text truncation | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` |
| Multi-line clamp | `-webkit-line-clamp: 3` |
| Cascade layers | `@layer base, components, utilities` |
| Native nesting | Native CSS nesting (no preprocessor) |
| Parent selector | `:has(input:checked)` |

---

## JavaScript / Browser APIs

| You think you need | What the platform has |
|---|---|
| `query-string` / `qs` | `new URLSearchParams(location.search)` |
| `lodash.clonedeep` | `structuredClone(obj)` |
| `lodash.groupby` | `Object.groupBy(arr, fn)` |
| `lodash.debounce` | 3-line debounce (see below) |
| `numeral` / `accounting` | `new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` |
| `date-fns` format | `new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)` |
| `date-fns` relative time | `new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-3, "day")` |
| `clipboard.js` | `navigator.clipboard.writeText(text)` |
| `uuid` (v4) | `crypto.randomUUID()` |
| Infinite scroll library | `new IntersectionObserver(cb).observe(sentinel)` |
| Resize listener | `new ResizeObserver(cb).observe(element)` |
| DOM mutation watcher | `new MutationObserver(cb).observe(el, options)` |
| `is-online` | `navigator.onLine` + `online`/`offline` events |
| `sharesheet` library | `navigator.share({ title, text, url })` |
| `store.js` (simple) | `localStorage.setItem(key, JSON.stringify(val))` |
| Abort fetch timeout | `AbortSignal.timeout(5000)` passed to `fetch` |
| Custom event bus | `new EventTarget()` / `dispatchEvent(new CustomEvent("x", { detail }))` |

**Debounce one-liner:**
```js
let t;
const debounce = (fn, ms) => (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
```

---

## Node.js Standard Library

| You think you need | What Node has |
|---|---|
| `mkdirp` | `fs.mkdirSync(path, { recursive: true })` |
| `rimraf` | `fs.rmSync(path, { recursive: true, force: true })` |
| `uuid` (v4) | `crypto.randomUUID()` |
| `is-stream` | `val instanceof stream.Readable` |
| `object-assign` | `Object.assign()` / spread |
| `array-uniq` | `[...new Set(arr)]` |
| `array-flatten` | `arr.flat(Infinity)` |
| `path-exists` | `fs.existsSync(path)` |
| `load-json-file` | `JSON.parse(fs.readFileSync(path, "utf8"))` |
| `write-json-file` | `fs.writeFileSync(path, JSON.stringify(obj, null, 2))` |
| `pkg-dir` | `import.meta.dirname` |

---

## Python Standard Library

| You think you need | What Python has |
|---|---|
| `python-dateutil` (basic) | `datetime.fromisoformat()` (3.7+) |
| `pytz` | `zoneinfo.ZoneInfo("America/New_York")` (3.9+) |
| `attrs` (simple data classes) | `@dataclass` |
| `six` | drop it, Python 2 is gone |
| `pathlib2` | `pathlib.Path` (built-in since 3.4) |
| `enum34` | `enum.Enum` (built-in since 3.4) |
| `simplejson` (basic) | `json` (stdlib) |
| `requests` (simple GET) | `urllib.request.urlopen(url)` |
| `click` (single command) | `argparse` (stdlib) |
| `mergedeep` | `dict \| other_dict` (3.9+) |
| `more-itertools` (basic) | `itertools` (stdlib) |
| `toolz` (basic) | `functools`: `lru_cache`, `partial`, `reduce` |

---

## Database

| You think you need app code for | What the database has |
|---|---|
| Pagination offset/limit | `LIMIT 20 OFFSET 40` |
| Running totals | `SUM(...) OVER (ORDER BY date)` (window function) |
| Rank within group | `RANK() OVER (PARTITION BY category ORDER BY score DESC)` |
| Deduplication | `SELECT DISTINCT` / `ON CONFLICT DO NOTHING` |
| Soft-delete filtering | Generated column + partial index |
| Tree traversal | Recursive CTE (`WITH RECURSIVE`) |
| Full-text search (basic) | `tsvector` / `MATCH AGAINST` / `FTS5` |
| JSON storage + query | `jsonb` (Postgres) / `JSON_EXTRACT` (SQLite/MySQL) |
| UUID generation | `gen_random_uuid()` (Postgres) / `UUID()` (MySQL) |
| Timestamps on insert | `DEFAULT now()` + trigger |
| Uniqueness enforcement | `UNIQUE` constraint, not app-level checks |
| Referential integrity | `FOREIGN KEY`, not app-level checks |
| Value range enforcement | `CHECK (price > 0)`, not app-level validation |

---

## The Pattern

```
Platform team spends years solving the problem.
Package author wraps it.
You install the wrapper.
The wrapper goes unmaintained.
You debug the wrapper.
```

Skip the wrapper. The platform ships with your app for free.

When the native solution is genuinely insufficient, the library earns its place. Install it then, not before.

## Anti-Rationalization Defense

### Common Rationalizations

| Excuse | Reality |
|---|---|
| "The library is more ergonomic than the native API" | Ergonomics are a legitimate reason to install a library — but only after checking the native solution and finding it genuinely insufficient for your specific use case, not as a default assumption. |
| "The native API is too old / has bad browser support" | Check the actual support matrix. Don't assume. `structuredClone` has been in every browser since 2022. |
| "I already installed this dependency, it's not adding new weight" | The dependency exists, but does the native solution also work? Existing dependencies still have maintenance and security surface cost. |
| "The library does more than the native API" | Does your code use the "more"? If you're using 10% of a library's features that the native API covers, the library is dead weight. |
| "I'll check the native API later, the library works now" | Later you'll have integration code built around the library's API. Replace it then becomes harder. Check first, install second. |
| "Everyone uses this library, it's the standard" | Social proof is not a technical argument. Check the native solution regardless of what's popular. |

### Red Flags

- You're about to install a dependency without first checking if the platform already ships the feature.
- You're assuming a native API doesn't exist without verifying (e.g., "there's no native date picker" when `<input type="date">` exists).
- You're installing a library for a single utility function that the stdlib already provides.
- You're choosing a library because it's popular, not because the native solution is insufficient.
- You're about to add a dependency that wraps a platform API with no significant added value.

### Anti-Pattern Callouts

- **Dependency-default:** Installing a library as the first action rather than checking the native API first. The platform ships with your app for free — the dependency adds maintenance, security surface, and bundle weight.
- **Ergonomics-as-justification:** Choosing a library because the API is "nicer" without checking if the native solution covers the actual use case. Ergonomics are a tiebreaker, not a first resort.
- **Popularity-as-proof:** Installing a library because "everyone uses it" without verifying the native solution is insufficient. Social proof is not a technical argument.
