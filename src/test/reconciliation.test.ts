import { afterEach, describe, expect, it, vi } from "vitest";
import { StrKey } from "@stellar/stellar-sdk";
import { publicLedgerPayment } from "@/lib/payments.server";
const hash = "a".repeat(64);
const from = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const to = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 2));
afterEach(() => vi.unstubAllGlobals());
describe("Ledger reconciliation with test-only responses", () => {
  it("not found remains unconfirmed", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 }))); expect(await publicLedgerPayment(hash)).toBeNull(); });
  it("RPC timeout cannot become confirmation", async () => { vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout"))); await expect(publicLedgerPayment(hash)).rejects.toThrow("timeout"); });
  it("transport error cannot become zero amount or confirmation", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 }))); await expect(publicLedgerPayment(hash)).rejects.toThrow("No repitas"); });
  it("returns exact verified ledger amount", async () => {
    const tx = { hash, successful: true, source_account: from, ledger: 123, fee_charged: "100", created_at: "2026-11-03T20:00:00Z", operation_count: 1 };
    const records = [{ type: "payment", asset_type: "native", from, to, amount: "5.0000001", transaction_successful: true }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(tx)).mockResolvedValueOnce(Response.json({ _embedded: { records } })));
    expect(await publicLedgerPayment(hash)).toMatchObject({ amount: "5.0000001", source: from, destination: to, ledger: 123 });
  });
});