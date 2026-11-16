import { deployments } from "./contract-config";
// Independently read from Testnet on 2026-11-16; runtime readers also pin WASM/token.
export const donationContractId: string | null = deployments.nft.id;
export { STELLAR_RPC } from "./contract-config";
export type DonationNft = { id: string; owner: string; recipient: string; amount: string; created_at: number };