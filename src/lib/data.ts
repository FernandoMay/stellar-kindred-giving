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

const ADDR = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";

export const creators: Creator[] = [
  { demo: true, id: "luna-beats", name: "Luna Beats", handle: "@lunabeats", category: "Música", emoji: "🎧", address: ADDR,
    bio: "Productora de lo-fi en vivo cada viernes. Cada regalo financia equipo para talleres juveniles.",
    goal: { title: "Estudio comunitario", raised: 3420, target: 5000 } },
  { demo: true, id: "dev-maya", name: "Maya Codes", handle: "@mayacodes", category: "Código abierto", emoji: "💻", address: ADDR,
    bio: "Mantengo librerías open source para Soroban y enseño Rust en español.",
    goal: { title: "Docs de Soroban en español", raised: 1280, target: 2000 } },
  { demo: true, id: "eco-raices", name: "Raíces Verdes", handle: "@raices", category: "Impacto social", emoji: "🌿", address: ADDR,
    bio: "Reforestación urbana en Mérida. Fondos custodiados en escrow y liberados por hito.",
    goal: { title: "1,000 árboles", raised: 6100, target: 10000 } },
  { demo: true, id: "pixel-ana", name: "Ana Pixel", handle: "@anapixel", category: "Arte digital", emoji: "🎨", address: ADDR,
    bio: "Ilustradora. Acceso exclusivo a bocetos y procesos para quienes apoyan.",
    goal: { title: "Novela gráfica", raised: 740, target: 1500 } },
];

export const promos = [
  { brand: "NodoCafé", title: "2x regalos patrocinados", desc: "Cada regalo Flor enviado esta semana es igualado por NodoCafé hasta 5,000 XLM.", reward: "Matching 1:1", ends: "30 nov" },
  { brand: "Andes Pay", title: "Cashback en USDC", desc: "Recibe 3% de vuelta al apoyar proyectos de impacto social.", reward: "3% USDC", ends: "15 dic" },
  { brand: "Stellar Builders MX", title: "Patrocina a un creador", desc: "Empresas pueden adoptar un creador y aparecer en su perfil.", reward: "Visibilidad", ends: "Permanente" },
];

export const hackathons = [
  { name: "Soroban Garden Hack", prize: 25000, status: "Abierto", date: "12–14 dic", tracks: ["DeFi social", "Escrow", "NFTs de acceso"], escrow: true },
  { name: "Code Garden Buildathon", prize: 10000, status: "Inscripciones", date: "Enero 2027", tracks: ["Micropagos", "UX de billeteras"], escrow: true },
  { name: "Impacto LatAm", prize: 15000, status: "Juzgando", date: "Oct 2026", tracks: ["ONGs", "Transparencia"], escrow: true },
];
