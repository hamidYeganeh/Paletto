# ADR-0002: Next.js BFF and Separate Transaction API

**Status:** Proposed  
**Date:** 2026-08-21  
**Deciders:** Technical lead, frontend lead, backend lead

## Context

The repository uses Next.js 16.2.6. Paletto needs SEO and server rendering, but also stable APIs for admin, future clients, PSP/carrier webhooks, background jobs, reconciliation and auctions. Next.js documentation describes its backend features as a BFF/API layer and notes runtime limitations for long-running work and WebSockets on some hosts.

## Decision

Use Next.js for customer/admin rendering and browser-specific BFF concerns. Put transactional commands, resource authorization and domain behavior in a separate private/public API. Put long-running and retryable work in workers. Server Components call the private API directly; they do not make HTTP loopback calls through public Route Handlers.

## Options considered

| Option                  | Initial speed | Boundary clarity   | Future clients            | Background work                           |
| ----------------------- | ------------- | ------------------ | ------------------------- | ----------------------------------------- |
| Next BFF + API + worker | Medium        | Strong             | Strong                    | Strong                                    |
| Next-only full stack    | High          | Weakens with scope | Requires later extraction | Host-dependent                            |
| SPA + API               | Medium        | Strong             | Strong                    | Strong, but sacrifices SSR/SEO simplicity |

## Consequences

- One additional deployable and local service are introduced.
- Public contracts and authorization live in one API boundary.
- The existing web experience can evolve without owning money/inventory rules.
- Browser-specific aggregation can change rapidly without versioning the core API.

## Action items

- [ ] Define private service authentication between BFF and API.
- [ ] Generate typed clients from OpenAPI into `packages/contracts`.
- [ ] Prohibit direct database imports from `apps/web` and `apps/admin`.
- [ ] Document which Route Handlers are public browser callbacks versus BFF proxies.
