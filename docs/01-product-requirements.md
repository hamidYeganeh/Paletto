# Product Requirements: Paletto Marketplace

**Status:** Proposed  
**Owner:** Product  
**Technical owner:** Engineering  
**Reviewers:** Art operations, legal, finance, security, logistics

## 1. Product vision

Paletto will be the most trusted and liquid platform for discovering, buying, owning and reselling verified Iranian art.

The complete customer loop is:

```text
Discover taste -> understand the work -> verify trust -> reserve/buy
-> receive safely -> register ownership -> manage collection -> resell
```

Paletto is not only an art storefront. It is a managed marketplace and operating system for artists, galleries, collectors, experts, logistics partners and art buyers.

## 2. Problem statement

Iranian art commerce is fragmented across galleries, artist studios, social media, auctions and private relationships. Buyers face uncertainty about authenticity, ownership, price, condition, safe delivery and future resale. Artists and galleries lack a shared, reliable way to manage inventory, reach qualified buyers, execute orders and preserve provenance.

The current Paletto application demonstrates a strong immersive visual language, but the primary product promise—direct purchase of Iranian works, portfolios, commissions, auctions, 3D exhibitions and art narratives—is not yet represented by transactional workflows or real marketplace data.

## 3. Product principles

1. **Trust before catalogue size.** Two hundred verified works are more valuable than twenty thousand uncontrolled listings.
2. **Every price has a unit.** The system never leaves Rial versus Toman implicit.
3. **A unique work cannot be sold twice.** Inventory correctness outranks conversion optimization.
4. **Human expertise remains accountable.** AI assists discovery, moderation and anomaly detection; it does not make final authenticity decisions.
5. **The platform is managed.** Seller and artwork publication require verification appropriate to risk.
6. **Domestic continuity is a product requirement.** Core browsing, identity, payment, media and support cannot depend exclusively on foreign infrastructure.
7. **Progressive disclosure.** First-time buyers get simple decisions; professional collectors and galleries can access deeper data.
8. **Accessible by default.** Persian RTL, keyboard access, reduced motion and low-bandwidth paths are release requirements.
9. **No guaranteed investment language.** Historical data and comparable sales may be shown; future return is never promised.
10. **Operations are part of the product.** Verification, packaging, condition checks, disputes and settlement must have first-class admin workflows.

## 4. Target personas and jobs

### 4.1 First-time collector

**Job:** “Help me choose an original work that fits my taste, wall and budget without feeling uninformed or cheated.”

Needs:

- discovery by mood, size, colour, price and space;
- clear price and delivery cost;
- authenticity evidence in plain language;
- preview in room and human consultation;
- simple return/dispute policy;
- education without art-world jargon.

### 4.2 Experienced collector

**Job:** “Help me evaluate, acquire, document and later resell a work efficiently.”

Needs:

- provenance, condition, edition and comparable-sale data;
- offers, wanted lists and auction participation;
- private collection management;
- expert review and resale workflow;
- privacy controls.

### 4.3 Independent artist

**Job:** “Help me present and sell my work professionally while preserving my reputation and price integrity.”

Needs:

- verified profile and portfolio;
- inventory, pricing and availability management;
- commission milestones;
- predictable fulfilment and settlement;
- analytics and qualified demand;
- non-exclusive but price-consistent representation.

### 4.4 Gallery or art institution

**Job:** “Extend my reach and operations without losing my client relationship or artist representation.”

Needs:

- organization accounts and staff roles;
- artist and inventory management;
- lead attribution, price parity and revenue share;
- exhibition, enquiry and sales tooling;
- reporting, invoices and settlement exports.

### 4.5 Reseller or estate owner

**Job:** “Verify my right to sell, receive a defensible estimate and find a buyer.”

Needs:

- seller KYC and ownership evidence;
- intake, condition report and expert opinion;
- private or public sale options;
- transparent deductions and settlement.

### 4.6 Interior designer, architect or organization

**Job:** “Source, approve, deliver and install multiple works within a project budget and deadline.”

Needs:

