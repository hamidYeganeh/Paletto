# API, Events and Workflow Contracts

**Status:** Proposed  
**Primary style:** REST/JSON with OpenAPI  
**External base path:** `/api/v1`

## 1. Product releases versus API versions

Product releases `v1` through `v6` describe capability rollout. They do not require a new HTTP API version.

Rules:

- add backward-compatible fields/endpoints to `/api/v1`;
- create `/api/v2` only for a breaking semantic or structural change that cannot be migrated compatibly;
- support at least one documented migration/deprecation window before retiring a public version;
- version event schemas independently: `catalogue.artwork-published.v1`;
- version webhook payloads and signed canonical forms;
- publish OpenAPI and event schema changes in CI.

## 2. Contract conventions

### Request headers

| Header            | Use                                                         |
| ----------------- | ----------------------------------------------------------- |
| `Authorization`   | Bearer/service authentication where applicable              |
| `Idempotency-Key` | Required for retryable commands that can create money/state |
| `X-Request-ID`    | Optional client correlation; server validates/generates     |
| `If-Match`        | Expected entity version for optimistic concurrency          |
| `Accept-Language` | Response message/labels; domain codes stay language-neutral |

### Response headers

| Header                   | Use                                                |
| ------------------------ | -------------------------------------------------- |
| `X-Request-ID`           | Support and trace correlation                      |
| `ETag`                   | Version for eligible resources                     |
| `Retry-After`            | Rate limiting or temporary provider/workflow delay |
| `Deprecation` / `Sunset` | API lifecycle communication                        |

### Money

```json
{
  "amount": "1250000000",
  "currency": "IRR",
  "display": {
    "amount": "125000000",
    "unit": "TOMAN",
    "formattedFa": "۱۲۵٬۰۰۰٬۰۰۰ تومان"
  }
}
```

The API source of truth is `amount` in Rial. `display` is optional presentation data and never used for calculations.

### Timestamps and dates

- timestamps: ISO-8601 UTC, for example `2026-08-21T10:30:00Z`;
- dates without time: Gregorian `YYYY-MM-DD`;
- scheduled objects include `timeZone: "Asia/Tehran"`;
- Jalali values may be returned as display metadata, not authoritative scheduling input.

### Pagination

- cursor-based pagination for all mutable/high-volume collections;
- deterministic sort plus unique tie-breaker;
- opaque cursor;
- maximum page size enforced;
- total count is optional and computed only where affordable.

```json
{
  "data": [],
  "page": {
    "nextCursor": "opaque",
    "hasMore": true
  }
}
```

### Errors

Use `application/problem+json` with stable machine codes.

```json
{
  "type": "https://paletto.ir/problems/inventory-unavailable",
  "title": "Artwork is no longer available",
  "status": 409,
  "code": "INVENTORY_UNAVAILABLE",
  "detail": "Safe user-facing explanation",
  "requestId": "req_...",
  "fieldErrors": []
}
```

Provider secrets, stack traces, KYC reasons that enable abuse and internal IDs are never returned.

## 3. Authentication and service boundaries

- Browser session uses secure, HTTP-only, same-site cookies managed by the BFF/auth library.
- BFF exchanges/forwards a short-lived internal identity assertion to the API over the private network.
- Resource authorization is repeated in the API; proxy/BFF checks are not sufficient.
- Admin requires MFA and separate audience/session policy.
- Provider callbacks use signature verification, allowlisted contract behavior, replay protection and dedicated credentials.
- Service-to-service calls use mTLS or signed short-lived service tokens with explicit audience.

## 4. Endpoint inventory

The inventory is directional; detailed request/response schemas are generated during each feature task.

### Identity, verification and organizations

```text
POST   /api/v1/auth/otp/challenges
POST   /api/v1/auth/otp/challenges/{id}/verify
POST   /api/v1/auth/sessions/refresh
DELETE /api/v1/auth/sessions/{id}
GET    /api/v1/me
PATCH  /api/v1/me
GET    /api/v1/me/sessions
POST   /api/v1/me/mfa/methods

POST   /api/v1/verification/cases
GET    /api/v1/verification/cases/{id}
POST   /api/v1/verification/cases/{id}/evidence
POST   /api/v1/bank-accounts
POST   /api/v1/bank-accounts/{id}/verify

POST   /api/v1/organizations
GET    /api/v1/organizations/{id}
PATCH  /api/v1/organizations/{id}
POST   /api/v1/organizations/{id}/invitations
PATCH  /api/v1/organizations/{id}/members/{memberId}
```

