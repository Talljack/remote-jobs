-- Migration: Add GREENHOUSE to job_source enum
-- Run this migration on existing databases to add the GREENHOUSE job source
-- This allows the Greenhouse crawler to insert jobs successfully
--
-- For Supabase: Run this in the SQL Editor
-- For other PostgreSQL: Run with psql $DATABASE_URL -f db/add-greenhouse-source.sql

-- Add GREENHOUSE to job_source enum (PostgreSQL 12+)
-- Using IF NOT EXISTS to make this idempotent (safe to run multiple times)
ALTER TYPE job_source ADD VALUE IF NOT EXISTS 'GREENHOUSE';

-- Verification query (run this to check the current enum values)
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_source') ORDER BY enumsortorder;
