import { createFileRoute } from "@tanstack/react-router";
import { promos } from "@/lib/data";

export const Route = createFileRoute("/promociones")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { title: "Promociones para empresas — Arceus" },
      { name: "description", content: "Marcas que patrocinan creadores y multiplican micro-regalos en Stellar." },
      { property: "og:title", content: "Promociones para empresas — Arceus" },
      { property: "og:description", content: "Patrocina creadores e iguala donaciones en Stellar." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Promociones para empresas</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Campañas de ejemplo; sin matching ni cashback activo.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {promos.map((p) => (
          <article key={p.title} className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-accent">DEMO · {p.brand}</p>
            <h2 className="mt-2 font-display text-xl font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-5 flex justify-between text-sm"><span className="font-semibold text-primary">{p.reward}</span><span className="text-muted-foreground">Hasta {p.ends}</span></div>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-primary bg-secondary p-6">
        <h2 className="font-display text-2xl font-semibold">¿Tu empresa quiere participar?</h2>
        <p className="mt-1 text-muted-foreground">Activación pendiente: datos reales de empresa, destinatarios y reglas de patrocinio.</p>
        <p className="mt-4 text-sm text-accent">Campañas no activadas</p>
      </div>
    </main>
  );
}
