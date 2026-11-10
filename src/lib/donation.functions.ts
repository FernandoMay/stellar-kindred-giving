import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addressSchema, hashSchema } from "./payment-validation";
import { donationContractId } from "./donation-config";

export const donationNfts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ address: addressSchema, page: z.number().int().min(0).max(10000).default(0) }).parse(input))
  .handler(async ({ data }) => {
    if (!donationContractId) return { contractId: null, items: [], more: false, status: "not_configured" as const };
    const { readDonationNfts } = await import("./donation.server");
    return { contractId: donationContractId, ...await readDonationNfts(donationContractId, data.address, data.page), status: "connected" as const };
  });

export const donationOutcome = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ hash: hashSchema, owner: addressSchema }).parse(input))
  .handler(async ({ data }) => {
    if (!donationContractId) throw new Error("Contrat NFT no configurado.");
    const { verifyDonationOutcome } = await import("./donation.server");
    return verifyDonationOutcome(donationContractId, data.hash, data.owner);
  });