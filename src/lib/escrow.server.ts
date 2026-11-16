import { campaignId } from "./contract-config";
import { verifiedContract } from "./contracts.server";
import type { Campaign } from "./escrow-rules";

export async function readCampaign(donor?: string) {
  const { sdk, rpc, call, config } = await verifiedContract("escrow");
  const c = await call("get", [sdk.nativeToScVal(BigInt(campaignId), { type: "u64" })]);
  const state = c.state?.[0];
  if (!["Funding", "Released", "Cancelled", "Rejected"].includes(state) || typeof c.target !== "bigint" || c.target <= 0n || typeof c.deposited !== "bigint" || typeof c.remaining !== "bigint" || c.deposited < 0n || c.remaining < 0n) throw new Error("Campaña inválida.");
  let contribution = "0";
  if (donor) {
    const key = sdk.xdr.LedgerKey.contractData(new sdk.xdr.LedgerKeyContractData({ contract: new sdk.Address(config.id).toScAddress(), key: sdk.nativeToScVal([sdk.xdr.ScVal.scvSymbol("Donation"), sdk.nativeToScVal(BigInt(campaignId), { type: "u64" }), new sdk.Address(donor).toScVal()]), durability: sdk.xdr.ContractDataDurability.persistent }));
    const rows = await rpc.getLedgerEntries(key); const value = rows.entries[0]?.val;
    if (value && "contractData" in value) { const amount = sdk.scValToNative(value.contractData.val); if (typeof amount !== "bigint" || amount < 0n) throw new Error("Aportación inválida."); contribution = String(amount); }
  }
  const campaign: Campaign = { owner: c.owner, recipient: c.recipient, approver: c.approver, target: String(c.target), deposited: String(c.deposited), remaining: String(c.remaining), deadline: Number(c.deadline), state };
  return { campaign, contribution, contractId: config.id, campaignId };
}
export async function escrowOutcome(hash: string, donor: string) {
  const { sdk, rpc, config } = await verifiedContract("escrow");
  const result = await rpc.getTransaction(hash);
  if (result.status === "NOT_FOUND") return { status: "pending" as const };
  if (result.status === "FAILED") return { status: "failed" as const };
  if (!("v1" in result.envelopeXdr)) throw new Error("Formato inesperado.");
  const tx = result.envelopeXdr.v1.tx;
  if (tx.operations.length !== 1 || !("ed25519" in tx.sourceAccount) || sdk.StrKey.encodeEd25519PublicKey(tx.sourceAccount.ed25519) !== donor) throw new Error("Firmante inesperado.");
  const body = tx.operations[0]?.body;
  if (!body || !("invokeHostFunctionOp" in body) || !("invokeContract" in body.invokeHostFunctionOp.hostFunction)) throw new Error("Operación inesperada.");
  const invocation = body.invokeHostFunctionOp.hostFunction.invokeContract;
  if (sdk.Address.fromScAddress(invocation.contractAddress).toString() !== config.id || !["deposit", "release", "cancel", "reject", "refund"].includes(invocation.functionName.toString()) || !invocation.args[0] || String(sdk.scValToNative(invocation.args[0])) !== campaignId) throw new Error("Campaña inesperada.");
  return { status: "confirmed" as const };
}