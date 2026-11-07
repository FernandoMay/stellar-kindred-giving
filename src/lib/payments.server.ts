import { HORIZON, parseLedgerPayment } from "./payment-validation";

export async function publicLedgerPayment(hash: string) {
  const txResponse = await fetch(`${HORIZON}/transactions/${hash}`, { signal: AbortSignal.timeout(15000) });
  if (txResponse.status === 404) return null;
  if (!txResponse.ok) throw new Error("Stellar no responde. No repitas el pago; vuelve a consultar el hash.");
  const opResponse = await fetch(`${HORIZON}/transactions/${hash}/operations?limit=2`, { signal: AbortSignal.timeout(15000) });
  if (!opResponse.ok) throw new Error("No se pudo verificar la operación.");
  const ops = await opResponse.json() as { _embedded?: { records?: unknown[] } };
  return parseLedgerPayment(await txResponse.json(), ops._embedded?.records, hash);
}