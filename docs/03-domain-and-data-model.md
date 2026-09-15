# Domain and Data Model

**Status:** Proposed logical model  
**Database:** PostgreSQL  
**Rule:** This document defines ownership and invariants, not a final ORM schema.

## 1. Modeling principles

- Separate the artistic identity of a work from a physical sellable unit and from a commercial listing.
- Preserve history for ownership, provenance, certificates, condition, bids and money.
- Model long-running workflows as explicit state machines, not loosely related booleans.
- Store snapshots of policies, fees, addresses and seller/buyer display data on transactions so future edits do not rewrite history.
- Keep personally identifiable information out of public/read-optimized projections.
- Use database constraints for invariants that must survive application bugs or concurrent requests.

## 2. Shared conventions

### Identifiers

- External IDs are opaque, sortable UUIDv7/ULID-compatible values.
- Human-friendly codes such as `PLT-ORD-...` are display/search references, not primary keys.
- National ID, card number, phone and Sheba are not identifiers in URLs or events.

### Money

```text
amount_irr: bigint
currency: "IRR"
```

- Persist integer Rial values only.
- API money values are serialized as strings to avoid JavaScript precision loss.
- Toman is accepted/displayed through an explicit boundary field and converted by `1 toman = 10 rial`.
- No floating-point arithmetic for price, discount, tax, commission, refund or payout.
- Percentage rules use integer basis points and an explicit rounding policy.

### Time and calendar

- Persist UTC timestamps.
- Persist the relevant IANA timezone for scheduled events; default customer/auction timezone is `Asia/Tehran`.
- Display Jalali and Persian digits where appropriate; APIs remain ISO-8601/Gregorian.
- Auction close and reservation expiry are determined by server time only.

### Text and locale

- Preserve authored display text.
- Maintain normalized search fields that standardize `ی/ي`, `ک/ك`, digits, diacritics, whitespace and ZWNJ.
- Slugs are unique per entity type and have redirect history when changed.

## 3. Identity and access

| Entity             | Purpose                          | Key fields/notes                                                |
| ------------------ | -------------------------------- | --------------------------------------------------------------- |
| `Account`          | Authentication principal         | status, primary phone, optional email, risk state               |
| `PersonProfile`    | Private/legal person information | legal name, birth date, national ID reference, encrypted fields |
| `PublicProfile`    | Safe public identity             | display name, avatar, biography, locale                         |
| `AuthIdentity`     | Login method                     | phone OTP, password/passkey/social where approved               |
| `Session`          | Server-side session              | hashed token, device, expiry, revocation                        |
| `MfaMethod`        | Staff/sensitive-user MFA         | method, verified time, recovery status                          |
| `Organization`     | Gallery/business/legal entity    | type, legal/public names, verification status                   |
| `Membership`       | Account role in an organization  | role, permissions, start/end, invitation source                 |
| `VerificationCase` | KYC/KYB workflow                 | subject, tier, provider refs, evidence, reviewer, decision      |
| `BankAccount`      | Verified payout destination      | encrypted/hashed Sheba/card references, owner-match result      |
| `RiskSignal`       | Reviewable risk input            | source, severity, reason, expiry and resolution                 |

### Access model

Use RBAC for broad roles and ABAC/resource checks for actual access.

Examples:

- A gallery manager may edit only artists/listings represented by that gallery.
- An expert sees assigned evidence but not unrelated payment information.
- Support may view an order summary but requires step-up permission for full identity/bank data.
- Finance can create a payout batch; a second authorized person approves exceptional/manual payouts.

## 4. Artist, catalogue and inventory

### Core separation

```text
Artist 1 --- * Artwork 1 --- * ArtworkUnit 1 --- * Listing
                           |
                           +--- ownership / condition / custody
```

| Entity                 | Purpose                                         | Key fields/notes                                                |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `Artist`               | Canonical creator identity                      | verified claim, names/aliases, life dates, city/country         |
| `ArtistRepresentation` | Artist-gallery relationship                     | scope, start/end, price/listing permissions                     |
| `ArtistCareerEvent`    | CV timeline                                     | education, exhibition, award, publication                       |
| `Artwork`              | Creative/artistic work                          | title, description, creation date, medium, style, subject       |
| `ArtworkDimension`     | Structured dimensions                           | height/width/depth, unit, framed dimensions                     |
| `ArtworkUnit`          | Unique physical object or numbered edition unit | kind, edition number/size, signature, physical state            |
| `MediaAsset`           | Image/video/document pointer                    | storage class, checksum, rights, moderation, derivatives        |
| `Listing`              | Commercial presentation                         | seller, unit, sale mode, price, visibility, policy, publication |
| `InventoryLocation`    | Where the unit physically resides               | artist, gallery, Paletto, expert, carrier or buyer custody      |
| `InventoryReservation` | Time-limited claim during checkout              | unit, actor/order, expires, released/consumed state             |
| `CuratedCollection`    | Editorial grouping                              | curator, theme, ordering, publication state                     |
| `Exhibition`           | Online/physical/3D exhibition                   | organizer, schedule, space config, artworks                     |

