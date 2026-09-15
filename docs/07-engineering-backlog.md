# Engineering Backlog

**Status:** Proposed executable backlog  
**Estimation:** Relative size (`S`, `M`, `L`, `XL`)  
**Ordering:** Dependencies first; tasks within a release may run in parallel after prerequisites

## 1. Task contract

Before a task enters implementation it must have:

- named product and engineering owner;
- linked user/compliance problem;
- design/API/event/state-machine acceptance criteria;
- dependency and provider/legal decisions resolved or explicitly mocked;
- rollout flag, telemetry and operational owner;
- estimate split if larger than one sprint.

An `XL` item is an epic and must be broken into sprint-sized stories before development.

## 2. Definition of done

A product/platform task is done only when applicable items are complete:

- implementation follows module ownership and approved ADRs;
- database migration is forward-safe and rollback/roll-forward is documented;
- OpenAPI/event schemas and generated clients are updated;
- unit, integration, contract, authorization and error-path tests pass;
- Persian/RTL/money/time/accessibility cases pass;
- security/privacy review and threat-control notes are complete;
- metrics, logs, traces, alerts and safe audit events exist;
- feature flag/entitlement and rollback behavior are verified;
- admin/support recovery path and runbook exist;
- docs and customer/operations copy are updated;
- acceptance criteria pass in staging and required release owner signs off.

## 3. v0 — Foundation backlog

| ID      | Task                                                                           | Size | Dependencies                   |
| ------- | ------------------------------------------------------------------------------ | ---: | ------------------------------ |
| PLT-001 | Approve module map, dependency rules and code ownership                        |    M | ADR review                     |
| PLT-002 | Define target monorepo apps/packages and build graph                           |    M | PLT-001                        |
| PLT-003 | Establish local, test, staging and production configuration contract           |    M | PLT-002                        |
| PLT-004 | Select migration/query tooling and create PostgreSQL migration policy          |    M | PLT-001                        |
| PLT-005 | Define Redis job, retry, dedupe and dead-letter conventions                    |    M | PLT-001                        |
| PLT-006 | Define transactional outbox/inbox schemas and processing semantics             |    L | PLT-004, PLT-005               |
| PLT-007 | Define object-storage buckets, signed upload and retention classes             |    M | security data classes          |
| PLT-008 | Define OpenAPI generation, client generation and breaking-change CI            |    M | PLT-002                        |
| PLT-009 | Define structured log, trace, metric and correlation standards                 |    M | PLT-003                        |
| PLT-010 | Define feature-flag, entitlement, cohort and kill-switch model                 |    M | PLT-001                        |
| PLT-011 | Define append-only audit event schema and safe diff rules                      |    M | SEC-002                        |
| PLT-012 | Build provider-port contract template and deterministic fake standard          |    M | PLT-001                        |
| PLT-013 | Define infrastructure-as-code, deploy, rollback and environment promotion      |    L | PLT-003                        |
| PLT-014 | Define backup, restore, PITR and disaster-recovery procedure                   |    M | PLT-004, PLT-013               |
| PLT-015 | Create synthetic marketplace fixtures and test factory design                  |    M | domain model                   |
| IAM-001 | Select authentication/session library using security review                    |    M | SEC-001                        |
| IAM-002 | Define account, session, device and revocation model                           |    M | IAM-001                        |
| IAM-003 | Define RBAC roles and ABAC resource-authorization policy                       |    L | domain personas                |
| IAM-004 | Define staff MFA, step-up and recovery policy                                  |    M | IAM-001, IAM-003               |
| SEC-001 | Produce marketplace threat model and abuse-case register                       |    L | architecture baseline          |
| SEC-002 | Classify public, internal, confidential, restricted and evidence data          |    M | SEC-001                        |
| SEC-003 | Define encryption, secret, key rotation and privileged-access policy           |    M | SEC-002                        |
| SEC-004 | Define rate-limit and anti-automation policy by endpoint risk                  |    M | IAM-002                        |
| FIN-001 | Approve Rial/Toman, basis-point and rounding conventions                       |    S | finance owner                  |
| FIN-002 | Design chart of ledger accounts and posting rules                              |    L | FIN-001, legal/accounting flow |
| FIN-003 | Define payment/refund/payout reconciliation cases and reports                  |    L | FIN-002                        |
| CMP-001 | Obtain written legal classification and licence checklist                      |    L | legal counsel                  |
| CMP-002 | Map tax/invoice responsibility by transaction type                             |    L | CMP-001, FIN-002               |
| CMP-003 | Define retention, legal hold and deletion matrix                               |    M | SEC-002, legal counsel         |
| OPS-001 | Map end-to-end service blueprint and operations queues                         |    L | product flows                  |
| OPS-002 | Define art risk tiers, packaging evidence and custody standards                |    L | art/logistics partners         |
| UX-001  | Define RTL design tokens, form states, money/date components and a11y baseline |    L | existing UI review             |
| QLT-001 | Define test pyramid, contract-test and production-release gates                |    M | architecture baseline          |
| QLT-002 | Define SLOs, error budgets, alert severity and on-call ownership               |    M | PLT-009, OPS-001               |

