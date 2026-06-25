# UI Smoke Enablers (RAT / Manual QA)

## Type

DOCUMENT.

Renderer UX gaps that block or complicate real-adapter manual smoke. Adapter track: `PROGRESS.md` (steps 00–08 closed).

## Closed RAT Dependencies

| Smoke | Issue | UI fix | Phase |
| --- | --- | --- | --- |
| R7-5 | `multiSessionsEnabled` not toggleable in UI | Settings overlay + facade `updateMultiCallSettings` | P11 WU1 / UI-2 |
| R7-* | Vertical list; hard to see zones | `SoftphoneLayout` zones | P11 WU0 / UI-1 |
| R1–R4 | Dev hints clutter | DEV-only hints | P11 WU0 |
| All | No projection debug | Diagnostics overlay (`?debug=1`) | UI-7 |

## Settings Write Path (WU1)

No Use Case for plain config flags.

```txt
SettingsOverlay → useSettingsActions → facade.updateMultiCallSettings()
  → SettingsRepository.setMultiCallSettings()   // port extension required
  → multiCallProjection via setMultiCallSettings()
```

Re-smoke R7-5 after WU1 without editing `InMemorySettingsRepository` defaults.

## Overlay Navigation Rule

During established / connecting / incoming visible call:

- Settings and Diagnostics = **overlay sheet** over ContextZone
- Do not use PanelNav to replace call screen

## Storybook & Catalog

- `npm run storybook` — visual contract for Dialpad, modals, layout
- `npm run ui:catalog` — regenerate `UI-Component-Catalog.md`

## Active Adapter Track (post UI-1)

| Next | Doc |
| --- | --- |
| F-008 DTMF real | `Feature-Registry.md` F-008; `JsSipTelephonyAdapter.sendDtmf` stub |
| P10 headset | Implementation Roadmap P10 |
| Transfer R6 | `TRANSFER-REAL-ADAPTER-BACKLOG.md` (backlog) |

## Related

- `UI-Architecture.md`, `UI-Design-System.md`
- `SMOKE-CHECKLIST.md` § R7
- `handoffs/P11-WU0-Shell-Layout-Agent-Prompt.md`
