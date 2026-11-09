export type PaymentMemory = { hash: string; source: string; destination: string; amount_exact: string; asset: string; confirmed_at: string; ledger: number };
// Ordinary payments are memories, never evidence that an NFT has been minted.
export function outgoingMemories(rows: PaymentMemory[], address: string) {
  return rows.filter((row) => row.source === address && row.destination !== address);
}
export function totalXlm(amounts: string[]) {
  const stroops = amounts.reduce((sum, amount) => { const [whole, fraction = ""] = amount.split("."); return sum + BigInt(whole + fraction.padEnd(7, "0")); }, 0n);
  return `${stroops / 10000000n}.${(stroops % 10000000n).toString().padStart(7, "0")}`;
}