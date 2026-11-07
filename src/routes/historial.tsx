import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useWallet, short } from "@/lib/wallet";
import { reconcilePayment, paymentHistory } from "@/lib/payments.functions";
import { EXPLORER } from "@/lib/payment-validation";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/historial")({ head: () => ({ meta: [
  { title: "Historial verificado — Arceus" }, { name: "description", content: "Consulta tus pagos XLM verificados en Stellar Testnet." },
  { property: "og:title", content: "Historial verificado — Arceus" }, { property: "og:description", content: "Evidencia de pagos confirmados en Stellar Testnet." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: History });

function History() {
  const w = useWallet(); const lookup = useServerFn(reconcilePayment); const list = useServerFn(paymentHistory);
  const [hash, setHash] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof paymentHistory>>>([]);
  const refresh = async () => { if (!w.address) return; setBusy(true); try { setRows(await list({ data: { address: w.address } })); setNotice(""); } catch { setNotice("No se pudo cargar el historial."); } finally { setBusy(false); } };
  const verify = async () => { setBusy(true); try { const result = await lookup({ data: { hash: hash.trim() } }); setNotice(result.status === "confirmed" ? `Confirmado: ${result.payment?.amount} XLM · ledger ${result.payment?.ledger}` : "Sin confirmación disponible. No repitas el pago."); } catch { setNotice("No se pudo verificar. Revisa el hash y vuelve a consultar; no repitas el pago."); } finally { setBusy(false); } };
  return <main className="mx-auto max-w-6xl px-4 py-10"><h1 className="font-display text-3xl font-bold">Historial verificado</h1>
    <form className="mt-6 flex max-w-2xl flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); void verify(); }}><label className="w-full text-sm" htmlFor="tx-hash">Hash de transacción · Testnet</label><input id="tx-hash" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2" value={hash} onChange={(e) => setHash(e.target.value)} maxLength={64} required pattern="[a-f0-9]{64}" /><Button type="submit" disabled={busy}>Verificar</Button></form>
    <p role="status" className="mt-3 text-sm text-accent">{notice}</p>
    <div className="mt-8 flex items-center gap-4"><h2 className="font-display text-xl">Mis aportaciones</h2><Button variant="outline" onClick={w.address ? refresh : w.connect} disabled={busy}>{w.address ? "Consultar" : "Conectar Freighter"}</Button></div>
    {rows.length === 0 && <p className="mt-4 text-muted-foreground">Sin operaciones cargadas.</p>}
    <ul className="mt-4 divide-y divide-border">{rows.map((r) => <li key={r.hash} className="flex flex-wrap justify-between gap-3 py-4"><div><p>{r.amount} {r.asset} · {short(r.source)} → {short(r.destination)}</p><p className="text-xs text-muted-foreground">{r.confirmed_at} · Ledger {r.ledger}</p></div><a href={`${EXPLORER}${r.hash}`} target="_blank" rel="noreferrer" className="text-primary underline">Ver transacción</a></li>)}</ul>
  </main>;
}