-- Migration: 003_create_job_postings_table.sql
-- Description: Creates the job_postings table with foreign key relationship to users table.

CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    work_type VARCHAR(50) DEFAULT 'hybrid' CHECK (work_type IN ('remote', 'hybrid', 'on-site')),
    employment_type VARCHAR(50) DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'internship', 'contract')),
    experience_level VARCHAR(50) DEFAULT 'mid' CHECK (experience_level IN ('intern', 'entry', 'mid', 'senior', 'lead')),
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    salary_range VARCHAR(100),
    application_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_work_type ON job_postings(work_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_is_active ON job_postings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
