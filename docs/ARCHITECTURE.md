# Architecture
```text
Browser / Freighter --> Testnet Horizon: sign and submit native XLM
Browser --> TanStack server function --> Testnet Horizon: verify hash + exact operation
                                    --> Cloud: unique public verified projection
Browser <-- Public payment history <-- Cloud (SELECT-only RLS)
Separate Rust escrow --> Testnet SAC token (not deployed / not connected)
```
No private-key custody. Wallet connection is not a Cloud login or proof of off-chain ownership. Creator/sponsor data remains DEMO; no editable real records or private content implemented. No Socket.io or Node daemon added. Reconciliation is explicit by hash; no automatic indexer/notification service claims. Persistent financial rows reflect publicly visible ledger evidence, not browser input. Browser retains only an unresolved hash to prevent accidental retries after reload.