# ADR-0000: Decision Title

## Type

DOCUMENT.

This document records one architecture decision.

## Status

Proposed.

Allowed values:

- Proposed
- Accepted
- Superseded
- Rejected
- Deprecated

## Context

Describe the technical situation and constraints.

Include:

- affected feature IDs
- affected bounded contexts
- affected layers
- current limitation
- decision deadline or trigger

## Decision

State the chosen decision clearly.

The decision must explain:

- what changes
- what remains unchanged
- which boundaries are affected
- which rule exception is approved, if any

## Alternatives Considered

List serious alternatives.

For each alternative include:

- benefits
- risks
- why it was not chosen

## Consequences

Describe consequences:

- positive outcomes
- negative trade-offs
- testing impact
- observability impact
- migration impact
- rollback plan

## Architecture Checks

Confirm:

- Domain remains framework-independent.
- UI does not access adapters.
- OCP remains optional.
- External libraries remain replaceable.
- State transitions remain explicit.
- Critical flows remain observable.

## Related Links

- Feature Registry:
- Pull Request:
- Audit Finding:
- Supersedes:
- Superseded By:
