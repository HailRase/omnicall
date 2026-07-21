# @axata/axatalk-sdk

## Unreleased — RC staging (SDK-10 Mode A)

First public release candidate target: **`0.1.0-rc.0`** on npm dist-tag **`rc`**.

Packages remain `private: true` / `0.0.0` in the incubating workspace until a human
authorizes registry publish. Stable / `latest` is **blocked on desktop DI-10** (packaged
Electron E2E).

### Included since incubation (SDK-00…SDK-09)

- `AxatalkClient` lifecycle: connect, pair, ready, disconnect, revoke, incompatible
- Namespaces: `calls`, `account`, `operator`, `window.show`
- Fail-closed capabilities; privileged caps stripped at pairing (`account.activate`, `window.hide`)
- Bounded reconnect with fresh snapshot; no mutation replay
- Public surface frozen at **47** API report symbols (`etc/api/sdk.api.md`)

### Not included

- Stable npm `latest` publish
- Packaged Electron E2E claims (DI-10)
- Example `crm-pairing-lite` as a published package (workspace-private)
