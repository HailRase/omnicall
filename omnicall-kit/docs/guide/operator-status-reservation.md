# Operator status change & post-call reservation

Canonical host contract for Ready/Break intent via `@softomnitel/omnicall-kit`.  
Desktop owns OCP FSM / busy rules; the SDK is a protocol client only.

## One command

```ts
const result = await client.operator.changeStatus({
  target: 'break', // or 'ready'
  reasonId, // optional; desktop may default from reasons catalog
  expectedRevision
});

// result.kind === 'applied'  → immediate Ready/Break command sent to OCP
// result.kind === 'reserved' → post-call booking; current chip does NOT flip yet
```

Do **not** invent `operator:reserve-status` or branch on mid-call OCP numeric statuses
in the browser. Public coarse status during a call is usually `unknown`.

## Success reply: fields and handling

`changeStatus()` and `finishAppeal()` resolve with the same complete shape:

```ts
type OperatorStatusChangeResult = {
  readonly accepted: true;
  readonly kind: 'applied' | 'reserved';
  readonly targetStatus: PublicOperatorStatus;
  readonly reasonId: number;
  readonly revision: number;
};
```

| Field | Meaning | Host action |
| --- | --- | --- |
| `accepted` | Always literal `true` on success. Rejections are thrown as `OmniCallClientError`, not returned here. | Do not create a `false` branch. |
| `kind` | `applied` means Desktop applied the target now; `reserved` means it stored a post-call booking. | This is the required branch for UI behavior. |
| `targetStatus` | The requested effective Ready/Break target. For `reserved`, it is the booked target, **not** the current coarse status. | Use for an immediate confirmation message only; recover persistent booking from snapshot/event. |
| `reasonId` | The accepted reason, including a Desktop-selected default when the request omitted `reasonId`. | Keep it with the booking/status label, not the requested optional value. |
| `revision` | Revision after this mutation. | Refresh snapshot before another mutation when UI/event cache may have changed. |

For example, a successful in-call Break request may be:

```ts
{
  accepted: true,
  kind: 'reserved',
  targetStatus: 'break',
  reasonId: 12,
  revision: 47
}
```

It confirms a **booking**, not an immediate `break` state. The current snapshot can
remain `unknown` during a call or become `post_call_processing` afterwards.

## When desktop reserves vs applies

| Current operator situation | `changeStatus` outcome |
| --- | --- |
| Idle Ready / Break / Preparing | `kind: "applied"` |
| Busy (talking, hold, ringing, …) or post-call processing | `kind: "reserved"` |

Apply of a booking is a separate explicit step:

```ts
// Only while snapshot/event status === 'post_call_processing'
await client.operator.finishAppeal({ expectedRevision });
```

**Finish target (desktop):** `finishAppeal` applies the **local** booking
(`reservedTarget` / `reservedReasonId` on the last snapshot) or **defaults to Ready**
when no booking is present. Always `await changeStatus` and confirm
`kind: "reserved"` (or re-read snapshot `reservedTarget`) before finishing.
Do not finish from optimistic CRM UI alone.

`finishAppeal` returns `kind: 'applied'` with the target and reason that Desktop
actually applied. It can reject with `conflict` and
`details.failure_kind: 'not_in_post_call_processing'`; wait for the snapshot status
instead of retrying outside post-call processing.

## Desktop UI (OmniCall OperatorStatusSelector)

| Surface | Behavior while booking is active |
| --- | --- |
| Header chip | Coarse / system label (e.g. post-call processing) — does **not** flip to Break/Ready |
| Dropdown options | Reserved Ready/Break reason is `isCurrent` (green/orange current chrome, inert) |
| Finish footer | `Завершить обращение: {reserved reason \| Доступен}` — same booking as finish target |

Booking chrome uses the same projection fields as the public snapshot
(`reservedTarget` / `reservedReasonId`). No separate reserve command.

## Observability (additive, compatible)

| Surface | Fields |
| --- | --- |
| `changeStatus` / `finishAppeal` reply | `kind`, `targetStatus`, `reasonId`, `revision` |
| Snapshot `sections.operator` | optional `reservedTarget`, `reservedReasonId` |
| Event `operator:status-changed` | optional `reservedTarget`, `reservedReasonId` |

After reconnect, re-read the snapshot — do not assume a prior `kind: "reserved"` reply
is still active without `reservedTarget` on the fresh snapshot.

## Revision

- Mutations require fresh `expectedRevision`.
- Desktop coarse-advances revision when public coarse status, Ready/Break `reasonId`,
  `connected`, or **reservation booking** (`reservedTarget` / `reservedReasonId`) changes.
- Mid-call talking↔hold both map to `unknown` and do **not** advance.

## Anti-patterns

| Wrong | Right |
| --- | --- |
| CRM checks “is busy?” then calls a reserve API | Always `changeStatus`; read `kind` |
| Treat `kind: "reserved"` as chip = Break/Ready | Keep showing coarse status; show booking UI from `reservedTarget` |
| Call `finishAppeal` without a confirmed booking | Await `changeStatus` → `reserved`; expect Ready if snapshot has no `reservedTarget` |
| Block all SDK commands while reserved | Only serialize mutations via revision/mutex; finish-appeal stays available in PCP |
| Mirror OCP `RESERVED_TO_CALL` (queue) as booking | Different concept; public API does not expose that enum |

See also: [Events](./events.md), [API reference](./api-reference.md), [Security anti-patterns](./security-anti-patterns.md).
