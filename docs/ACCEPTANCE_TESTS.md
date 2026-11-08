# Acceptance evidence
Internal review only; not formal security audit. Original route test passed before changes. Contract native `cargo test` compiled SDK 28.0.0 and passed **17/17**: positive/zero/negative/over-target deposits, release, incomplete funding, cancellation/refund once, rejection/refund, deadline escape, early refund denial, repeated release/refund denial, campaign isolation, invalid approver, unauthorized release/deposit/cancel/refund, token failure rollback. `events.publish` emits a deprecation warning. WASM compile failed because Stellar CLI >=25.2.0 is required and absent; no deployment performed.

App regression suite includes amount precision, UTF-8 memo, self-payment, absent/disconnected/changed/wrong-network wallet, successful native ledger result, failed transaction, wrong asset/hash, multi-operation rejection and rejected signature. Freighter/network mocks are test-only. Reconciliation tests cover absent hash, timeout, transport failure and exact amount.

Browser: actual `/creadores/luna-beats` rendered, DEMO payment disabled, gift picker/custom amount exercised. `/historial` verified nonexistent hash as unconfirmed. Existing public native Testnet payment was independently fetched, reconciled twice, persisted and read back once through address lookup; no financial transaction was created for this test. Confirmed amount 10.0000000 XLM, ledger 5625478. Missing Freighter produced installation error after extension detection timeout. Home, promotions and hackathons rendered unique titles. No page errors in these checks. Screenshots recorded outside source checkout. No real Freighter signature/transfer, contract RPC execution, authenticated private flow or mobile accessibility audit performed.

Cloud schema read confirmed table existence; database linter returned no issues. This does not prove all security properties. Latest automatic app build reported OK after fixes.

| Criterion | Status / evidence |
|---|---|
| A No false confirmation | Tests + actual public-ledger reconciliation/readback; wallet-created transfer unverified |
| B No private keys exposed | Source boundary review; wallet keys never requested; no formal bundle security scan |
| C Authorized campaign changes | Contract native auth tests; off-chain campaign CRUD absent |
| D Idempotent projection | PK hash + same public hash reconciled twice, one readback row |
| E Exact amount/asset | Ledger parser + canonical decimal string; only native XLM supported |
| F Authorized escrow | 17 native contract tests; deploy/browser integration blocked |
| G Reconciliation | Explicit by-hash Cloud projection tested; automatic indexer absent |
| H Notifications not financial authority | No notification system implemented |
| I Errors not false success | Timeout/not-found tests and absent extension UI; real signing unverified |
| J Gaps identified | DEMO labels, docs and roadmap list absent/blocked features |

## Remaining work
Owner compiles/deploys Testnet contract, shares ID/hash/SAC and public roles/rules. Real creator wallets/ownership/content, sponsors/matching/cashback conditions and hackathon recipient/award rules are missing. Browser signing, contract network invocation and archival restoration need separate verification after deployment. Multiple milestones, partial awards, USDC, other wallets, notification/indexing service, private content, profile administration and production publishing are not completed. Do not claim full product acceptance.