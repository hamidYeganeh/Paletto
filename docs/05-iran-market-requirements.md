# Iran Market, Operations and Compliance Requirements

**Status:** Product/engineering requirements; legal conclusions require Iranian counsel  
**Owners:** Product, legal, finance, security, art operations and logistics

## 1. Purpose

This document turns Iran-specific market risks into testable product and platform requirements. It is not a legal opinion. Legal owners must confirm the current law, licences and regulator/provider contracts before each release gate.

## 2. Domestic continuity

### Requirements

- Core DNS, runtime, database, object origin, OTP, payment and operations access must have an Iran-reachable path.
- Do not make foreign CAPTCHA, fonts, maps, analytics, error reporting, CDN or image optimization a hard dependency.
- Bundle critical fonts and static assets locally.
- Provide an accessible static/2D fallback for AR and 3D experiences.
- Queue non-critical outbound email/analytics during foreign-service outages.
- Maintain at least one manual support/fulfilment/reconciliation path.
- Test domestic-only operation by blocking foreign egress in a staging game day.

### Acceptance criteria

- A domestic-only game day proves that users can browse cached/current catalogue, log in by the approved domestic method, reserve, pay through the approved PSP, view order state and contact support.
- Operations can inspect payment and fulfilment queues during the exercise.
- Loss of foreign analytics/CDN/error tracking does not fail a transaction.

## 3. Rial, Toman and inflation-sensitive pricing

### Requirements

- Store and settle in integer Rial (`IRR`).
- Every user-visible price labels the unit; no naked numbers in checkout, invoice, offer, bid, notification or admin.
- Input controls may accept Toman but must display the Rial conversion before confirmation where legally/operationally useful.
- API and database never infer a unit from locale.
- Offers and quotes have explicit expiry; seller price updates never rewrite accepted orders.
- Percentage fees use basis points and a documented rounding rule.
- Comparable sales retain original currency, transaction date, source and any converted-value methodology.

### Acceptance criteria

- Automated tests cover factor-of-ten errors at all payment, refund, bid, invoice and payout boundaries.
- Provider callback amount is matched in Rial against the payment intent.
- Admin exports name the money column with `_irr` or provide an explicit currency column.

## 4. Iranian payments and high-value reconciliation

### Requirements

- Integrate PSP/aggregator through `PaymentGatewayPort`; never embed provider states in order logic.
- Treat browser redirect as untrusted; confirm through signed callback or provider inquiry.
- Support duplicate, delayed, missing and out-of-order callbacks.
- Store provider reference, amount, status, safe raw evidence and reconciliation timestamp.
- Support bank-transfer evidence/reconciliation for eligible high-value orders if approved by finance/legal/provider contracts.
- Do not implement a custodial wallet or stored value without explicit licensing review.
- Do not promise automatic marketplace split settlement unless the selected provider contract supports it.
- Seller payout requires verified beneficiary ownership and finance/risk gates.
- Maintain a daily provider-versus-ledger reconciliation report and exception queue.

### Acceptance criteria

- Duplicate callback creates no duplicate order, ledger entry or ownership transfer.
- A payment amount mismatch cannot confirm an order.
- An unknown/late payment enters manual reconciliation with an SLA and buyer-visible safe state.
- Finance can explain gross buyer payment, provider movement, platform fee, tax/adjustments and net seller payout.

## 5. Identity, phone and bank verification

### Requirements

- Normalize Iranian phones to E.164 `+98...`; accept common `09...` input.
- OTP endpoints use per-phone, per-device and per-IP rate limits and anti-enumeration responses.
- Risk-tier KYC: browsing needs none; selling, payout, high-value purchase and auction bidding require increasing verification.
- Validate seller/organization identity and authority to represent an artist or owner.
- Match payout bank ownership using an approved domestic verification provider/process.
- Encrypt sensitive identity/bank fields and restrict staff access by purpose.
- Admin and high-risk financial actions require MFA/step-up authentication.
- Record consent and policy version for identity verification.

### Acceptance criteria

- Account discovery is not possible through OTP error differences.
- Suspended or unverified sellers cannot publish/payout.
- Bank mismatch creates a review case; it cannot be overridden without permission, reason and audit.

## 6. Persian language, search and numerals

### Requirements

- Full RTL layout and Persian-first UX; English metadata may be added for international discovery.
- Normalize Arabic/Persian character variants, ZWNJ, diacritics, whitespace and Persian/Arabic/Latin digits.
- Search aliases cover artist alternate spellings, pen names and Latin transliterations.
- Synonyms cover common medium/style terms and colloquial variants.
- Filters support dimensions, price, availability, medium, city, colour, mood, style, edition and sale mode.
- Preserve user-authored text while indexing a separate normalized form.
- Generate SEO-safe canonical URLs and redirects for slug changes.

