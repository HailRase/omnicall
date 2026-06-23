# Step 07: Transfer & Multi-call (DEFERRED)

## Do after R1–R6 stable

- `blindTransfer` / `attendedTransfer` on JsSIP REFER
- Multi-call hold-all on real SBC
- LF-028, LF-029, LF-021, LF-023, LF-032

## Risk

Highest regression area — requires dedicated slice and SBC test extensions.

## Prerequisite

Document REFER semantics of your SBC in ADR before coding.

## Gate

- P05 mock regression still green
- Manual transfer smoke on two test extensions

## Update PROGRESS

Mark step 07 `done` only when transfer smoke passes.
