import { createFileRoute, Link } from "@tanstack/react-router";
import { creators } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arceus — Micro-regalos para creadores en Stellar" },
      { name: "description", content: "Apoya a creadores y proyectos sociales con micro-regalos instantáneos en la red Stellar." },
      { property: "og:title", content: "Arceus — Micro-regalos en Stellar" },
      { property: "og:description", content: "Donaciones P2P, escrow Soroban y premios para hackathons." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-14">
        <p className="mb-3 text-sm uppercase tracking-widest text-accent">Code Garden Collective</p>
        <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
          Apoya a quien crea.<br /><span className="text-primary">Directo, en 5 segundos.</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Micro-regalos, donaciones y fondos comunitarios sobre Stellar. Sin intermediarios, con comisiones de fracciones de centavo.
        </p>
        <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4 text-sm">
          {[["1", "Conecta tu billetera"], ["2", "Elige un creador"], ["3", "Envía un regalo"]].map(([n, t]) => (
            <div key={n} className="rounded-lg border border-border p-3"><span className="font-display text-2xl text-primary">{n}</span><p>{t}</p></div>
          ))}
        </div>
      </section>
      <h2 className="mb-5 font-display text-2xl font-semibold">Creadores</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {creators.map((c) => {
          const pct = Math.round((c.goal.raised / c.goal.target) * 100);
          return (
            <Link key={c.id} to="/creadores/$id" params={{ id: c.id }} className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary">
              <div className="text-4xl">{c.emoji}</div>
              <h3 className="mt-3 font-display text-lg font-semibold group-hover:text-primary">{c.name}</h3>
              <p className="text-xs text-accent">{c.category}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.bio}</p>
              <div className="mt-4 h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{pct}% · {c.goal.title}</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
