import { STELLAR_RPC, donationContractId } from "./donation-config";
import { TESTNET_PASSPHRASE, validatePayment } from "./payment-validation";
import { walletSnapshot } from "./stellar";
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export async function prepareDonation(from: string, recipient: string, amount: string) {
  if (!donationContractId) throw new Error("Contrato NFT pendiente de despliegue.");
  validatePayment(from, recipient, amount, "");
  await walletSnapshot(from);
  const sdk = await import("@stellar/stellar-sdk");
  const server = new sdk.rpc.Server(STELLAR_RPC);
  const account = await server.getAccount(from);
  const [whole, fraction = ""] = amount.split(".");
  const stroops = BigInt(whole + fraction.padEnd(7, "0"));
  const tx = new sdk.TransactionBuilder(account, { fee: "100", networkPassphrase: TESTNET_PASSPHRASE })
    .addOperation(new sdk.Contract(donationContractId).call("donate", new sdk.Address(from).toScVal(), new sdk.Address(recipient).toScVal(), sdk.nativeToScVal(stroops, { type: "i128" })))
    .setTimeout(60).build();
  const simulation = await server.simulateTransaction(tx);
  if (!sdk.rpc.Api.isSimulationSuccess(simulation) || sdk.rpc.Api.isSimulationRestore(simulation)) throw new Error("No se pudo preparar la donación NFT. Revisa saldo, destinatario y estado del contrato.");
  const prepared = sdk.rpc.assembleTransaction(tx, simulation).build();
  return { from, recipient, amount, fee: String(prepared.fee), xdr: prepared.toXDR(), hash: hex(prepared.hash()) };
}
export async function submitDonation(prepared: Awaited<ReturnType<typeof prepareDonation>>, retain: (hash: string) => void) {
  await walletSnapshot(prepared.from);
  const [sdk, freighter] = await Promise.all([import("@stellar/stellar-sdk"), import("@stellar/freighter-api")]);
  const result = await freighter.signTransaction(prepared.xdr, { networkPassphrase: TESTNET_PASSPHRASE, address: prepared.from });
  if (result.error || !result.signedTxXdr) throw new Error("Firma rechazada; no se envió la donación.");
  const signed = sdk.TransactionBuilder.fromXDR(result.signedTxXdr, TESTNET_PASSPHRASE);
  if (result.signerAddress !== prepared.from || hex(signed.hash()) !== prepared.hash) throw new Error("La firma no coincide con la donación revisada.");
  retain(prepared.hash);
  try { await new sdk.rpc.Server(STELLAR_RPC).sendTransaction(signed); } catch { /* Preserve pending hash; never infer success or retry payment. */ }
}