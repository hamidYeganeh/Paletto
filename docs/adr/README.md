# Architecture Decision Records

| ADR                                                       | Decision                                                                 | Status   |
| --------------------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| [ADR-0001](./0001-modular-monolith.md)                    | Start with a domain-oriented modular monolith                            | Proposed |
| [ADR-0002](./0002-next-bff-and-transaction-api.md)        | Separate Next.js BFF from the transactional API and workers              | Proposed |
| [ADR-0003](./0003-postgres-ledger-outbox.md)              | Use PostgreSQL transactions, append-only ledger and transactional outbox | Proposed |
| [ADR-0004](./0004-domestic-first-provider-abstraction.md) | Use domestic-first infrastructure and external-provider ports            | Proposed |

An ADR becomes **Accepted** only after technical, product and operational owners sign off. Superseding a decision requires a new ADR that links to the old one; history is never rewritten.
