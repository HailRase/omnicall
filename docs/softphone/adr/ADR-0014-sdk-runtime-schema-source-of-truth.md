# ADR-0014: SDK Runtime Schema Source of Truth and Fixture Format

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — closes **O-SCHEMA-1** (SDK-01)

## Context

- **Features:** F-011
- **Legacy:** LF-080, LF-081
- **Roadmap:** P12
- **Contexts:** Integration
- **Layers:** `@softomnitel/omnicall-protocol`, desktop DI-01 consumers

SDK-02 / DI-01 must share one runtime validation model. ADR-0012 left the library and
generation direction open. Installing a runtime dependency requires an explicit decision
(`omnicall-kit/docs/DEPENDENCIES.md`).

## Decision

### O-SCHEMA-1 — Runtime schema library and generation

1. **Canonical source of truth:** Zod schemas in `@softomnitel/omnicall-protocol` (`zod@^4`, exact
   version locked at install time in SDK-02). Checked on 2026-07-20: npm latest `4.4.3`,
   maintained, not deprecated.

2. **TypeScript types:** derived via `z.infer<typeof Schema>` (or equivalent Zod 4
   helpers). No hand-maintained duplicate public types that can drift from schemas.

3. **Generation direction:** schemas → types → API report. Do **not** generate schemas from
   TypeScript interfaces. Do **not** treat OpenAPI/JSON Schema as the primary authoring
   surface for v1 (optional JSON Schema export may be added later without changing wire).

4. **Validation posture:** every inbound/outbound protocol boundary value is `unknown` until
   a Zod schema succeeds. Fail closed with stable codes (`invalid_message`,
   `invalid_payload`, `incompatible_version`).

5. **Desktop consumption:** desktop DI-01 consumes the same `@softomnitel/omnicall-protocol` package (or
   identical published schemas/fixtures). Domain remains free of Zod and protocol imports;
   Application/adapters validate at the boundary.

6. **Bundle note:** Zod is a runtime dependency of `@softomnitel/omnicall-protocol` only. SDK-02 must
   record gzipped size evidence in `DEPENDENCIES.md` before merge. Alternatives rejected
   below if size becomes a Blocker in SDK-02 review.

### Shared compatibility fixture format (SDK-01 / SDK-02 / DI-01)

Fixtures live under `omnicall-kit/packages/protocol/fixtures/` (created in SDK-02) and are
consumed unchanged by desktop tests:

```text
fixtures/
  valid/<suite>/<case>.json
  invalid/<suite>/<case>.json
  meta/<suite>/<case>.meta.json   # optional: expected error code, notes
```

Each `*.json` file is a single JSON-safe protocol message or discovery document.
`invalid` cases must document the expected stable error code in sibling `.meta.json` or in
the suite README. Fixtures never contain real secrets, real phone numbers, or live tokens.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Valibot | Smaller, but weaker ecosystem/docs for dual Electron+browser gate; revisit only if Zod size is Blocker |
| Hand-rolled validators | High drift risk; duplicates TS types |
| TypeBox / JSON Schema first | Extra compile step; poorer DX for discriminated unions in this repo |
| Zod 3 | Superseded by Zod 4 on registry at decision time |

## Consequences

- SDK-02 installs Zod and implements schemas; no product API yet.
- DI-01 must not invent a second schema language.
- API Extractor reports reflect inferred public types from protocol exports.

## Architecture Checks

- `protocol` never imports `sdk` or desktop `src/`.
- Domain never imports Zod or protocol packages.
- No `any` / `@ts-ignore` / `as unknown as` at schema boundaries.

## Related Links

- Closes: O-SCHEMA-1 in `omnicall-kit/docs/PROTOCOL.md`, ADR-0012 open table
- Feature Registry: F-011
- Related: ADR-0012, SDK-02, DI-01
