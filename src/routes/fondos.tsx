import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { escrowCampaign, verifyEscrow } from "@/lib/escrow.functions";
import { escrowActions } from "@/lib/escrow-rules";
import { xlm } from "@/lib/contract-config";
import { EXPLORER } from "@/lib/payment-validation";
import { useWallet } from "@/lib/wallet";
import type { EscrowAction } from "@/lib/escrow-wallet";
const campaignQuery = queryOptions({ queryKey: ["escrow", "0"], queryFn: () => escrowCampaign({ data: {} }), staleTime: 15000 });
export const Route = createFileRoute("/fondos")({
  head: () => ({ meta: [{ title: "Fondo comunitario Testnet — Arceus" }, { name: "description", content: "Campaña 0 con aportaciones XLM, aprobación autorizada y reembolsos en Stellar Testnet." }, { property: "og:title", content: "Fondo comunitario — Arceus" }, { property: "og:description", content: "Estado verificado del fondo comunitario en Soroban Testnet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(campaignQuery), component: Funds,
});
const labels: Record<EscrowAction, string> = { deposit: "Aportar", release: "Liberar al destinatario", cancel: "Cancelar campaña", reject: "Rechazar campaña", refund: "Recuperar mi aportación" };
function Funds() {
  const { data: initial } = useSuspenseQuery(campaignQuery); const w = useWallet(); const read = useServerFn(escrowCampaign); const verify = useServerFn(verifyEscrow);
  const [data, setData] = useState(initial); const [amount, setAmount] = useState("1"); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<string | null>(null); const [prepared, setPrepared] = useState<Awaited<ReturnType<typeof import("@/lib/escrow-wallet").prepareEscrow>> | null>(null);
  useEffect(() => { setPending(localStorage.getItem("arceus-pending-escrow")); }, []);
  async function refresh() { setBusy(true); setPrepared(null); try { setData(await read({ data: { donor: w.address ?? undefined } })); } catch { setNotice("No se pudo actualizar la campaña; no repitas operaciones pendientes."); } finally { setBusy(false); } }
  useEffect(() => { setPrepared(null); void refresh(); }, [w.address]);
  const c = data.campaign; const actions = escrowActions(c, w.address, Math.floor(Date.now() / 1000), data.contribution);
  async function prepare(action: EscrowAction) {
    if (!w.address || busy || pending) return; setBusy(true); setNotice("");
    try { const helper = await import("@/lib/escrow-wallet"); setPrepared(await helper.prepareEscrow(w.address, action, c, data.contribution, amount)); } catch (e) { setNotice(e instanceof Error ? e.message : "No se pudo preparar la operación."); } finally { setBusy(false); }
  }
  async function sign() {
    if (!prepared || busy || pending) return; setBusy(true);
    try { const helper = await import("@/lib/escrow-wallet"); await helper.submitEscrow(prepared, (hash) => { localStorage.setItem("arceus-pending-escrow", hash); setPending(hash); }); setPrepared(null); setNotice("Enviado; verifica el resultado antes de realizar otra operación."); } catch (e) { setNotice(e instanceof Error ? e.message : "No se pudo firmar."); } finally { setBusy(false); }
  }
  async function check() {
    if (!pending || !w.address || busy) return; setBusy(true);
    try { const result = await verify({ data: { hash: pending, donor: w.address } }); if (result.status === "pending") { setNotice("Sin confirmación todavía. Conserva el hash y no repitas la operación."); return; } localStorage.removeItem("arceus-pending-escrow"); setPending(null); await refresh(); setNotice(result.status === "confirmed" ? "Operación confirmada en Stellar Testnet." : "Stellar confirmó que la operación falló."); } catch { setNotice("No se pudo verificar; conserva el hash y no repitas la operación."); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl px-4 py-10">
    <div className="flex flex-wrap justify-between gap-4 border-b border-border pb-6"><div><p className="text-sm text-accent">Soroban · Solo Testnet · No auditado</p><h1 className="mt-2 font-display text-4xl font-bold">Fondo comunitario</h1><p className="mt-3 text-muted-foreground">Campaña #0 · {c.state === "Funding" ? "Recaudando" : c.state}</p></div><Button variant="outline" onClick={refresh} disabled={busy}><RefreshCw className="size-4" />Actualizar</Button></div>
    <dl className="grid gap-6 border-b border-border py-8 sm:grid-cols-3"><div><dt className="text-muted-foreground">Aportado / objetivo</dt><dd className="mt-2 font-display text-2xl">{xlm(BigInt(c.deposited))} / {xlm(BigInt(c.target))} XLM</dd></div><div><dt className="text-muted-foreground">Custodiado</dt><dd className="mt-2 font-display text-2xl">{xlm(BigInt(c.remaining))} XLM</dd></div><div><dt className="text-muted-foreground">Fecha límite UTC</dt><dd className="mt-2">{new Date(c.deadline * 1000).toLocaleString("es-MX", { timeZone: "UTC" })}</dd></div></dl>
    <section className="py-7"><h2 className="flex items-center gap-2 font-display text-xl"><ShieldCheck className="size-5 text-primary" />Participantes</h2><dl className="mt-5 grid gap-4 text-sm">{[["Propietario", c.owner], ["Destinatario", c.recipient], ["Aprobador", c.approver], ["Contrato", data.contractId]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-all">{value}</dd></div>)}</dl></section>
    <section className="border-t border-border py-7"><h2 className="font-display text-2xl">Mi aportación</h2><p className="mt-3 text-muted-foreground">{w.address ? `${xlm(BigInt(data.contribution))} XLM` : "Billetera sin conectar"}</p>{!w.address && <Button className="mt-5" onClick={w.connect} disabled={w.connecting}>Conectar Freighter</Button>}
      {actions.deposit && <div className="mt-5 flex max-w-md flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><label htmlFor="escrow-amount" className="block text-sm">Importe XLM</label><input id="escrow-amount" value={amount} onChange={(e) => { setAmount(e.target.value); setPrepared(null); }} inputMode="decimal" disabled={busy || Boolean(pending)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2" /></div><Button onClick={() => prepare("deposit")} disabled={busy || Boolean(pending)}>Revisar aportación</Button></div>}
      <div className="mt-5 flex flex-wrap gap-3">{(["release", "cancel", "reject", "refund"] as const).filter((action) => actions[action]).map((action) => <Button key={action} variant="outline" disabled={busy || Boolean(pending)} onClick={() => prepare(action)}>{labels[action]}</Button>)}</div>
      {prepared && <div className="mt-6 border-y border-border py-5"><p>{labels[prepared.action]} {prepared.amount && `${prepared.amount} XLM`} · Campaña #0</p><p className="mt-2 text-sm">Comisión máxima: {xlm(BigInt(prepared.fee))} XLM · Testnet</p><p className="mt-2 break-all text-sm text-muted-foreground">Destinatario final: {c.recipient}</p><div className="mt-4 flex gap-3"><Button disabled={busy || Boolean(pending)} onClick={sign}>Firmar en Freighter</Button><Button variant="outline" onClick={() => setPrepared(null)} disabled={busy}>Volver</Button></div></div>}
      {pending && <div className="mt-6"><a className="break-all text-sm text-primary underline" href={`${EXPLORER}${pending}`} target="_blank" rel="noreferrer">{pending}</a><Button className="mt-3" onClick={check} disabled={busy || !w.address}>Verificar operación pendiente</Button></div>}
      <p role="status" className="mt-4 text-sm text-accent">{busy ? "Consultando Stellar…" : notice}</p>
    </section>
  </main>;
}