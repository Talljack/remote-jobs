# 🚀 RemoteJobs 部署指南

本文档提供 RemoteJobs 平台的详细部署步骤。

---

## 📋 部署前准备

### 必需服务账号

1. **Vercel Account** - 用于托管应用
2. **Supabase / Vercel Postgres** - PostgreSQL 数据库
3. **Clerk Account** - 用户认证服务

### 可选服务（后期功能）

4. **Resend** - 邮件服务
5. **Vercel Blob** - 文件存储

---

## 🎯 方案一：Vercel 部署（推荐）

### Step 1: 准备 GitHub 仓库

```bash
# 初始化 Git
cd /Users/yugangcao/apps/my-apps/remote-jobs
git init
git add .
git commit -m "Initial commit: RemoteJobs platform"

# 推送到 GitHub
git branch -M main
git remote add origin https://github.com/yourusername/remote-jobs.git
git push -u origin main
```

### Step 2: 部署到 Vercel

#### 方法 A: Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"New Project"**
3. 导入你的 GitHub 仓库
4. 配置项目设置：
   - Framework Preset: **Next.js**
   - Build Command: `pnpm build` (默认)
   - Output Directory: `.next` (默认)
5. 暂时不要部署，先配置环境变量

#### 方法 B: Vercel CLI

```bash
# 安装 Vercel CLI
pnpm i -g vercel

# 登录
vercel login

# 部署（会提示配置）
vercel

# 按照提示选择：
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No
# - Project name? remote-jobs
# - Directory? ./ (回车)
# - Override settings? No
```

### Step 3: 配置数据库

#### 选项 A: Vercel Postgres (推荐)

```bash
# 创建 Vercel Postgres 数据库
vercel postgres create

# 按照提示：
# Database name: remote-jobs-db
# Region: 选择最近的区域

# 连接数据库到项目
vercel postgres link
```

数据库 URL 会自动添加到环境变量 `POSTGRES_URL`。

#### 选项 B: Supabase

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 创建新项目
3. 在 **Settings → Database** 获取连接字符串
4. 复制 `Connection string` (Transaction模式)

### Step 4: 配置环境变量

在 Vercel Dashboard → Settings → Environment Variables 添加：

```env
# Database
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# App URL (重要: 使用你的实际域名)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Cron Secret (生成一个随机字符串)
CRON_SECRET=use-strong-random-secret-here

# Optional: Email (Resend)
RESEND_API_KEY=re_xxxxx

# Optional: File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
```

**重要提示：**

- 为生产环境使用 Clerk 的 **Live** keys（不是 Test keys）
- `CRON_SECRET` 应该是一个强随机字符串
- `NEXT_PUBLIC_APP_URL` 必须是你的实际域名

### Step 5: 执行数据库迁移

#### 新数据库（首次部署）

```bash
# 方法 A: 本地执行（推荐）
# 确保 .env.local 中的 DATABASE_URL 指向生产数据库
pnpm db:push

# 方法 B: 通过 Vercel CLI
vercel env pull .env.local
pnpm db:push
```

#### 已存在的数据库（更新部署）

如果你的数据库已经存在，需要添加对新爬虫源（Jobicy, Working Nomads, 4 Day Week, RemoteBase）的支持：

```bash
# 方法 A: 使用 psql 命令行
psql $DATABASE_URL -f db/add-new-sources.sql

# 方法 B: 通过数据库管理界面
# - Supabase: Dashboard → SQL Editor → 粘贴 db/add-new-sources.sql 的内容并执行
# - Vercel Postgres: Dashboard → Data → Query → 粘贴 db/add-new-sources.sql 的内容并执行
```

**重要**: 此迁移是幂等的（可以安全地多次执行），因为它会检查枚举值是否已存在。

### Step 6: 部署应用

```bash
# CLI 部署
vercel --prod

# 或在 Vercel Dashboard 点击 "Deploy"
```

### Step 7: 配置自定义域名（可选）

1. 在 Vercel Dashboard → Settings → Domains
2. 添加你的域名
3. 按照提示配置 DNS 记录
4. 更新 `NEXT_PUBLIC_APP_URL` 环境变量为你的域名
5. 重新部署

### Step 8: 验证部署

1. **访问网站**：https://your-app.vercel.app
2. **测试功能**：
   - ✅ 首页加载
   - ✅ 职位列表
   - ✅ 搜索功能
   - ✅ 用户登录
   - ✅ 主题切换

