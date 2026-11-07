import { z } from "zod";

export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON = "https://horizon-testnet.stellar.org";
export const EXPLORER = "https://stellar.expert/explorer/testnet/tx/";
export const amountSchema = z.string().regex(/^(0|[1-9]\d{0,12})(\.\d{1,7})?$/, "Importe inválido: máximo 7 decimales.")
  .refine((s) => BigInt(s.split(".")[0] + (s.split(".")[1] ?? "").padEnd(7, "0")) > 0n, "El importe debe ser mayor que cero.");
export const addressSchema = z.string().regex(/^G[A-Z2-7]{55}$/, "Dirección Stellar inválida.");
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/, "Hash inválido.");
export function validatePayment(from: string, to: string, amount: string, memo: string) {
  addressSchema.parse(from); addressSchema.parse(to); amountSchema.parse(amount);
  if (from === to) throw new Error("El destinatario debe ser otra cuenta.");
  if (new TextEncoder().encode(memo).length > 28) throw new Error("El mensaje no puede exceder 28 bytes UTF-8.");
}
export function validateWalletState(installed: boolean, address: string, passphrase: string, expected?: string) {
  if (!installed) throw new Error("Instala la extensión Freighter para continuar.");
  addressSchema.parse(address);
  if (passphrase !== TESTNET_PASSPHRASE) throw new Error("Selecciona Stellar Testnet en Freighter.");
  if (expected && address !== expected) throw new Error("La cuenta cambió. Revisa la billetera antes de continuar.");
}

export function parseLedgerPayment(tx: unknown, operations: unknown, hash: string) {
  const t = z.object({ hash: hashSchema, successful: z.literal(true), source_account: addressSchema,
    ledger: z.number().int().positive(), fee_charged: z.string().regex(/^\d+$/), created_at: z.string().datetime(), operation_count: z.literal(1) }).parse(tx);
  const o = z.array(z.object({ type: z.literal("payment"), asset_type: z.literal("native"), from: addressSchema, to: addressSchema, amount: amountSchema, transaction_successful: z.literal(true) })).length(1).parse(operations)[0];
  if (!o || t.hash !== hash || o.from !== t.source_account) throw new Error("La operación no coincide con el pago esperado.");
  return { hash: t.hash, source: o.from, destination: o.to, amount: o.amount, fee_stroops: Number(t.fee_charged), ledger: t.ledger, confirmed_at: t.created_at, asset: "XLM", network: "testnet" };
}