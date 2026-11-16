import { deployments, NATIVE_TOKEN, STELLAR_RPC } from "./contract-config";
import { TESTNET_PASSPHRASE } from "./payment-validation";

export async function verifiedContract(kind: keyof typeof deployments) {
  const sdk = await import("@stellar/stellar-sdk");
  const rpc = new sdk.rpc.Server(STELLAR_RPC);
  const config = deployments[kind];
  const ledger = await rpc.getLedgerEntries(new sdk.Contract(config.id).getFootprint());
  const val = ledger.entries[0]?.val;
  if (!val || !("contractData" in val) || !("instance" in val.contractData.val)) throw new Error("Contrato no disponible o archivado.");
  const executable = val.contractData.val.instance.executable;
  if (!("wasmHash" in executable) || executable.wasmHash.toString() !== config.wasm) throw new Error("La huella del contrato no coincide.");
  const call = async (method: string, args: Parameters<InstanceType<typeof sdk.Contract>["call"]> extends [string, ...infer A] ? A : never = []) => {
    const tx = new sdk.TransactionBuilder(new sdk.Account("GCRUI2SMED5CD56BYPS23UTOGN6A5HU2J743LDJ2BCNI7K6GDSODPDCB", "0"), { fee: "100", networkPassphrase: TESTNET_PASSPHRASE })
      .addOperation(new sdk.Contract(config.id).call(method, ...args)).setTimeout(60).build();
    const result = await rpc.simulateTransaction(tx);
    if (!sdk.rpc.Api.isSimulationSuccess(result) || sdk.rpc.Api.isSimulationRestore(result) || !result.result) throw new Error("Lectura del contrato no disponible.");
    return sdk.scValToNative(result.result.retval);
  };
  if (await call(config.tokenMethod) !== NATIVE_TOKEN) throw new Error("El activo no es XLM nativo de Testnet.");
  return { sdk, rpc, call, config };
}