import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";

type Wallet = {
  address: string | null;
  balance: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<Wallet | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const connected = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!connected.current) return;
    try {
      const { walletSnapshot, getXlmBalance } = await import("./stellar");
      const current = await walletSnapshot();
      const nextBalance = await getXlmBalance(current);
      if (!connected.current) return;
      setAddress(current); setBalance(nextBalance); setError(null);
    } catch (e) {
      setAddress(null); setBalance(null);
      setError(e instanceof Error ? e.message : "No se pudo verificar la billetera.");
    }
  }, []);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") void refresh(); };
    const interval = window.setInterval(tick, 10000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", tick); };
  }, [refresh]);

  const connect = async () => {
    setError(null);
    setConnecting(true);
    try {
      const { connectFreighter } = await import("./stellar");
      const a = await connectFreighter();
      connected.current = true;
      setAddress(a);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar");
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    connected.current = false;
    setBalance(null); setError(null);
    localStorage.removeItem("arceus-wallet");
  };

  return (
    <Ctx.Provider value={{ address, balance, connecting, error, connect, disconnect, refresh }}>
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