- trade account and multi-user projects;
- room boards, proposals and approvals;
- consolidated quote, invoice, delivery and installation;
- rental/rotation or commissioned works;
- account manager and reporting.

### 4.7 Paletto operations and experts

**Job:** “Safely operate a marketplace where every exception is visible, owned and auditable.”

Needs:

- review queues and service-level timers;
- identity, content, authenticity, order and payout controls;
- immutable audit history;
- dispute evidence and decision workflows;
- operational dashboards and alerts.

## 5. Goals

### User goals

- A qualified buyer can discover a relevant shortlist without knowing an artist name.
- A buyer can understand total price, authenticity evidence, delivery and return terms before commitment.
- An approved seller can publish and fulfil verified inventory without manual spreadsheet coordination.
- A collector can prove platform-recorded ownership and initiate resale.
- A gallery or business buyer can complete a multi-work project through one workflow.

### Business goals

- Maximize completed, non-refunded gross merchandise value rather than listing count.
- Build defensible provenance, demand and transaction data.
- Create recurring B2B, gallery tooling and data revenue alongside transaction commission.
- Increase artist earnings while keeping contribution margin positive after payment, support and fulfilment costs.
- Become the default trusted transaction layer for primary and secondary Iranian art.

## 6. Explicit non-goals

These are product-level exclusions even after `v6`, unless a new legal and architecture review changes them:

- fractional ownership or tokenized investment products;
- a custodial user wallet or deposit-taking activity without the required licence;
- guarantees of appreciation, liquidity or investment return;
- automatic AI-issued authenticity certificates;
- anonymous high-value buying, selling or payout;
- circumvention of sanctions, payment rules, export controls or content law;
- uncontrolled peer-to-peer publication of purported antiques or heritage objects;
- using blockchain as a substitute for expert provenance and legal ownership evidence.

## 7. Complete committed capability inventory

### Discovery and content

- Persian catalogue search and faceted filtering;
- browse by artist, medium, movement, city, dimensions, colour, mood, availability and price;
- taste onboarding and personalized recommendations;
- visual similarity search;
- saved works, collections, follows, alerts and recently viewed;
- editorial stories, artist narratives and curated collections;
- SEO pages, structured data, sitemap and shareable previews;
- augmented-reality “view in room”;
- curated 3D exhibitions with a low-motion and low-bandwidth fallback;
- accessibility and PWA support.

### Seller, artist and gallery

- phone-first registration, identity verification and bank-account matching;
- artist, gallery and organization profiles;
- role-based organization membership;
- portfolio, CV, exhibitions, representation and press;
- artwork drafts, variants/editions, media, availability and location;
- publication review and moderation;
- inventory and price-parity controls;
- seller analytics, enquiries, offers, orders, fulfilment and settlement;
- pricing assistance based on declared and observed market evidence;
- original commission workflow with proposal, milestones and approvals.

### Trust, authenticity and ownership

- seller KYC/KYB and risk tiering;
- artwork identity and immutable public identifier;
- artist-signed primary certificate;
- platform verification record and QR verification page;
- provenance and custody events;
- condition reports and expert opinions;
- edition-number controls;
- ownership transfer and private collection registry;
- evidence storage, audit history and dispute case files;
- content rights and media-use consent.

### Commerce

- unique-work reservation with expiry;
- direct purchase, negotiated offer and assisted sale;
- Rial-native pricing and explicit Toman display;
- Iranian payment provider abstraction;
- bank-transfer reconciliation for eligible high-value orders;
- internal double-entry accounting ledger, invoices and settlements;
- discount/commission rules with audit history;
- cancellation, statutory withdrawal, refund and dispute workflows;
- seller payout after fulfilment gates;
- notifications over in-app, SMS and email with provider fallback.

### Logistics and services

- structured Iranian addresses and service zones;
- packaging standards by medium;
- pickup, delivery, tracking and delivery evidence;
- pre-pickup and post-delivery condition checks;
- damage claim and coverage workflow;
- framing, installation and in-home preview orders;
- multi-carrier adapter and manual fallback;
- export-document tracking for legally eligible international orders.

### Secondary market and auctions

