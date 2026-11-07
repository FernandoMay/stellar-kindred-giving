import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { addressSchema, hashSchema } from "./payment-validation";

export const reconcilePayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ hash: hashSchema }).parse(input))
  .handler(async ({ data }) => {
    // Public ledger evidence is the authorization boundary: no client-supplied amount/status is accepted.
    const { publicLedgerPayment } = await import("./payments.server");
    const payment = await publicLedgerPayment(data.hash);
    if (!payment) return { status: "pending" as const, payment: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("stellar_payments").upsert({ ...payment, amount: Number(payment.amount), amount_exact: payment.amount }, { onConflict: "hash", ignoreDuplicates: true });
    if (error) throw new Error("Pago verificado; no se pudo guardar el historial. Revisa el hash de nuevo, no repitas el pago.");
    return { status: "confirmed" as const, payment };
  });

export const paymentHistory = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ address: addressSchema }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const url = process.env["SUPABASE_URL"];
    if (!key || !url) throw new Error("Historial no disponible.");
    const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key); return fetch(input, { ...init, headers });
    } } });
    const { data: rows, error } = await client.from("stellar_payments").select("hash,source,destination,amount_exact,asset,fee_stroops,ledger,confirmed_at").or(`source.eq.${data.address},destination.eq.${data.address}`).order("confirmed_at", { ascending: false }).limit(50);
    if (error) throw new Error("No se pudo consultar el historial.");
    return rows ?? [];
  });