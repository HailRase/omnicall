# Compatibility Fixture Format (shared SDK ↔ Desktop)

Frozen by **SDK-01** / ADR-0014. Files are created in **SDK-02**; desktop **DI-01** consumes
the same bytes without translation.

## Layout

```text
omnicall-kit/packages/protocol/fixtures/
  valid/<suite>/<case>.json
  invalid/<suite>/<case>.json
  meta/<suite>/<case>.meta.json
```

Suggested suites: `discovery`, `handshake`, `auth`, `command`, `reply`, `event`,
`snapshot`.

## Rules

- One JSON value per `*.json` file (protocol message or discovery document).
- Values are JSON-safe and redaction-safe (ADR-0017). No real secrets or live PII.
- `invalid` cases include sibling `meta` with at least `{ "expectedErrorCode": "..." }`.
- Desktop and SDK CI both execute the same fixture set; divergence is a Blocker.
- Fixture format version is implicit in protocol major; breaking fixture layout requires an
  ADR note in SDK-02 evidence.
