# ADR-0004: Domestic-First Infrastructure and Provider Abstraction

**Status:** Proposed  
**Date:** 2026-08-21  
**Deciders:** Technical lead, SRE, operations, legal

## Context

Iranian users can experience international network disruption, and several global payment, identity, messaging and hosting services do not support Iran. Domestic providers also differ in reliability and contract/API quality. A hard vendor dependency can make the marketplace unavailable or impossible to operate legally.

## Decision

Host the core runtime, transactional data, media origin and operational access on infrastructure reachable from Iran. Integrate payment, identity, SMS, carrier, storage and search through domain-neutral ports. Critical capabilities require a manual recovery path and, where economically justified, a second provider adapter.

## Options considered

| Option                                 | Domestic continuity | Vendor flexibility | Global reach                       |
| -------------------------------------- | ------------------- | ------------------ | ---------------------------------- |
| Domestic-first + adapters              | High                | High               | Requires later compliant extension |
| Global-only SaaS                       | Low                 | Medium             | High where permitted               |
| Single domestic vendor tightly coupled | Medium              | Low                | Low                                |

## Consequences

- Some managed global conveniences are unavailable or optional.
- Adapter and contract-test work is required.
- Core commerce remains operable during foreign-service disruption.
- International rollout requires a separate legal and infrastructure review.

## Action items

- [ ] Select primary and fallback providers using a scored operational review.
- [ ] Define provider health, timeout, circuit-breaker and manual fallback behavior.
- [ ] Run a quarterly foreign-dependency outage exercise.
- [ ] Keep all provider secrets and raw evidence within approved data locations.
