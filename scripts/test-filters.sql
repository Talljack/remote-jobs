-- Test 1: Category distribution
SELECT
  c.name,
  COUNT(j.id) as job_count
FROM job_categories c
LEFT JOIN jobs j ON j.category_id = c.id AND j.status = 'PUBLISHED'
WHERE c.parent_id IS NOT NULL
GROUP BY c.id, c.name
HAVING COUNT(j.id) > 0
ORDER BY COUNT(j.id) DESC
LIMIT 10;

-- Test 2: Single category filter (React Developer)
SELECT
  'Test 2: React Developer Jobs' as test,
  COUNT(*) as count
FROM jobs j
JOIN job_categories c ON j.category_id = c.id
WHERE j.status = 'PUBLISHED'
  AND c.name = 'React Developer';

-- Test 3: Multiple category filter (React OR Sales)
SELECT
  'Test 3: React OR Sales Jobs' as test,
  COUNT(*) as count
FROM jobs j
JOIN job_categories c ON j.category_id = c.id
WHERE j.status = 'PUBLISHED'
  AND c.name IN ('React Developer', 'Sales');

-- Test 4: Multiple type filter (FULL_TIME OR PART_TIME)
SELECT
  'Test 4: Multiple Job Types' as test,
  type,
  COUNT(*) as count
FROM jobs
WHERE status = 'PUBLISHED'
  AND type IN ('FULL_TIME', 'PART_TIME')
GROUP BY type;

-- Test 5: Multiple source filter (REMOTEOK OR HIMALAYAS)
SELECT
  'Test 5: Multiple Sources' as test,
  source,
  COUNT(*) as count
FROM jobs
WHERE status = 'PUBLISHED'
  AND source IN ('REMOTEOK', 'HIMALAYAS')
GROUP BY source;

-- Test 6: Combined filters (FULL_TIME + React + REMOTEOK)
SELECT
  'Test 6: Combined Filters' as test,
  COUNT(*) as count
FROM jobs j
JOIN job_categories c ON j.category_id = c.id
WHERE j.status = 'PUBLISHED'
  AND j.type = 'FULL_TIME'
  AND c.name = 'React Developer'
  AND j.source = 'REMOTEOK';

-- Test 7: Overall statistics
SELECT 'Test 7: Overall Stats' as test;
SELECT
  'Total published jobs' as metric,
  COUNT(*) as value
FROM jobs
WHERE status = 'PUBLISHED'
UNION ALL
SELECT
  'Jobs with category' as metric,
  COUNT(*) as value
FROM jobs
WHERE status = 'PUBLISHED' AND category_id IS NOT NULL
UNION ALL
SELECT
  'Jobs without category' as metric,
  COUNT(*) as value
FROM jobs
WHERE status = 'PUBLISHED' AND category_id IS NULL;
