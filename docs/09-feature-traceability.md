# Feature Traceability Matrix

**Status:** Proposed scope control  
**Rule:** A committed feature is not implementation-ready unless it maps to a release, task IDs, acceptance criteria and a release gate.

This matrix proves that the complete feature inventory in the PRD has a delivery home. Task IDs refer to [the engineering backlog](./07-engineering-backlog.md).

## Identity, access and compliance

| Capability                            | Release  | Primary tasks        | Gate/evidence                      |
| ------------------------------------- | -------- | -------------------- | ---------------------------------- |
| Phone-first account and OTP           | v1       | IAM-101–103          | Anti-enumeration/rate-limit tests  |
| Secure sessions and device revocation | v1       | IAM-102              | Session rotation/revocation tests  |
| Staff MFA and step-up                 | v0/v1    | IAM-004, IAM-105     | Security review                    |
| RBAC and resource-level authorization | v0/v1    | IAM-003/104          | Cross-tenant/IDOR tests            |
| Seller KYC and bank match             | v1       | KYC-101–103          | Provider/manual evidence and audit |
| Gallery/business KYB and roles        | v2       | ORG-201/202          | Organization isolation tests       |
| Legal classification/licence register | v0+      | CMP-001, CMP-C01     | Written legal evidence             |
| Tax/invoice responsibility            | v0/v1/v2 | CMP-002, TAX-101/201 | Finance/tax sign-off               |
| Retention, deletion and legal hold    | v0+      | CMP-003              | Security/legal matrix              |

## Artist, gallery, catalogue and content

| Capability                                     | Release | Primary tasks        | Gate/evidence                        |
| ---------------------------------------------- | ------- | -------------------- | ------------------------------------ |
| Canonical artist identity and public profile   | v1      | CAT-101              | Safe DTO/privacy test                |
| Artist CV, exhibitions, awards and press       | v2      | SEL-202              | Seller workflow acceptance           |
| Gallery organization and artist representation | v2      | ORG-201–203          | Authority/price access tests         |
| Artwork draft and structured metadata          | v1      | CAT-102              | Publication validation               |
| Unique work and numbered edition units         | v1      | CAT-103              | Edition/unique constraints           |
| Rights grants and content moderation           | v1      | CAT-106/108/109      | No publication without rights/review |
| Media upload and private originals             | v1      | CAT-104              | Signed upload/file security test     |
| Derivatives, watermark and metadata stripping  | v1      | CAT-105              | Worker/checksum/privacy test         |
| Fixed-price listing and policy snapshot        | v1      | CAT-107/108          | State-machine tests                  |
| Curated collections and policy/FAQ CMS         | v1      | CMS-101              | Version/publication audit            |
| Editorial stories and artist narratives        | v3      | CMS-301              | Editorial review workflow            |
| Curated 3D exhibitions                         | v3      | GLR-301/302          | Real listing link + fallback         |
| Bulk inventory/media management                | v2      | SEL-203/204          | Validation/resume/error UX           |
| Inventory freshness and external-sale handling | v2      | SEL-205/206, INV-104 | Stale/double-sale incident controls  |

## Discovery and engagement

| Capability                                     | Release | Primary tasks             | Gate/evidence                         |
| ---------------------------------------------- | ------- | ------------------------- | ------------------------------------- |
| Persian normalization                          | v1      | SRC-101                   | `ی/ي`, `ک/ك`, digit/ZWNJ fixtures     |
| Catalogue search and facets                    | v1      | SRC-102/103               | Relevance/performance suite           |
| Synonyms, transliteration and query recovery   | v3      | SRC-301                   | Zero-result/reformulation metrics     |
| Save works and private collections             | v3      | ENG-301                   | Privacy/authorization tests           |
| Follow artists and alerts                      | v3      | ENG-302                   | Preference/delivery controls          |
| Taste onboarding/profile                       | v3      | TST-301                   | Editable/consent-safe profile         |
| Personalized recommendations                   | v3      | REC-301–303               | Baseline lift/diversity/privacy       |
| Visual similarity search                       | v3      | SRC-302/303               | Evaluation set and abuse/privacy test |
| Browse by mood, palette, room, size and budget | v3      | TST-301, REC-302, SRC-301 | UX/relevance acceptance               |
| Human consultation and shortlist               | v3      | CON-301                   | Outcome tracking and SLA              |
| View in room / AR                              | v3      | AR-301/302                | Scale tolerance and fallback          |
| PWA and safe public caching                    | v3      | PWA-301                   | Offline/degraded behavior             |
| SEO, structured data and sitemap               | v3      | SEO-301                   | canonical/redirect validation         |
| Experiments and product analytics              | v1/v3   | ANL-101–103, EXP-301      | Exposure/guardrail correctness        |

