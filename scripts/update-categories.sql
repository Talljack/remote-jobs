-- Update job categories based on title and description keywords
-- This script should be run carefully as it updates existing data

-- Frontend - React
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.frontend.react' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%react%'
    OR LOWER(title) LIKE '%next.js%'
    OR LOWER(title) LIKE '%nextjs%'
    OR LOWER(description) LIKE '%react%'
  );

-- Frontend - Vue
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.frontend.vue' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%vue%'
    OR LOWER(title) LIKE '%nuxt%'
  );

-- Frontend - Angular
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.frontend.angular' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND LOWER(title) LIKE '%angular%';

-- Backend - Python
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.backend.python' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%python%'
    OR LOWER(title) LIKE '%django%'
    OR LOWER(title) LIKE '%flask%'
  );

-- Backend - Node.js
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.backend.nodejs' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%node%'
    OR LOWER(title) LIKE '%express%'
  );

-- Backend - Java
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.backend.java' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%java%'
    OR LOWER(title) LIKE '%spring%'
    OR LOWER(title) LIKE '%kotlin%'
  );

-- Backend - Go
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.backend.go' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%golang%'
    OR LOWER(title) LIKE '% go %'
    OR LOWER(title) LIKE 'go %'
  );

-- Mobile
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.mobile' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%mobile%'
    OR LOWER(title) LIKE '%ios%'
    OR LOWER(title) LIKE '%android%'
    OR LOWER(title) LIKE '%flutter%'
    OR LOWER(title) LIKE '%react native%'
  );

-- Full Stack
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.fullstack' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%full stack%'
    OR LOWER(title) LIKE '%fullstack%'
    OR LOWER(title) LIKE '%full-stack%'
  );

-- Frontend (general)
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.frontend' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%frontend%'
    OR LOWER(title) LIKE '%front-end%'
    OR LOWER(title) LIKE '%front end%'
  );

-- Backend (general)
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.backend' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%backend%'
    OR LOWER(title) LIKE '%back-end%'
    OR LOWER(title) LIKE '%back end%'
  );

-- DevOps
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.devops' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%devops%'
    OR LOWER(title) LIKE '%sre%'
    OR LOWER(title) LIKE '%site reliability%'
    OR LOWER(title) LIKE '%infrastructure%'
  );

-- QA
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.qa' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%qa%'
    OR LOWER(title) LIKE '%quality assurance%'
    OR LOWER(title) LIKE '%test engineer%'
  );

-- Security
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'engineering.security' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%security%'
    OR LOWER(title) LIKE '%cybersecurity%'
  );

-- Data Scientist
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'data.science' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%data scientist%'
    OR LOWER(title) LIKE '%data science%'
  );

-- Data Engineer
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'data.engineer' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%data engineer%'
    OR LOWER(title) LIKE '%etl%'
  );

-- Data Analyst
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'data.analyst' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%data analyst%'
    OR LOWER(title) LIKE '%business analyst%'
    OR LOWER(title) LIKE '%analytics%'
  );

-- AI/ML Engineer
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'ml.ai.engineer' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%ai engineer%'
    OR LOWER(title) LIKE '%ml engineer%'
    OR LOWER(title) LIKE '%machine learning engineer%'
  );

-- Product Manager
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'product.manager' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%product manager%'
    OR LOWER(title) LIKE '%product owner%'
  );

-- Product Designer
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'product.designer' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND LOWER(title) LIKE '%designer%';

-- Sales
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'business.sales' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%sales%'
    OR LOWER(title) LIKE '%account executive%'
  );

-- Marketing
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'business.marketing' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%marketing%'
    OR LOWER(title) LIKE '%growth%'
  );

-- Customer Success
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'business.customer_success' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND LOWER(title) LIKE '%customer success%';

-- Customer Support
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'business.customer_support' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%customer support%'
    OR LOWER(title) LIKE '%support engineer%'
    OR LOWER(title) LIKE '%technical support%'
  );

-- Content Writer
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'other.content' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%writer%'
    OR LOWER(title) LIKE '%content%'
  );

-- HR/Recruiter
UPDATE jobs j
SET category_id = (SELECT id FROM job_categories WHERE slug = 'other.hr' LIMIT 1)
WHERE status = 'PUBLISHED'
  AND category_id IS NULL
  AND (
    LOWER(title) LIKE '%recruiter%'
    OR LOWER(title) LIKE '%talent%'
    OR LOWER(title) LIKE '%hr %'
  );

-- Show results
SELECT
  'Updated categories' as status,
  COUNT(*) as jobs_with_category
FROM jobs
WHERE status = 'PUBLISHED' AND category_id IS NOT NULL;

SELECT
  'Still missing categories' as status,
  COUNT(*) as jobs_without_category
FROM jobs
WHERE status = 'PUBLISHED' AND category_id IS NULL;
