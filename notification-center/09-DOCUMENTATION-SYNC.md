# F-034 Documentation Sync

- Purpose: keep canonical product truth aligned with Notification Center implementation evidence.
- Inputs: completed WUs, test results, ADR decisions, UI/i18n changes, release decision.
- Outputs: synchronized registry, status, queue, handoff, ADR, coverage, and work history.

## WU-00 canonical bootstrap

- [x] Add `F-034: Notification Center` to `docs/softphone/Feature-Registry.md`.
- [x] Context Settings; related F-016, F-029, LF-060, ADR-AF-007, ADR-0013; status `in-progress`.
- [x] Add F-034 active/planned line and branch `feature/notification-center` to `docs/softphone/STATUS.md`.
- [x] Add `T-053` Notification Center WU track to `docs/softphone/TASK-QUEUE.md` as `claimed`.
- [x] Create `docs/softphone/handoffs/P15-Notification-Center-Master-Handoff.md`.
- [x] Create proposed `docs/softphone/adr/ADR-0025-notification-center-preferences-policy.md`.
- [x] Mark WU-00 evidence in `notification-center/PROGRESS.md`.

Do not mark F-034 implemented, bump SemVer, or edit CHANGELOG/manifest during WU-00.

## Per-WU updates

| WU | Canonical updates required |
| --- | --- |
| WU-01 | Registry data-model/migration evidence; handoff schema N→N+1; ADR-0025 preferences shape |
| WU-02 | Policy matrix evidence; CaptureService outcome shape; ADR-0025 accepted before raise extension |
| WU-03 | Tagging evidence across producers; I18N keys only if copy added |
| WU-04 | Settings hub Preferences UI; I18N coverage; UI catalog |
| WU-05 | Appearance relocation; General deep-link; geometry non-regression note |
| WU-06 | History module filter expansion; F-029 cross-evidence |
| WU-07 | F-030 export design + registry cross-evidence |
| WU-08 | Optional raise reason: ADR-0013 amendment evidence **or** explicit deferral note |
| WU-09 | Optional OS gateway: port/ADR note **or** explicit deferral |
| WU-10 | F-034 implemented only when acceptance passes; STATUS/TASK-QUEUE/handoff close; release docs only if shipping |

## Master handoff contents

`docs/softphone/handoffs/P15-Notification-Center-Master-Handoff.md` tracks:

- Feature/context/branch and locked non-goals.
- WU status/evidence table.
- ADR-0025 decision state.
- Compatibility law checklist.
- Module catalog and producer tagging matrix.
- Settings schema + F-030 compatibility.
- Relationship to F-029 / LF-060 / ADR-0013.
- Automated and manual evidence.
- Non-regression statement for SIP/OCP/SDK/headset/incoming UI/toast geometry.
- Open risks and review gate.

## Work history

Each completed WU writes one Russian entry:

```txt
work-history/YYYY-MM-DD/notification-center-wuXX_HH-mm.md
```

## Release docs

Only when user authorizes a ship cut after acceptance:

- SemVer per `version-release.mdc` (MINOR for user-visible Notification Center).
- `CHANGELOG.md`, `npm run release:sync-manifest`, tag/CI per release playbook.
