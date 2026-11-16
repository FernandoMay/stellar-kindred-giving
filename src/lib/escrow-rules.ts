export type Campaign = { owner: string; recipient: string; approver: string; target: string; deposited: string; remaining: string; deadline: number; state: "Funding" | "Released" | "Cancelled" | "Rejected" };
export function escrowActions(c: Campaign, address: string | null, now: number, contribution: string) {
  const funding = c.state === "Funding"; const before = now < c.deadline;
  return {
    deposit: Boolean(address) && funding && before && BigInt(c.deposited) < BigInt(c.target),
    release: address === c.approver && funding && before && c.deposited === c.target,
    cancel: address === c.owner && funding,
    reject: address === c.approver && funding,
    refund: Boolean(address) && c.state !== "Released" && (!funding || !before) && BigInt(contribution) > 0n,
  };
}