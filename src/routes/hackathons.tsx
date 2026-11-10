import { createFileRoute } from "@tanstack/react-router";
import { hackathons } from "@/lib/data";

export const Route = createFileRoute("/hackathons")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      { title: "Premios para hackathons — Arceus" },
      { name: "description", content: "Bolsas de premios en escrow Soroban para hackathons y buildathons." },
      { property: "og:title", content: "Premios para hackathons — Arceus" },
      { property: "og:description", content: "Premios transparentes custodiados en Stellar." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Hackathons y premios</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">No hay hackathons registrados. Contrato de custodia pendiente de despliegue.</p>
      <div className="mt-8 space-y-4">
        {hackathons.map((h) => (
          <article key={h.name} className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-6">
            <div className="flex-1">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-accent">{h.status}</span>
              <h2 className="mt-2 font-display text-2xl font-semibold">{h.name}</h2>
              <p className="text-sm text-muted-foreground">{h.date}</p>
              <div className="mt-3 flex flex-wrap gap-2">{h.tracks.map((t) => <span key={t} className="rounded border border-border px-2 py-0.5 text-xs">{t}</span>)}</div>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-primary">{h.prize.toLocaleString()} XLM</p>
              <p className="text-xs text-muted-foreground">Custodia pendiente de verificación</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
