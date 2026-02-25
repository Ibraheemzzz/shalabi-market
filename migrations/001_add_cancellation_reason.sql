-- =========================================
-- Migration: Add 'cancellation' to stock_reason_check
-- =========================================
-- WHY: Prisma does not manage CHECK constraints automatically.
--      This migration must be run MANUALLY on any existing database
--      before deploying code that uses reason = 'cancellation'.
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f migrations/001_add_cancellation_reason.sql
--
-- Allowed reason values after this migration:
--   'purchase' | 'admin_add' | 'admin_remove' | 'cancellation'
-- =========================================

-- First, drop the existing constraint (safe if not exists)
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_reason_check;

-- Add the new constraint with all allowed values
ALTER TABLE stock_transactions 
ADD CONSTRAINT stock_reason_check 
CHECK (reason IN ('purchase', 'admin_add', 'admin_remove', 'cancellation'));