### Acceptance criteria

- `ک` and `ك`, `ی` and `ي`, and all digit forms return equivalent intended results.
- Search ranking does not require exact ZWNJ placement.
- Zero-result pages suggest spellings, related categories or consultation rather than a dead end.
- Mixed Persian/Latin artist queries have test fixtures.

## 7. Calendar, time and auctions

### Requirements

- Store UTC; display Jalali and `Asia/Tehran` consistently.
- Keep a configurable Iranian business-day/holiday calendar for review, delivery, withdrawal and support SLAs.
- Auction server clock is authoritative; client clock is informational.
- Notifications show both exact timezone and understandable Jalali date.
- Daylight/timezone rule updates come from maintained timezone data, not hard-coded offsets.

### Acceptance criteria

- Reservation/offer/auction expiry is unchanged by client clock manipulation.
- Holiday-aware SLA tests cover Nowruz and configured closures.
- Auction close, extension and bid sequence can be reconstructed from server evidence.

## 8. Iranian address and logistics

### Address requirements

- country, province, county/city, district, street/address lines, plaque/unit, ten-digit postal code, recipient phone and delivery instructions;
- Persian digit normalization and postal-code validation;
- service-zone lookup does not expose exact private addresses;
- geolocation/map is optional assistance, not a required foreign dependency.

### Artwork logistics requirements

- risk tier by value, medium, dimensions, fragility and provenance sensitivity;
- packaging checklist and required materials per tier;
- pickup and delivery custody/condition evidence;
- carrier adapters plus manual tracking fallback;
- explicit responsibility for packaging cost, shipping, coverage and return transport;
- damage/loss case with evidence deadlines, liable party, decision and compensation;
- framing/installation/preview orders separate from the artwork item but linked to the order/project.

### Acceptance criteria

- High-risk artwork cannot be marked ready without mandatory packaging/condition evidence.
- Every custody change is timestamped and attributable.
- Carrier outage creates a manual operations task and does not lose order state.

## 9. Authenticity, ownership and price trust

### Requirements

- Distinguish artist, gallery, platform-transaction and independent-expert certificates.
- Verify authority to sell and retain ownership/provenance evidence privately.
- Display what was checked, by whom, when and with what limitation.
- Maintain a public revocation/status check without exposing owner identity.
- Secondary listings require stronger ownership and condition checks than artist-direct primary listings.
- Valuation shows date, range, method and comparable evidence; no guaranteed future value.
- Price changes and negotiated discounts are auditable but private where contractually required.

### Acceptance criteria

- The generic label “guaranteed authentic” cannot be shown without a configured certificate/warranty type.
- Revoked/suspended certificates immediately show non-valid status on the verification page.
- A seller cannot issue their own independent-expert opinion.

## 10. Buyer protection, withdrawal and disputes

