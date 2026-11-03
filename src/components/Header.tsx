import { Link } from "@tanstack/react-router";
import { short, useWallet } from "@/lib/wallet";

export function Header() {
  const w = useWallet();
  const link = "text-sm text-muted-foreground hover:text-foreground [&.active]:text-primary";
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold text-primary">✦ Arceus</Link>
        <nav className="hidden gap-5 md:flex">
          <Link to="/" className={link} activeOptions={{ exact: true }}>Creadores</Link>
          <Link to="/promociones" className={link}>Promociones</Link>
          <Link to="/hackathons" className={link}>Hackathons</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-accent">Testnet</span>
          {w.address ? (
            <button onClick={w.disconnect} className="rounded-md bg-secondary px-3 py-1.5 text-sm" title="Desconectar">
              {Number(w.balance).toFixed(2)} XLM · {short(w.address)}
            </button>
          ) : (
            <button onClick={w.connect} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
              Conectar Freighter
            </button>
          )}
        </div>
      </div>
      {w.error && <p className="bg-destructive px-4 py-1 text-center text-xs text-destructive-foreground">{w.error} <a className="underline" href="https://www.freighter.app" target="_blank" rel="noreferrer">freighter.app</a></p>}
    </header>
  );
}
