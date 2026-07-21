# @axata/axatalk-protocol

## Unreleased — RC staging (SDK-10 Mode A)

First public release candidate target: **`0.1.0-rc.0`** on npm dist-tag **`rc`**
(linked with `@axata/axatalk-sdk`).

Packages remain `private: true` / `0.0.0` until authorized RC publish.
Stable / `latest` is **blocked on desktop DI-10**.

### Included since incubation (SDK-00…SDK-09)

- Runtime Zod schemas for local protocol v1
- Inferred TypeScript types + golden fixtures (`./fixtures/*`)
- Compatibility and negative fixtures for handshake, auth, commands, events, replies
- Public surface frozen at **169** API report symbols (`etc/api/protocol.api.md`)

### Not included

- Stable npm `latest` publish
- Desktop Domain / Electron types (forbidden dependency)