### v0 completion evidence

- Architecture and compliance decisions are signed.
- A staging technical slice can authenticate staff, reserve synthetic inventory, post a balanced fake payment ledger entry, write outbox/audit events and recover a duplicate job.
- Restore and domestic-dependency outage exercises have documented results.

## 4. v1 — Trusted curated marketplace backlog

### Identity and verification

| ID      | Task                                                                   | Size | Dependencies              |
| ------- | ---------------------------------------------------------------------- | ---: | ------------------------- |
| IAM-101 | Implement phone normalization and OTP challenge/verification contract  |    L | IAM-001/002, SEC-004      |
| IAM-102 | Implement secure server sessions, rotation, device list and revocation |    L | IAM-101                   |
| IAM-103 | Implement customer profile and consent/policy acknowledgement          |    M | IAM-102, CMP-003          |
| IAM-104 | Implement API resource authorization framework and denial audit        |    L | IAM-003, PLT-011          |
| IAM-105 | Implement admin authentication, MFA and step-up actions                |    L | IAM-004, IAM-102          |
| KYC-101 | Implement invite-only seller verification case and evidence upload     |    L | IAM-103, PLT-007, SEC-002 |
| KYC-102 | Implement bank-account ownership verification/manual review adapter    |    L | KYC-101, PLT-012          |
| KYC-103 | Build admin KYC queue, decision, reason and expiry/recheck             |    L | KYC-101, IAM-105          |

### Artist, catalogue, media and search

| ID      | Task                                                                           | Size | Dependencies              |
| ------- | ------------------------------------------------------------------------------ | ---: | ------------------------- |
| CAT-101 | Implement canonical artist profile, aliases and public/private DTOs            |    L | IAM-104                   |
| CAT-102 | Implement artwork draft with Persian fields, medium and dimensions             |    L | CAT-101, FIN-001          |
| CAT-103 | Implement artwork unit model for unique work and numbered edition              |    L | CAT-102                   |
| CAT-104 | Implement signed media upload, validation, checksum and private original       |    L | PLT-007, SEC-002          |
| CAT-105 | Implement media derivative, watermark and metadata-stripping worker            |    L | CAT-104, PLT-005          |
| CAT-106 | Implement rights grant and media moderation gate                               |    M | CAT-104, CMP-003          |
| CAT-107 | Implement listing draft, Rial price and sale-policy snapshot                   |    L | CAT-103, FIN-001          |
| CAT-108 | Implement submit/review/approve/publish/suspend state machine                  |    L | CAT-106/107, PLT-011      |
| CAT-109 | Build artwork review/admin publication queue and SLA                           |    L | CAT-108, IAM-105          |
| SRC-101 | Implement Persian normalization library and regression fixtures                |    M | FIN-001 conventions       |
| SRC-102 | Implement PostgreSQL search projection, trigram/FTS and filters                |    L | CAT-108, SRC-101, PLT-006 |
| SRC-103 | Implement cursor pagination, deterministic sorting and availability projection |    M | SRC-102                   |
| WEB-101 | Replace prototype placeholders with real artist/artwork/catalogue data         |   XL | CAT-101–108, SRC-103      |
| WEB-102 | Build accessible artist, artwork, collection and catalogue routes              |   XL | WEB-101, UX-001           |
| CMS-101 | Implement policy, FAQ and curated-collection CMS baseline                      |    L | IAM-105, PLT-011          |

