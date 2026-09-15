# Quality, Security and Operations Plan

**Status:** Proposed baseline  
**Applies to:** Every release and every provider integration

## 1. Service objectives

Targets exclude approved maintenance and are measured from Iran-relevant probes where possible.

| Service indicator                           |     v1 target |     v3+ target |
| ------------------------------------------- | ------------: | -------------: |
| Public catalogue availability               | 99.5% monthly |  99.9% monthly |
| Authenticated order/collection availability |         99.5% |          99.9% |
| Checkout/payment-initiation availability    |         99.5% |         99.95% |
| API read p95, excluding provider time       |      < 350 ms |       < 250 ms |
| API write p95, excluding provider time      |      < 600 ms |       < 400 ms |
| Search p95                                  |      < 600 ms |       < 350 ms |
| Critical outbox event processing            |  99% < 60 sec | 99.9% < 30 sec |
| Notification processing                     |   95% < 5 min |    99% < 2 min |
| Transactional DB RPO/RTO                    | 15 min / 2 hr | 5 min / 30 min |
| Double-sale                                 |             0 |              0 |
| Unbalanced posted journal entry             |             0 |              0 |

Provider-caused failure is still visible to users and operations and counts toward product workflow health, even when separated in vendor SLO reporting.

## 2. Error-budget policy

- A release that consumes more than 50% of the monthly critical-flow error budget pauses non-essential rollout.
- A double-sale, ledger imbalance, unauthorized payout, accepted invalid bid or private evidence leak triggers an immediate severity-1 response and relevant feature hold.
- Repeated provider failure triggers adapter failover/manual path and a vendor review, not hidden retries forever.
- Error-budget exceptions require product, engineering and operations sign-off with an expiry.

## 3. Data classification

| Class              | Examples                                                                           | Controls                                                                |
| ------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Public             | published artist/work metadata, public derivatives, stories                        | integrity, moderation, CDN                                              |
| Internal           | feature config, non-sensitive operations metrics                                   | staff auth, least privilege                                             |
| Confidential       | support messages, private collection, exact inventory location, valuation          | encryption, scoped access, no public cache                              |
| Restricted         | national ID, identity documents, bank/Sheba, home address, private expert evidence | field/object encryption, strict audit, step-up access, retention limits |
| Immutable evidence | ledger, bids, certificate versions, custody/condition/audit events                 | append-only, checksum/signature where applicable, backup/legal hold     |

Production data must not be copied to local development. Staging uses synthetic or purpose-built redacted data.

## 4. Threat and abuse register

Minimum scenarios to model and test:

### Account and identity

- OTP brute force, enumeration, SIM swap and session theft;
- seller identity fraud, fake gallery authority and bank mismatch;
- staff account takeover and privilege escalation;
- IDOR across buyers, sellers, organizations and cases.

### Catalogue and media

- unauthorized artwork listing or impersonation;
- malicious files, decompression/image bombs and stored XSS;
- copyright theft, scraping and private-original exposure;
- price/availability manipulation and seller external double-sale.

### Commerce and finance

- duplicate/replayed/forged payment callbacks;
- Rial/Toman factor-of-ten error;
- order confirmation without money or money without order;
- refund/payout to changed beneficiary;
- promotion/fee abuse, ledger mutation and insider adjustment fraud;
- off-platform leakage and social-engineering support attacks.

### Trust and secondary market

- forged provenance/ownership evidence;
- compromised or conflicted expert;
- certificate cloning/QR replacement;
- doxxing a private collector through public history.

### Auctions

- bid replay, race, client-clock manipulation and proxy maximum exposure;
- bidder collusion/shill signals and deposit evasion;
- denial of service near close;
- staff changing reserve, increments, close or bid history without evidence.

### Infrastructure and providers

- secret leakage, dependency compromise and CI supply-chain attack;
- queue poison messages/retry storms;
- backup corruption or untested restore;
- domestic/foreign network partition;
- payment/SMS/carrier provider outage or contract change.

Each threat has owner, prevention, detection, response and residual-risk acceptance.

## 5. Security controls

### Authentication and authorization

- established authentication library; no bespoke crypto/session design;
- short-lived/rotated server-side sessions with secure HTTP-only cookies;
- OTP rate limits and non-enumerating responses;
- MFA for staff and step-up for sensitive financial/trust actions;
- resource authorization in every API command/query and Server Action/Route Handler entry point;
- default-deny permissions and periodic access review;
- dual control for exceptional payout, manual ledger posting, certificate revocation and auction override.

### Input, output and files

