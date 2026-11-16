# Arceus — independently checked Testnet deployments

## 2026-11-16

Only Testnet. Not a third-party audit. No private keys are stored here.

| Contract | Address | Deployed WASM SHA-256 |
|---|---|---|
| Escrow | `CB5XRAKPQZFIGZRXGEOQEGD65J3SICQFBQH4OPIHU2PNBKF25ND2CMF7` | `f3dd52e8003324ae783d2e01e37aa606dd28ee6c645177563c64ec0b93217608` |
| Donation NFT | `CAC6UMQVTS3HBOKK36R5CQHQ4OGL4NRMG2EI6IFIBVGVVCCBRSW573UC` | `838a821201911790a515b1a8e648ea3d7d5623f38732a9a15f20cf8bb9bda34b` |

RPC getLedgerEntries independently matched both deployed hashes. Read-only `asset()` / `token()` matched native Testnet SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`.

Deployment transactions independently returned SUCCESS and the respective contract address:
- Escrow: `94cab7a28fedfe96caaa4b815b4e266b481ea7822379f3842ee8167b72ed7fdb`
- NFT: `4dfb851a36cf459643e655c99bcfafb715c70e505b8f3ae120a9edbbedd4dcf5`

User-reported upload transactions (not independently checked): escrow `db6f53a29ab807cfa50b31819b1081868371434a748c1404ee0e448de76446ba`, NFT `3f03cd8472b673c8ab9854f4c915b9b1a4e24f6f0343a5bb3f50f8d24a55fd03`. User reports SDK 28, CLI 30.0.1 and native tests 17/17 + 10/10. A reproducible WASM comparison against this repository's Rust source has not been performed; deployed hash matching is not proof of source equivalence.

### NFT #0 — ownership correction
Transaction `82c73e449d7e074d163faec2cc0698ec64ac2c14748576fd461c3bb8f008a64d` independently returned SUCCESS, donate arguments and return ID 0. `get(0)` matched:
- **Owner/donor:** `GCRUI2SMED5CD56BYPS23UTOGN6A5HU2J743LDJ2BCNI7K6GDSODPDCB`
- **Recipient:** `GDRJROKDJ4DGIZUQCYQZP26L4ZR7DGZJG45VIJT5LY3LFNOX5MWXRYTR`
- Amount: 10000000 stroops / 1 XLM; created_at: 1794841915.

The recipient received XLM, not ownership of this non-transferable NFT. The uploaded narrative claiming recipient ownership is incorrect.

### Escrow campaign #0
Create transaction `371b61345d4811558945f92e8c1a99efb54e17d5e1156b83df68f4a7c7c7b644` independently returned SUCCESS / ID 0. `get(0)` matched:
- Owner: `GAUZSVWQY5KOFMWZA5YJEBOECWBGSZHPSADVI6G3ZB54JULLDL6IKISJ`
- Recipient: `GDPOP72P4YKSS5MRVO5QRU2EN5DBVWKO572WJZ4BX4DZVHS6CE55BPEX`
- Approver: `GBR5G5CEYM5NXYYYEMT7BFWIFWKC4H25FONQ4K4KYZSZS7TCKU4U6ERV`
- Target: 100000000 stroops / 10 XLM; deadline: 1802531837.
- Observed Funding; deposited 0; remaining 0. UI always re-reads live values.

Owner and recipient may be equal under the supplied source; approver must differ from both. No transaction was signed or submitted during this review. Wallet-authorized deposit/release/refund remain to be exercised with the relevant real accounts. Real creator names/content and sponsor/hackathon records remain unavailable.