### Inventory, checkout and orders

| ID      | Task                                                                      | Size | Dependencies              |
| ------- | ------------------------------------------------------------------------- | ---: | ------------------------- |
| INV-101 | Implement inventory location and availability state                       |    M | CAT-103                   |
| INV-102 | Implement unique active reservation database invariant                    |    L | INV-101, PLT-004          |
| INV-103 | Implement reservation expiry/release worker and audit                     |    M | INV-102, PLT-005/006      |
| INV-104 | Implement external-sale/unavailable incident command                      |    M | INV-101, ADM-102          |
| ORD-101 | Implement checkout quote with item, fee, shipping and policy snapshot     |    L | CAT-107, INV-102, FIN-001 |
| ORD-102 | Implement structured Iranian buyer address and validation                 |    M | IAM-103                   |
| ORD-103 | Implement idempotent order creation consuming reservation atomically      |    L | ORD-101/102, PLT-006      |
| ORD-104 | Implement order state machine and actor/expected-version transition rules |    L | ORD-103, PLT-011          |
| ORD-105 | Implement buyer/seller order timeline and safe DTOs                       |    M | ORD-104                   |
| ORD-106 | Implement cancellation request and operations decision                    |    M | ORD-104, CMS-101          |

### Payments, ledger and finance

| ID      | Task                                                                    | Size | Dependencies              |
| ------- | ----------------------------------------------------------------------- | ---: | ------------------------- |
| PAY-101 | Finalize approved PSP contract and normalized gateway port              |    L | CMP-001/002, PLT-012      |
| PAY-102 | Implement idempotent payment intent and provider initialization         |    L | PAY-101, ORD-103          |
| PAY-103 | Implement raw-body callback verification, replay prevention and dedupe  |    L | PAY-101, SEC-001          |
| PAY-104 | Implement provider inquiry and ambiguous/late payment state             |    L | PAY-103, FIN-003          |
| LED-101 | Implement immutable double-entry ledger and balance constraints         |   XL | FIN-002, PLT-004          |
| LED-102 | Implement order-payment posting rules and idempotency                   |    L | LED-101, PAY-103          |
| PAY-105 | Implement daily provider/ledger reconciliation and exception queue      |    L | PAY-104, LED-102, FIN-003 |
| PAY-106 | Implement refund request, approval, provider attempt and ledger posting |    L | PAY-105, ORD-106          |
| TAX-101 | Implement receipt/invoice snapshot and document generation              |    L | CMP-002, LED-102          |
| SET-101 | Implement basic seller settlement statement and payout eligibility      |    L | LED-102, FUL-106          |
| SET-102 | Implement manual payout approval/evidence and payout ledger posting     |    L | SET-101, KYC-102, IAM-105 |

### Fulfilment, trust and support

| ID      | Task                                                                    | Size | Dependencies              |
| ------- | ----------------------------------------------------------------------- | ---: | ------------------------- |
| FUL-101 | Implement service zone and assisted/manual shipping quote               |    M | OPS-002, ORD-102          |
| FUL-102 | Implement risk-based packaging plan/checklist and media evidence        |    L | OPS-002, CAT-104          |
| FUL-103 | Implement shipment, manual tracking and custody events                  |    L | FUL-101/102, ORD-104      |
| FUL-104 | Implement delivery evidence and buyer inspection-period start           |    M | FUL-103                   |
| FUL-105 | Implement pickup/delivery condition report baseline                     |    L | FUL-102/104               |
| FUL-106 | Implement delivery acceptance/policy timer and order completion         |    L | FUL-104/105, ORD-104      |
| FUL-107 | Implement damage/non-delivery claim intake and operations queue         |    L | FUL-105, SUP-101          |
| TRU-101 | Implement certificate types, immutable versions and signed payload hash |    L | CAT-103, SEC-003          |
| TRU-102 | Implement safe public QR/certificate verification and revocation status |    M | TRU-101                   |
| TRU-103 | Implement primary ownership and custody/provenance events on sale       |    L | TRU-101, FUL-106, LED-102 |
| SUP-101 | Implement support case, SLA, evidence links and safe communication log  |    L | IAM-104, PLT-011          |
| SUP-102 | Implement return/mismatch/authenticity dispute categories and holds     |    L | SUP-101, CMS-101, PAY-106 |

