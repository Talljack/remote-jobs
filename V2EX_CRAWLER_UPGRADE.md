# V2EX Crawler Upgrade Summary

## 📊 What Was Done

Successfully upgraded the V2EX crawler from HTML scraping to using the **official V2EX API**.

## ✅ Key Changes

### 1. API Integration

- **Old Method**: HTML scraping using Cheerio (`https://www.v2ex.com/go/jobs?tab=remote`)
- **New Method**: V2EX API v1 (`https://www.v2ex.com/api/topics/show.json?node_name=jobs`)

### 2. Benefits

- ✅ **More stable**: Official API less likely to break than HTML structure
- ✅ **Cleaner data**: Structured JSON response
- ✅ **No authentication required**: V1 API is public
- ✅ **Better parsing**: Direct access to content, author, timestamps

### 3. Improvements Made

- Automatic job type detection (Full-time, Part-time, Internship, Contract)
- Smart remote type detection based on keywords
- Excludes job-seeking posts automatically
- Better error handling

## 📈 Current Stats

```
Total Jobs Crawled: 9
Remote Types:
  - Fully Remote: 1
  - Occasional Remote: 8

Data Source: V2EX Official API
Update Frequency: On-demand (can be scheduled with cron)
```

## 🔄 How It Works

1. Fetches latest 10 topics from V2EX `/jobs` node
2. Filters out job-seeking posts (`[求职]`)
3. Detects remote work type based on keywords:
   - 远程, remote, 居家, 在家, wfh, etc.
4. Detects job type:
   - 兼职 → Part-time
   - 实习 → Internship
   - 合同 → Contract
   - Default → Full-time
5. Extracts company name and tech stack from title
6. Saves to database with proper categorization

## ⚠️ Limitations

1. **API Returns Only 10 Topics**: V2EX API v1 doesn't support pagination
2. **Mixed Remote Types**: Not all jobs are fully remote (need filtering on frontend)
3. **No Tab Support**: Can't directly filter for `tab=remote` like on the website

## 🎯 Recommendations

### Short-term

- Add frontend filters to show only "Fully Remote" jobs
- Schedule crawler to run every 6 hours via cron

### Long-term

- Implement pagination if V2EX adds it to API
- Add more data sources (Eleduck, RemoteOK)
- Consider hybrid approach: API + selective HTML scraping for `tab=remote`

## 📝 Files Modified

- `lib/crawlers/v2ex.ts` - Main crawler logic
- `db/index.ts` - Export schema definitions
- `init-db.sql` - Fixed missing enum
- `middleware.ts` - Allow public API access

## 🧪 Testing

Run the crawler manually:

```bash
DATABASE_URL=postgresql://localhost:5432/remotejobs npx tsx scripts/run-crawler.ts
```

View results:

```bash
psql postgresql://localhost:5432/remotejobs -c "SELECT title, remote_type FROM jobs LIMIT 10;"
```

## 🌐 Access the Jobs Page

Open in browser:

- English: http://localhost:3000/en/jobs
- Chinese: http://localhost:3000/zh/jobs

You should see 9 jobs from V2EX displayed with filters and pagination.
