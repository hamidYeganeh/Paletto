# System Architecture

**Status:** Proposed  
**Architecture style:** Domain-oriented modular monolith  
**Evolution strategy:** Extract by measured pressure, not prediction

## 1. Context and constraints

Paletto is a two-sided, high-trust marketplace for mostly unique physical inventory. The difficult parts are not raw request volume; they are correctness, evidence, provider failure, operational recovery and evolving Iranian regulatory/payment/logistics requirements.

Current repository constraints:

- npm workspaces and Turborepo;
- Next.js 16.2 App Router, React 19 and TypeScript;
- a single `apps/web` visual prototype;
- no backend, database, queue, identity, operations console or deployment baseline yet.

The installed Next.js 16 documentation explicitly positions Route Handlers as a Backend-for-Frontend layer rather than a complete backend replacement. Paletto also needs stable APIs for admin, future mobile clients, PSP/carrier callbacks, long-running work and auction traffic. Therefore the system separates the UI/BFF from the transactional API and workers.

## 2. Quality attributes

Priority order:

1. **Correctness and auditability** — no double-sale, lost payment, unexplained payout or mutable bid history.
2. **Security and privacy** — protect identity, bank, address, collection and expert evidence.
3. **Recoverability** — operators can identify and resume every failed workflow.
4. **Domestic availability** — core service remains functional without a foreign SaaS dependency.
5. **Maintainability** — modules have explicit ownership, contracts and tests.
6. **Performance** — fast catalogue discovery on mobile and slow networks.
7. **Scalability** — horizontal growth without an early distributed-system tax.

## 3. Design envelope

These are architecture envelopes, not forecasts.

| Dimension                     | Early releases | Target envelope before major re-architecture |
| ----------------------------- | -------------: | -------------------------------------------: |
| Registered accounts           |         50,000 |                                    5,000,000 |
| Published works               |         10,000 |                                    1,000,000 |
| Media objects                 |        100,000 |                                   20,000,000 |
| Completed orders/day          |            100 |                                       20,000 |
| Normal API traffic            |         50 RPS |                                    2,000 RPS |
| Auction peak                  |            N/A |        500 bid commands/second per hot event |
| Catalogue availability target |       99.5% v1 |                                    99.9% v3+ |
| Checkout availability target  |       99.5% v1 |                                   99.95% v4+ |
| RPO / RTO                     |  15 min / 2 hr |        5 min / 30 min for transactional data |

Before any extraction, load and failure tests must show which boundary is under pressure.

## 4. High-level system

```text
                    +---------------------------+
                    | Browsers / PWA / future app|
                    +-------------+-------------+
                                  |
                         CDN/WAF/Rate limiting
                                  |
          +-----------------------+-----------------------+
          |                                               |
+---------v----------+                          +---------v----------+
| Next.js Web + BFF  |                          | Next.js Admin BFF  |
| SSR/RSC/SEO/session|                          | Ops UI/dual control|
+---------+----------+                          +---------+----------+
          |                                               |
          +----------------------+------------------------+
                                 |
                         Private service network
                                 |
                    +------------v-------------+
                    | Transaction API          |
                    | NestJS + Fastify          |
                    | Modular monolith          |
                    +---+----------+---------+--+
                        |          |         |
               +--------v--+  +----v----+ +--v----------------+
               |PostgreSQL |  | Redis   | | Object storage    |
               |SoR/outbox |  |cache/jobs| | private + public |
               +--------+--+  +----+----+ +---------+---------+
                        |          |                |
                    outbox/jobs    |                | direct signed upload
                        |          |                |
                    +---v----------v----------------v---+
                    | Worker processes                 |
                    | media, search, notifications,     |
                    | reconciliation, fulfilment, docs  |
                    +--+-------+-------+-------+--------+
                       |       |       |       |
                    PSP/KYC  SMS     Carrier  Search/analytics
                    adapters adapters adapters projections
```

## 5. Deployable units

### `apps/web`