### Notifications, admin and analytics

| ID      | Task                                                                             | Size | Dependencies                  |
| ------- | -------------------------------------------------------------------------------- | ---: | ----------------------------- |
| NOT-101 | Implement in-app notification model and preference-safe templates                |    M | IAM-103                       |
| NOT-102 | Implement SMS adapter, delivery records, retry and rate limits                   |    L | PLT-012, NOT-101              |
| NOT-103 | Implement email adapter as non-critical fallback/channel                         |    M | PLT-012, NOT-101              |
| NOT-104 | Subscribe order/payment/fulfilment events to required notifications              |    M | PLT-006, NOT-101–103          |
| ADM-101 | Build admin shell, navigation, RBAC and global entity search                     |    L | IAM-105, UX-001               |
| ADM-102 | Build unified operations queue framework with owner/SLA/escalation               |    L | ADM-101, OPS-001              |
| ADM-103 | Add order/payment/reconciliation/refund/payout queue views                       |   XL | ADM-102, PAY-105/106, SET-102 |
| ADM-104 | Add catalogue/KYC/fulfilment/trust/support queue views                           |   XL | ADM-102, respective modules   |
| ANL-101 | Define privacy-safe product/marketplace event catalogue                          |    M | SEC-002, metrics definition   |
| ANL-102 | Implement event collection pipeline independent of checkout                      |    L | ANL-101, PLT-006              |
| ANL-103 | Build v1 GMV, conversion, sell-through and operations dashboards                 |    L | ANL-102, LED-102              |
| REL-101 | Run v1 concurrency, reconciliation, security, accessibility and outage test plan |   XL | all v1 critical paths         |
| REL-102 | Execute staff alpha, closed beta and GA gate reviews                             |    L | REL-101                       |

## 5. v2 — Seller, gallery and fulfilment OS backlog

### Organizations and seller workspace

| ID      | Task                                                                    | Size | Dependencies         |
| ------- | ----------------------------------------------------------------------- | ---: | -------------------- |
| ORG-201 | Implement gallery/business organization and KYB case                    |    L | IAM-104, KYC-101     |
| ORG-202 | Implement invitations, membership roles and organization audit          |    L | ORG-201, IAM-104     |
| ORG-203 | Implement artist representation scope and listing authority             |    L | ORG-201, CAT-101     |
| SEL-201 | Implement self-serve seller application and review status               |    L | KYC-103, ORG-201     |
| SEL-202 | Implement artist CV, exhibitions, awards, press and portfolio editor    |    L | CAT-101, CAT-104     |
| SEL-203 | Implement seller/gallery inventory dashboard and bulk editing           |   XL | CAT-107/108, INV-101 |
| SEL-204 | Implement CSV/import validation and resumable bulk media flow           |    L | SEL-203, CAT-104     |
| SEL-205 | Implement inventory freshness confirmation and stale listing suspension |    M | INV-104, NOT-104     |
| SEL-206 | Implement price-parity declaration and external-sale incident analytics |    M | SEL-203, INV-104     |
| SEL-207 | Implement seller performance, enquiry, order and settlement dashboard   |    L | ANL-103, SET-101     |

### Offers, commissions and pricing