- schema validation at every trust boundary;
- content-type and maximum size checks before expensive parsing;
- file signature verification, malware scanning and safe image decoding;
- public derivatives generated by workers; private originals never served by guessable URLs;
- output encoding/sanitization for authored HTML/content;
- safe DTO allowlists, not entity serialization;
- SSRF protections for remote import and webhook/callback URLs.

### Network and secrets

- TLS end to end; private data services are not internet-exposed;
- WAF/rate limiting plus application-level actor/resource limits;
- secret manager with environment separation, rotation and access audit;
- service identities with explicit audience and least privilege;
- database credentials separated by app/worker/read role;
- egress allowlists where operationally feasible.

### Financial and evidence integrity

- append-only ledger/bids/certificate/audit records;
- balanced journal constraint and source idempotency;
- callback signature, replay, amount/currency/reference validation;
- daily reconciliation and aged-exception alerts;
- checksums/signatures for immutable evidence objects;
- no destructive admin endpoint for posted financial/evidence records.

## 6. Privacy and logging

- Logs contain opaque IDs, state/error codes and trace IDs; they do not contain OTPs, passwords, full phone, national ID, bank number, full address, identity images, proxy bid maximum or raw secret-bearing callbacks.
- Restricted access events themselves are audited.
- Public analytics actor IDs are pseudonymous and separated from identity data.
- Consent/purpose, retention and legal hold are enforced per data class.
- Data export/deletion is a reviewed workflow; financial/provenance retention is explained and pseudonymized where deletion is not lawful/possible.
- Production support screens mask sensitive fields by default and record reveal reason.

## 7. Test strategy

### Unit tests

Required for:

- money conversion, basis-point calculation and rounding;
- Persian normalization and phone/postal/date parsing;
- state-machine transitions and prohibited transitions;
- fee, policy, increment, proxy bid and anti-sniping rules;
- ledger posting rules and reconciliation classification;
- authorization policies and certificate claim rendering.

### Property-based/model tests

- ledger journals always balance;
- unique artwork is never sold/reserved twice under concurrent command sequences;
- accepted auction bid sequence remains ordered and deterministic;
- refund never exceeds settled refundable amount;
- ownership intervals do not overlap for one unit;
- edition numbering remains within declared edition size.

### Integration tests

- real PostgreSQL constraints/transactions/migrations;
- Redis queue retry, dedupe, delay and dead-letter behavior;
- object signed upload and media processing;
- outbox/inbox replay and recovery;
- API authorization against organization/resource ownership;
- payment/order/ledger and fulfilment/ownership vertical slices.

### Contract tests

- OpenAPI producer/generated clients;
- event schema producer/consumer compatibility;
- PSP/KYC/SMS/carrier adapter sandbox and recorded fixtures;
- webhook raw-body/signature/replay behavior;
- provider timeout, rate limit, malformed response and duplicate callback.

### End-to-end tests

Critical paths:

1. seller verification -> artwork publication;
2. buyer discovery -> reservation -> payment -> delivery -> ownership -> payout;
3. cancellation/return/damage/authenticity dispute -> refund/hold;
4. offer and commission milestone flows;
5. resale intake -> valuation -> sale -> ownership transfer;
6. auction registration -> bid/proxy/extension -> winner -> settlement;
7. B2B proposal -> approval -> consolidated order/installation;
8. provider outage/manual recovery.

E2E suite uses approved test providers or deterministic fakes; it never performs accidental real payout.

### Accessibility and localization tests

- automated accessibility checks plus manual keyboard/screen-reader review;
- RTL visual regression on core pages;
- Persian/Arabic/Latin digit and character fixtures;
- reduced-motion and no-WebGL purchase paths;
- Jalali/holiday/timezone boundary tests;
- Rial/Toman snapshot and provider-boundary tests.

### Performance and resilience tests

- catalogue/search load and cache stampede;
- concurrent reservation/order race;
- PSP callback storm and worker retry storm;
- auction expected peak at 2x, with hot-lot focus;
- large/resumable media upload and processing backlog;
- search down, Redis failover, carrier/SMS/PSP timeout;
- domestic-only egress block;
- database restore and outbox replay.

## 8. Observability

### Required telemetry

- request rate, latency, errors and saturation by route/command;
- PostgreSQL connection/lock/slow-query/replication/PITR health;
- Redis memory/availability and queue age, attempts, failure/DLQ;
- outbox lag and inbox duplicate rate;
- payment init/callback/success/failure/unknown/mismatch/reconciliation age;
- reservation expiry, unavailable conflicts and double-sale invariant alerts;
- order state age and stuck workflow counts;
- shipment state age/damage/loss/manual cases;
- ledger imbalance checks, payout eligibility/attempt/failure;
- certificate/trust holds and moderation queue age;
- auction bid latency, rejection reasons, sequence lag, connections and close jobs;
- provider health, timeout, circuit state and fallback usage;
- web Core Web Vitals, media/3D weight and client error rate.

