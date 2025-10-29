# TODO List

## Completed (2025-10-28)

### ✅ Bookmark Functionality

- Completed all API endpoints (POST/DELETE/GET)
- BookmarkButton component with state management
- Bookmarks list page at /console/bookmarks
- Integration with job cards and detail pages

### ✅ Stats/Analytics Page

- All stats API endpoints (overview/sources/categories/trends)
- Complete /stats page with Recharts visualizations
- Overview cards, pie chart, bar chart, line chart

### ✅ SEO Optimization

- Sitemap.xml generation
- Robots.txt configuration
- JSON-LD structured data for JobPosting
- Open Graph and Twitter Card metadata

---

## Features to Implement

### Multi-Language Support for Job Data (职位数据国际化)

**Priority**: Low (非MVP功能)

**Current Status**:

- ✅ UI界面已完全支持中英文切换（静态文字、按钮、标签等）
- ❌ 职位数据（标题、公司名、地点等）仅存储单一语言，未实现多语言

**Problem**:

- 数据库中职位数据字段（title, companyName, location等）只有单一语言
- 爬虫抓取的原始数据直接存储，大多为英文
- 中文用户查看时，职位卡片显示混合语言（部分中文UI + 英文数据）

**Proposed Solution**:

**阶段 1: 数据库架构改造**

1. 在 `jobs` 表添加多语言字段：
   - `titleEn` / `titleZh`
   - `companyNameEn` / `companyNameZh`
   - `locationEn` / `locationZh`
   - `descriptionEn` / `descriptionZh`
2. 修改 `/api/jobs` 根据请求的 `locale` 返回对应语言字段
3. 修改前端组件 `job-card.tsx` 和 `job-details` 显示逻辑

**阶段 2: 数据填充方案（三选一）**

**方案 A: 使用翻译API（推荐 - 快速实现）**

- 集成 Google Translate API 或其他翻译服务
- 对现有数据批量翻译
- 新爬取的数据在保存时自动翻译
- 使用Redis缓存翻译结果避免重复调用
- 估算成本：Google Translate $20/1M字符

**方案 B: 修改爬虫获取原生多语言（质量最高）**

- 调研各源平台是否支持多语言API
- 修改爬虫逻辑获取多语言数据
- 质量最好但工作量最大

**方案 C: 静态映射表（临时方案）**

- 针对常见地点（United States → 美国）做简单映射
- 职位标题和公司名保持英文
- 工作量最小但效果有限

**Implementation Steps**:

1. [ ] 修改数据库schema，添加多语言字段
2. [ ] 运行数据库迁移 `pnpm db:generate && pnpm db:migrate`
3. [ ] 修改API层根据locale返回对应语言
4. [ ] 修改前端组件显示逻辑
5. [ ] 选择并实现数据填充方案
6. [ ] 修改爬虫在保存时填充多语言字段
7. [ ] 添加管理后台手动编辑多语言内容的功能

**Related Files**:

- `db/schema.ts` - 数据库表定义
- `app/api/jobs/route.ts` - 职位列表API
- `components/jobs/job-card.tsx` - 职位卡片组件
- `lib/crawlers/*.ts` - 各个爬虫脚本

**Estimated Effort**: 2-3天（不含数据填充和测试）

---

## Completed

### Filter Improvements (筛选器优化)

- ✅ 修复滚动问题（使用flexbox布局）
- ✅ 添加Category全部展开/折叠按钮
