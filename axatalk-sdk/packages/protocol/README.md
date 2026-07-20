# @axatalk/protocol

Runtime schemas and inferred TypeScript types for the Axatalk local protocol v1
(ADR-0014…0017).

## Status

Implemented in **SDK-02**. Public surface is schemas, constants, validation helpers,
and compatibility helpers. There is no `AxatalkClient` and no transport.

## Source of truth

Zod schemas author the contract. Types are inferred. Golden fixtures under
`fixtures/{valid,invalid,meta}/` are the shared SDK ↔ desktop compatibility corpus
(`docs/COMPATIBILITY-FIXTURES.md`). Desktop DI-01 must load the **same bytes** without
translation.

## Install (workspace)

```bash
cd axatalk-sdk
npm ci
npm run build -w @axatalk/protocol
```

## Boundaries

- `protocol` must not import `@axatalk/sdk` or desktop `src/`.
- Domain must not import this package (desktop Application/adapters validate at the edge).
- Wire payloads are JSON-safe and redaction-safe; machine-readable errors only.
