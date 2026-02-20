-- ================================================
-- RBAC Migration PART 2: Add columns to existing tables
-- ================================================
-- Run this after Part 1 succeeds

-- Add company_id and owner_id to all tables
-- Using uuid type without foreign key constraints to avoid issues

ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE archived_orders ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE filaments ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE models ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE models ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE external_parts ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE supply_categories ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE supply_categories ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE stores ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE printers ADD COLUMN IF NOT EXISTS company_id uuid;
-- Skip owner_id for printers as it may already exist with different type

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE filament_usage_history ADD COLUMN IF NOT EXISTS owner_id uuid;

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_archived_orders_company_id ON archived_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_filaments_company_id ON filaments(company_id);
CREATE INDEX IF NOT EXISTS idx_models_company_id ON models(company_id);
CREATE INDEX IF NOT EXISTS idx_external_parts_company_id ON external_parts(company_id);
CREATE INDEX IF NOT EXISTS idx_supply_categories_company_id ON supply_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_company_id ON team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_stores_company_id ON stores(company_id);
CREATE INDEX IF NOT EXISTS idx_printers_company_id ON printers(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_filament_usage_history_company_id ON filament_usage_history(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);

SELECT 'Part 2 completed successfully!' as status;
