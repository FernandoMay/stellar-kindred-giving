# Operations
Reconcile a public Testnet transaction hash through Historial > Verificar. No payout is initiated by reconciliation. Only successful single-operation native payments are indexed. Query history for connected address; newest 50 rows, not full export.

After timeout do not repeat payment. Preserve pending hash and inspect Testnet explorer, transaction timebounds and ledger sequence. Missing history does not imply failed settlement. Reconciliation may be retried with the same hash; no duplicate row created. If a transaction is definitively failed/expired, current MVP requires manual recovery; there is no automatic unlock/resubmit button.

Friendbot exists only for Testnet; balances display unknown on transport failure rather than zero. Network/account polling is active only for connected sessions and visible page.

Contract maintenance: retain campaign IDs/contributors, renew instance, campaigns and donor records before TTL threshold using keep_alive. Restore archived entries with Stellar tooling; test recovery separately before funding. Contract lifetime/archival and Testnet resets are not yet end-to-end tested.