import { createFileRoute } from "@tanstack/react-router";
import { promos } from "@/lib/data";

export const Route = createFileRoute("/promociones")({
  head: () => ({
    meta: [
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
      <p className="mt-2 max-w-xl text-muted-foreground">Las marcas igualan regalos, dan cashback y patrocinan creadores con total transparencia on-chain.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {promos.map((p) => (
          <article key={p.title} className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-accent">{p.brand}</p>
            <h2 className="mt-2 font-display text-xl font-semibold">{p.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-5 flex justify-between text-sm"><span className="font-semibold text-primary">{p.reward}</span><span className="text-muted-foreground">Hasta {p.ends}</span></div>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-primary bg-secondary p-6">
        <h2 className="font-display text-2xl font-semibold">¿Tu empresa quiere participar?</h2>
        <p className="mt-1 text-muted-foreground">Escríbenos y lanzamos tu campaña de patrocinio en Arceus.</p>
        <a href="mailto:hola@codegarden.example" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Crear campaña</a>
      </div>
    </main>
  );
}
