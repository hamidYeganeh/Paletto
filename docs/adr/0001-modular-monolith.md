# ADR-0001: Domain-Oriented Modular Monolith

**Status:** Proposed  
**Date:** 2026-08-21  
**Deciders:** Technical lead, backend lead, product owner

## Context

Paletto must eventually support catalogue, identity, payment, fulfilment, provenance, secondary sales, auctions, B2B and analytics. Most early high-risk flows share strong consistency needs, while the initial team and traffic do not justify independent service ownership.

## Decision

Build one transactional backend deployable organized into explicit domain modules. Each module owns its tables and business rules, communicates through typed application interfaces and emits versioned outbox events. Deploy media/search/notification background work separately as workers. Extract a module only after measured operational or ownership pressure.

## Options considered

| Option                              | Complexity    | Consistency                    | Independent scale                      | Team fit                          |
| ----------------------------------- | ------------- | ------------------------------ | -------------------------------------- | --------------------------------- |
| Modular monolith                    | Medium        | Strong/simple                  | Module-level process scaling initially | Best                              |
| Microservices from v1               | Very high     | Distributed transactions/sagas | Excellent                              | Poor for early team               |
| Unstructured Next.js full-stack app | Low initially | Possible but boundaries erode  | Limited                                | Fast start, high marketplace risk |

## Consequences

- Orders, inventory, ledger and ownership can use one ACID transaction where appropriate.
- Local development, test setup and incident diagnosis remain tractable.
- Architectural discipline is required to prevent cross-module table mutation.
- Deployments of the API are initially coupled.
- Extraction later requires preserving contracts and moving data ownership, which is why ports/events exist from the beginning.

## Action items

- [ ] Define module dependency rules and enforce them in lint/architecture tests.
- [ ] Assign every table to exactly one module owner.
- [ ] Add transactional outbox and idempotent consumer framework before v1 commerce.
- [ ] Review extraction triggers quarterly after v3.
