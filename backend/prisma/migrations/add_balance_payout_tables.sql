-- Migration: Add Balance and Payout System Tables
-- Created: 2025-01-XX

-- Create TransactionType enum
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('CREDIT', 'DEBIT', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AccountType enum
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('BANK_ACCOUNT', 'E_WALLET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DisbursementStatus enum
DO $$ BEGIN
    CREATE TYPE disbursement_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organizer_balance table
CREATE TABLE IF NOT EXISTS organizer_balance (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizer_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pending_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_earned DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_withdrawn DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_balance_organizer_id ON organizer_balance(organizer_id);

-- Create balance_transactions table
CREATE TABLE IF NOT EXISTS balance_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_transactions_organizer_id ON balance_transactions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON balance_transactions(created_at);

-- Create payout_accounts table
CREATE TABLE IF NOT EXISTS payout_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_type account_type NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_code TEXT,
    e_wallet_type TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_organizer_id ON payout_accounts(organizer_id);
CREATE INDEX IF NOT EXISTS idx_payout_accounts_is_default ON payout_accounts(is_default);

-- Create disbursements table
CREATE TABLE IF NOT EXISTS disbursements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payout_account_id TEXT NOT NULL REFERENCES payout_accounts(id),
    amount DECIMAL(12, 2) NOT NULL,
    status disbursement_status NOT NULL DEFAULT 'PENDING',
    xendit_id TEXT,
    xendit_reference TEXT,
    failure_reason TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disbursements_organizer_id ON disbursements(organizer_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_xendit_id ON disbursements(xendit_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizer_balance_updated_at BEFORE UPDATE ON organizer_balance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_accounts_updated_at BEFORE UPDATE ON payout_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disbursements_updated_at BEFORE UPDATE ON disbursements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

