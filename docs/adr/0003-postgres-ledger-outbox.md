# ADR-0003: PostgreSQL, Append-Only Ledger and Transactional Outbox

**Status:** Proposed  
**Date:** 2026-08-21  
**Deciders:** Technical lead, finance owner, security owner

## Context

Paletto must reconcile unique inventory, asynchronous payment callbacks, refunds, seller payouts, bids, certificate changes and provider retries. Editing balances or relying on a queue write after a database commit creates unacceptable gaps.

## Decision

Use PostgreSQL as the system of record. Record economic movements in an internal double-entry, append-only ledger. Record domain state and outbox events in the same database transaction. Workers process events at least once with idempotent handlers. Corrections use compensating entries.

The ledger is bookkeeping infrastructure, not a user wallet or stored-value product.

## Options considered

| Option                                 | Auditability | Failure recovery       | Complexity                |
| -------------------------------------- | ------------ | ---------------------- | ------------------------- |
| PostgreSQL + ledger + outbox           | High         | High                   | Medium                    |
| Mutable order/payment balance columns  | Low          | Low                    | Low initially             |
| Event sourcing for all domains         | Very high    | High                   | Very high and unnecessary |
| Distributed queue publish after commit | Medium       | Gap on partial failure | Medium                    |

## Consequences

- Reconciliation and financial audit have an immutable evidence trail.
- Consumers must tolerate duplicate delivery.
- Read models are needed for convenient balances and statements.
- Ledger account design and posting rules require finance review and strong tests.

## Action items

- [ ] Approve chart of accounts and posting rules with finance.
- [ ] Add database constraints that journal entries balance.
- [ ] Define idempotency keys for payment, refund, payout and manual adjustment commands.
- [ ] Build reconciliation reports before enabling automated seller payout.