| ID      | Task                                                                  | Size | Dependencies              |
| ------- | --------------------------------------------------------------------- | ---: | ------------------------- |
| OFF-201 | Implement offer thread, immutable offer/counter and expiry            |    L | IAM-104, CAT-107          |
| OFF-202 | Implement atomic offer acceptance plus priced reservation             |    L | OFF-201, INV-102, ORD-103 |
| OFF-203 | Implement offer privacy, abuse limits and notifications               |    M | OFF-201, NOT-104          |
| COM-201 | Implement commission brief and artist invitation/matching             |    L | SEL-202, CAT taxonomy     |
| COM-202 | Implement proposal, price, rights, timeline and revision workflow     |    L | COM-201, CMS-101          |
| COM-203 | Implement commission contract and milestone state machine             |   XL | COM-202, ORD-104, LED-101 |
| COM-204 | Implement deliverable review, revision, approval and dispute          |    L | COM-203, SUP-101          |
| COM-205 | Create final artwork unit, certificate and fulfilment from commission |    L | COM-204, TRU-101, FUL-102 |
| PRC-201 | Define explainable pricing-assistance methodology and guardrails      |    L | art ops, ANL-103          |
| PRC-202 | Implement seller-facing pricing range and limitation display          |    L | PRC-201, CAT-107          |

### Logistics, returns and automated settlement

| ID      | Task                                                                      | Size | Dependencies                        |
| ------- | ------------------------------------------------------------------------- | ---: | ----------------------------------- |
| FUL-201 | Implement primary carrier adapter and contract tests                      |    L | FUL-103, PLT-012                    |
| FUL-202 | Implement pickup booking, polling/callback and normalized tracking        |    L | FUL-201                             |
| FUL-203 | Implement SMS/carrier fallback and manual takeover circuit                |    M | FUL-202, NOT-102                    |
| FUL-204 | Implement packaging partner assignment and quality evidence               |    L | FUL-102, ORG-201                    |
| FUL-205 | Implement framing, installation and in-home preview service orders        |   XL | FUL-101, ORD-104, LED-101           |
| FUL-206 | Implement damage coverage decision and compensation ledger flow           |    L | FUL-107, PAY-106, LED-101           |
| RET-201 | Implement policy-engine rules for withdrawal/return by transaction type   |    L | legal OQ-003, CMS-101               |
| RET-202 | Implement return shipment, condition comparison and refund calculation    |   XL | RET-201, FUL-202, PAY-106           |
| SET-201 | Implement automated payout eligibility checks and approval batch          |    L | SET-102, FUL-106, PAY-105           |
| SET-202 | Implement provider/bank payout adapter and reconciliation                 |    L | SET-201, PLT-012                    |
| TAX-201 | Implement approved Taxpayer System invoice/export integration             |   XL | CMP-002, TAX-101, provider decision |
| PLN-201 | Implement gallery plan/commission entitlements without billing automation |    M | ORG-201, LED-101, PLT-010           |
| REL-201 | Run seller/gallery authorization, commission and fulfilment beta          |    L | v2 critical paths                   |

## 6. v3 — Discovery and immersive commerce backlog

| ID       | Task                                                                    | Size | Dependencies              |
| -------- | ----------------------------------------------------------------------- | ---: | ------------------------- |
| ENG-301  | Implement save/unsave and private user collections                      |    M | IAM-103, CAT-108          |
| ENG-302  | Implement artist follow and availability/new-work alerts                |    M | ENG-301, NOT-104          |
| TST-301  | Implement taste onboarding and editable preference profile              |    L | CAT taxonomy, IAM-103     |
| REC-301  | Define recommendation training/evaluation data and diversity guardrails |    L | ANL-102, TST-301          |
| REC-302  | Implement deterministic/content-based recommendation v1                 |   XL | REC-301, SRC-102          |
| REC-303  | Implement explainable recommendation surfaces and controls              |    L | REC-302, WEB-102          |
| SRC-301  | Add Persian synonym, transliteration and query-recovery management      |    L | SRC-101/102, CMS-101      |
| SRC-302  | Implement visual embedding generation and similarity index behind port  |   XL | CAT-105, PLT-012          |
| SRC-303  | Build visual-search upload/privacy/abuse flow                           |    L | SRC-302, SEC-002          |
| AR-301   | Define physical-scale calibration and supported-device contract         |    M | CAT dimensions, design    |
| AR-302   | Implement view-in-room assets and accessible fallback                   |   XL | AR-301, CAT-105           |
| GLR-301  | Define 3D exhibition scene schema linked to real listing IDs            |    L | CAT-108, Exhibition model |
| GLR-302  | Implement curated 3D viewer with lazy loading and low-motion fallback   |   XL | GLR-301, UX-001           |
| CMS-301  | Implement versioned editorial story and artist narrative workflow       |    L | CMS-101, CAT-101          |
| SEO-301  | Implement canonical/slugs, redirects, structured data and sitemaps      |    L | WEB-102, CMS-301          |
| PWA-301  | Implement manifest, installability and safe cached public discovery     |    L | WEB-102, security review  |
| EXP-301  | Implement experiment assignment, exposure and guardrail metrics         |    L | ANL-102                   |
| CON-301  | Implement consultation booking, shortlist and outcome tracking          |    L | ENG-301, SUP-101          |
| PERF-301 | Enforce image/JS/3D performance budgets in CI and RUM                   |    L | PLT-009, AR/GLR work      |
| A11Y-301 | Complete WCAG 2.2 AA audit/remediation for core customer flows          |   XL | all v3 UI                 |
| REL-301  | Run relevance, privacy, mobile performance and accessibility beta       |    L | v3 critical paths         |

