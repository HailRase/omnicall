# ADR-0023: External Services per-trigger delay

- Status: **Accepted**
- Date: 2026-07-30
- Related: F-031, ADR-0022

## Decision
- Automatic bindings use integer delays from 0 to 180 seconds; delay zero enqueues immediately.
- Capture definitions, variables, focus eligibility, and lifecycle stamps at event time; never re-read context at timer fire.
- Cancel waiting jobs on lifecycle, revision, dispose, or operator cancellation; do not abort in-flight HTTP and do not journal drops.
- Queue exposes delayed waiting jobs only; logout warns when any are waiting; process restart and OS sleep have no recovery policy.

## Consequences
- FIFO concurrency remains three; delayed jobs join it when their timers fire.
- Manual Run now ignores bindings; call terminal events never cancel a scheduled job.
