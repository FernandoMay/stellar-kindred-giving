# Deployment
Use contracts/arceus-escrow/README.md for Rust compile/test and Testnet deploy commands. Both Testnet deployments and current WASM hashes were independently read on 2026-11-16; see DEPLOYMENTS.md. Reproducible source-to-WASM comparison and wallet signing were not verified here.

Cloud is provisioned; drizzle migrations create verified payment projection with explicit grants/RLS and canonical decimal text. Managed environment supplies server URL, publishable key and server-only service key; do not copy keys into source. Existing Vite bootstrap and managed Cloud helpers remain intact.

Current browser endpoints: Testnet Horizon, Soroban RPC and Friendbot. NFT and escrow addresses are pinned with WASM hashes and native XLM SAC checks. Campaign 0 is available on /fondos. No Mainnet toggle, USDC issuer, cron credential or sponsor contact configured.

No public publish was performed; existing published site may not contain these changes. Publish only after acceptance checks and explicit authorization. Financial contract deployment is performed separately by owner using local signing.