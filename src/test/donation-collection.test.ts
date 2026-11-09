import { describe, expect, it } from "vitest";
import { outgoingMemories, totalXlm } from "@/lib/donation-collection";
describe("Donation collection integrity", () => {
  const outgoing = { hash: "a".repeat(64), source: "donor", destination: "creator", amount_exact: "1.0000001", asset: "XLM", confirmed_at: "2026-11-08T15:25:00Z", ledger: 123 };
  it("only the donating account gets an outgoing payment memory", () => {
    expect(outgoingMemories([outgoing, { ...outgoing, source: "creator", destination: "donor" }], "donor")).toEqual([outgoing]);
  });
  it("self-payments cannot be donation memories", () => {
    expect(outgoingMemories([{ ...outgoing, destination: "donor" }], "donor")).toEqual([]);
  });
  it("preserves seven-decimal XLM values when summing", () => {
    expect(totalXlm(["1.0000001", "2.0000002"])).toBe("3.0000003");
  });
});