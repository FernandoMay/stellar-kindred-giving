<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep wallet/SDK calls in dynamically imported browser helpers and ledger verification in TanStack server functions; this separates wallet signatures from trusted settlement evidence.
- Store only independently verified single-operation XLM ledger transactions in the public payment projection, uniquely keyed by hash, retaining decimal amount text; clients never write financial state.
- Keep Soroban source isolated under contracts/arceus-escrow and compile with CARGO_TARGET_DIR outside the repository; generated Rust dependencies and test snapshots are not source deliverables.
- Escrow campaigns have one full-release milestone, immutable token selection, independent donor refunds, an authorized approver and no admin sweep; this keeps refund accounting isolated and reviewable.
- Donation NFTs use atomic token transfer and non-transferable mint in an isolated Soroban contract; external payment hashes cannot authorize NFT issuance. Their server reader consults only the verified configured Testnet contract; never projects classic payment memories as NFTs.
