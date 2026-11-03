# Arceus — implementation inventory

Initial inspection: 2026-11-03. This is an internal source review, not external certification.

## Existing stack
TanStack Start 1.168.60 / Router 1.170.41, React 19.2, TypeScript, Vite 8.1.5, Tailwind 4.2; Stellar SDK 17.4 and Freighter API 6.0.1. Actual versions are locked by bun.lock. Routing: src/router.tsx, src/routes/__root.tsx, src/routes/index.tsx, src/routes/creadores.$id.tsx, promociones.tsx, hackathons.tsx. Server wrapper: src/server.ts; CSRF: src/start.ts. Existing UI tokens in src/styles.css.

## Before changes
| Capability | Status | Evidence / risk |
|---|---|---|
| Creator browsing | Implemented, demo | src/lib/data.ts: four fictional profiles share a sample address |
| Freighter connection | Partial, not wallet-tested | stellar.ts requestAccess; wallet.tsx trusts cached address; no network/account refresh validation (P1) |
| XLM transfer | Partial, not ledger-tested | stellar.ts builds TESTNET payment; no strict amount/memo/network checks or late confirmation handling (P1) |
| Financing progress | Simulated | static raised values in data.ts; index/profile display them without DEMO (P1) |
| Soroban escrow | Absent | profile/hackathon claim custody and automatic release without contract (P1) |
| Sponsor offers/prizes | Demo only | static data, fabricated contact codegarden.example (P2) |
| Transaction history/indexing | Absent | no database or backend integration before this task (P1) |
| Content distribution/USDC/other wallets | Absent | no configured issuer/content/wallet integration |
| Navigation | Partial | Header hides navigation below md with no replacement (P2) |
| Tests | One route matcher passed | src/test/app-routing.test.tsx does not test payments |

No contract IDs, deployed sources, private credentials or live creator addresses supplied. Rust 1.95/cargo available; Stellar CLI and rustup absent. No existing database/migrations before Cloud provisioning in this task. No evidence of exposed privileged credentials found in inspected app source. Hosted signup settings and published-source parity not checked. Network failures alone are not classified as source defects.

## Remediation scope
Preserve identity and existing pages, add validated wallet/network and payment flows, verified durable history, isolated one-milestone escrow and tests; keep demo payments blocked. Expand real campaigns only after verified recipients and campaign rules are supplied. See ACCEPTANCE_TESTS.md and DEPLOYMENT.md for actual evidence and remaining blockers.