### Trace rules

- propagate `trace_id`/`request_id` across BFF, API, outbox, worker and provider attempt;
- link audit and support views to safe trace search;
- sample normal browse traffic, but retain required transaction/error traces within policy;
- never attach restricted payloads to spans.

### Alert design

- alerts must name user/business impact, owner, runbook and dashboard;
- page only on actionable urgent signals;
- ticket non-urgent trend/capacity issues;
- deduplicate provider-wide failure to avoid alert storms;
- critical alerts include ledger imbalance, unauthorized transition, callback amount mismatch, payout anomaly, double-sale constraint attempts, auction close failure and backup failure.

## 9. Operational queues and SLAs

Every queue item contains priority, owner, created/due time, linked entities, safe evidence, next action and escalation.

Required queues:

- seller/KYC/KYB verification;
- artwork rights/publication/moderation;
- payment reconciliation and bank transfer;
- packaging/pickup/delivery exception;
- return/refund/damage/loss;
- payout eligibility/failure;
- authenticity/ownership/certificate;
- resale/valuation/expert assignment;
- auction registration/deposit/default;
- copyright/content complaint;
- security/privacy request.

SLA targets are configured from signed operations/legal policy rather than hard-coded in UI.

## 10. Backup and disaster recovery

- automated encrypted PostgreSQL backups with point-in-time recovery;
- backup copies separated from primary failure domain;
- object storage versioning/immutability for evidence where supported;
- configuration, infrastructure and schema are reproducible from source;
- Redis is recoverable according to its role, but PostgreSQL remains economic truth;
- quarterly full restore to isolated environment with data-integrity checks;
- verify ledger balance, latest ownership, outbox replay position and certificate evidence after restore;
- documented key/secret recovery and break-glass access;
- RPO/RTO exercise results reviewed against SLO.

## 11. Incident response

### Severity examples

| Severity | Examples                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| SEV-1    | private data leak, unauthorized payout, ledger imbalance, double-sale, invalid auction result, broad checkout outage   |
| SEV-2    | major provider outage without effective fallback, stuck fulfilment/payout cohort, certificate verification unavailable |
| SEV-3    | degraded search/recommendations, notification delay, isolated recoverable order issue                                  |

### Required process

1. declare severity and incident commander;
2. protect users/money/evidence using feature hold or kill switch;
3. preserve logs, callback and audit evidence;
4. communicate safe status to operations/users;
5. reconcile affected accounts/orders/lots;
6. restore service with reviewed commands, not direct database edits;
7. publish blameless post-incident review with owners/dates;
8. add regression tests, detection and runbook change.

## 12. Release gate checklist

### Product and operations

- [ ] Scope, non-goals, flags and cohorts approved.
- [ ] Customer/support/legal copy and policy snapshot approved.
- [ ] Operations queue, owner, SLA and escalation staffed.
- [ ] Unit economics and provider capacity reviewed.

### Engineering and data

- [ ] Migrations, backfill, compatibility and rollback/roll-forward rehearsed.
- [ ] API/event compatibility checks pass.
- [ ] Critical-path and error-path tests pass.
- [ ] Dashboards and alerts show test traffic.
- [ ] Feature can be disabled without corrupting in-flight state.

### Security and compliance

- [ ] Threat/authorization/privacy review complete.
- [ ] Secrets/provider credentials are production-scoped and rotated from test.
- [ ] Licence/tax/payment/content/export gates applicable to release are signed.
- [ ] Audit/evidence/retention behavior verified.

### Reliability

- [ ] Load and provider-outage test meets release envelope.
- [ ] Backup/restore is within current validity window.
- [ ] Runbook and on-call rehearsal complete.
- [ ] Hold/rollback thresholds are configured and owned.

## 13. Production change policy

- No direct production database edit for order, payment, ledger, bid, certificate, ownership or payout state.
- Recovery uses an authenticated, authorized, idempotent application command with reason/evidence/audit.
- Emergency feature disable is allowed and audited; re-enable requires incident owner approval.
- Schema changes use expand/migrate/contract; old deploy and new deploy remain compatible during rollout.
- Financial and auction rule changes are versioned and affect only new policy snapshots unless legal correction is explicitly approved.
