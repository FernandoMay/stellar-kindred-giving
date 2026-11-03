import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { creators, giftTiers } from "@/lib/data";
import { useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/creadores/$id")({
  loader: ({ params }) => {
    const c = creators.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Creador"} en Arceus` },
      { name: "description", content: loaderData?.bio ?? "Perfil de creador en Arceus" },
      { property: "og:title", content: `${loaderData?.name ?? "Creador"} en Arceus` },
      { property: "og:description", content: loaderData?.bio ?? "" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const c = Route.useLoaderData();
  const w = useWallet();
  const [tier, setTier] = useState(giftTiers[1]!);
  const [custom, setCustom] = useState("");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "busy"; text: string; hash?: string } | null>(null);
  const amount = custom || tier.amount;
  const pct = Math.round((c.goal.raised / c.goal.target) * 100);

  const send = async () => {
    if (!w.address) return w.connect();
    setStatus({ kind: "busy", text: "Firma la transacción en Freighter…" });
    try {
      const { sendXlm } = await import("@/lib/stellar");
      const hash = await sendXlm(w.address, c.address, amount, msg || `Arceus ${tier.name}`);
      setStatus({ kind: "ok", text: `¡Regalo de ${amount} XLM enviado!`, hash });
      w.refresh();
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "Error al enviar" });
    }
  };

  const fund = async () => {
    if (!w.address) return;
    try {
      const { fundWithFriendbot } = await import("@/lib/stellar");
      await fundWithFriendbot(w.address);
      await w.refresh();
      setStatus({ kind: "ok", text: "Cuenta fondeada con 10,000 XLM de prueba." });
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "Error" });
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_380px]">
      <section>
        <div className="text-6xl">{c.emoji}</div>
        <h1 className="mt-4 font-display text-4xl font-bold">{c.name}</h1>
        <p className="text-accent">{c.handle} · {c.category}</p>
        <p className="mt-4 max-w-xl text-muted-foreground">{c.bio}</p>
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Meta comunitaria (escrow Soroban)</p>
          <h2 className="font-display text-xl font-semibold">{c.goal.title}</h2>
          <div className="mt-3 h-2 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-sm">{c.goal.raised.toLocaleString()} / {c.goal.target.toLocaleString()} XLM · {pct}%</p>
          <p className="mt-2 text-xs text-muted-foreground">Los fondos se liberan automáticamente al cumplir el hito.</p>
        </div>
        <p className="mt-6 break-all text-xs text-muted-foreground">Billetera: {c.address}</p>
      </section>

      <aside className="h-fit rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Enviar micro-regalo</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {giftTiers.map((t) => (
            <button key={t.id} onClick={() => { setTier(t); setCustom(""); }}
              className={`rounded-lg border p-3 text-left transition ${tier.id === t.id && !custom ? "border-primary bg-secondary" : "border-border"}`}>
              <div className="text-2xl">{t.emoji}</div>
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.amount} XLM</div>
            </button>
          ))}
        </div>
        <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Monto personalizado (XLM)"
          className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={28} placeholder="Mensaje (opcional)"
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <button onClick={send} disabled={status?.kind === "busy" || !Number(amount)}
          className="mt-4 w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-50">
          {w.address ? `Enviar ${amount} XLM` : "Conectar billetera"}
        </button>
        {w.address && Number(w.balance) === 0 && (
          <button onClick={fund} className="mt-2 w-full rounded-md border border-border py-2 text-sm">Obtener XLM de prueba (Friendbot)</button>
        )}
        {status && (
          <p className={`mt-3 text-sm ${status.kind === "err" ? "text-destructive" : status.kind === "ok" ? "text-primary" : "text-muted-foreground"}`}>
            {status.text}{" "}
            {status.hash && <a className="underline" target="_blank" rel="noreferrer" href={`https://stellar.expert/explorer/testnet/tx/${status.hash}`}>Ver transacción</a>}
          </p>
        )}
      </aside>
    </main>
  );
}
