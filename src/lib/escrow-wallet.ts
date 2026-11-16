import { campaignId, deployments, STELLAR_RPC } from "./contract-config";
import { TESTNET_PASSPHRASE, amountSchema } from "./payment-validation";
import { walletSnapshot } from "./stellar";
import { escrowActions, type Campaign } from "./escrow-rules";
export type EscrowAction = keyof ReturnType<typeof escrowActions>;
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export async function prepareEscrow(from: string, action: EscrowAction, campaign: Campaign, contribution: string, amount: string) {
  await walletSnapshot(from);
  if (!escrowActions(campaign, from, Math.floor(Date.now() / 1000), contribution)[action]) throw new Error("Acción no autorizada o campaña cerrada.");
  const sdk = await import("@stellar/stellar-sdk"); const server = new sdk.rpc.Server(STELLAR_RPC);
  const args = [sdk.nativeToScVal(BigInt(campaignId), { type: "u64" })];
  if (action === "deposit" || action === "refund") args.push(new sdk.Address(from).toScVal());
  if (action === "deposit") {
    amountSchema.parse(amount); const [whole, fraction = ""] = amount.split("."); const stroops = BigInt(whole + fraction.padEnd(7, "0"));
    if (stroops > BigInt(campaign.target) - BigInt(campaign.deposited)) throw new Error("El importe supera lo que falta para la meta.");
    args.push(sdk.nativeToScVal(stroops, { type: "i128" }));
  }
  const tx = new sdk.TransactionBuilder(await server.getAccount(from), { fee: "100", networkPassphrase: TESTNET_PASSPHRASE }).addOperation(new sdk.Contract(deployments.escrow.id).call(action, ...args)).setTimeout(60).build();
  const simulation = await server.simulateTransaction(tx);
  if (!sdk.rpc.Api.isSimulationSuccess(simulation) || sdk.rpc.Api.isSimulationRestore(simulation)) throw new Error("La operación no está disponible; actualiza la campaña y revisa tu saldo.");
  const prepared = sdk.rpc.assembleTransaction(tx, simulation).build();
  return { from, action, amount: action === "deposit" ? amount : "", fee: prepared.fee, xdr: prepared.toXDR(), hash: hex(prepared.hash()) };
}
export async function submitEscrow(prepared: Awaited<ReturnType<typeof prepareEscrow>>, retain: (hash: string) => void) {
  await walletSnapshot(prepared.from);
  const [sdk, wallet] = await Promise.all([import("@stellar/stellar-sdk"), import("@stellar/freighter-api")]);
  const signed = await wallet.signTransaction(prepared.xdr, { address: prepared.from, networkPassphrase: TESTNET_PASSPHRASE });
  if (signed.error || !signed.signedTxXdr) throw new Error("Firma rechazada; no se envió la operación.");
  const tx = sdk.TransactionBuilder.fromXDR(signed.signedTxXdr, TESTNET_PASSPHRASE);
  if (signed.signerAddress !== prepared.from || hex(tx.hash()) !== prepared.hash) throw new Error("La firma no coincide con la operación revisada.");
  retain(prepared.hash);
  try { await new sdk.rpc.Server(STELLAR_RPC).sendTransaction(tx); } catch { /* Outcome is reconciled, never retried. */ }
}