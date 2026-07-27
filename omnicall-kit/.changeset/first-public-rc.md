---
"@softomnitel/omnicall-protocol": minor
"@softomnitel/omnicall-kit": minor
---

First public release candidate.
With workspace already in `changeset pre` mode (tag `rc`), `changeset version`
produces **`0.1.0-rc.0`** for both packages (not bare `0.1.0`).
Incubation complete through SDK-09 (protocol + OmniCallClient namespaces, docs, examples).
Publish only under non-default npm tag `rc` until DI-10 packaged E2E closes stable gates.
Do not apply this changeset for a `latest` promote while DI-10 is open;
exit pre mode first (`changeset pre exit`) only for Mode B stable.