- resale intake, ownership proof and review;
- valuation range and comparable-sale evidence;
- wanted lists and unsolicited offer controls;
- private sale, fixed-price resale and timed auction;
- bidder KYC, deposit/authorization and limits;
- proxy/max bidding, anti-sniping and canonical server time;
- immutable bid log and auction settlement;
- optional platform-funded living-artist resale contribution;
- market history and collector portfolio views.

### B2B and data

- trade accounts for designers, architects and organizations;
- projects, room boards, proposals, approval and consolidated ordering;
- art advisory, commissions, rental/rotation, framing and installation;
- gallery subscription and transaction plans;
- market dashboards, artist performance and comparable sales;
- privacy-safe exports and future partner API.

### Administration and platform

- operations console with queues, RBAC and dual control for sensitive actions;
- CMS and policy/version management;
- feature flags and staged rollouts;
- product analytics and consent-aware event collection;
- audit, observability, backups, security controls and incident response;
- data retention, deletion and legal-hold workflows.

## 8. Success metrics

### North-star metric

**Completed Trusted GMV:** value of orders delivered and accepted, excluding cancellations, refunds, suspected fraud and unresolved authenticity disputes.

### Marketplace health

- active verified buyers and sellers in trailing 30/90/365 days;
- percentage of published works receiving a qualified action within 30 days;
- 90-day sell-through rate;
- median days from publication to completed sale;
- offer-to-order and consultation-to-order conversion;
- repeat buyer rate and first-time collector share;
- seller payout time after acceptance;
- off-platform leakage reports.

### Trust and operations

- authenticity dispute rate;
- double-sale incidents, with a target of zero;
- payment reconciliation exceptions;
- delivery damage and loss rate;
- refund and statutory withdrawal rate;
- median dispute resolution time;
- KYC and listing-review turnaround;
- percentage of orders with complete condition and custody evidence.

### Product quality

- Core Web Vitals by device and network tier;
- search zero-result and reformulation rates;
- recommendation save/contact/purchase rates;
- checkout completion and provider failure rates;
- accessibility defect count;
- support contacts per completed order.

Targets are hypotheses until `v1` baseline data exists. Each release document defines a success threshold and a rollback/hold threshold before broad rollout.

## 9. Global acceptance criteria

No customer-facing release is complete unless:

- all money is represented and persisted in Rial integers;
- all public write operations are authenticated as required, authorized at resource level and idempotent where retry is possible;
- sensitive actions generate an immutable audit event;
- unique inventory has a database-enforced single-sale invariant;
- payment, refund and payout can be reconciled against provider evidence;
- Persian/Arabic character and digit normalization is tested;
- RTL, keyboard navigation and reduced-motion paths are tested;
- empty, error, timeout and provider-outage states are designed;
- operational users can inspect and recover failed workflows;
- telemetry, runbook and rollback/kill switch exist;
- legal/compliance gates for the capability are signed off.

## 10. Open decisions

| ID     | Question                                                                                     | Owner                     | Blocking release |
| ------ | -------------------------------------------------------------------------------------------- | ------------------------- | ---------------- |
| OQ-001 | Exact legal classification: marketplace, online gallery, cultural institution or combination | Legal                     | v1               |
| OQ-002 | Approved PSP/payment aggregator and whether marketplace split settlement is supported        | Finance/Legal/Engineering | v1               |
| OQ-003 | Statutory withdrawal and auction/commission exceptions                                       | Legal                     | v1/v5            |
| OQ-004 | Who may issue each level of certificate and what warranty it represents                      | Art Ops/Legal             | v1               |
| OQ-005 | Domestic carrier, packaging and damage-coverage partners                                     | Operations                | v1               |
| OQ-006 | Seller commission, gallery share and payout schedule                                         | Product/Finance           | v1               |
| OQ-007 | Data retention periods for financial, identity and provenance evidence                       | Legal/Security            | v1               |
| OQ-008 | Eligibility and workflow for international sales and export                                  | Legal/Trade Ops           | v6               |
| OQ-009 | Whether living-artist resale contribution is opt-in, contractual or platform-funded          | Product/Legal/Finance     | v4               |
