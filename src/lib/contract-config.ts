export const STELLAR_RPC = "https://soroban-testnet.stellar.org";
export const NATIVE_TOKEN = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
export const deployments = {
  nft: { id: "CAC6UMQVTS3HBOKK36R5CQHQ4OGL4NRMG2EI6IFIBVGVVCCBRSW573UC", wasm: "838a821201911790a515b1a8e648ea3d7d5623f38732a9a15f20cf8bb9bda34b", tokenMethod: "token" },
  escrow: { id: "CB5XRAKPQZFIGZRXGEOQEGD65J3SICQFBQH4OPIHU2PNBKF25ND2CMF7", wasm: "f3dd52e8003324ae783d2e01e37aa606dd28ee6c645177563c64ec0b93217608", tokenMethod: "asset" },
} as const;
export const campaignId = "0";
export function xlm(stroops: bigint) { return `${stroops / 10000000n}.${(stroops % 10000000n).toString().padStart(7, "0")}`; }