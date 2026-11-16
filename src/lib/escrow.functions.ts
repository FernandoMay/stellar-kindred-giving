import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addressSchema, hashSchema } from "./payment-validation";
export const escrowCampaign = createServerFn({ method: "GET" }).inputValidator((input: unknown) => z.object({ donor: addressSchema.optional() }).parse(input)).handler(async ({ data }) => {
  const { readCampaign } = await import("./escrow.server"); return readCampaign(data.donor);
});
export const verifyEscrow = createServerFn({ method: "GET" }).inputValidator((input: unknown) => z.object({ hash: hashSchema, donor: addressSchema }).parse(input)).handler(async ({ data }) => {
  const { escrowOutcome } = await import("./escrow.server"); return escrowOutcome(data.hash, data.donor);
});