### Artists, catalogue, media and content

```text
GET    /api/v1/artists
GET    /api/v1/artists/{slugOrId}
POST   /api/v1/artists
PATCH  /api/v1/artists/{id}
POST   /api/v1/artists/{id}/claim

GET    /api/v1/artworks
GET    /api/v1/artworks/{slugOrId}
POST   /api/v1/artworks
PATCH  /api/v1/artworks/{id}
POST   /api/v1/artworks/{id}/units
POST   /api/v1/artworks/{id}/submit
POST   /api/v1/artworks/{id}/publish
POST   /api/v1/artworks/{id}/unpublish

POST   /api/v1/media/uploads
POST   /api/v1/media/{id}/complete
GET    /api/v1/media/{id}/status

GET    /api/v1/collections
GET    /api/v1/collections/{slug}
GET    /api/v1/exhibitions
GET    /api/v1/exhibitions/{slug}
GET    /api/v1/stories/{slug}
```

Publication endpoints are role- and state-restricted; admin actions are separate commands, not a client-supplied `status` patch.

### Discovery and engagement

```text
GET    /api/v1/search
POST   /api/v1/discovery/taste-profile
GET    /api/v1/recommendations
POST   /api/v1/visual-search
PUT    /api/v1/me/saved-artworks/{artworkId}
DELETE /api/v1/me/saved-artworks/{artworkId}
PUT    /api/v1/me/follows/artists/{artistId}
GET    /api/v1/me/alerts
POST   /api/v1/me/alerts
GET    /api/v1/artworks/{id}/room-preview-assets
```

### Listings, offers and commissions

```text
POST   /api/v1/listings
GET    /api/v1/listings/{id}
PATCH  /api/v1/listings/{id}
POST   /api/v1/listings/{id}/activate
POST   /api/v1/listings/{id}/pause

POST   /api/v1/listings/{id}/offer-threads
POST   /api/v1/offer-threads/{id}/offers
POST   /api/v1/offers/{id}/accept
POST   /api/v1/offers/{id}/reject
POST   /api/v1/offers/{id}/withdraw

POST   /api/v1/commission-requests
POST   /api/v1/commission-requests/{id}/proposals
POST   /api/v1/commission-proposals/{id}/accept
POST   /api/v1/commission-contracts/{id}/milestones/{milestoneId}/submit
POST   /api/v1/commission-contracts/{id}/milestones/{milestoneId}/approve
```

### Checkout and orders

```text
POST   /api/v1/checkout-sessions
GET    /api/v1/checkout-sessions/{id}
POST   /api/v1/checkout-sessions/{id}/reserve
POST   /api/v1/orders
GET    /api/v1/orders/{id}
GET    /api/v1/me/orders
POST   /api/v1/orders/{id}/cancel
POST   /api/v1/orders/{id}/accept-delivery
POST   /api/v1/orders/{id}/return-requests
POST   /api/v1/orders/{id}/disputes
```

`POST /orders` requires an idempotency key and consumes valid reservations atomically.

### Payments, refunds, invoices and payouts

```text
POST   /api/v1/orders/{id}/payment-intents
GET    /api/v1/payment-intents/{id}
POST   /api/v1/payment-providers/{provider}/callbacks
POST   /api/v1/orders/{id}/bank-transfer-evidence
POST   /api/v1/orders/{id}/refund-requests
GET    /api/v1/orders/{id}/invoice
GET    /api/v1/seller/settlements
GET    /api/v1/seller/payouts
```

Provider callbacks are public infrastructure endpoints with provider-specific verification and normalized internal commands.

### Trust, certificates and collection

```text
GET    /api/v1/verify/{publicCertificateCode}
GET    /api/v1/artwork-units/{id}/provenance
GET    /api/v1/artwork-units/{id}/condition-reports
POST   /api/v1/artwork-units/{id}/condition-reports
POST   /api/v1/artwork-units/{id}/expert-opinions
GET    /api/v1/me/collection
PATCH  /api/v1/me/collection/{unitId}/visibility
GET    /api/v1/me/collection/{unitId}/ownership-record
```

Public verification returns safe certificate claims and revocation status, not buyer identity or private evidence.

### Fulfilment and services

```text
GET    /api/v1/service-zones
POST   /api/v1/orders/{id}/packaging-plans
POST   /api/v1/packaging-plans/{id}/complete
POST   /api/v1/orders/{id}/shipments
GET    /api/v1/shipments/{id}
POST   /api/v1/shipping-providers/{provider}/callbacks
POST   /api/v1/shipments/{id}/delivery-evidence
POST   /api/v1/shipments/{id}/damage-claims
POST   /api/v1/service-orders
```