## 7. v4 — Ownership and secondary market backlog

| ID      | Task                                                                   | Size | Dependencies                  |
| ------- | ---------------------------------------------------------------------- | ---: | ----------------------------- |
| COL-401 | Implement private collector collection and visibility policy           |    L | TRU-103, IAM-104              |
| COL-402 | Implement ownership document/certificate download and sharing controls |    M | COL-401, TRU-102              |
| PRV-401 | Implement provenance event schema, evidence and confidence/visibility  |    L | TRU-101, SEC-002              |
| PRV-402 | Implement custody timeline and corrections/reversal workflow           |    L | PRV-401, FUL-103              |
| EXP-401 | Implement expert profile, qualification, conflict and assignment       |    L | KYC-101, ORG-202              |
| EXP-402 | Implement structured condition report with signed evidence             |    L | EXP-401, CAT-104              |
| EXP-403 | Implement expert opinion scope, conclusion and limitations             |    L | EXP-401, PRV-401              |
| SEC-401 | Implement resale intake and ownership evidence                         |    L | COL-401, KYC-101              |
| SEC-402 | Implement ownership/condition/authenticity review gates                |   XL | SEC-401, EXP-402/403, SUP-102 |
| VAL-401 | Define valuation methodology, comparable source rights and disclaimer  |    L | legal, art ops, data          |
| VAL-402 | Implement comparable-sale normalization and correction workflow        |   XL | VAL-401, PRV-401              |
| VAL-403 | Implement dated valuation report/range and expert approval             |    L | VAL-402, EXP-401              |
| SEC-403 | Implement seller choice: private or fixed-price secondary listing      |    L | SEC-402/VAL-403, CAT-107      |
| WNT-401 | Implement wanted request, matching and privacy settings                |    L | SRC-102, IAM-104              |
| WNT-402 | Implement owner opt-in for private unsolicited offers                  |    M | COL-401, OFF-201              |
| SEC-404 | Implement secondary ownership transfer, fees and settlement            |   XL | SEC-403, TRU-103, LED-101     |
| RSL-401 | Define optional living-artist contribution contract/accounting         |    L | legal/finance decision        |
| RSL-402 | Implement contribution policy snapshot and ledger posting              |    L | RSL-401, SEC-404              |
| TRU-401 | Implement certificate revocation/reissue and public status             |    L | TRU-102, PRV-401              |
| TRU-402 | Implement trust/authenticity case, holds, expert decision and appeal   |   XL | SUP-102, EXP-403, TRU-401     |
| DAT-401 | Build privacy-safe artist/market/comparable dashboards                 |    L | VAL-402, ANL-103              |
| REL-401 | Run ownership privacy, secondary settlement and trust-case beta        |    L | v4 critical paths             |

## 8. v5 — Auction backlog