### Artwork publication state

```text
DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> PUBLISHED
                      |               |
                      v               v
                 CHANGES_REQUIRED   SUSPENDED
                                      |
PUBLISHED -> UNLISTED -> ARCHIVED <----+
```

Rules:

- only approved sellers/artists can submit;
- `PUBLISHED` requires required media, rights consent, declared owner, price policy and sellable unit status;
- moderation or authenticity concern can suspend without destroying evidence;
- a sold unique unit cannot return to primary availability; resale creates a new listing tied to the same unit.

### Inventory invariants

- A unique `ArtworkUnit` has at most one active sale listing per authorized channel policy.
- It has at most one active reservation that can result in sale.
- A unit marked `SOLD`, `LOST`, `DESTROYED`, `AUTHENTICITY_HOLD` or `EXPORT_HOLD` cannot be reserved.
- Edition number must be unique within an edition; edition size changes require expert/admin review and history.
- Availability is revalidated against inventory during reservation and order confirmation, never trusted from cached catalogue data.

## 5. Trust, provenance and ownership

| Entity               | Purpose                                  | Key fields/notes                                              |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| `Certificate`        | A claim about an artwork/unit            | issuer, level/type, signed payload hash, issue/revoke history |
| `CertificateVersion` | Immutable certificate content            | canonical JSON, signature, public verification fields         |
| `ProvenanceEvent`    | Historical evidence/claim                | type, date range, source, confidence, visibility              |
| `OwnershipRecord`    | Legal/declared ownership interval        | owner subject, acquisition basis, start/end, evidence         |
| `CustodyEvent`       | Physical possession movement             | from/to custodian, condition refs, timestamps                 |
| `ConditionReport`    | Structured condition at a point in time  | author, observations, severity, media, signature              |
| `ExpertOpinion`      | Attributed professional assessment       | scope, conclusion, confidence, conflict declaration           |
| `RightsGrant`        | Permission to display/use media and text | grantor, channels, duration, revocation rules                 |
| `TrustCase`          | Authenticity/ownership dispute           | allegation, evidence, holds, decision and appeals             |

### Certificate levels

The UI and contract must not collapse different claims into a generic “authentic” badge.

1. **Artist-issued primary certificate** — artist identity and signature are verified.
2. **Gallery/representative certificate** — issuer and representation authority are verified.
3. **Paletto transaction certificate** — proves the platform-recorded listing, seller, transaction and evidence; it does not independently attribute the artist unless stated.
4. **Independent expert opinion** — named expert, scope, method and limitations are visible.

### Ownership transfer

Ownership transfer is append-only:

```text
seller ownership active
  -> order paid/fulfilled/accepted
  -> close seller ownership interval
  -> open buyer ownership interval
  -> append provenance + custody events
  -> issue transaction certificate version
```

Reversal uses a linked reversal/correction event and never erases the original history.

## 6. Offers and commissioned work

| Entity                  | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `OfferThread`           | Negotiation context for listing/buyer/seller              |
| `Offer`                 | Immutable proposed amount, expiry and terms snapshot      |
| `CommissionRequest`     | Buyer brief, budget, dimensions and desired timeline      |
| `CommissionProposal`    | Artist scope, price, rights, milestones and delivery plan |
| `CommissionContract`    | Accepted proposal and policy snapshot                     |
| `CommissionMilestone`   | Deposit, concept, progress, completion and delivery gate  |
| `CommissionDeliverable` | Media/evidence submitted for milestone approval           |

### Offer state

```text
OPEN -> ACCEPTED -> ORDER_CREATED
  |        |
  |        +-> EXPIRED if reservation/payment deadline passes
  +-> COUNTERED -> ACCEPTED
  +-> REJECTED
  +-> WITHDRAWN
  +-> EXPIRED
```

Only one offer in a thread may be accepted. Acceptance creates a priced reservation atomically.

### Commission state

```text
REQUESTED -> PROPOSED -> CONTRACTED -> IN_PROGRESS
                                      -> MILESTONE_REVIEW
                                      -> COMPLETED -> DELIVERED -> ACCEPTED
                                      -> DISPUTED / CANCELLED
```

