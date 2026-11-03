CREATE TABLE public.stellar_payments (
 hash text PRIMARY KEY CHECK (hash ~ '^[0-9a-f]{64}$'),
 network text NOT NULL DEFAULT 'testnet' CHECK (network = 'testnet'),
 source text NOT NULL CHECK (source ~ '^G[A-Z2-7]{55}$'),
 destination text NOT NULL CHECK (destination ~ '^G[A-Z2-7]{55}$'),
 amount numeric(20,7) NOT NULL CHECK (amount > 0),
 asset text NOT NULL DEFAULT 'XLM' CHECK (asset = 'XLM'),
 fee_stroops bigint NOT NULL CHECK (fee_stroops >= 0),
 ledger bigint NOT NULL CHECK (ledger > 0),
 confirmed_at timestamptz NOT NULL,
 indexed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stellar_payments TO anon, authenticated;
GRANT ALL ON public.stellar_payments TO service_role;
ALTER TABLE public.stellar_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public confirmed ledger payments" ON public.stellar_payments FOR SELECT TO anon, authenticated USING (network = 'testnet');
CREATE INDEX stellar_payments_source_time ON public.stellar_payments(source, confirmed_at DESC);
CREATE INDEX stellar_payments_destination_time ON public.stellar_payments(destination, confirmed_at DESC);
COMMENT ON TABLE public.stellar_payments IS 'Public Testnet ledger projection. Writes only after server verifies exact successful transaction and its single native payment. No browser write grants.';