## Inventory, buying and payment

| Capability                                  | Release | Primary tasks                       | Gate/evidence                          |
| ------------------------------------------- | ------- | ----------------------------------- | -------------------------------------- |
| Inventory location and availability         | v1      | INV-101                             | Module/state tests                     |
| Unique reservation and expiry               | v1      | INV-102/103                         | Concurrency and expiry tests           |
| Total-cost checkout quote                   | v1      | ORD-101/102                         | Rial/policy/address acceptance         |
| Idempotent order and state machine          | v1      | ORD-103/104                         | Duplicate/concurrency tests            |
| Buyer/seller order timeline                 | v1      | ORD-105                             | Safe DTO and error states              |
| Cancellation, withdrawal and return         | v1/v2   | ORD-106, RET-201/202                | Legal policy and refund tests          |
| Iranian PSP integration                     | v1      | PAY-101–104                         | Signed callback/inquiry tests          |
| Duplicate/late/unknown payment handling     | v1      | PAY-103–105                         | Reconciliation queue                   |
| Bank transfer for approved high-value cases | v1+     | PAY-104/105, legal/finance decision | Manual evidence/reconciliation         |
| Double-entry ledger                         | v0/v1   | FIN-002, LED-101/102                | Balanced/property tests                |
| Refund                                      | v1/v2   | PAY-106, RET-202                    | Provider/ledger reconciliation         |
| Invoice/Taxpayer System data                | v1/v2   | TAX-101/201                         | Finance/tax sign-off                   |
| Seller statement and payout                 | v1/v2   | SET-101/102/201/202                 | Bank match and daily reconciliation    |
| In-app/SMS/email notification               | v1      | NOT-101–104                         | Provider fallback and preference tests |

## Offers, commissions and seller tools

| Capability                                      | Release | Primary tasks   | Gate/evidence                      |
| ----------------------------------------------- | ------- | --------------- | ---------------------------------- |
| Offer/counter/accept/expiry                     | v2      | OFF-201–203     | Atomic reservation and privacy     |
| Commission brief and artist matching            | v2      | COM-201         | Matching/operations acceptance     |
| Commission proposal/contract/milestones         | v2      | COM-202–204     | Ledger/cancellation/dispute tests  |
| Convert commission to physical work/certificate | v2      | COM-205         | Catalogue/trust/fulfilment handoff |
| Seller/gallery dashboard and analytics          | v2      | SEL-207         | Metric/data authorization          |
| Pricing assistance                              | v2      | PRC-201/202     | Transparent method/disclaimer      |
| Gallery plan/commission entitlement             | v2/v6   | PLN-201/601/602 | Finance/tax and entitlement tests  |

## Trust, ownership and secondary market

| Capability                               | Release | Primary tasks    | Gate/evidence                       |
| ---------------------------------------- | ------- | ---------------- | ----------------------------------- |
| Certificate types and immutable versions | v1      | TRU-101          | Signature/hash/version tests        |
| Public QR verification and revocation    | v1/v4   | TRU-102/401      | No private owner data               |
| Primary ownership/custody transfer       | v1      | TRU-103          | Completion/ledger invariant         |
| Private collector collection             | v4      | COL-401/402      | Visibility/access tests             |
| Provenance timeline and corrections      | v4      | PRV-401/402      | Append-only/correction audit        |
| Expert profiles and conflict declaration | v4      | EXP-401/403      | Qualification/conflict evidence     |
| Structured condition reports             | v1/v4   | FUL-105, EXP-402 | Signed evidence and custody linkage |
| Resale intake and ownership evidence     | v4      | SEC-401/402      | KYC/ownership/trust gates           |
| Valuation and comparable sales           | v4      | VAL-401–403      | Method/date/source/disclaimer       |
| Private/fixed-price resale               | v4      | SEC-403/404      | Secondary settlement/ownership      |
| Wanted lists and private owner offers    | v4      | WNT-401/402      | Owner opt-in/privacy                |
| Living-artist resale contribution        | v4      | RSL-401/402      | Legal/finance and ledger proof      |
| Authenticity/trust dispute and appeal    | v4      | TRU-402          | Holds, expert/legal SLA             |
| Market/artist dashboards                 | v4/v6   | DAT-401/601      | Source/privacy/correction controls  |

## Fulfilment and physical services

