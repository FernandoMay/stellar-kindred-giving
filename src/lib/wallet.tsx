import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Wallet = {
  address: string | null;
  balance: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<Wallet | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("arceus-wallet");
    if (saved) setAddress(saved);
  }, []);

  const refresh = async () => {
    if (!address) return;
    const { getXlmBalance } = await import("./stellar");
    setBalance(await getXlmBalance(address));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const connect = async () => {
    setError(null);
    try {
      const { connectFreighter } = await import("./stellar");
      const a = await connectFreighter();
      setAddress(a);
      localStorage.setItem("arceus-wallet", a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar");
    }
  };

  const disconnect = () => {
    setAddress(null);
    setBalance("0");
    localStorage.removeItem("arceus-wallet");
  };

  return (
    <Ctx.Provider value={{ address, balance, error, connect, disconnect, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWallet() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWallet outside provider");
  return c;
}

export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
