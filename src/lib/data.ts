// Demo data. Wallet addresses are sample Testnet accounts.
export type Creator = {
  demo: boolean;
  id: string;
  name: string;
  handle: string;
  category: string;
  bio: string;
  address: string;
  emoji: string;
  goal: { title: string; raised: number; target: number };
};

export const giftTiers = [
  { id: "semilla", name: "Semilla", emoji: "🌱", amount: "1" },
  { id: "flor", name: "Flor", emoji: "🌸", amount: "5" },
  { id: "arbol", name: "Árbol", emoji: "🌳", amount: "20" },
  { id: "bosque", name: "Bosque", emoji: "🌲", amount: "100" },
];

// No fabricated recipients or financial figures. Real records await owner information.
export const creators: Creator[] = [];
export const promos: { brand: string; title: string; desc: string; reward: string; ends: string }[] = [];
export const hackathons: { name: string; prize: number; status: string; date: string; tracks: string[]; escrow: boolean }[] = [];