- Next.js customer experience, SSR/RSC, SEO and public content;
- session-aware BFF endpoints only where browser clients require them;
- direct server-side calls to the private API, not loopback calls to its own Route Handlers;
- no ownership of transactional business rules or database access;
- public catalogue pages can be cached; user/order data is private and uncached.

### `apps/admin`

- separate Next.js operations application and deployment;
- not publicly indexed;
- mandatory staff MFA and stricter session policy;
- queues for verification, moderation, orders, disputes, payments, payouts, auctions and compliance;
- dual approval for manual ledger adjustments, payout overrides, certificate revocation and high-risk account changes.

### `apps/api`

- the only synchronous owner of transactional commands;
- NestJS application using the Fastify HTTP adapter;
- REST/OpenAPI external contract under `/api/v1`;
- domain modules enforce invariants and resource authorization;
- database changes and outbox events commit in one transaction;
- no long-running media, provider polling or batch work inside request handlers.

### `apps/worker`

- BullMQ-compatible workers backed by Redis;
- consumes jobs and transactional outbox records;
- retries with exponential backoff, jitter and dead-letter queues;
- performs media derivatives, search indexing, notifications, payment reconciliation, statement generation, carrier polling and analytics export;
- all handlers are idempotent and record attempt/result metadata.

## 6. Proposed repository shape

This is a target layout, not an implementation performed by this documentation change.

```text
apps/
  web/                   # existing customer application
  admin/                 # operations console
  api/                   # modular transaction API
  worker/                # asynchronous consumers and schedulers
packages/
  ui/                    # shared visual primitives
  contracts/             # OpenAPI-derived clients, schemas, event contracts
  config/                # typed runtime configuration
  observability/         # logging, tracing, metrics helpers
  testkit/               # factories, provider fakes, contract fixtures
  eslint-config/
  typescript-config/
docs/
```

Business rules must not be placed in `packages/ui` or duplicated between web and API. Shared contracts describe data; the API owns domain behavior.

## 7. Domain modules

Each module owns its tables, commands, policies and emitted events. Cross-module reads use explicit application services or read models; modules must not mutate another module’s tables directly.

| Module               | Responsibilities                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Identity & Access    | accounts, phone/email verification, sessions, MFA, devices, roles and permissions                |
| Organizations        | galleries, businesses, teams, memberships and invitations                                        |
| Verification         | KYC/KYB cases, bank-account match, sanctions/risk flags and review outcomes                      |
| Artist               | public artist identity, CV, representation, biography and claims                                 |
| Catalogue            | artworks, media, medium, dimensions, editions, collections and publication lifecycle             |
| Inventory            | ownership source, physical location, availability, reservation and unique-sale invariant         |
| Trust & Provenance   | certificates, condition reports, expert opinions, provenance, custody and ownership transfer     |
| Discovery            | Persian normalization, search projection, recommendations, visual similarity, follows and alerts |
| Content              | editorial stories, curated exhibitions, CMS, SEO metadata and policy-managed copy                |
| Offers & Commissions | price offers, negotiations, commissioned-work proposals, milestones and approvals                |
| Orders               | checkout, order lines, totals, policy snapshot, cancellation and orchestration state             |
| Payments & Ledger    | payment attempts, callbacks, refunds, internal accounts, journal entries, invoices and payouts   |
| Fulfilment           | packaging, service zones, shipments, condition evidence, installation and damage claims          |
| Secondary Market     | resale intake, valuation, wanted lists, private/fixed-price sales and resale contribution        |
| Auctions             | auction catalogue, registration, deposits, lots, bids, anti-sniping, close and settlement        |
| B2B                  | trade accounts, projects, room boards, quotes, approvals, rental and rotation                    |
| Moderation & Support | reports, queues, disputes, evidence, policy versions and decisions                               |
| Notifications        | templates, preferences, in-app/SMS/email delivery and provider fallback                          |
| Analytics            | product event catalogue, privacy controls, read models and exports                               |
| Audit & Compliance   | immutable staff/user action log, retention, legal hold and compliance reports                    |

