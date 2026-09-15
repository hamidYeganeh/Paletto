# Release Roadmap: v0 to v6

**Status:** Proposed sequencing  
**Commitment:** All capabilities listed here remain in target scope  
**Release model:** Feature-flagged, progressively rolled out, independently reversible

## 1. Why versions exist

Paletto is one product with a stable target architecture. Versions reduce transaction, legal and operational risk; they are not separate rewrites.

- `v0` builds foundations and has no public marketplace promise.
- `v1` proves trusted fixed-price commerce.
- `v2` turns manual operations into a seller/gallery operating system.
- `v3` makes discovery and immersive design a conversion engine.
- `v4` adds ownership, resale and market data.
- `v5` adds managed auctions.
- `v6` expands B2B, national operations, data products and compliant international sales.

Customer URLs remain stable. Feature flags and entitlements determine access. External APIs stay on `/api/v1` until a breaking contract change actually requires `/api/v2`.

## 2. Capacity and calendar assumptions

Indicative engineering windows for the team described in [docs/README.md](./README.md):

| Release |    Indicative window | Confidence before discovery   |
| ------- | -------------------: | ----------------------------- |
| v0      |            4–6 weeks | Medium                        |
| v1      | 10–12 weeks after v0 | Medium                        |
| v2      |           8–10 weeks | Low-medium                    |
| v3      |           8–12 weeks | Low                           |
| v4      |          10–14 weeks | Low                           |
| v5      |          10–12 weeks | Low until auction/legal spike |
| v6      |          12–16 weeks | Low; partner/legal dependent  |

After v1, discovery/design/legal work for the next release can overlap current delivery. With only two or three engineers, expect the full scope to take well beyond two years. Calendar dates should be committed one release at a time.

Capacity allocation per release:

- 65% roadmap capabilities;
- 20% security, reliability, performance and technical health;
- 10% operations/vendor/compliance integration;
- 5% unplanned production work.

## 3. Dependency map

```text
v0 Foundation
  |
  v
v1 Trusted primary commerce
  |--------------------|
  v                    v
v2 Seller/Gallery OS  v3 Discovery & immersive growth
  |                    |
  +----------+---------+
             v
       v4 Ownership & secondary market
             |
             v
       v5 Managed auctions
             |
             v
       v6 B2B, national scale, data & international
```

Some v3 content/discovery work can run beside v2, but v4 must rely on completed ownership, condition, ledger and fulfilment foundations. v5 must reuse v4 trust/secondary intake and v1/v2 commerce.

## 4. Rollout stages for every release

1. **Development:** local/provider fakes; no production data.
2. **Staff alpha:** real internal workflow with test/specially approved inventory.
3. **Closed beta:** allowlisted sellers/buyers/locations and daily operations review.
4. **Limited production:** percentage/segment rollout with automated monitoring.
5. **General availability:** release gates and hold thresholds passed.
6. **Post-release review:** metrics, incidents, support load, architecture and next-release changes.

Every capability has:

- server-side kill switch;
- entitlement/allowlist where appropriate;
- migration and rollback strategy;
- owner, dashboard, alerts and runbook.

## 5. v0 — Platform and operational foundation

### Outcome

The team can build, test, deploy and operate a secure transactional marketplace without changing the current public experience.

### Included

- approved ADRs and module dependency rules;
- `web`, `admin`, `api`, `worker` deployment skeletons;
- typed config/secrets and environment separation;
- PostgreSQL migrations, Redis jobs, object storage and local provider fakes;
- CI quality gates, infrastructure-as-code and repeatable deployment;
- centralized logs, traces, metrics and alert routing;
- identity/session/RBAC foundation and staff MFA path;
- audit log, idempotency, outbox/inbox and job retry foundation;
- feature flags and entitlement service;
- compliance register and legal/accounting workflow decisions;
- design system foundations for RTL, accessibility, forms and transaction states;
- test fixtures and synthetic marketplace data.

### Exit criteria

- A synthetic order can reserve an inventory unit and post a balanced fake ledger transaction end to end in staging.
- Duplicate command/event tests prove idempotency.
- Backup restore and secret rotation drills pass.
- Staff alpha authentication/MFA and audit events pass security review.
- Blocking v1 legal/payment/logistics decisions have owners and target dates.

## 6. v1 — Trusted curated marketplace

### Promise

“Discover a verified, available Iranian artwork and buy it with a clear price, documented trust and safe fulfilment.”

### Buyer scope

