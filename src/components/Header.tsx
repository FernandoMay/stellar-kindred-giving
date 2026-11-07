import { Link } from "@tanstack/react-router";
import { short, useWallet } from "@/lib/wallet";
import { Button } from "@/components/ui/button";

export function Header() {
  const w = useWallet();
  const link = "text-sm text-muted-foreground hover:text-foreground [&.active]:text-primary";
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold text-primary">✦ Arceus</Link>
        <nav aria-label="Navegación principal" className="order-3 flex w-full flex-wrap gap-5 md:order-none md:w-auto">
          <Link to="/" className={link} activeOptions={{ exact: true }}>Creadores</Link>
          <Link to="/promociones" className={link}>Promociones</Link>
          <Link to="/hackathons" className={link}>Hackathons</Link>
          <Link to="/historial" className={link}>Historial</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-accent">Testnet</span>
          {w.address ? (
            <Button variant="secondary" onClick={w.disconnect} title="Desconectar">
              {w.balance === null ? "—" : Number(w.balance).toFixed(2)} XLM · {short(w.address)}
            </Button>
          ) : (
            <Button onClick={w.connect} disabled={w.connecting}>{w.connecting ? "Conectando…" : "Conectar Freighter"}</Button>
          )}
        </div>
      </div>
      {w.error && <p className="bg-destructive px-4 py-1 text-center text-xs text-destructive-foreground">{w.error} <a className="underline" href="https://www.freighter.app" target="_blank" rel="noreferrer">freighter.app</a></p>}
    </header>
  );
}