## 8. Storage architecture

### PostgreSQL: system of record

Reasons:

- unique inventory and financial flows need strong transactions and constraints;
- relational ownership/provenance data is naturally connected;
- mature backup, point-in-time recovery and audit tooling;
- JSONB remains available for provider-specific evidence without replacing core typed columns.

Rules:

- one PostgreSQL cluster initially;
- separate schemas or strongly enforced table prefixes per module;
- only the owning module writes its tables;
- public IDs are UUIDv7/ULID-like sortable opaque identifiers; sequential database IDs are never exposed;
- money uses `bigint` Rial values, never floating point;
- timestamps are UTC; display uses `Asia/Tehran` and Jalali conversion at boundaries;
- append-only records for ledger entries, bids, certificate history and audit events;
- soft deletion is not a universal default: financial/evidence records are immutable, user content follows retention policy, and accidental “deleted_at everywhere” is prohibited.

### Redis

Permitted uses:

- distributed rate limiting;
- short-lived reservation coordination backed by a PostgreSQL truth;
- cache of safe derived reads;
- job queues, delayed jobs and deduplication markers;
- ephemeral live-auction fan-out.

Redis is never the sole record of a payment, order, bid, entitlement or ownership event.

### Object storage

- separate buckets/containers for private originals, evidence, public derivatives and exports;
- direct browser upload using short-lived signed URLs;
- content-type, file signature, size and malware validation before publication;
- derivative pipeline for resize, format conversion, watermark and metadata stripping;
- immutable/checksummed evidence objects;
- lifecycle and retention rules by data class;
- origin and primary copy hosted where domestic users and operations can reach it reliably.

### Search

Phase 1:

- PostgreSQL full-text/trigram indexes over normalized Persian fields;
- denormalized search document refreshed through outbox events;
- cursor pagination and deterministic ranking.

Extraction threshold:

- catalogue/read load threatens transactional SLOs;
- faceting or visual similarity exceeds PostgreSQL operational limits;
- reindex duration exceeds the recovery target;
- independent discovery team ownership is justified.

At that point add an OpenSearch/compatible engine behind the existing `SearchPort`; PostgreSQL remains authoritative.

### Analytics

- transactional metrics come from authoritative read models;
- product events follow a versioned event catalogue;
- events are streamed/batched through an outbox-derived pipeline to a privacy-controlled analytics store;
- analytics failure must never block checkout, bidding or fulfilment.

## 9. Synchronous and asynchronous rules

Use synchronous calls when the user must know the authoritative result now:

- reserve unique inventory;
- submit/accept an offer;
- create an order;
- record verified payment callback;
- place a bid;
- change ownership or certificate state.

Use durable asynchronous work when eventual completion is acceptable:

- create media derivatives;
- update search index;
- send SMS/email;
- poll payment/carrier status;
- generate invoice PDFs and statements;
- compute recommendations and analytics;
- alert followers and wanted-list users.

The transaction that changes state also writes an outbox event. A worker publishes/processes that event at least once; consumers must be idempotent.

## 10. Key consistency patterns

### Unique artwork reservation

- authoritative inventory row is locked/updated in PostgreSQL;
- a partial unique constraint prevents more than one active reservation/order for a unique work;
- reservation has server-issued expiry;
- expiration worker releases stale reservations;
- late payment enters reconciliation/manual-review state and never silently steals an already sold work.

### Payments and payouts

- provider requests use idempotency keys where supported;
- every callback is signature-verified, timestamp-checked and deduplicated;
- provider status and raw signed evidence are retained;
- internal double-entry ledger records economic truth; provider data proves cash movement;
- payout requires fulfilled/accepted order, passed risk gates and balanced ledger;
- manual adjustments create compensating entries, never edits.

### Auctions

- server time is canonical;
- bids are commands with client request IDs;
- lot row/version is locked for validation and sequence allocation;
- accepted bids are append-only;
- anti-sniping extension is a deterministic policy snapshot on the lot;
- live UI may be eventually updated, but authoritative bid response is synchronous;
- close job is idempotent and validates no eligible later bid exists.