- phone-first sign-up/login and profile;
- real artist/artwork catalogue with Persian search and filters;
- artist, artwork and curated collection pages;
- fixed-price listings with explicit Rial/Toman, availability and total-cost quote;
- unique inventory reservation and checkout;
- one approved Iranian payment provider plus manual reconciliation;
- order timeline, notifications and support case;
- shipping/packaging status with initially assisted/manual operations;
- buyer acceptance, return/dispute request and refund workflow;
- public transaction-certificate verification;
- responsive, accessible and low-bandwidth purchase path.

### Seller/operations scope

- invite-only seller/artist onboarding and KYC;
- artist profile, artwork draft, media upload and listing submission;
- admin review for seller, artwork, rights and publication;
- inventory location and availability management;
- order, packaging, condition, delivery and dispute queues;
- basic invoice, ledger, reconciliation and seller settlement statement;
- manual payout approval and evidence;
- CMS for policies, FAQ and curated collections;
- baseline product/marketplace analytics.

### Deliberately deferred but architecturally supported

- self-serve gallery organizations, offers and commissions: v2;
- personalization, AR and 3D commerce: v3;
- resale/valuation: v4;
- auctions: v5;
- B2B/international: v6.

### Exit criteria

- zero double-sale incidents in concurrency tests and closed beta;
- payment/refund/payout daily reconciliation explains all money or opens owned exceptions;
- at least 30 approved artists, 200 published verified works and 30 completed real orders in the initial operating cohort;
- 100% of sold works have required condition/custody/transaction certificate evidence;
- damage, refund, dispute and support SLAs are measurable;
- legal, finance, security, accessibility and operations owners sign the GA checklist.

### Hold thresholds

- any unresolved double-sale or unexplained ledger imbalance;
- authenticity/ownership process cannot produce evidence;
- payment callback mismatch is auto-confirming orders;
- damage rate or support queue exceeds the agreed operational capacity;
- blocking licence/tax/payment partner status unresolved.

## 7. v2 — Artist, gallery and fulfilment operating system

### Promise

“Artists and galleries can professionally manage inventory, negotiations, commissions, fulfilment and settlement.”

### Included

- self-serve seller application with review queue and risk tiering;
- organizations, gallery verification, team roles and invitations;
- artist representation and listing authority;
- portfolio/CV/exhibitions/press management;
- bulk inventory and media workflow;
- price parity, external-sale incident and inventory freshness controls;
- seller dashboard for views, saves, enquiries, orders and settlement;
- make-offer/counter/accept/expiry workflow;
- commissioned artwork briefs, proposals, contracts, milestones and disputes;
- pricing assistance with transparent methodology/limitations;
- automated multi-provider SMS notification fallback;
- carrier adapter, zones, pickup booking, tracking and delivery evidence;
- risk-based packaging checklist and damage-claim workflow;
- framing, installation and in-home preview service orders;
- policy-driven withdrawal/return/refund operations;
- automated payout eligibility and approval workflow;
- gallery subscription/commission rule foundation;
- finance/admin exports and Taxpayer System-compatible data flow as legally required.

### Exit criteria

- seller can complete onboarding-to-payout without spreadsheets or hidden database edits;
- gallery roles cannot access another organization’s data in authorization tests;
- accepted offer atomically reserves inventory;
- commission milestone money and cancellation outcomes reconcile in ledger tests;
- carrier outage falls back to a visible manual task;
- seller payout median and exception targets are met for closed cohort.

## 8. v3 — Personalized discovery and immersive commerce

### Promise

“Find art for your taste, space and budget—even if you do not know an artist’s name.”

### Included

- taste onboarding and editable preference profile;
- saves, custom collections, artist follows and alerts;
- personalized recommendation v1 with explainable reasons;
- improved Persian synonyms, transliteration and zero-result recovery;
- visual similarity search;
- browse by mood, palette, room, dimension and budget;
- AR/view-in-room with scale calibration;
- curated 3D exhibitions connected to real listings;
- static/2D and reduced-motion alternatives;
- editorial CMS, artist stories, city/medium/style landing pages;
- SEO structured data, canonical/slugs, sitemap and OG automation;
- PWA installability, safe retry and cached public discovery;
- consultation booking and assisted shortlist;
- experiment framework and recommendation/search analytics.

### Exit criteria

