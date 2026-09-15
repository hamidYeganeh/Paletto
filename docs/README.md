# Paletto Product & Engineering Blueprint

**Status:** Proposed baseline  
**Document version:** 1.0  
**Date:** 2026-08-21  
**Scope:** Documentation only; no feature implementation is included in this change.

This directory is the source of truth for turning Paletto from the current visual gallery prototype into a managed marketplace for Iranian art. Every product capability discussed for Paletto remains in committed scope, but it is delivered in independently releasable versions.

## Important versioning distinction

- `v1` through `v6` are **product releases** and rollout milestones.
- Public customer pages remain on stable URLs such as `/artworks/...`; production pages are not duplicated under `/v1` or `/v2` because that would damage SEO and create migration debt.
- External HTTP contracts use `/api/v1/...`, `/api/v2/...` only when a breaking API change is required.
- Internal events are versioned by schema, for example `order.paid.v1`.
- Unfinished capabilities are controlled by server-side entitlements and feature flags, not long-lived branches.

## Reading order

1. [Persian executive summary](./00-executive-summary-fa.md) — خلاصه‌ی فارسی تصمیم‌ها، نسخه‌ها و ترتیب شروع.
2. [Product requirements](./01-product-requirements.md) — vision, personas, scope and success metrics.
3. [System architecture](./02-system-architecture.md) — target components, domain boundaries and deployment model.
4. [Domain and data model](./03-domain-and-data-model.md) — entities, invariants and state machines.
5. [API, events and workflows](./04-api-events-and-workflows.md) — contract rules, endpoints, idempotency and event flows.
6. [Iran market requirements](./05-iran-market-requirements.md) — payments, Rial/Toman, Persian search, KYC, logistics and compliance.
7. [Release roadmap](./06-release-roadmap.md) — `v0` foundation and product releases `v1` through `v6`.
8. [Engineering backlog](./07-engineering-backlog.md) — executable epics and ordered tasks.
9. [Quality, security and operations](./08-quality-security-operations.md) — SLOs, test strategy, threat controls and production gates.
10. [Feature traceability](./09-feature-traceability.md) — every committed feature mapped to a release, tasks and gate.
11. [Architecture decisions](./adr/README.md) — accepted/proposed decisions and their trade-offs.

## Decision summary

| Area                   | Decision                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Delivery               | Incremental releases; all committed capabilities are preserved in the target architecture                        |
| Backend                | TypeScript modular monolith with explicit domain modules                                                         |
| Web                    | Next.js 16 App Router as UI and Backend-for-Frontend, not the system of record                                   |
| Transaction API        | Separate Node.js API using NestJS with the Fastify adapter                                                       |
| Background work        | Separate worker process consuming durable jobs and outbox events                                                 |
| Primary database       | PostgreSQL; one database initially, schema ownership per module                                                  |
| Money                  | Integer Rial values (`IRR`) at rest and in contracts; Toman is display/input only                                |
| Consistency            | Database transactions, unique constraints, state machines, idempotency and transactional outbox                  |
| Search                 | PostgreSQL Persian search first; dedicated search engine added behind an interface when thresholds are reached   |
| Files                  | S3-compatible object storage with private originals and public derivatives                                       |
| Hosting                | Domestic-first core infrastructure with vendor abstraction and no hard runtime dependency on blocked global SaaS |
| Architecture evolution | Extract services only after measured scaling, reliability or team-ownership pressure                             |

## Scope policy

All items in the release roadmap are committed product scope. “Not in v1” means “sequenced for a later release,” not cancelled. Any new requirement must include:

1. the user or compliance problem it solves;
2. the target release;
3. dependencies and acceptance criteria;
4. what moves later if team capacity does not increase.

## Planning assumptions

The roadmap assumes a stable cross-functional team of approximately:

- 1 product manager/founder;
- 1 product designer/researcher;
- 1 staff/lead engineer;
- 3 backend/platform engineers;
- 2 frontend engineers;
- 1 QA/automation engineer;
- fractional SRE/DevOps, data, legal, finance and art-operations support.

With materially fewer engineers the sequence remains valid, but calendar estimates must expand. No launch date is a commitment until capacity, vendor contracts and legal launch gates are confirmed.