Iran’s Electronic Commerce Law includes pre-contract information duties and a general minimum seven-working-day withdrawal right for distance transactions. Applicability and exceptions for commissioned work, auctions, services and unique goods must be confirmed by counsel before implementation. Reference: [Electronic Commerce Law](https://nezamat.ir/post-34221/).

### Requirements

- Show seller/platform identity, artwork description, total price, fees, delivery, return, warranty and dispute terms before commitment.
- Snapshot the applicable policy on the order.
- Model cancellation, withdrawal, mismatch, damage, authenticity and non-delivery separately.
- Do not make “no return” a generic default without legal sign-off for the transaction type.
- Preserve communication and evidence while limiting unnecessary personal data.
- Provide an appeal/escalation path and visible case SLA.

### Acceptance criteria

- Buyer must acknowledge the exact policy version before payment/bid/commission contract.
- Refund amount and who bears return logistics are explainable from the policy snapshot.
- Support cannot close an authenticity/damage dispute without required evidence or an audited exception.

## 11. E-commerce, tax and invoicing

The Law on Store Terminals and the Taxpayer System links payment gateways/commercial accounts and electronic invoicing/reporting obligations. Exact current thresholds and treatment of platform, artist, gallery and secondary seller must be confirmed by tax counsel. Reference: [Store Terminals and Taxpayer System law](https://nezamat.ir/post-41585/).

### Requirements

- Map each transaction role: disclosed seller, buyer, platform agent/service provider, gallery/referrer and logistics/service providers.
- Identify who issues which invoice and who owes each tax/fee.
- Register and use approved commercial accounts/gateways.
- Generate immutable transaction/invoice data needed for the Taxpayer System integration or approved export.
- Separate platform commission revenue from seller proceeds in ledger/reporting.
- Preserve tax-policy version and taxpayer identifiers with restricted access.
- Define retention and legal hold with counsel.

### Launch gate

- Written accounting flow for fixed-price primary sale, negotiated sale, commission, refund, secondary sale, auction and B2B project.
- Successful end-to-end test invoices and reconciliation approved by finance/tax owner.

## 12. Business and cultural licensing

The legal classification must be resolved before v1. Depending on operating model, Paletto may need e-commerce/business permissions and cultural/art-gallery permissions or partnerships. Relevant starting references include [rules for cultural institutions](https://nezamat.ir/post-29521/) and the [gallery establishment regulation](https://nezamat.ir/%D8%A2%DB%8C%DB%8C%D9%86%D9%86%D8%A7%D9%85%D9%87-%D8%AA%D8%A3%D8%B3%DB%8C%D8%B3-%D9%86%DA%AF%D8%A7%D8%B1%D8%AE%D8%A7%D9%86%D9%87/).

### Requirements

- Obtain written legal classification and required licences/partners.
- Display legal entity, contact, terms, privacy and complaint paths.
- Maintain licence metadata/renewal owner in compliance register.
- Feature flags can disable sale modes/categories if a licence or partner expires.
- Do not ingest purported heritage/antique works into an open workflow.

## 13. Content moderation and intellectual property

Iranian law recognizes rights in visual art, sculpture and qualifying photography. Reference: [Protection of Authors, Composers and Artists Rights](https://nezamat.ir/post-21035/).

### Requirements

- Obtain explicit display, marketing, crop, derivative, 3D/AR and social-sharing rights from the authorized party.
- Private originals remain protected; public derivatives are resolution-limited and may be watermarked.
- Strip location/device metadata from public images.
- Provide copyright complaint, impersonation and unauthorized-listing workflows.
- Version moderation policy and record decision reason, reviewer and appeal.
- Separate legal removal from curatorial rejection in records and communication.
- Train operations on sensitive-content escalation; do not encode vague policy solely in automated filters.

### Acceptance criteria

- No media can publish without a rights grant and moderation state.
- Copyright removal preserves legal/audit evidence while removing public access.
- AI moderation never performs irreversible deletion or final authenticity attribution.

## 14. International sales, sanctions and export

International/diaspora commerce is `v6` and remains disabled until a separate launch approval. Cultural/art exports can require trade/customs workflows and heritage checks. Reference: [regulation for export/import of cultural and artistic products](https://nezamat.ir/post-41874/).

Mainstream global processors may not support Iran; no workaround using personal/borrowed accounts is acceptable.

### Requirements

- Determine legal seller/exporter of record and permitted destinations/payment rails.
- Track export eligibility, permit application, customs documents and carrier evidence.
- Exclude heritage/prohibited/restricted works until specialist approval.
- Screen parties and service providers as required by applicable law/contracts.
- Quote currency, duties, tax, insurance, return feasibility and settlement explicitly.
- Separate international terms/policy and operational queue.
- International feature flag defaults off by country and artwork category.

## 15. Accessibility, bandwidth and device reality

### Requirements

- WCAG 2.2 AA target for core browsing, authentication, checkout, collection and admin workflows.
- keyboard and screen-reader support in RTL;
- reduced-motion alternative for all GSAP/3D/AR experiences;
- responsive images with low-bandwidth placeholders;
- catalogue and checkout usable on mid-range mobile hardware;
- no 3D asset loaded before user intent;
- interrupted uploads are resumable for seller media/evidence;
- critical form state survives safe retry.

## 16. Operations and customer support

- Persian support templates with safe transaction references.
- In-app status is authoritative; SMS/email are notifications, not the only record.
- Every manual process has an owner, queue, SLA, escalation and audited resolution.
- Buyer/seller direct contact is protected until policy allows it, reducing off-platform leakage and privacy risk.
- Support impersonation and social-engineering playbooks are required.
- High-value incidents have phone escalation and named on-call owner.

## 17. Compliance register and release gates

Maintain a versioned register with:

| Field         | Description                                            |
| ------------- | ------------------------------------------------------ |
| Requirement   | Licence, law, contract or internal policy              |
| Applicability | Entity, feature, transaction type and geography        |
| Evidence      | Legal memo, licence ID, provider contract, test/report |
| Owner         | Named accountable role/person                          |
| Review date   | Next validation/renewal                                |
| Feature flags | Capabilities that must disable on failure/expiry       |
| Data impact   | Collection, location, retention and access             |

No release proceeds with an unresolved blocking gate in the release roadmap.
