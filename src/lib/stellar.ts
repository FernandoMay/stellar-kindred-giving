// Browser-only Stellar SDK imports; no private keys are held by the app.
import { HORIZON, TESTNET_PASSPHRASE, validatePayment, validateWalletState } from "./payment-validation";
export { HORIZON, EXPLORER } from "./payment-validation";
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export async function walletSnapshot(expected?: string) {
  const f = await import("@stellar/freighter-api");
  const conn = await f.isConnected();
  if (!conn.isConnected) throw new Error("Instala la extensión Freighter para continuar.");
  const [account, network] = await Promise.all([f.getAddress(), f.getNetworkDetails()]);
  if (account.error || network.error) throw new Error("Freighter no autorizó la consulta de cuenta o red.");
  validateWalletState(conn.isConnected, account.address, network.networkPassphrase, expected);
  const sdk = await import("@stellar/stellar-sdk");
  if (!sdk.StrKey.isValidEd25519PublicKey(account.address)) throw new Error("Dirección inválida.");
  return account.address;
}

export async function connectFreighter(): Promise<string> {
  const f = await import("@stellar/freighter-api");
  const conn = await f.isConnected();
  if (!conn.isConnected) throw new Error("Instala la extensión Freighter para continuar.");
  const access = await f.requestAccess();
  if (access.error) throw new Error("Conexión rechazada en Freighter.");
  return walletSnapshot(access.address);
}

export async function getXlmBalance(address: string): Promise<string> {
  const res = await fetch(`${HORIZON}/accounts/${address}`);
  if (res.status === 404) return "0";
  if (!res.ok) throw new Error("No se pudo consultar el saldo en Stellar.");
  const data = await res.json();
  const native = data.balances?.find((b: { asset_type: string }) => b.asset_type === "native");
  return native?.balance ?? "0";
}

export async function fundWithFriendbot(address: string) {
  await walletSnapshot(address);
  const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
  if (!res.ok) throw new Error("Friendbot no pudo fondear la cuenta (quizá ya está fondeada).");
}

export async function prepareXlm(from: string, to: string, amount: string, memo: string) {
  validatePayment(from, to, amount, memo);
  await walletSnapshot(from);
  const sdk = await import("@stellar/stellar-sdk");
  if (!sdk.StrKey.isValidEd25519PublicKey(to)) throw new Error("Destinatario inválido.");
  const server = new sdk.Horizon.Server(HORIZON);
  await server.loadAccount(to);
  const account = await server.loadAccount(from);
  const feeStats = await server.feeStats();
  const fee = feeStats.fee_charged.p70;
  const native = account.balances.find((b) => b.asset_type === "native");
  const minimum = (2 + account.subentry_count + (account.num_sponsoring ?? 0) - (account.num_sponsored ?? 0)) * 0.5;
  const selling = native && "selling_liabilities" in native ? Number(native.selling_liabilities) : 0;
  if (!native || Number(native.balance) - minimum - selling < Number(amount) + Number(fee) / 1e7) throw new Error("Saldo disponible insuficiente; la reserva mínima no se puede gastar.");
  const tx = new sdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: sdk.Networks.TESTNET,
  })
    .addOperation(sdk.Operation.payment({ destination: to, asset: sdk.Asset.native(), amount }))
    .addMemo(sdk.Memo.text(memo))
    .setTimeout(60)
    .build();
  return { xdr: tx.toXDR(), hash: hex(tx.hash()), fee: String(Number(fee) / 1e7), from, to, amount, memo };
}

export async function signAndSubmit(prepared: Awaited<ReturnType<typeof prepareXlm>>, onSigned: (hash: string) => void) {
  await walletSnapshot(prepared.from);
  const [sdk, f] = await Promise.all([import("@stellar/stellar-sdk"), import("@stellar/freighter-api")]);
  const signed = await f.signTransaction(prepared.xdr, { networkPassphrase: TESTNET_PASSPHRASE, address: prepared.from });
  if (signed.error || !signed.signedTxXdr) throw new Error("Firma rechazada; no se envió el pago.");
  const tx = sdk.TransactionBuilder.fromXDR(signed.signedTxXdr, TESTNET_PASSPHRASE);
  if (signed.signerAddress !== prepared.from || hex(tx.hash()) !== prepared.hash) throw new Error("La firma no coincide con la transacción revisada.");
  onSigned(prepared.hash); // Retain hash BEFORE network send; ambiguous timeout must not create another payment.
  try { await new sdk.Horizon.Server(HORIZON).submitTransaction(tx); }
  catch { /* Server reconciliation decides the ledger outcome, never the submission exception. */ }
  return prepared.hash;
}
