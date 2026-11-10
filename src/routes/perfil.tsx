import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Leaf, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, short } from "@/lib/wallet";
import { paymentHistory } from "@/lib/payments.functions";
import { donationNfts, donationOutcome } from "@/lib/donation.functions";
import { donationContractId } from "@/lib/donation-config";
import { outgoingMemories, totalXlm, type PaymentMemory } from "@/lib/donation-collection";
import { EXPLORER, addressSchema, amountSchema } from "@/lib/payment-validation";
import seed from "@/assets/donation-seed.jpg";

export const Route = createFileRoute("/perfil")({ head: () => ({ meta: [
  { title: "Mi perfil y NFTs de donaciones — Arceus" }, { name: "description", content: "Tu colección de donaciones verificadas y NFTs en Stellar Testnet." },
  { property: "og:title", content: "Mi perfil y NFTs — Arceus" }, { property: "og:description", content: "Recuerdos de aportaciones verificadas y propiedad NFT consultada en Soroban." },
  { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" },
] }), component: DonorProfile });

function DonorProfile() {
  const w = useWallet(); const history = useServerFn(paymentHistory); const nftList = useServerFn(donationNfts); const outcome = useServerFn(donationOutcome);
  const [address, setAddress] = useState(""); const [viewed, setViewed] = useState("");
  const [memories, setMemories] = useState<PaymentMemory[]>([]);
  const [nfts, setNfts] = useState<Awaited<ReturnType<typeof donationNfts>> | null>(null);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [tab, setTab] = useState<"nfts" | "memories">("nfts"); const [page, setPage] = useState(0);
  const [recipient, setRecipient] = useState(""); const [amount, setAmount] = useState("1");
  const [prepared, setPrepared] = useState<Awaited<ReturnType<typeof import("@/lib/donation-wallet").prepareDonation>> | null>(null);
  const [pending, setPending] = useState<string | null>(null); const generation = useRef(0);
  useEffect(() => { setPending(localStorage.getItem("arceus-pending-nft")); }, []);
  async function load(owner: string, nextPage = 0) {
    const request = ++generation.current; setBusy(true); setNotice("");
    try {
      addressSchema.parse(owner);
      const [payments, tokens] = await Promise.all([history({ data: { address: owner } }), nftList({ data: { address: owner, page: nextPage } })]);
      if (request !== generation.current) return;
      setMemories(outgoingMemories(payments, owner)); setNfts(tokens); setViewed(owner); setPage(nextPage);
    } catch { if (request === generation.current) { setMemories([]); setNfts(null); setViewed(""); setNotice("No se pudo consultar la colección. Revisa la dirección e inténtalo de nuevo."); } }
    finally { if (request === generation.current) setBusy(false); }
  }
  useEffect(() => { setMemories([]); setNfts(null); setViewed(""); setPrepared(null); generation.current++; if (w.address) { setAddress(w.address); void load(w.address); } }, [w.address]);
  async function donate() {
    if (!w.address || pending || busy) return;
    setBusy(true); setNotice("");
    try {
      const helper = await import("@/lib/donation-wallet");
      if (!prepared) { setPrepared(await helper.prepareDonation(w.address, recipient.trim(), amount)); return; }
      await helper.submitDonation(prepared, (hash) => { setPending(hash); localStorage.setItem("arceus-pending-nft", hash); });
      setPrepared(null); setNotice("Envío pendiente de confirmación. Conserva el hash y no repitas la donación.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "No se pudo preparar la donación."); }
    finally { setBusy(false); }
  }
  async function checkPending() {
    if (!pending || !w.address) return;
    setBusy(true);
    try {
      const result = await outcome({ data: { hash: pending, owner: w.address } });
      if (result.status === "pending") { setNotice("Sin confirmación disponible; no repitas la donación."); return; }
      localStorage.removeItem("arceus-pending-nft"); setPending(null);
      if (result.status === "confirmed") { await load(w.address); setNotice(`Donación confirmada · NFT #${result.id}`); }
      else setNotice("Stellar confirmó que la operación falló; no se creó el NFT.");
    } catch { setNotice("No se pudo verificar este hash. Consérvalo; no repitas la donación."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl px-4 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-7">
      <div><p className="mb-2 text-sm text-accent">Arceus · Stellar Testnet</p><h1 className="font-display text-4xl font-bold">Mi jardín de aportaciones</h1><p className="mt-3 break-all text-sm text-muted-foreground">{viewed || w.address || "Billetera sin conectar"}</p></div>
      <Button variant="outline" onClick={() => w.address ? load(w.address) : w.connect()} disabled={busy || w.connecting}>{w.address ? <RefreshCw className="size-4" /> : <Wallet className="size-4" />}{w.address ? "Actualizar mi perfil" : "Conectar Freighter"}</Button>
    </div>
    <form onSubmit={(e) => { e.preventDefault(); void load(address.trim()); }} className="mt-6 flex max-w-3xl flex-wrap gap-3"><label htmlFor="collection-address" className="w-full text-sm">Consultar colección de una dirección pública</label><input id="collection-address" value={address} onChange={(e) => setAddress(e.target.value)} required pattern="G[A-Z2-7]{55}" maxLength={56} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2" /><Button disabled={busy} type="submit" variant="secondary">Consultar colección</Button></form>
    <p role="status" className="mt-3 text-sm text-accent">{busy ? "Consultando Stellar…" : notice}</p>
    <dl className="my-8 grid grid-cols-2 gap-6 border-y border-border py-5"><div><dt className="text-sm text-muted-foreground">NFTs en esta página</dt><dd className="mt-1 font-display text-3xl">{nfts ? nfts.items.length : "—"}</dd></div><div><dt className="text-sm text-muted-foreground">XLM en recuerdos cargados</dt><dd className="mt-1 break-all font-display text-2xl">{viewed ? totalXlm(memories.map((r) => r.amount_exact)) : "—"}</dd></div></dl>
    <div role="tablist" aria-label="Colección" className="flex flex-wrap gap-3"><Button role="tab" aria-selected={tab === "nfts"} variant={tab === "nfts" ? "default" : "outline"} onClick={() => setTab("nfts")}>NFTs de donaciones</Button><Button role="tab" aria-selected={tab === "memories"} variant={tab === "memories" ? "default" : "outline"} onClick={() => setTab("memories")}>Recuerdos verificados</Button></div>
    {tab === "nfts" ? <section className="mt-6" aria-label="NFTs de donaciones">
      <p className="mb-5 break-all text-sm text-muted-foreground">{donationContractId ? `Contrato Testnet: ${donationContractId}` : "Contrato NFT pendiente de despliegue. No hay emisión activada."}</p>
      {!nfts?.items.length && <div className="flex min-h-48 flex-col items-center justify-center gap-3 border-y border-border py-8 text-center"><Leaf className="size-8 text-primary" /><h2 className="font-display text-xl">Sin NFTs confirmados</h2><p className="max-w-lg text-sm text-muted-foreground">{viewed ? "No hay NFTs consultados para esta dirección." : "Ninguna colección consultada."}</p></div>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{nfts?.items.map((n) => <article key={n.id} className="overflow-hidden rounded-lg border border-border bg-card"><img src={seed} alt="Semilla de cristal verde, arte conmemorativo Arceus" loading="lazy" width={1024} height={1024} className="aspect-square w-full object-cover" /><div className="p-5"><p className="text-xs text-primary">NFT en Soroban · Testnet</p><h2 className="mt-2 font-display text-xl">Aportación #{n.id}</h2><p className="mt-2">{n.amount} XLM</p><p className="mt-2 text-xs text-muted-foreground">Destinatario: {short(n.recipient)}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at * 1000).toLocaleDateString("es-MX", { timeZone: "UTC" })}</p></div></article>)}</div>
      {viewed && nfts && (page > 0 || nfts.more) && <div className="mt-5 flex gap-3"><Button variant="outline" disabled={busy || page === 0} onClick={() => load(viewed, page - 1)}>Anterior</Button><Button variant="outline" disabled={busy || !nfts.more} onClick={() => load(viewed, page + 1)}>Siguiente</Button></div>}
    </section> : <section className="mt-6" aria-label="Recuerdos verificados"><p className="mb-5 text-sm text-muted-foreground">Pagos XLM salientes verificados, hasta 50 operaciones registradas. Estos recuerdos no son NFTs.</p>{!memories.length && <p className="border-y border-border py-10 text-center text-muted-foreground">Sin aportaciones verificadas cargadas.</p>}<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{memories.map((r) => <article key={r.hash} className="overflow-hidden rounded-lg border border-border bg-card"><img src={seed} alt="Semilla de cristal verde, recuerdo visual de una aportación" width={1024} height={1024} loading="lazy" className="aspect-square w-full object-cover" /><div className="p-5"><p className="text-xs text-accent">Recuerdo · no es un NFT</p><h2 className="mt-2 font-display text-xl">{r.amount_exact} XLM</h2><p className="mt-2 text-sm text-muted-foreground">Para {short(r.destination)} · Ledger {r.ledger}</p><a className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline" href={`${EXPLORER}${r.hash}`} target="_blank" rel="noreferrer">Ver donación<ExternalLink className="size-3" /></a></div></article>)}</div><Link to="/historial" className="mt-6 inline-block text-sm text-primary underline">Verificar otra transacción</Link></section>}
    {donationContractId && <section className="mt-10 border-t border-border pt-6"><h2 className="font-display text-2xl">Donar y recibir NFT</h2><form className="mt-5 grid max-w-2xl gap-3" onSubmit={(e) => { e.preventDefault(); void donate(); }}><label htmlFor="nft-recipient">Destinatario Stellar</label><input id="nft-recipient" value={recipient} disabled={busy || Boolean(pending)} onChange={(e) => { setRecipient(e.target.value); setPrepared(null); }} className="rounded-md border bg-background px-3 py-2" /><label htmlFor="nft-amount">XLM</label><input id="nft-amount" value={amount} disabled={busy || Boolean(pending)} onChange={(e) => { setAmount(e.target.value); setPrepared(null); }} className="rounded-md border bg-background px-3 py-2" />{prepared && <p className="break-all text-sm">{prepared.amount} XLM → {prepared.recipient} · Comisión: {totalXlm([`${BigInt(prepared.fee) / 10000000n}.${(BigInt(prepared.fee) % 10000000n).toString().padStart(7, "0")}`])} XLM</p>}<Button disabled={busy || !w.address || Boolean(pending) || !addressSchema.safeParse(recipient.trim()).success || !amountSchema.safeParse(amount).success}>{prepared ? "Firmar donación y NFT" : "Revisar donación"}</Button></form></section>}
    {pending && <div className="mt-6"><p className="break-all text-sm text-accent">Donación pendiente: <a className="underline" href={`${EXPLORER}${pending}`} target="_blank" rel="noreferrer">{pending}</a></p><Button className="mt-3" variant="outline" disabled={busy || !w.address} onClick={checkPending}>Verificar donación pendiente</Button></div>}
  </main>;
}