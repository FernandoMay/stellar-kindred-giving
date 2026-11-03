// Stellar Testnet helpers. Browser-only: imported dynamically from components.
export const HORIZON = "https://horizon-testnet.stellar.org";
export const EXPLORER = "https://stellar.expert/explorer/testnet/tx/";

export async function connectFreighter(): Promise<string> {
  const f = await import("@stellar/freighter-api");
  const conn = await f.isConnected();
  if (!conn.isConnected) throw new Error("Instala la extensión Freighter para continuar.");
  const access = await f.requestAccess();
  if (access.error) throw new Error(String(access.error));
  return access.address;
}

export async function getXlmBalance(address: string): Promise<string> {
  const res = await fetch(`${HORIZON}/accounts/${address}`);
  if (!res.ok) return "0";
  const data = await res.json();
  const native = data.balances?.find((b: { asset_type: string }) => b.asset_type === "native");
  return native?.balance ?? "0";
}

export async function fundWithFriendbot(address: string) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
  if (!res.ok) throw new Error("Friendbot no pudo fondear la cuenta (quizá ya está fondeada).");
}

export async function sendXlm(from: string, to: string, amount: string, memo: string) {
  const sdk = await import("@stellar/stellar-sdk");
  const f = await import("@stellar/freighter-api");
  const server = new sdk.Horizon.Server(HORIZON);
  const account = await server.loadAccount(from);
  const tx = new sdk.TransactionBuilder(account, {
    fee: sdk.BASE_FEE,
    networkPassphrase: sdk.Networks.TESTNET,
  })
    .addOperation(sdk.Operation.payment({ destination: to, asset: sdk.Asset.native(), amount }))
    .addMemo(sdk.Memo.text(memo.slice(0, 28)))
    .setTimeout(60)
    .build();
  const signed = await f.signTransaction(tx.toXDR(), { networkPassphrase: sdk.Networks.TESTNET });
  if (signed.error) throw new Error(String(signed.error));
  const result = await server.submitTransaction(
    sdk.TransactionBuilder.fromXDR(signed.signedTxXdr, sdk.Networks.TESTNET),
  );
  return result.hash;
}