| ID      | Task                                                                    | Size | Dependencies              |
| ------- | ----------------------------------------------------------------------- | ---: | ------------------------- |
| AUC-501 | Complete auction legal, fee, deposit, default and policy decisions      |    L | CMP register, v4 trust    |
| AUC-502 | Implement auction and lot aggregate/state machines                      |   XL | AUC-501, SEC-402          |
| AUC-503 | Build auction admin creation, review, publish and schedule              |   XL | AUC-502, ADM-101          |
| AUC-504 | Implement public auction catalogue, lot pages and timezone display      |    L | AUC-502, WEB-102          |
| BID-501 | Implement bidder registration, terms and risk-tier KYC                  |    L | KYC-101, AUC-501          |
| BID-502 | Implement bidder deposit/authorization and limits                       |   XL | BID-501, PAY-101, LED-101 |
| BID-503 | Implement bid command, validation, append-only sequence and idempotency |   XL | AUC-502, PLT-006          |
| BID-504 | Implement increment tables, reserve and deterministic current price     |    L | BID-503                   |
| BID-505 | Implement confidential proxy/max bidding and priority rules             |   XL | BID-503/504               |
| BID-506 | Implement canonical close and anti-sniping extension policy             |    L | BID-503                   |
| BID-507 | Implement SSE/live fan-out with reconnect from sequence                 |   XL | BID-503, Redis            |
| AUC-505 | Implement idempotent lot close, winner/unsold result and evidence       |    L | BID-505/506               |
| AUC-506 | Implement winner order, payment deadline and default handling           |   XL | AUC-505, ORD/PAY modules  |
| AUC-507 | Implement buyer/seller premiums, invoices and auction settlement        |   XL | AUC-501, LED-101, SET-202 |
| AUC-508 | Implement post-auction offer and unsold return workflow                 |    L | AUC-505, OFF-201, FUL-202 |
| AUC-509 | Build bidder support/ops dashboard and event health telemetry           |   XL | AUC-503, BID-507, PLT-009 |
| AUC-510 | Build deterministic auction simulator and property-based tests          |    L | BID-503–506               |
| AUC-511 | Run 2x peak load, clock skew, reconnect and provider outage tests       |    L | AUC-510, BID-507          |
| AUC-512 | Rehearse auction war room, manual close hold and incident runbook       |    M | AUC-509/511               |
| REL-501 | Run invite-only auction and settlement review before GA                 |    L | all v5 critical paths     |

## 9. v6 — B2B, national, data and international backlog

### B2B/trade

| ID      | Task                                                               | Size | Dependencies              |
| ------- | ------------------------------------------------------------------ | ---: | ------------------------- |
| B2B-601 | Implement trade-account application, verification and entitlements |    L | ORG-201, KYC-103          |
| B2B-602 | Implement trade projects, team roles, budget and deadlines         |    L | B2B-601, ORG-202          |
| B2B-603 | Implement spaces/walls, images, dimensions and constraints         |    L | B2B-602, CAT-104          |
| B2B-604 | Implement artwork boards, availability checks and alternatives     |    L | B2B-603, SRC-102, INV-101 |
| B2B-605 | Implement versioned proposals, comments and stakeholder approvals  |   XL | B2B-604, IAM-104          |
| B2B-606 | Convert approved proposal to consolidated holds/orders             |   XL | B2B-605, ORD-103, INV-102 |
| B2B-607 | Implement consolidated invoice, delivery and installation plan     |   XL | B2B-606, TAX-201, FUL-205 |
| B2B-608 | Implement rental/rotation agreement, billing and custody checks    |   XL | B2B-602, LED-101, PRV-402 |
| B2B-609 | Implement organizational commission and account-manager workflow   |    L | COM-203, B2B-602          |

### National operations and subscriptions/data

