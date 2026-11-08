# Deployment
Use contracts/arceus-escrow/README.md for Rust compile/test and Testnet deploy commands. Source and tests are included; contract ID not supplied, WASM build and network deployment not verified here.

Cloud is provisioned; drizzle migrations create verified payment projection with explicit grants/RLS and canonical decimal text. Managed environment supplies server URL, publishable key and server-only service key; do not copy keys into source. Existing Vite bootstrap and managed Cloud helpers remain intact.

Current browser endpoints: Testnet Horizon and Friendbot. No Mainnet toggle, USDC issuer, Soroban deployment address, cron credential or sponsor contact configured. Configure only real public destinations after ownership verification. Contract connection additionally needs Testnet contract ID, deployment hash and verified asset/roles/rules.

No public publish was performed; existing published site may not contain these changes. Publish only after acceptance checks and explicit authorization. Financial contract deployment is performed separately by owner using local signing.