# 🚀 Quick Start Guide - RemoteJobs Platform

## 🐳 快速启动（使用 Docker）

**最快启动方式 - 推荐！**

```bash
# 1. 启动 PostgreSQL 容器
docker run --name remotejobs-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=remotejobs \
  -p 5432:5432 \
  -d postgres:16-alpine

# 2. 安装依赖
pnpm install

# 3. 初始化数据库
pnpm db:push

# 4. 启动开发服务器
pnpm dev
```

**停止和清理**
```bash
# 停止容器
docker stop remotejobs-postgres

# 删除容器（保留数据）
docker rm remotejobs-postgres

# 删除容器和数据
docker rm -v remotejobs-postgres
```

**数据库管理**
```bash
# 连接到数据库
docker exec -it remotejobs-postgres psql -U postgres -d remotejobs

# 查看表
\dt

# 退出
\q
```

---

## 📦 项目已完成功能

### ✅ 核心功能 (已完成 80%)

1. **完整的项目架构**
   - Next.js 15.5.7 + App Router
   - Drizzle ORM + PostgreSQL
   - Clerk 认证系统
   - Tailwind CSS + shadcn/ui
   - 中英文国际化

2. **职位功能**
   - ✅ 职位列表页面（分页、筛选、搜索）
   - ✅ 职位详情页面（Markdown渲染、相关推荐）
   - ✅ 多维度筛选（类型、远程类型、来源、薪资、时间）
   - ✅ 响应式设计

3. **爬虫系统**
   - ✅ V2EX 爬虫（完整实现）
   - ✅ 爬虫调度器
   - ✅ Cron Jobs API
   - ⏳ 电鸭爬虫（框架已就绪）

4. **用户体验**
   - ✅ 现代化首页
   - ✅ 主题切换（暗黑模式）
   - ✅ 语言切换
   - ✅ 骨架屏加载
   - ✅ Toast 通知

---

## 🛠️ 本地开发环境设置

### 前置要求

```bash
Node.js >= 18.0.0
pnpm (推荐) 或 npm
PostgreSQL 数据库（Supabase 或本地）
```

### Step 1: 安装依赖

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs
pnpm install
```

### Step 2: 配置环境变量

`.env.local` 已配置好本地 Docker 数据库：

```bash
# Database - Local PostgreSQL (使用 Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/remotejobs

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**如果使用其他数据库：**

**如果使用其他数据库：**

**选项 A: Docker (推荐 - 已配置)**
```bash
# 使用页面顶部的 Docker 命令启动
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/remotejobs
```

**选项 B: Supabase**
2. 创建新项目
3. 在 Settings → Database → Connection String 获取连接字符串
4. 复制 `postgres://...` 格式的URL到 `DATABASE_URL`

**选项 B: Vercel Postgres**

```bash
vercel postgres create
```

**选项 C: 本地 PostgreSQL**

```bash
# 安装 PostgreSQL
brew install postgresql  # macOS
# 创建数据库
createdb remote_jobs
# 连接字符串
DATABASE_URL="postgresql://localhost:5432/remote_jobs"
```

#### 3.2 设置 Clerk 认证

