# F-031 Documentation Sync

- Purpose: keep canonical product truth aligned with implementation evidence.
- Inputs: completed WUs, test results, architecture decisions, UI/i18n changes, and release decision.
- Outputs: synchronized registry, status, queue, handoff, ADR, coverage, and work history.

## WU-00 canonical bootstrap

- [x] Add `F-031: External Services (Outbound HTTP Automations)` to `docs/softphone/Feature-Registry.md`.
- [x] Set context Integration, legacy IDs `_none_`, status `planned` or `in-progress`, related F-016/F-023/F-024/F-028/F-030, and explicit non-overlap with F-011.
- [x] Add F-031 planned/active line and branch to `docs/softphone/STATUS.md`.
- [x] Add `T-052` F-031 WU track to `docs/softphone/TASK-QUEUE.md` as `claimed`.
- [x] Create `docs/softphone/handoffs/P14-External-Services-Master-Handoff.md`.
- [x] Create proposed `docs/softphone/adr/ADR-0022-external-services-http-isolation.md`.
- [x] Mark WU-00 evidence in `external-services-plan/PROGRESS.md`.

Do not update I18N coverage, CHANGELOG, release manifests, or feature status to implemented during WU-00.

## Per-WU updates

| WU | Canonical updates required |
| --- | --- |
| WU-01 | F-031 registry data-model/migration evidence; handoff schema v12 note. |
| WU-02 | F-031 port/mock evidence; ADR-0022 contract details accepted before real HTTP implementation. |
| WU-03 | F-031 stable trigger/variable evidence; handoff exact campaign/ACD map. |
| WU-04 | F-031 execution/manual-run evidence; ADR-0022 final HTTP limits/redirect policy. |
| WU-05 | F-023 cross-reference and F-031 profile lifecycle evidence. |
| WU-06 | Update `docs/softphone/P11-Operator-Preferences-Export-Design.md`; add F-030 and F-031 cross-evidence. |
| WU-07 | F-031 collection transfer format evidence and handoff compatibility note. |
| WU-08 | Add I18N coverage row; update icon/UI catalog evidence if touched; F-016 nav cross-reference. |
| WU-09 | I18N coverage editor/Run namespaces and UI test/Storybook evidence. |
| WU-10 | I18N coverage journal namespace and redaction/truncation UI evidence. |
| WU-11 | F-031 event/focus integration evidence; F-028 consume-only note; no OCP protocol acceptance changes. |
| WU-12 | F-031 implemented only when all acceptance passes; STATUS/TASK-QUEUE/handoff close; release docs only if shipping. |

## Master handoff contents

`docs/softphone/handoffs/P14-External-Services-Master-Handoff.md` tracks:

- Feature/context/branch and locked non-goals.
- WU status/evidence table.
- ADR-0022 decision and acceptance state.
- Exact runtime composition and disposal points.
- Trigger/variable/focus matrix.
- Settings schema and F-030 compatibility.
- Automated and manual evidence.
- Non-regression statement for SIP/OCP/SDK/headset/transfer.
- Open risks and review gate.

## Feature Registry contract

F-031 entry must eventually contain:

- Inputs: active-profile config, supported committed events, and manual Run now.
- Outputs: isolated outbound attempts and redacted profile journal.
- Acceptance: enable gates, focused-line policy, concurrency three, timeout 10 seconds, methods/body modes, templates, Run result, cap/redaction, profile/F-030 portability, UI/i18n.
- Test coverage paths by WU.
- ADR-0022 and handoff references.
- Explicit “new feature; no LF parity”.

Do not add a fake LF entry to `Legacy-Feature-Coverage.md`; update it only if implementation discovery proves an actual legacy behavior mapping.

## I18N coverage

During WU-08 add a row to `docs/softphone/I18N-Coverage.md` for:

```txt
settings.integrations.externalServices.*
settings.nav.integrations.externalServices
icons.settings.integrations.externalServices
```

Extend the same row in WU-09/WU-10 with editor, Run, journal tests and `npm run i18n:check` evidence.

## UI and icon catalogs

- Run `npm run ui:catalog` when components/test IDs change.
- Update the existing component catalog only when its generator or current convention requires committed output.
- Register the semantic External Services icon through `src/renderer/components/icons/iconCatalog.ts` and canonical icon docs.
- Do not mark incomplete generic UI Kit components complete as part of product WUs.

## Preferences design

WU-06 updates `docs/softphone/P11-Operator-Preferences-Export-Design.md`:

- `UserSettings` v12 includes External Services definitions.
- Outer F-030 format stays v1 unless outer shape changes.
- Journal excluded.
- Existing SIP/OCP/SDK/machine exclusions unchanged.
- External Services authored header/query values are portable and exported files may contain integration credentials.
- Import refreshes the F-031 runtime registry.

## Work history

Every completed implementation/planning session writes one Russian entry:

```txt
work-history/YYYY-MM-DD/external-services-<topic>_HH-mm.md
```

Use status `выполнено` or `не выполнено`, include key paths, 3–6 changes, purpose, result, verification, and commit hash or `—`. Update the same session entry if status changes.

## Release synchronization

Only WU-12 decides release handling:

- A completed user-visible F-031 gate requires a MINOR bump under `version-release.mdc`.
- Update only `package.json` version, `CHANGELOG.md`, generated manifests via `npm run release:sync-manifest`, and work history.
- Run release preflight before a release cut.
- Do not build installers, tag, commit, or push unless the user explicitly requests the applicable action.

## Drift gate

Before marking WU-12 done:

- [ ] Plan, registry, STATUS, TASK-QUEUE, handoff, ADR, I18N coverage, and F-030 design agree.
- [ ] No plan-only acceptance contradicts implemented behavior.
- [ ] Every `done` WU has code/test/doc/work-history evidence.
- [ ] Feature status is not `implemented` while a quality gate remains open.