| Capability                                | Release | Primary tasks        | Gate/evidence                      |
| ----------------------------------------- | ------- | -------------------- | ---------------------------------- |
| Iranian address and service zone          | v1      | ORD-102, FUL-101     | Postal/digit/zone tests            |
| Packaging plan and evidence               | v1/v2   | FUL-102/204          | Risk-tier mandatory checklist      |
| Shipment, custody and tracking            | v1/v2   | FUL-103, FUL-201/202 | Provider/manual fallback           |
| Delivery evidence and inspection          | v1      | FUL-104/106          | Ownership/payout gate              |
| Damage/loss claim and compensation        | v1/v2   | FUL-107/206          | Evidence/ledger/operations SLA     |
| Framing, installation and home preview    | v2      | FUL-205              | Service order and liability policy |
| Regional logistics partners and scorecard | v6      | NAT-601–603          | Quality/unit economics             |

## Auctions

| Capability                         | Release | Primary tasks | Gate/evidence                |
| ---------------------------------- | ------- | ------------- | ---------------------------- |
| Auction/lot lifecycle and admin    | v5      | AUC-501–504   | Legal/catalogue review       |
| Bidder KYC, agreements and deposit | v5      | BID-501/502   | Risk/payment controls        |
| Direct append-only bidding         | v5      | BID-503/504   | Idempotency/sequence tests   |
| Proxy/max bidding                  | v5      | BID-505       | Confidentiality/determinism  |
| Anti-sniping and server time       | v5      | BID-506       | Clock/extension simulation   |
| Live updates and reconnect         | v5      | BID-507       | Sequence recovery/load tests |
| Authoritative close and result     | v5      | AUC-505       | One-result invariant         |
| Winner payment/default             | v5      | AUC-506       | Order/payment reconciliation |
| Premiums, invoices and settlement  | v5      | AUC-507       | Finance/tax proof            |
| Unsold/post-auction offers         | v5      | AUC-508       | Inventory/offer workflow     |
| Auction operations and war room    | v5      | AUC-509–512   | 2x load and rehearsal        |

## B2B, subscriptions, data and international

| Capability                             | Release | Primary tasks | Gate/evidence                     |
| -------------------------------------- | ------- | ------------- | --------------------------------- |
| Trade account and teams                | v6      | B2B-601/602   | KYB/role isolation                |
| Projects, spaces and artwork boards    | v6      | B2B-603/604   | Availability/measurement workflow |
| Versioned proposal and approvals       | v6      | B2B-605       | Named approval audit              |
| Consolidated holds/orders/invoices     | v6      | B2B-606/607   | Inventory/ledger/tax proof        |
| Rental/rotation                        | v6      | B2B-608       | Billing/custody/condition proof   |
| Organizational commissions             | v6      | B2B-609       | Commission integration            |
| Subscription billing/entitlements      | v6      | PLN-601/602   | Grace/cancel/tax tests            |
| Partner API, scopes and quotas         | v6      | API-601/602   | Contract/security/usage audit     |
| Data export and correction             | v6      | API-603       | Privacy/retention controls        |
| International legal/payment gate       | v6      | INT-601–603   | Written approval; default off     |
| Export permit/customs workflow         | v6      | INT-604       | Trade/legal evidence              |
| Currency, duties, shipping and returns | v6      | INT-605/606   | Quote/ledger/carrier proof        |
| Bilingual catalogue/support            | v6      | INT-607       | Content/support review            |
| Required party/category screening      | v6      | INT-608       | Audited hold/decision             |
| International settlement/ownership     | v6      | INT-609/610   | Allowlisted compliant pilot       |

## Platform-wide quality and operations

| Capability                                 | Release  | Primary tasks              | Gate/evidence              |
| ------------------------------------------ | -------- | -------------------------- | -------------------------- |
| Audit log and dual control                 | v0+      | PLT-011, IAM-105           | Security/admin tests       |
| Feature flags and kill switches            | v0+      | PLT-010                    | Rollback rehearsal         |
| OpenAPI/event compatibility                | v0+      | PLT-008, QLT-C01           | CI diff/consumer tests     |
| Outbox/inbox and durable jobs              | v0+      | PLT-005/006                | Replay/duplicate/DLQ tests |
| Observability and SLOs                     | v0+      | PLT-009, QLT-002           | Dashboards/alerts/runbooks |
| Backup/restore and domestic-only operation | v0+      | PLT-014, DR-C01            | Recovery/game-day evidence |
| Accessibility and low-bandwidth fallback   | v0/v1/v3 | UX-001, A11Y-301, PERF-301 | WCAG/performance gates     |
| Admin operations queues                    | v1+      | ADM-101–104, OPS-001       | Owner/SLA/escalation       |

## Change-control check

At release planning:

1. filter this matrix by the target release;
2. confirm every primary task is accepted, completed or deliberately moved;
3. if moved, update the roadmap, PRD and matrix in the same change;
4. do not declare the release complete with an unmapped or silently removed committed capability.
