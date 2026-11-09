import { STELLAR_RPC, type DonationNft } from "./donation-config";
import { TESTNET_PASSPHRASE } from "./payment-validation";

// No keys, signing, writes, or user-selected RPC endpoints in this reader.
export async function readDonationNfts(contractId: string, owner: string, page: number) {
  const sdk = await import("@stellar/stellar-sdk");
  const rpc = new sdk.rpc.Server(STELLAR_RPC);
  const tx = new sdk.TransactionBuilder(new sdk.Account(owner, "0"), { fee: "100", networkPassphrase: TESTNET_PASSPHRASE })
    .addOperation(new sdk.Contract(contractId).call("list", new sdk.Address(owner).toScVal(), sdk.nativeToScVal(BigInt(page * 12), { type: "u64" }), sdk.nativeToScVal(13, { type: "u32" })))
    .setTimeout(60).build();
  const result = await rpc.simulateTransaction(tx);
  if (!sdk.rpc.Api.isSimulationSuccess(result) || sdk.rpc.Api.isSimulationRestore(result) || !result.result) throw new Error("La colección NFT no está disponible; puede requerir restauración del contrato.");
  const records = sdk.scValToNative(result.result.retval) as Array<{ id: bigint; owner: string; recipient: string; amount: bigint; created_at: bigint }>;
  if (!Array.isArray(records) || records.some((r) => r.owner !== owner || typeof r.amount !== "bigint" || r.amount <= 0n)) throw new Error("Respuesta de contrato inválida.");
  const items: DonationNft[] = records.slice(0, 12).map((r) => ({ id: String(r.id), owner: r.owner, recipient: r.recipient, amount: `${r.amount / 10000000n}.${(r.amount % 10000000n).toString().padStart(7, "0")}`, created_at: Number(r.created_at) }));
  return { items, more: records.length > 12 };
}