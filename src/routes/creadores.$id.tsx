import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { creators, giftTiers } from "@/lib/data";
import { useWallet } from "@/lib/wallet";
import { reconcilePayment } from "@/lib/payments.functions";
import { amountSchema, EXPLORER } from "@/lib/payment-validation";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/creadores/$id")({
  loader: ({ params }) => { const c = creators.find((x) => x.id === params.id); if (!c) throw notFound(); return c; },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.name ?? "Creador"} en Arceus` },
    { name: "description", content: loaderData?.bio ?? "Perfil de creador en Arceus" },
    { property: "og:title", content: `${loaderData?.name ?? "Creador"} en Arceus` },
    { property: "og:description", content: loaderData?.bio ?? "Perfil de Arceus" },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" },
  ] }), component: Profile,
});

function Profile() {
  const c = Route.useLoaderData(); const w = useWallet(); const verify = useServerFn(reconcilePayment);
  const [tier, setTier] = useState(giftTiers[1] ?? giftTiers[0]);
  const [custom, setCustom] = useState(""); const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "busy"; text: string; hash?: string } | null>(null);
  const [prepared, setPrepared] = useState<Awaited<ReturnType<typeof import("@/lib/stellar").prepareXlm>> | null>(null);
  const [pending, setPending] = useState<string | null>(null); const lock = useRef(false);
  useEffect(() => { setPending(localStorage.getItem("arceus-pending-payment")); }, []);
  const amount = custom || tier?.amount || "5"; const pct = Math.round(c.goal.raised / c.goal.target * 100);
  const busy = status?.kind === "busy";
  const check = async (hash: string) => {
    setStatus({ kind: "busy", text: "Verificando en Stellar…", hash });
    try {
      const result = await verify({ data: { hash } });
      if (result.status === "confirmed") {
        setPending(null); localStorage.removeItem("arceus-pending-payment"); setPrepared(null);
        setStatus({ kind: "ok", text: `Confirmado: ${result.payment?.amount} XLM · ledger ${result.payment?.ledger}`, hash }); await w.refresh();
      } else setStatus({ kind: "err", text: "Confirmación pendiente. No repitas el pago; vuelve a consultar este hash.", hash });
    } catch { setStatus({ kind: "err", text: "No se pudo verificar. Conserva el hash y consulta de nuevo, sin repetir el pago.", hash }); }
  };
  const send = async () => {
    if (c.demo || pending || lock.current) return;
    if (!w.address) return w.connect();
    lock.current = true; setStatus({ kind: "busy", text: prepared ? "Firma en Freighter…" : "Preparando pago…" });
    try {
      const { prepareXlm, signAndSubmit } = await import("@/lib/stellar");
      if (!prepared) { setPrepared(await prepareXlm(w.address, c.address, amount, msg || `Arceus ${tier?.name ?? "regalo"}`)); setStatus(null); return; }
      const hash = await signAndSubmit(prepared, (h) => { localStorage.setItem("arceus-pending-payment", h); setPending(h); setStatus({ kind: "busy", text: "Enviando a Stellar…", hash: h }); });
      await check(hash);
    } catch (e) { setStatus({ kind: "err", text: e instanceof Error ? e.message : "No se pudo preparar el pago." }); }
    finally { lock.current = false; }
  };
  const fund = async () => {
    if (!w.address) return; setStatus({ kind: "busy", text: "Solicitando XLM de prueba…" });
    try { const { fundWithFriendbot } = await import("@/lib/stellar"); await fundWithFriendbot(w.address); await w.refresh(); setStatus({ kind: "ok", text: "Friendbot procesado; consulta el saldo actualizado." }); }
    catch { setStatus({ kind: "err", text: "No se pudo fondear la cuenta. Puede estar fondeada ya." }); }
  };
  return <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[minmax(0,1fr)_360px]">
    <section className="min-w-0"><div className="text-6xl">{c.emoji}</div>
      {c.demo && <p className="mt-3 text-sm font-semibold text-accent">DEMO · destinatario de ejemplo · pagos deshabilitados</p>}
      <h1 className="mt-4 font-display text-4xl font-bold">{c.name}</h1><p className="text-accent">{c.handle} · {c.category}</p>
      <p className="mt-4 max-w-xl text-muted-foreground">{c.bio}</p>
      <div className="mt-8 border-t border-border pt-5"><p className="text-sm text-muted-foreground">Meta comunitaria · DEMO</p>
        <h2 className="font-display text-xl font-semibold">{c.goal.title}</h2>
        <progress aria-label="Progreso ilustrativo" value={c.goal.raised} max={c.goal.target} className="mt-3 h-2 w-full accent-primary" />
        <p className="mt-2 text-sm">{c.goal.raised.toLocaleString()} / {c.goal.target.toLocaleString()} XLM · {pct}% · DEMO</p>
        <p className="mt-2 text-xs text-muted-foreground">Cifras ilustrativas. Escrow pendiente de despliegue y verificación; aprobación humana autorizada.</p>
      </div><p className="mt-6 break-all text-xs text-muted-foreground">Billetera de ejemplo: {c.address}</p>
    </section>
    <aside className="h-fit min-w-0 rounded-lg border border-border bg-card p-5"><h2 className="font-display text-lg font-semibold">Enviar micro-regalo</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">{giftTiers.map((t) => <Button variant="outline" key={t.id} disabled={Boolean(pending) || busy} aria-pressed={tier?.id === t.id && !custom} onClick={() => { setTier(t); setCustom(""); setPrepared(null); }} className={`h-auto flex-col items-start p-3 ${tier?.id === t.id && !custom ? "border-primary bg-secondary" : "border-border"}`}><span className="text-2xl">{t.emoji}</span><span>{t.name}</span><span className="text-xs text-muted-foreground">{t.amount} XLM</span></Button>)}</div>
      <label className="mt-4 block text-xs" htmlFor="amount">Monto personalizado (XLM)</label><input id="amount" disabled={Boolean(pending) || busy} value={custom} onChange={(e) => { setCustom(e.target.value); setPrepared(null); }} inputMode="decimal" placeholder="5.0000000" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      <label className="mt-3 block text-xs" htmlFor="message">Mensaje opcional · máximo 28 bytes</label><input id="message" disabled={Boolean(pending) || busy} value={msg} onChange={(e) => { setMsg(e.target.value); setPrepared(null); }} maxLength={28} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      {prepared && <dl className="mt-4 space-y-2 break-all text-xs"><dt>Destinatario</dt><dd>{prepared.to}</dd><dt>Activo y red</dt><dd>XLM · Stellar Testnet</dd><dt>Importe / comisión estimada / total</dt><dd>{prepared.amount} / {prepared.fee} / {(Number(prepared.amount) + Number(prepared.fee)).toFixed(7)} XLM</dd></dl>}
      <Button onClick={send} disabled={c.demo || Boolean(pending) || busy || !amountSchema.safeParse(amount).success} className="mt-4 h-auto w-full whitespace-normal py-2.5">{c.demo ? "Pagos deshabilitados · DEMO" : !w.address ? "Conectar billetera" : prepared ? "Firmar y enviar" : `Revisar ${amount} XLM`}</Button>
      {pending && <Button variant="outline" disabled={busy} onClick={() => check(pending)} className="mt-3 w-full">Verificar pago pendiente</Button>}
      {w.address && w.balance !== null && Number(w.balance) === 0 && <Button variant="outline" disabled={busy} onClick={fund} className="mt-2 h-auto w-full whitespace-normal py-2">Obtener XLM de prueba (Friendbot)</Button>}
      {status && <p role="status" className={`mt-3 text-sm ${status.kind === "err" ? "text-destructive" : status.kind === "ok" ? "text-primary" : "text-muted-foreground"}`}>{status.text} {status.hash && <a className="underline" href={`${EXPLORER}${status.hash}`} target="_blank" rel="noreferrer">Ver transacción</a>}</p>}
    </aside>
  </main>;
}