### Secondary market and wanted lists

```text
POST   /api/v1/resale-cases
GET    /api/v1/resale-cases/{id}
POST   /api/v1/resale-cases/{id}/ownership-evidence
POST   /api/v1/resale-cases/{id}/condition-report
GET    /api/v1/resale-cases/{id}/valuation
POST   /api/v1/resale-cases/{id}/list
POST   /api/v1/wanted-requests
GET    /api/v1/me/wanted-requests
PATCH  /api/v1/me/collection/{unitId}/private-offer-permission
```

### Auctions

```text
GET    /api/v1/auctions
GET    /api/v1/auctions/{slugOrId}
POST   /api/v1/auctions/{id}/registrations
POST   /api/v1/auctions/{id}/deposits
GET    /api/v1/auction-lots/{id}
POST   /api/v1/auction-lots/{id}/bids
POST   /api/v1/auction-lots/{id}/proxy-bids
GET    /api/v1/auction-lots/{id}/bid-stream
GET    /api/v1/auction-lots/{id}/result
```

Live stream may use SSE initially. The bid command endpoint remains authoritative and returns accepted sequence/current price/close time.

### B2B/trade

```text
POST   /api/v1/trade-accounts
POST   /api/v1/trade-projects
GET    /api/v1/trade-projects/{id}
POST   /api/v1/trade-projects/{id}/spaces
POST   /api/v1/trade-projects/{id}/boards
POST   /api/v1/trade-projects/{id}/proposals
POST   /api/v1/proposals/{id}/approve
POST   /api/v1/rental-agreements
POST   /api/v1/installation-plans
```

### Admin

Admin APIs use the same domain commands but a distinct audience and `/api/v1/admin/...` resource surface. Required queues include:

```text
/admin/verification-cases
/admin/artwork-reviews
/admin/moderation-cases
/admin/orders
/admin/reconciliation-cases
/admin/refunds
/admin/payout-batches
/admin/shipments
/admin/damage-claims
/admin/trust-cases
/admin/resale-cases
/admin/auctions
/admin/audit-events
/admin/feature-flags
```

Sensitive admin actions require a reason and may require a second approval.

## 5. Idempotency and concurrency

### Required idempotency

Required on:

- account/organization creation where clients may retry;
- reservation, order and payment-intent creation;
- offer acceptance;
- payment/refund/payout commands;
- shipment booking;
- certificate issuance/revocation;
- resale listing activation;
- bid and proxy-bid commands;
- provider callbacks using provider event/transaction IDs.

The server stores actor, endpoint/command, idempotency key, normalized request hash and result reference. Reusing a key with a different request returns `409 IDEMPOTENCY_KEY_REUSED`.

### Optimistic concurrency

Mutable drafts and admin cases expose a version/ETag. Conflicting edits return `412 PRECONDITION_FAILED` with the latest safe version. Critical inventory, payment and bidding commands additionally use database locks/constraints.

## 6. Event envelope

```json
{
  "eventId": "evt_...",
  "eventType": "orders.order-paid.v1",
  "occurredAt": "2026-08-21T10:30:00Z",
  "aggregateType": "order",
  "aggregateId": "ord_...",
  "aggregateVersion": 7,
  "actor": {
    "type": "account|staff|service|provider",
    "id": "opaque-or-null"
  },
  "traceId": "trace_...",
  "data": {},
  "metadata": {
    "producer": "orders",
    "schemaVersion": 1
  }
}
```

Rules:

- events contain opaque subject IDs, not national IDs, full addresses, bank details or identity documents;
- event names are past tense facts;
- breaking data changes create a new event version;
- consumers register an inbox record keyed by `eventId` before side effects;
- event order is guaranteed only per aggregate version, not globally;
- failed events move to a dead-letter queue with an operations case.

## 7. Core event catalogue

### Identity and catalogue

```text
identity.account-created.v1
identity.account-suspended.v1
verification.case-approved.v1
verification.case-rejected.v1
organizations.organization-verified.v1
artists.artist-verified.v1
catalogue.artwork-submitted.v1
catalogue.artwork-approved.v1
catalogue.artwork-published.v1
catalogue.artwork-suspended.v1
catalogue.media-ready.v1
inventory.unit-reserved.v1
inventory.reservation-expired.v1
inventory.unit-unavailable.v1
```

### Commerce and money