Milestone releases and cancellation consequences are policy-driven and ledger-backed.

## 7. Orders, policy and commerce

| Entity               | Purpose                                | Key fields/notes                                     |
| -------------------- | -------------------------------------- | ---------------------------------------------------- |
| `CheckoutSession`    | Short-lived quote/reservation context  | actor, currency, expiry, totals version              |
| `Order`              | Commercial agreement                   | buyer/seller/channel, state, totals, policy snapshot |
| `OrderItem`          | Artwork unit/service/commission line   | immutable description and price snapshot             |
| `PriceComponent`     | Explainable total component            | item, shipping, discount, tax, fee, coverage         |
| `OrderPartySnapshot` | Historical safe party/address identity | encrypted private section + public receipt section   |
| `PolicySnapshot`     | Terms in force for this transaction    | withdrawal, return, damage, payout and dispute rules |
| `Cancellation`       | Requested/approved cancellation        | initiator, reason, money effect                      |
| `Dispute`            | Structured post-order case             | category, evidence, SLA, decision and appeal         |

### Order state

```text
DRAFT
 -> RESERVED
 -> PAYMENT_PENDING
 -> PAID
 -> FULFILMENT_PENDING
 -> IN_TRANSIT
 -> DELIVERED
 -> INSPECTION_PERIOD
 -> ACCEPTED
 -> COMPLETED

Exceptional terminal/side states:
CANCELLED, PAYMENT_EXPIRED, REFUND_PENDING, REFUNDED,
DISPUTED, DAMAGE_REVIEW, MANUAL_RECONCILIATION
```

Transition rules are commands with actor, reason and expected version. Arbitrary status updates are prohibited.

## 8. Payments, ledger, invoices and settlement

### Provider evidence

| Entity                                | Purpose                                             |
| ------------------------------------- | --------------------------------------------------- |
| `PaymentIntent`                       | Amount and order payment objective                  |
| `PaymentAttempt`                      | One provider/bank attempt with idempotency key      |
| `PaymentCallback`                     | Raw verified callback evidence and dedupe key       |
| `RefundRequest` / `RefundAttempt`     | Refund lifecycle and provider evidence              |
| `PayoutInstruction` / `PayoutAttempt` | Seller/expert/carrier payout lifecycle              |
| `ReconciliationCase`                  | Mismatch between provider/bank and internal records |
| `Invoice` / `InvoiceLine`             | Tax/receipt document and immutable snapshot         |
| `SettlementStatement`                 | Explain seller/gallery deductions and net payout    |

### Internal ledger

| Entity          | Purpose                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| `LedgerAccount` | Platform cash clearing, buyer receivable, seller payable, fee revenue, refund payable, etc. |
| `JournalEntry`  | Business event header with source/idempotency key                                           |
| `JournalLine`   | Debit/credit amount for one account                                                         |

Invariants:

- every posted journal entry balances to zero;
- entries are immutable after posting;
- one source event/idempotency key produces at most one journal entry;
- balance is derived from lines or a rebuildable projection;
- “available seller payout” is not the same as provider cash balance;
- manual corrections require a reason, linked evidence, role check and compensating entry.

### Payment state

```text
CREATED -> REDIRECTED/PROCESSING -> SUCCEEDED
   |             |                   |
   v             v                   v
CANCELLED      FAILED             REFUND_PENDING -> PARTIALLY_REFUNDED/REFUNDED
                    \
                     -> UNKNOWN/MANUAL_RECONCILIATION
```

Client redirect is never treated as proof of payment; verified callback or provider inquiry is required.

## 9. Fulfilment and condition

| Entity               | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `ServiceZone`        | Province/city/postal coverage and service levels       |
| `Address`            | Structured Iranian address with normalized postal data |
| `PackagingPlan`      | Required packaging by unit/medium/value                |
| `PackagingChecklist` | Completed evidence and responsible actor               |
| `Parcel`             | Physical package dimensions/weight/seals               |
| `Shipment`           | Pickup-to-delivery workflow and carrier adapter state  |
| `TrackingEvent`      | Normalized append-only carrier/manual event            |
| `DeliveryEvidence`   | OTP/signature/photo/person/time evidence               |
| `DamageClaim`        | Damage/loss evidence, responsibility and compensation  |
| `ServiceOrder`       | Framing, installation, preview or conservation service |

### Shipment state

```text
PLANNING -> PACKAGING_REQUIRED -> READY_FOR_PICKUP -> PICKED_UP
 -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED -> CONDITION_CONFIRMED

Exceptions: PICKUP_FAILED, DELIVERY_FAILED, RETURNING, RETURNED,
LOST, DAMAGED, MANUAL_HANDLING
```

