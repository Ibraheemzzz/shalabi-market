-- Drop the old constraint and add a new one with 'Confirmed' included
ALTER TABLE orders DROP CONSTRAINT IF EXISTS order_status_check;
ALTER TABLE orders ADD CONSTRAINT order_status_check CHECK (status IN ('Created', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'));