- recommendation and visual-search evaluation set passes relevance threshold;
- personalized surfaces outperform deterministic baseline on qualified actions without reducing diversity target;
- AR scale error is within the documented device/measurement tolerance;
- 3D is not loaded before intent and core purchase works without it;
- Core Web Vitals/accessibility budgets pass on the agreed mid-range mobile/network profile;
- no private collection or identity data leaks into recommendation/search logs.

## 9. v4 — Ownership, secondary market and market intelligence

### Promise

“Own art with a durable record and a credible path to resale.”

### Included

- private collector collection dashboard and visibility controls;
- provenance timeline, custody records and certificate versions;
- expert directory/assignment, condition reports and opinions;
- resale intake, ownership evidence and review;
- valuation report with date, range, method and comparable sales;
- fixed-price and private secondary listings;
- wanted lists and private-offer permissions;
- historical/comparable market data and price context;
- owner alerts when matched demand appears;
- resale settlement and ownership transfer;
- configurable platform-funded living-artist resale contribution;
- certificate revocation, trust disputes and appeals;
- portfolio summary without investment-return promises;
- privacy-safe market dashboards.

### Exit criteria

- ownership history cannot be overwritten and correction is auditable;
- public verification reveals no private owner or evidence;
- resale listing requires passed ownership/condition gates;
- valuation methodology and conflicts are visible;
- secondary settlement, contribution, fees and payout balance;
- trust cases have named expert/legal/ops SLAs.

## 10. v5 — Managed auctions

### Promise

“Participate in transparent, verified online auctions with authoritative bids and settlement.”

### Included

- auction creation, catalogue review and schedule;
- bidder KYC, agreements, limits and deposit/authorization;
- lots, reserves, estimates and increment tables;
- timed auction and optional moderated live experience;
- direct bids, confidential proxy/max bids and deterministic priority;
- canonical server time and anti-sniping extensions;
- real-time updates with reconnect/sequence recovery;
- append-only bid audit and bidder-safe history;
- winner order/payment deadline and default handling;
- seller/buyer premium rules, invoices and settlement;
- unsold/post-auction offer workflow;
- bidder support and operations war-room dashboards;
- auction load, clock, failure and recovery tests.

### Exit criteria

- no duplicate accepted bid for one client request;
- deterministic simulation produces the same winner/price for the same ordered commands;
- peak load test passes at least 2x expected event peak;
- disconnect/reconnect does not change authoritative result;
- close/extension behavior is reconstructable and independently tested;
- auction terms, deposit, tax, withdrawal/default and licensing sign-off completed;
- manual event runbook and staffed incident plan rehearsed.

## 11. v6 — B2B, national scale, data products and compliant international sales

### Promise

“Paletto is the operating network for individual, professional and organizational Iranian art commerce.”

### B2B included

- verified trade accounts and organization teams;
- projects, spaces/walls, boards and stakeholder approvals;
- versioned proposals, budget and availability holds;
- consolidated orders, invoices, delivery and installation;
- rental/rotation agreements and periodic condition checks;
- organizational commissions and account management;
- trade pricing/commission entitlements and reporting.

### National operations included

- expanded multi-carrier service zones;
- regional packaging/condition partners and quality scores;
- route/installation scheduling and exception dashboards;
- service-level and unit-economics reporting by city/medium/risk tier.

### Data platform included

- gallery/artist subscription tiers;
- advanced demand, sell-through and comparable-sale dashboards;
- privacy-safe exports;
- partner API keys, scopes, quotas, audit and `/api/v1` contracts;
- data provenance and correction workflow.

### International/diaspora included only after launch gate

- country/category eligibility and feature flags;
- compliant legal entity/seller/exporter of record design;
- permitted payment/settlement provider;
- export permits/customs document tracking;
- currency, duties, coverage, shipping and return quote;
- English/bilingual catalogue fields and support workflow;
- restricted-party/category screening as required;
- no personal-account or sanctions workaround.

### Exit criteria

- B2B proposal-to-consolidated-order flow balances and preserves approvals;
- rental/rotation custody and condition history is complete;
- regional partners pass evidence and damage thresholds;
- partner API security/quotas/contract tests pass;
- international capability remains disabled until legal, tax, payment, export, insurance and operations evidence is signed off;
- domestic commerce can disable international dependencies without degradation.

## 12. Release review template

For every release, the owner publishes:

```text
Release:
Scope shipped / scope moved:
Flags and cohorts:
User outcome metrics:
Marketplace/trust metrics:
Reliability/security incidents:
Support/operations load:
Legal/vendor changes:
Architecture pressure observed:
Rollback/cleanup completed:
Decision for next rollout:
```
