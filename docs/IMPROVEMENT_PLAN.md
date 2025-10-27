# Remote Jobs Platform - Improvement Plan

**Reference**: [job.careers](https://job.careers/)
**Date**: 2025-10-22
**Status**: In Progress

---

## Overview

This document outlines the improvements to be made to the remote jobs aggregation platform, inspired by job.careers and other leading remote job platforms.

---

## 1. New Data Sources

### Priority 1 (Implement First)

#### 1.1 RemoteOK

- **URL**: https://remoteok.com/
- **API**: https://remoteok.com/api
- **Features**:
  - No authentication required
  - JSON API available
  - Returns ~1000+ remote jobs
  - Rich metadata (salary, location, skills)
- **Implementation**: RSS/API parsing

#### 1.2 We Work Remotely

- **URL**: https://weworkremotely.com/
- **API**: RSS feeds available
- **Features**:
  - Curated high-quality jobs
  - Categories: Programming, Design, Marketing, etc.
  - RSS: https://weworkremotely.com/categories/remote-programming-jobs.rss
- **Implementation**: RSS parsing

### Priority 2 (Implement Later)

#### 2.1 Himalayas

- **URL**: https://himalayas.app/jobs
- **Features**: Modern UI, great filters
- **Implementation**: Web scraping (no public API)

#### 2.2 Remote3

- **URL**: https://remote3.co/
- **Features**: Web3/Crypto focused remote jobs
- **Implementation**: Web scraping

#### 2.3 Remotive

- **URL**: https://remotive.com/
- **Features**: High-quality curated jobs
- **Implementation**: RSS/API

---

## 2. Enhanced Categorization System

### 2.1 Job Categories

Add a structured category system with **hierarchical categories**:

```typescript
enum JobCategory {
  // Engineering
  ENGINEERING_FRONTEND = "engineering.frontend",
  ENGINEERING_BACKEND = "engineering.backend",
  ENGINEERING_FULLSTACK = "engineering.fullstack",
  ENGINEERING_MOBILE = "engineering.mobile",
  ENGINEERING_DEVOPS = "engineering.devops",
  ENGINEERING_QA = "engineering.qa",
  ENGINEERING_SECURITY = "engineering.security",

  // Data & AI
  DATA_SCIENCE = "data.science",
  DATA_ENGINEER = "data.engineer",
  DATA_ANALYST = "data.analyst",
  ML_AI = "ml.ai",

  // Product & Design
  PRODUCT_MANAGER = "product.manager",
  PRODUCT_DESIGNER = "product.designer",
  UX_DESIGNER = "ux.designer",
  UI_DESIGNER = "ui.designer",

  // Business
  SALES = "business.sales",
  MARKETING = "business.marketing",
  OPERATIONS = "business.operations",
  CUSTOMER_SUCCESS = "business.customer_success",
  CUSTOMER_SUPPORT = "business.customer_support",

  // Other
  CONTENT_WRITING = "other.content",
  HR = "other.hr",
  FINANCE = "other.finance",
  LEGAL = "other.legal",
  OTHER = "other.general",
}
```

### 2.2 Skills/Tech Stack Tags

Create a separate `skills` table for better organization:

```typescript
interface Skill {
  id: string;
  name: string;
  slug: string;
  category: "language" | "framework" | "database" | "cloud" | "tool" | "soft_skill";
  count: number;
  // Popular skills
  languages: ["JavaScript", "Python", "TypeScript", "Go", "Rust", "Java", "C++", ...];
  frameworks: ["React", "Vue", "Angular", "Django", "Flask", "Spring Boot", ...];
  databases: ["PostgreSQL", "MongoDB", "MySQL", "Redis", ...];
  cloud: ["AWS", "Azure", "GCP", "Docker", "Kubernetes", ...];
}
```

### 2.3 Additional Metadata

Add these fields to jobs table:

- `category`: Primary job category
- `subcategory`: Optional subcategory
- `experienceLevel`: "entry", "mid", "senior", "lead", "staff"
- `timezone`: Preferred timezone (if any)
- `benefits`: Array of benefits
- `applicationDeadline`: Optional deadline

---

## 3. Database Schema Updates

### 3.1 New Tables

```sql
-- Job categories table
CREATE TABLE job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES job_categories(id),
  description TEXT,
  icon VARCHAR(50),
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skills table (separate from general tags)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50), -- language, framework, database, cloud, tool
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job-Skill relation (many-to-many)
CREATE TABLE job_skill_relations (
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, skill_id)
);
```

### 3.2 Update Jobs Table

```sql
ALTER TABLE jobs
ADD COLUMN category_id UUID REFERENCES job_categories(id),
ADD COLUMN experience_level VARCHAR(20),
ADD COLUMN timezone VARCHAR(100),
ADD COLUMN benefits TEXT[], -- Array of benefits
ADD COLUMN application_deadline TIMESTAMP;
```

### 3.3 Update Enums

```sql
-- Add new job sources
ALTER TYPE job_source ADD VALUE 'REMOTEOK';
ALTER TYPE job_source ADD VALUE 'WEWORKREMOTELY';
ALTER TYPE job_source ADD VALUE 'HIMALAYAS';
ALTER TYPE job_source ADD VALUE 'REMOTE3';
ALTER TYPE job_source ADD VALUE 'REMOTIVE';

-- Add experience level enum
CREATE TYPE experience_level_enum AS ENUM (
  'ENTRY',
  'MID',
  'SENIOR',
  'LEAD',
  'STAFF',
  'PRINCIPAL'
);
```

---

## 4. New Crawlers Implementation

### 4.1 RemoteOK Crawler

**File**: `lib/crawlers/remoteok.ts`

```typescript
// Features:
// - Fetch from https://remoteok.com/api
// - Parse job data with rich metadata
// - Extract skills, salary, location
// - Map to our schema with categories
```

### 4.2 WeWorkRemotely Crawler

**File**: `lib/crawlers/weworkremotely.ts`

```typescript
// Features:
// - Parse multiple RSS feeds by category
// - Programming: https://weworkremotely.com/categories/remote-programming-jobs.rss
// - Design: https://weworkremotely.com/categories/remote-design-jobs.rss
// - Marketing: https://weworkremotely.com/categories/remote-marketing-jobs.rss
// - Extract and normalize data
```

---

## 5. UI/UX Improvements

### 5.1 Enhanced Filters

Add these filter options:

- **Category dropdown** (multi-level: Engineering > Frontend)
- **Skills/Tech Stack** (multi-select with popular skills)
- **Experience Level** (entry, mid, senior, etc.)
- **Salary Range** (min-max slider)
- **Company Size** (startup, small, medium, large, enterprise)
- **Benefits** (health insurance, equity, etc.)

### 5.2 Job Card Improvements

Display:

- Category badge
- Primary skills (top 3-5)
- Experience level
- Salary range (if available)
- Company logo

### 5.3 Search Enhancement

- Full-text search on title, description, company
- Search by skills
- Advanced search filters

---

## 6. Implementation Phases

### Phase 1: Database Schema Update (Week 1)

- [ ] Create migration for new tables
- [ ] Add new columns to jobs table
- [ ] Create seed data for categories
- [ ] Update TypeScript types

### Phase 2: RemoteOK Crawler (Week 1)

- [ ] Implement RemoteOK API client
- [ ] Add category mapping logic
- [ ] Add skill extraction
- [ ] Test and deploy

### Phase 3: WeWorkRemotely Crawler (Week 2)

- [ ] Implement RSS parser
- [ ] Add category mapping
- [ ] Test and deploy

### Phase 4: UI Updates (Week 2)

- [ ] Update job filters component
- [ ] Add category filter
- [ ] Add skills filter
- [ ] Update job card design
- [ ] Add experience level filter

### Phase 5: Additional Crawlers (Week 3+)

- [ ] Himalayas scraper
- [ ] Remote3 scraper
- [ ] Remotive integration

---

## 7. Data Quality Improvements

### 7.1 Duplicate Detection

Improve deduplication logic:

- Compare by company name + job title (fuzzy match)
- Check sourceUrl across all sources
- Merge duplicate jobs from different sources

### 7.2 Content Enhancement

- Extract salary information more reliably
- Parse benefits from description
- Detect experience level from description
- Extract timezone requirements

### 7.3 Data Validation

- Ensure all jobs have valid categories
- Validate salary ranges
- Check for required fields
- Flag low-quality jobs

---

## 8. Performance Optimizations

- Add database indexes for category_id, experience_level
- Implement caching for popular filters
- Optimize job search query
- Add pagination for large result sets

---

## 9. Success Metrics

Track these metrics:

- Number of active job listings by source
- Category distribution
- User engagement with filters
- Search query patterns
- Bookmark/save rates

---

## Next Steps

1. ✅ Create this improvement plan
2. ⬜ Review and approve plan
3. ⬜ Create database migration
4. ⬜ Implement RemoteOK crawler
5. ⬜ Update UI components
6. ⬜ Test and deploy Phase 1

---

**Last Updated**: 2025-10-22
