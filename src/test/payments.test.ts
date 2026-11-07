import { describe, expect, it, vi, beforeEach } from "vitest";
import { StrKey } from "@stellar/stellar-sdk";
import { amountSchema, parseLedgerPayment, TESTNET_PASSPHRASE, validatePayment, validateWalletState } from "@/lib/payment-validation";

const from = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const to = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 2));
const hash = "a".repeat(64); // Mock evidence used only by tests.
const tx = { hash, successful: true, source_account: from, ledger: 123, fee_charged: "100", created_at: "2026-11-03T20:00:00Z", operation_count: 1 };
const op = { type: "payment", asset_type: "native", from, to, amount: "5.0000000", transaction_successful: true };
describe("Financial validation", () => {
  it("accepts 7 decimal places", () => expect(amountSchema.parse("0.0000001")).toBe("0.0000001"));
  it.each(["0", "-1", "1.00000001", "1..2", "NaN", "1e3", "Infinity"])("rejects invalid amount %s", (s) => expect(amountSchema.safeParse(s).success).toBe(false));
  it("limits memo to 28 UTF-8 bytes", () => expect(() => validatePayment(from, to, "5", "🌸".repeat(8))).toThrow());
  it("rejects self payment", () => expect(() => validatePayment(from, from, "5", "")).toThrow());
  it("blocks missing wallet", () => expect(() => validateWalletState(false, from, TESTNET_PASSPHRASE)).toThrow());
  it("blocks disconnected wallet", () => expect(() => validateWalletState(true, "", TESTNET_PASSPHRASE)).toThrow());
  it("blocks wrong network", () => expect(() => validateWalletState(true, from, "Public Global Stellar Network ; September 2015")).toThrow());
  it("blocks changed account", () => expect(() => validateWalletState(true, to, TESTNET_PASSPHRASE, from)).toThrow());
  it("accepts successful single XLM ledger operation", () => expect(parseLedgerPayment(tx, [op], hash)).toMatchObject({ amount: "5.0000000", ledger: 123, destination: to, network: "testnet" }));
  it("rejects unsuccessful transaction", () => expect(() => parseLedgerPayment({ ...tx, successful: false }, [op], hash)).toThrow());
  it("rejects arbitrary USDC asset", () => expect(() => parseLedgerPayment(tx, [{ ...op, asset_type: "credit_alphanum4" }], hash)).toThrow());
  it("rejects hash mismatch", () => expect(() => parseLedgerPayment(tx, [op], "b".repeat(64))).toThrow());
  it("rejects multiple operations", () => expect(() => parseLedgerPayment({ ...tx, operation_count: 2 }, [op, op], hash)).toThrow());
});

vi.mock("@stellar/freighter-api", () => ({ isConnected: vi.fn(), getAddress: vi.fn(), getNetworkDetails: vi.fn(), signTransaction: vi.fn() }));
import * as freighter from "@stellar/freighter-api";
import { signAndSubmit, walletSnapshot } from "@/lib/stellar";
describe("Wallet integration (mocked only in tests)", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true }); vi.mocked(freighter.getAddress).mockResolvedValue({ address: from }); vi.mocked(freighter.getNetworkDetails).mockResolvedValue({ network: "TESTNET", networkUrl: "", networkPassphrase: TESTNET_PASSPHRASE }); });
  it("detects absent extension", async () => { vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false }); await expect(walletSnapshot()).rejects.toThrow("Instala"); });
  it("signature rejection never submits", async () => { vi.mocked(freighter.signTransaction).mockResolvedValue({ signedTxXdr: "", signerAddress: "" }); const onSigned = vi.fn(); await expect(signAndSubmit({ from, to, amount: "5", memo: "", xdr: "mock", hash, fee: "0.00001" }, onSigned)).rejects.toThrow("Firma rechazada"); expect(onSigned).not.toHaveBeenCalled(); });
});