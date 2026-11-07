ALTER TABLE public.stellar_payments ADD COLUMN amount_exact text;
UPDATE public.stellar_payments SET amount_exact = amount::text;
ALTER TABLE public.stellar_payments ALTER COLUMN amount_exact SET NOT NULL;
ALTER TABLE public.stellar_payments ADD CONSTRAINT stellar_payment_exact_amount CHECK (amount_exact ~ '^(0|[1-9][0-9]{0,12})(\.[0-9]{1,7})?$' AND amount_exact::numeric > 0);
COMMENT ON COLUMN public.stellar_payments.amount_exact IS 'Canonical decimal amount from verified Horizon operation; use this text for display to avoid JS floating-point rounding.';