3. **触发首次爬虫**：

   ```bash
   curl -X GET "https://your-app.vercel.app/api/cron/crawl-jobs" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **验证 Cron Jobs**：
   - 在 Vercel Dashboard → Cron Jobs 查看
   - 确认 `/api/cron/crawl-jobs` 已配置
   - Schedule: `0 */6 * * *` (每6小时)

---

## ⚙️ Vercel Cron Jobs 配置

### 自动配置

`vercel.json` 已包含 Cron 配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/crawl-jobs",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 手动配置（如果自动失败）

1. 访问 Vercel Dashboard → Settings → Cron Jobs
2. 点击 **"Add Cron Job"**
3. 配置：
   - Path: `/api/cron/crawl-jobs`
   - Schedule: `0 */6 * * *`
   - Description: "Crawl jobs from V2EX and Eleduck"

### Cron 表达式说明

```
0 */6 * * *  = 每6小时执行一次
0 0 * * *    = 每天午夜执行
0 */12 * * * = 每12小时执行一次
```

---

## 🔒 安全检查清单

### 必需配置

- [ ] 使用 Clerk **Live** keys（不是 Test）
- [ ] `CRON_SECRET` 是强随机字符串
- [ ] `DATABASE_URL` 使用 SSL 连接
- [ ] 环境变量中没有敏感信息泄露
- [ ] `.env.local` 已添加到 `.gitignore`

### 推荐配置

- [ ] 配置自定义域名和 HTTPS
- [ ] 启用 Vercel 的 DDoS 防护
- [ ] 配置 Clerk 的 Rate Limiting
- [ ] 定期备份数据库
- [ ] 监控应用性能和错误

---

## 📊 性能优化

### 1. 启用 Edge Runtime（可选）

某些 API 路由可以使用 Edge Runtime：

```typescript
// app/api/jobs/route.ts
export const runtime = "edge";
```

### 2. 配置图片优化

在 `next.config.mjs` 中已配置：

```javascript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**",
    },
  ],
}
```

### 3. 启用 ISR（增量静态生成）

对于职位详情页，可以配置 ISR：

```typescript
// app/[locale]/jobs/[id]/page.tsx
export const revalidate = 3600; // 每小时重新生成
```

---

## 🐛 常见部署问题

### 问题 1: 构建失败

**错误**: `Module not found: Can't resolve 'react-markdown'`

**解决**:

```bash
pnpm add react-markdown
git commit -am "Add react-markdown"
git push
```

### 问题 2: 数据库连接失败

**错误**: `Connection refused`

**检查**:

- DATABASE_URL 格式正确
- 数据库服务在运行
- IP 白名单配置（Supabase需要）

### 问题 3: Clerk 认证失败

**错误**: `Clerk: publishable key not found`

**解决**:

- 确认环境变量已正确设置
- 使用 Live keys（生产环境）
- 重新部署应用

### 问题 4: Cron Jobs 不执行

**检查**:

- Vercel Pro 账号（Free tier 可能有限制）
- Cron 配置正确
- API 路由可以手动访问
- 查看 Vercel Logs

---

## 📈 监控与日志

### Vercel Analytics

免费启用：

1. Vercel Dashboard → Analytics
2. 启用 **Web Analytics**
3. 启用 **Speed Insights**

### 日志查看

```bash
# Vercel CLI 查看实时日志
vercel logs

# 查看最近的日志
vercel logs --since 1h

# 跟踪特定部署的日志
vercel logs [deployment-url]
```

### 数据库监控

**Supabase**:

- Dashboard → Database → Query Performance
- 查看慢查询
- 监控连接数

**Vercel Postgres**:

- Dashboard → Storage → Postgres
- 查看使用量和性能指标

---

## 🔄 持续部署（CI/CD）

### Git 工作流

```bash
# 开发分支
git checkout -b feature/new-feature
# ... 开发完成
git commit -am "Add new feature"
git push origin feature/new-feature

# Vercel 会自动创建预览部署
# 测试预览链接: https://remote-jobs-xxx.vercel.app

# 合并到主分支
git checkout main
git merge feature/new-feature
git push origin main

# Vercel 会自动部署到生产环境
```

### 自动测试（可选）

在 `package.json` 添加：

```json
{
  "scripts": {
    "test": "jest",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

GitHub Actions 配置 (`.github/workflows/test.yml`):

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
```

---

## 📦 数据库备份

### Supabase 自动备份

Supabase 自动每天备份（Pro plan）

### 手动备份

```bash
# 使用 pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 恢复
psql $DATABASE_URL < backup-20250120.sql
```

### 定时备份脚本

创建 `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

echo "Starting backup..."
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup-$DATE.sql"
echo "Backup completed: backup-$DATE.sql"

# 可选: 上传到云存储
# aws s3 cp "$BACKUP_DIR/backup-$DATE.sql" s3://your-bucket/
```

---

## ✅ 部署完成清单

部署完成后，确认以下项目：

- [ ] 应用可以访问
- [ ] 数据库连接正常
- [ ] 用户登录/注册正常
- [ ] 职位列表显示
- [ ] 搜索功能正常
- [ ] Cron Jobs 配置完成
- [ ] 首次爬虫成功执行
- [ ] SSL 证书配置（HTTPS）
- [ ] 自定义域名配置（如果有）
- [ ] Analytics 启用
- [ ] 错误监控配置

---

## 🎉 恭喜！

你的 RemoteJobs 平台现在已经成功部署到生产环境！

**接下来可以做什么？**

1. **宣传推广**
   - 社交媒体分享
   - Product Hunt 发布
   - 相关社区推广

2. **持续优化**
   - 监控性能指标
   - 收集用户反馈
   - 添加更多功能

3. **数据增长**
   - 添加更多爬虫源
   - 优化SEO
   - 提升职位质量

---

**需要帮助？** 查看相关文档或提交 Issue。

- [QUICKSTART.md](./QUICKSTART.md) - 快速开始指南
- [README.md](./README.md) - 项目说明
- [PRD.md](./PRD.md) - 产品需求文档
