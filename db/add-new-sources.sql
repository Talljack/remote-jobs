-- Migration: Add new job sources to existing database
-- Run this migration on existing databases to add the new job source enum values
-- This allows the new crawlers (Jobicy, Working Nomads, 4 Day Week, RemoteBase) to work

-- Add JOBICY to job_source enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'JOBICY' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_source')) THEN
        ALTER TYPE job_source ADD VALUE 'JOBICY';
    END IF;
END $$;

-- Add WORKING_NOMADS to job_source enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WORKING_NOMADS' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_source')) THEN
        ALTER TYPE job_source ADD VALUE 'WORKING_NOMADS';
    END IF;
END $$;

-- Add FOURDAYWEEK to job_source enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FOURDAYWEEK' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_source')) THEN
        ALTER TYPE job_source ADD VALUE 'FOURDAYWEEK';
    END IF;
END $$;

-- Add REMOTEBASE to job_source enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'REMOTEBASE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_source')) THEN
        ALTER TYPE job_source ADD VALUE 'REMOTEBASE';
    END IF;
END $$;

-- Verification query (optional - run this to check the current enum values)
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_source') ORDER BY enumsortorder;