1. 访问 [Clerk Dashboard](https://dashboard.clerk.com)
2. 创建新应用
3. 在 "API Keys" 页面获取：
   - Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret Key → `CLERK_SECRET_KEY`

### Step 4: 初始化数据库

```bash
# 生成 Drizzle 迁移文件
pnpm db:generate

# 推送 schema 到数据库
pnpm db:push

# (可选) 打开 Drizzle Studio 查看数据库
pnpm db:studio
```

### Step 5: 启动开发服务器

```bash
pnpm dev
```

访问: [http://localhost:3000](http://localhost:3000)

---

## 🎯 测试已实现的功能

### 1. 浏览职位列表

访问: `http://localhost:3000/jobs`

- 测试筛选功能
- 测试搜索功能
- 测试分页加载

### 2. 手动触发爬虫（获取初始数据）

```bash
# 使用 curl 触发爬虫
curl -X GET "http://localhost:3000/api/cron/crawl-jobs" \
  -H "Authorization: Bearer your_random_secret_here"

# 或访问浏览器
http://localhost:3000/api/cron/crawl-jobs
```

### 3. 查看职位详情

点击任意职位卡片，查看完整的职位详情页面

### 4. 测试认证

- 点击 "Sign In" 注册/登录
- 测试主题切换
- 测试语言切换

---

## 📚 项目结构说明

```
remote-jobs/
├── app/                          # Next.js App Router
│   ├── [locale]/                # 国际化路由
│   │   ├── page.tsx            # 首页
│   │   ├── jobs/
│   │   │   ├── page.tsx        # 职位列表 ✅
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 职位详情 ✅
│   ├── api/
│   │   ├── jobs/
│   │   │   ├── route.ts        # 职位列表API ✅
│   │   │   └── [id]/
│   │   │       └── route.ts    # 职位详情API ✅
│   │   └── cron/
│   │       └── crawl-jobs/
│   │           └── route.ts    # 爬虫API ✅
│   ├── sign-in/                # Clerk 登录 ✅
│   └── sign-up/                # Clerk 注册 ✅
├── components/
│   ├── ui/                     # shadcn/ui 组件 ✅
│   ├── jobs/                   # 职位相关组件 ✅
│   ├── header.tsx              # 导航栏 ✅
│   ├── hero.tsx                # 首页Hero ✅
│   └── ...
├── db/
│   ├── schema.ts               # Drizzle Schema ✅
│   └── index.ts                # DB 连接 ✅
├── lib/
│   ├── crawlers/
│   │   ├── v2ex.ts            # V2EX 爬虫 ✅
│   │   └── scheduler.ts        # 调度器 ✅
│   └── utils.ts                # 工具函数 ✅
├── i18n/                       # 国际化配置 ✅
├── PRD.md                      # 产品需求文档 ✅
├── README.md                   # 项目文档 ✅
└── PROJECT_STATUS.md           # 项目状态 ✅
```

---

## 🔧 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器 (http://localhost:3000)
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 代码检查

# 数据库
pnpm db:generate      # 生成迁移文件
pnpm db:migrate       # 执行迁移（生产环境）
pnpm db:push          # 推送 schema（开发环境）
pnpm db:studio        # 打开 Drizzle Studio (数据库可视化工具)
```

---

## ⏳ 待完成功能（可选）

如果你想继续完善项目，以下功能可以实现：

### 1. 用户发布职位 (优先级: 高)

- 创建 `/jobs/create` 页面
- 表单验证（React Hook Form + Zod）
- 富文本编辑器（Tiptap）
- 图片上传（公司Logo）

### 2. 用户控制台 (优先级: 中)

- `/console/jobs` - 我的职位
- `/console/bookmarks` - 收藏列表
- `/console/profile` - 个人设置
- 实现收藏功能API

### 3. 数据统计页面 (优先级: 中)

- `/stats` 页面
- 职位趋势图表
- 技能热度分析
- 薪资分布图

### 4. 电鸭爬虫 (优先级: 中)

- 实现 `lib/crawlers/eleduck.ts`
- 添加到调度器

---

## 🚀 部署到 Vercel

### 快速部署

```bash
# 1. 安装 Vercel CLI
pnpm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 配置环境变量（在 Vercel Dashboard）
# - DATABASE_URL
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - CRON_SECRET

# 5. 执行数据库迁移
pnpm db:push
```

### Vercel Cron Jobs 配置

`vercel.json` 已配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/crawl-jobs",
      "schedule": "0 */6 * * *" // 每6小时执行一次
    }
  ]
}
```

---

## 📖 相关文档

- [PRD.md](./PRD.md) - 完整产品需求文档
- [README.md](./README.md) - 项目说明
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - 项目状态详情

---

## 🐛 常见问题

### Q: 数据库连接失败

**A:** 检查 `DATABASE_URL` 是否正确，确保数据库服务运行中

### Q: Clerk 认证报错

**A:** 确认 Clerk Keys 已正确配置，检查 middleware.ts 配置

### Q: 爬虫无数据

**A:** 手动触发爬虫 API，检查网络连接和目标网站可访问性

### Q: 构建失败

**A:** 确保所有依赖已安装：`pnpm install`

---

## 💡 开发技巧

1. **使用 Drizzle Studio 查看数据**

   ```bash
   pnpm db:studio
   # 访问 https://local.drizzle.studio
   ```

2. **查看 API 响应**
   - 职位列表: `http://localhost:3000/api/jobs`
   - 职位详情: `http://localhost:3000/api/jobs/[id]`

3. **快速测试爬虫**
   ```bash
   curl http://localhost:3000/api/cron/crawl-jobs
   ```

---

## 🎉 恭喜！

你现在已经有一个功能完善的远程工作聚合平台了！

**已实现的核心功能：**
✅ 职位聚合与展示
✅ 搜索与筛选
✅ 职位详情
✅ V2EX 自动爬虫
✅ 用户认证
✅ 国际化
✅ 暗黑模式

**立即开始：**

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看你的应用！

---

**有问题？** 查看完整文档或提交 Issue。