Each custody boundary should have timestamp, responsible party and linked condition evidence according to the artwork risk tier.

## 10. Secondary market and valuation

| Entity                   | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `ResaleCase`             | Intake, verification, valuation, sale mode and review       |
| `OwnershipEvidence`      | Private seller-uploaded proof                               |
| `ValuationReport`        | Range, currency/date, method, comparable references, author |
| `ComparableSale`         | Normalized public/private permitted market evidence         |
| `WantedRequest`          | Collector demand criteria and privacy preference            |
| `PrivateOfferPermission` | Whether/how owners may receive unsolicited offers           |
| `ResaleContributionRule` | Optional living-artist contribution policy snapshot         |

### Resale state

```text
INTAKE -> OWNERSHIP_REVIEW -> CONDITION_REVIEW -> VALUATION
 -> SELLER_DECISION -> LISTED_PRIVATE/FIXED/AUCTION
 -> SOLD -> SETTLED

Exceptions: REJECTED, WITHDRAWN, AUTHENTICITY_HOLD, EXPORT_HOLD
```

Valuation is a dated expert/data opinion with limitations, never a guaranteed sale price.

## 11. Auctions

| Entity                | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `Auction`             | Schedule, policy, currency, visibility and status                |
| `AuctionRegistration` | Bidder KYC, limits, agreements and eligibility                   |
| `BidderDeposit`       | Required deposit/authorization evidence                          |
| `AuctionLot`          | Artwork unit, reserve, increments, close and anti-sniping policy |
| `Bid`                 | Append-only accepted/rejected command result with sequence       |
| `ProxyBidInstruction` | Confidential bidder maximum and status                           |
| `LotResult`           | Winner, hammer amount, reserve outcome and close evidence        |

### Auction/lot states

```text
Auction: DRAFT -> REVIEW -> PUBLISHED -> REGISTRATION_OPEN
         -> LIVE -> CLOSING -> CLOSED -> SETTLEMENT -> ARCHIVED

Lot: DRAFT -> APPROVED -> SCHEDULED -> OPEN -> EXTENDED* -> CLOSED
     -> SOLD/UNSOLD/PAYMENT_DEFAULT
```

Bid invariants:

- bid amount satisfies current minimum/increment and bidder limit;
- accepted bid receives a strictly increasing lot sequence;
- accepted bids are never edited/deleted;
- proxy maximum is not exposed;
- lot close is based on database/server time and the snapshotted extension rule;
- one winner result is created once.

## 12. B2B and trade

| Entity                         | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `TradeAccount`                 | Approved designer/architect/organization account    |
| `TradeProject`                 | Client, budget, deadline, locations and owner       |
| `ProjectSpace`                 | Room/wall with dimensions, images and constraints   |
| `ProjectBoard`                 | Selected artworks and layout notes                  |
| `Proposal` / `ProposalVersion` | Versioned commercial proposal                       |
| `Approval`                     | Named stakeholder approval/rejection                |
| `RentalAgreement`              | Rotation/rental schedule, condition and billing     |
| `InstallationPlan`             | Delivery, installers, site constraints and sign-off |

Proposal acceptance creates normal orders/service orders; B2B does not bypass commerce, ledger or ownership controls.

## 13. Content, moderation, support and audit

| Entity                            | Purpose                                               |
| --------------------------------- | ----------------------------------------------------- |
| `ContentEntry` / `ContentVersion` | Editorial/CMS content and publication history         |
| `Policy` / `PolicyVersion`        | Terms, moderation and workflow policies               |
| `ModerationCase`                  | Subject, reason, reviewer, action, appeal             |
| `SupportCase`                     | Customer issue, SLA, communication and linked objects |
| `AuditEvent`                      | Append-only security/business action record           |
| `OutboxEvent`                     | Transactionally committed integration event           |
| `InboxRecord`                     | Consumer dedupe/processing result                     |

Audit events contain actor, organization, action, resource, timestamp, request/trace ID, reason and safe before/after diff. Secret values and full identity documents must not be copied into logs.

## 14. Referential and privacy rules

- Public profile deletion does not delete required financial or ownership history; it pseudonymizes public presentation subject to legal retention.
- Ownership visibility defaults to private; a collector explicitly opts into public display.
- Exact artwork location, home address and private valuation evidence are never public.
- Expert conflicts of interest are recorded with the opinion.
- Analytics uses surrogate actor IDs and excludes national ID, full phone, bank, address and identity-document payloads.
- Search projections contain only fields authorized for public discovery.
