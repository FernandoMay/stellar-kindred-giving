import { afterEach, expect, it, vi } from "vitest";
import { rpc } from "@stellar/stellar-sdk";
import { verifyDonationOutcome } from "@/lib/donation.server";
afterEach(() => vi.restoreAllMocks());
it("an unknown NFT transaction stays pending", async () => {
  vi.spyOn(rpc.Server.prototype, "getTransaction").mockResolvedValue({ status: "NOT_FOUND" } as Awaited<ReturnType<rpc.Server["getTransaction"]>>);
  expect(await verifyDonationOutcome("unused", "a".repeat(64), "unused")).toEqual({ status: "pending" });
});
it("a ledger-failed NFT transaction cannot become confirmation", async () => {
  vi.spyOn(rpc.Server.prototype, "getTransaction").mockResolvedValue({ status: "FAILED" } as Awaited<ReturnType<rpc.Server["getTransaction"]>>);
  expect(await verifyDonationOutcome("unused", "a".repeat(64), "unused")).toEqual({ status: "failed" });
});
it("RPC errors never clear the pending NFT as confirmed", async () => {
  vi.spyOn(rpc.Server.prototype, "getTransaction").mockRejectedValue(new Error("timeout"));
  await expect(verifyDonationOutcome("unused", "a".repeat(64), "unused")).rejects.toThrow("timeout");
});