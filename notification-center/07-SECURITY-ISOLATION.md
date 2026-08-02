# F-034 Security and Isolation

- Purpose: keep notification preferences and presentation from expanding privilege, leaking secrets, or stealing focus unsafely.
- Inputs: descriptors, journal records, settings documents, optional future OS notifications, shell raise IPC.
- Outputs: redaction/validation boundaries and stop-conditions for review.

## Trust boundaries

| Boundary | Rule |
| --- | --- |
| Domain | Pure policy + parsers only; no IO |
| Application capture | Sanitizes titles/params before journal; evaluates policy |
| Renderer | Renders allowed toasts; cannot bypass capture in product path |
| Preload / main | Raise and future OS notify use narrow typed IPC only |
| OCP remote body | Treated as untrusted text; show as text, never HTML |

## Secret and PII handling

- Reuse F-029 sanitizers for title snapshots/params.
- Password, API key, token-like fields remain redacted before journal persistence.
- Logs must not include raw notification bodies from OCP, Authorization headers, SIP passwords, or pairing secrets.
- Preferences documents contain no secrets (booleans/enums/numbers only).

## Focus and window isolation

- Default preferences must not introduce new automatic raises.
- Optional `errors_only` raise requires allowlisted IPC reason + dedupe.
- Informational/remote classes never raise.
- SDK-hide intentional concealment must not be undone by success/info toasts.
- Critical telephony/SDK attention paths remain producer-owned and must not wait on notification prefs.

## OS notification seam (deferred)

When/if implemented:

- Main-process only via `NotificationGateway`.
- Renderer supplies already-sanitized title/body.
- Click handler focuses existing shell; no arbitrary URL open from notification payload.
- Respect OS permission denial without crashing capture/toast path.

## Settings / profile isolation

- Preferences are per `SettingsAccountKey`.
- Profile A cannot read Profile B preferences.
- Journal identity filters remain; do not expose other OS users’ data beyond existing app-scoped journal design.

## XSS / injection

- Toast and history render plain text / i18n keys only.
- OCP `messageText` must not be interpreted as HTML/Markdown with scripts.
- Storybook fixtures must not introduce `dangerouslySetInnerHTML` patterns.

## Threat mitigations

| Threat | Mitigation |
| --- | --- |
| Malicious OCP notification spam | Module disable + minLevel; no raise for remote; sticky still suppressible |
| Preference export leaks | No secrets in prefs; journal excluded |
| Focus steal harassment | Raise default never; actionable-only; dedupe |
| Renderer bypass of policy | Facade/capture is sole authority; code review + tests |
| Schema downgrade confusion | Fail closed; no silent dual-write drift |

## Review stop conditions

Stop for a new ADR/product decision if implementation would require:

- Broad `raiseShellWindow` on every toast.
- Raw `ipcRenderer` / Node in renderer for notifications.
- Storing unsanitized OCP payloads in journal.
- Gating ADR-0013 critical raises behind module prefs.
- Executing links/scripts from notification bodies.