```text
offers.offer-accepted.v1
commissions.contract-created.v1
commissions.milestone-approved.v1
orders.order-created.v1
orders.order-paid.v1
orders.order-cancelled.v1
orders.order-delivered.v1
orders.order-accepted.v1
orders.order-disputed.v1
payments.payment-succeeded.v1
payments.payment-failed.v1
payments.reconciliation-required.v1
payments.refund-completed.v1
ledger.journal-posted.v1
settlements.payout-eligible.v1
settlements.payout-completed.v1
```

### Trust, fulfilment, secondary and auctions

```text
trust.certificate-issued.v1
trust.certificate-revoked.v1
trust.condition-report-created.v1
trust.ownership-transferred.v1
fulfilment.shipment-booked.v1
fulfilment.shipment-delivered.v1
fulfilment.damage-reported.v1
secondary.resale-approved.v1
secondary.valuation-completed.v1
secondary.resale-sold.v1
auctions.registration-approved.v1
auctions.bid-accepted.v1
auctions.lot-extended.v1
auctions.lot-closed.v1
auctions.lot-won.v1
```

## 8. Critical workflow sequences

### 8.1 Fixed-price unique artwork purchase

```text
Buyer -> API: create checkout session
API -> Inventory: validate listing + lock/reserve unit
Inventory -> DB: reservation + outbox (one transaction)
API -> Buyer: quote, reservation expiry, policy summary
Buyer -> API: create order [Idempotency-Key]
API -> DB: consume reservation + create order PAYMENT_PENDING
Buyer -> API: create payment intent
API -> PSP: initialize payment
PSP -> Callback API: signed result
Callback API -> DB: dedupe + payment success + ledger + order PAID + outbox
Worker -> Fulfilment: create packaging/fulfilment task
Worker -> Notification: notify buyer, seller and operations
```

### 8.2 Late/ambiguous payment

```text
Callback/inquiry reports success
  -> order/reservation is no longer safely confirmable
  -> record provider evidence
  -> post to payment clearing/reconciliation account as approved by finance design
  -> order MANUAL_RECONCILIATION
  -> block automatic ownership/payout
  -> create operations SLA case
```

### 8.3 Fulfilment, ownership and payout

```text
Paid order -> packaging evidence -> pickup condition/custody
-> carrier tracking -> delivery evidence -> inspection period
-> buyer accepts or policy timer completes
-> order ACCEPTED
-> transactionally append ownership/provenance/certificate + payout eligibility
-> finance risk/reconciliation checks
-> payout instruction -> provider/bank evidence -> payout journal -> COMPLETED
```

### 8.4 Commissioned work

```text
Buyer brief -> artist proposal -> buyer acceptance
-> deposit/payment -> contract and milestones
-> artist submits deliverable -> buyer/curator review
-> approve/revise/dispute -> milestone ledger release
-> final physical artwork unit created
-> condition/certificate -> fulfilment -> ownership transfer
```

### 8.5 Resale

```text
Owner intake -> ownership/KYC evidence -> condition report
-> expert/data valuation -> seller chooses sale mode
-> listing/auction -> order settlement
-> close prior ownership + create buyer ownership
-> optional living-artist contribution posting
-> seller payout
```

### 8.6 Auction bid

```text
Bidder -> API: bid(lot, amount, clientRequestId)
API: authenticate + registration/deposit/limit check
API -> DB transaction:
  lock lot/version
  verify OPEN and server time
  compute minimum/increment/proxy outcome
  append bid(s) and sequence
  update current lot projection
  apply deterministic anti-sniping extension
  append outbox event
API -> Bidder: authoritative accepted/rejected result
Worker/fanout -> connected clients: sequence/current price/new close time
```

## 9. Webhook security

- separate endpoint and credential per provider/environment;
- verify signature over raw body before parsing when required;
- validate timestamp/nonce and reject replay outside the provider window;
- deduplicate provider event and transaction IDs;
- compare callback amount/currency/order reference with server record;
- query provider for high-risk or ambiguous results;
- acknowledge duplicates with the provider-expected success response;
- redact callback secrets from logs while retaining legally permitted signed evidence;
- alert on signature failures, amount mismatch and callback spikes.

## 10. Contract testing and lifecycle

- OpenAPI diff runs in CI and rejects undocumented breaking changes.
- Generated client must compile against web/admin before merge.
- Provider adapters run against recorded contract fixtures and sandbox where available.
- Event schemas have producer and consumer compatibility tests.
- Deprecation includes owner, replacement, first notice, telemetry and sunset date.
- Unused endpoints are removed only after traffic proves zero or all registered clients migrate.
