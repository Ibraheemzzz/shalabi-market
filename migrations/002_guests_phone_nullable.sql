-- =========================================
-- Migration: Make guests.phone_number nullable
-- =========================================
-- WHY: Guests can browse and place orders without providing a phone number
--      at session creation time. The contact phone is collected separately
--      via shipping_phone when the order is placed.
--
-- HOW TO RUN:
--   psql $DATABASE_URL -f migrations/002_guests_phone_nullable.sql
--
-- SAFE TO RUN MULTIPLE TIMES: YES (IF EXISTS guard)
-- =========================================

ALTER TABLE guests ALTER COLUMN phone_number DROP NOT NULL;
