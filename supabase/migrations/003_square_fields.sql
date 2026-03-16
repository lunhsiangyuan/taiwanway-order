-- 003_square_fields.sql
-- Add Square integration fields to orders table

ALTER TABLE orders
  ADD COLUMN square_order_id TEXT,
  ADD COLUMN square_payment_id TEXT,
  ADD COLUMN receipt_url TEXT;

-- Expand payment_method to include 'card'
DO $$
DECLARE c_name TEXT;
BEGIN
  SELECT conname INTO c_name FROM pg_constraint
    WHERE conrelid = 'orders'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%payment_method%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', c_name);
  END IF;
END $$;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('card', 'cash', 'zelle', 'venmo'));

CREATE INDEX idx_orders_square ON orders (square_order_id) WHERE square_order_id IS NOT NULL;