| ID      | Task                                                                      | Size | Dependencies              |
| ------- | ------------------------------------------------------------------------- | ---: | ------------------------- |
| NAT-601 | Implement carrier/packaging/installation partner onboarding and scorecard |    L | ORG-201, FUL-204          |
| NAT-602 | Implement expanded zones, routing rules and multi-carrier selection       |   XL | NAT-601, FUL-201          |
| NAT-603 | Implement regional exception and unit-economics dashboard                 |    L | NAT-602, ANL-103          |
| PLN-601 | Finalize gallery/artist subscription packages and billing/tax treatment   |    L | PLN-201, CMP-002          |
| PLN-602 | Implement subscription billing, entitlements and grace/cancellation       |   XL | PLN-601, PAY-101, PLT-010 |
| DAT-601 | Implement advanced demand/sell-through/comparable analytics               |   XL | DAT-401, v5 auction data  |
| API-601 | Implement partner API key, scopes, quotas, rotation and audit             |    L | IAM-104, SEC-004          |
| API-602 | Publish partner OpenAPI, sandbox, contract tests and usage dashboard      |    L | API-601, PLT-008          |
| API-603 | Implement privacy-safe data export and correction request                 |    L | API-601, CMP-003          |

### International/diaspora launch-gated work

| ID      | Task                                                                         | Size | Dependencies                       |
| ------- | ---------------------------------------------------------------------------- | ---: | ---------------------------------- |
| INT-601 | Obtain country/category legal, sanctions, tax and exporter-of-record memo    |   XL | legal/trade partners               |
| INT-602 | Select permitted international payment/settlement provider and contract      |   XL | INT-601                            |
| INT-603 | Implement country/category eligibility and default-off feature flags         |    M | INT-601, PLT-010                   |
| INT-604 | Implement export eligibility, permit and customs document case               |   XL | INT-601, PRV-401                   |
| INT-605 | Implement multi-currency quote while preserving Rial ledger/accounting rules |   XL | INT-602, FIN-002                   |
| INT-606 | Implement duties, international shipping, coverage and return quote          |   XL | INT-604, carrier/coverage partners |
| INT-607 | Implement bilingual catalogue fields and international support policies      |    L | CMS-301, CAT-102                   |
| INT-608 | Implement required party/category screening and audited holds                |    L | INT-601, KYC framework             |
| INT-609 | Implement international settlement, export custody and ownership transfer    |   XL | INT-602/604/606, SEC-404           |
| INT-610 | Run compliant pilot with allowlisted destinations, works and buyers          |    L | INT-603–609                        |
| REL-601 | Run B2B, national, partner API and international launch-gate reviews         |   XL | v6 critical paths                  |

## 10. Cross-release continuous work

These are capacity reservations, not a one-time epic:

| ID       | Continuous task                                                                  |
| -------- | -------------------------------------------------------------------------------- |
| SEC-C01  | Dependency, secret, authorization and abuse review each release                  |
| QLT-C01  | Maintain unit/integration/contract/E2E/flaky-test health                         |
| REL-C01  | Dependency upgrades after reading installed framework migration guides           |
| OPS-C01  | Review incidents, support queues, SLAs and manual steps monthly                  |
| DAT-C01  | Validate event quality, privacy and metric definitions                           |
| CMP-C01  | Review licence, tax, payment, content and export register on schedule            |
| PERF-C01 | Track web/API/database/queue performance and capacity quarterly                  |
| DR-C01   | Restore drill quarterly; domestic-only and provider-outage game day twice yearly |
| ADR-C01  | Review architecture pressure and create/supersede ADRs when evidence changes     |

## 11. Suggested initial sprint sequence

The first implementation sprints after document approval should be:

1. **Sprint 1:** PLT-001–004, SEC-001/002, IAM-001, FIN-001/002, CMP-001, UX-001.
2. **Sprint 2:** PLT-005–012, IAM-002–004, FIN-003, OPS-001/002, QLT-001/002.
3. **Sprint 3:** deployable API/worker/admin skeleton, audit/outbox/idempotency technical slice, KYC/media signed-upload spike.
4. **Sprint 4:** catalogue/artwork unit/public DTO slice plus Persian search foundation.
5. **Sprint 5:** inventory reservation/order/ledger fake-provider vertical slice.
6. **Sprint 6:** PSP callback/reconciliation and admin operations slice.

This order deliberately proves the hardest invariants before polishing the entire catalogue UI.
