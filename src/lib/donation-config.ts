// Set only after verifying the user's Testnet deployment transaction and WASM.
export const donationContractId: string | null = null;
export const STELLAR_RPC = "https://soroban-testnet.stellar.org";
export type DonationNft = { id: string; owner: string; recipient: string; amount: string; created_at: number };