## 11. Provider abstraction

All external capabilities are ports with at least one production adapter and one deterministic fake:

- `PaymentGatewayPort`;
- `IdentityVerificationPort`;
- `SmsPort` and `EmailPort`;
- `CarrierPort`;
- `ObjectStoragePort`;
- `SearchPort`;
- `ImageAnalysisPort`;
- `Currency/Calendar` utilities.

Provider payloads are translated at the adapter edge. Domain code never branches on a vendor name. A second SMS/payment/carrier route can be enabled without changing order logic.

## 12. Caching and rendering

- public artist, artwork, collection and editorial pages use tagged cache/revalidation;
- availability and price are validated at reservation time even if catalogue HTML was cached;
- authenticated collection, order, payment, KYC and admin data is never placed in a public/shared cache;
- Next.js Server Components call the private API directly rather than fetching the application’s public Route Handlers;
- DTOs contain only fields permitted for the current viewer;
- client components never receive database entities or secret provider fields;
- media uses responsive derivatives and lazy loading; 3D content is opt-in and has static fallback.

## 13. Deployment topology

### Initial production

- containerized `web`, `admin`, `api` and `worker` deployments;
- reverse proxy/WAF with TLS termination, request limits and rate limiting;
- managed or well-operated PostgreSQL with point-in-time recovery;
- highly available Redis appropriate to queue durability needs;
- S3-compatible object storage and CDN;
- private network between BFF/API/data services;
- separate staging and production accounts/projects;
- secrets from a managed secret store, not repository or image layers.

Kubernetes is not required for v1. Adopt it only when deployment count, autoscaling, isolation or operations evidence justifies its cost. Containers on a managed platform or disciplined VM orchestration are acceptable.

### Domestic continuity

Core production database, object origin, runtime, DNS fallback, payment, OTP and operational access must have an Iran-reachable path. Foreign analytics, error tracking, fonts, maps, CAPTCHA or CDN may enrich the service but cannot be a single point of failure.

## 14. Architecture evolution

Keep the modular monolith until a module demonstrates at least one extraction trigger:

- independent scaling profile that cannot be handled economically in-process;
- availability isolation requirement;
- separate team with stable ownership and deployment cadence;
- regulatory/data residency boundary;
- technology need fundamentally incompatible with the main runtime.

Likely first extraction candidates are media processing, search/recommendations, live-auction fan-out and analytics—not orders or ledger.

## 15. Known failure modes and required behavior

| Failure                                   | Required response                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Duplicate payment callback                | Return success for the prior result; create no duplicate economic entry    |
| Payment succeeds after reservation expiry | Quarantine for reconciliation; do not auto-confirm a sold/unavailable work |
| Search index is stale                     | Checkout validates PostgreSQL; display a recoverable availability message  |
| SMS provider is down                      | Retry/fallback provider; critical state remains visible in-app             |
| Carrier API is down                       | Create manual fulfilment task; order remains paid and auditable            |
| Media processing fails                    | Keep original private, show processing state, retry safely                 |
| Artist sells externally                   | Block checkout, record inventory incident, notify affected buyer/ops       |
| Concurrent offers/orders                  | Database constraint/state transition selects one winner                    |
| Worker processes an event twice           | Idempotent consumer returns the existing result                            |
| Auction client disconnects                | Reconnect from last sequence; server bid result remains authoritative      |
| International connectivity loss           | Core domestic browse/login/order/support path remains operational          |
| Analytics or recommendation outage        | Degrade to deterministic catalogue; never block transactions               |

## 16. Revisit points

- Re-evaluate dedicated search after 100k published works or sustained search p95 above target.
- Re-evaluate auction service extraction before the first event expected above 100 accepted bids/second.
- Re-evaluate read replicas when catalogue/admin reads cause primary database contention.
- Re-evaluate data warehouse when operational queries compete with product analytics.
- Re-evaluate multi-region disaster recovery after transaction volume and business loss justify the cost.
