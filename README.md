# RemoteJobs - 远程工作聚合平台

[![CI](https://github.com/yourusername/remote-jobs/workflows/CI/badge.svg)](https://github.com/yourusername/remote-jobs/actions)
[![Deploy](https://github.com/yourusername/remote-jobs/workflows/Deploy%20to%20Production/badge.svg)](https://github.com/yourusername/remote-jobs/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一个现代化的远程工作聚合平台，汇集全球主流远程工作平台的职位信息，为求职者提供一站式远程工作搜索服务。

![RemoteJobs](https://via.placeholder.com/1200x600/0066CC/FFFFFF?text=RemoteJobs)

## ✨ 特性

- 🌐 **多平台聚合** - 自动聚合 V2EX、电鸭、RemoteOK 等平台职位
- ⚡ **实时更新** - 每 6 小时自动更新最新职位
- 🔍 **智能搜索** - 全文搜索和多维度筛选
- 📝 **免费发布** - 用户可免费发布远程职位
- 🎨 **现代化 UI** - 使用 shadcn/ui 和 Tailwind CSS
- 🌍 **国际化** - 支持中英文切换
- 🌓 **暗黑模式** - 完美的暗黑模式支持
- 📱 **响应式设计** - 完美适配移动端

## 🚀 技术栈

### 前端

- **框架**: [Next.js 15.5.7](https://nextjs.org/) (App Router)
- **语言**: TypeScript 5.7+
- **样式**: [Tailwind CSS 4.x](https://tailwindcss.com/)
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com/)
- **状态管理**: React Hooks
- **表单**: React Hook Form + Zod
- **国际化**: next-intl

### 后端

- **运行时**: Next.js API Routes
- **认证**: [Clerk](https://clerk.com/)
- **数据库**: PostgreSQL (Vercel Postgres / Supabase)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **爬虫**: Axios + Cheerio
- **邮件**: Resend

### 部署

- **托管**: Vercel
- **数据库**: Supabase / Vercel Postgres
- **定时任务**: Vercel Cron Jobs

## 📦 安装

### 前置要求

- Node.js 18+
- pnpm (推荐) / npm / yarn
- PostgreSQL 数据库

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/remote-jobs.git
cd remote-jobs
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入以下配置：

```env
# Database
DATABASE_URL="postgres://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Optional)
RESEND_API_KEY=re_...

# Cron Secret
CRON_SECRET=your_random_secret_here
```

### 4. 初始化数据库

```bash
# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:push
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🗂️ 项目结构

```
remote-jobs/
├── app/                    # Next.js App Router
│   ├── [locale]/          # 国际化路由
│   │   ├── page.tsx       # 首页
│   │   ├── jobs/          # 职位相关页面
│   │   ├── console/       # 用户控制台
│   │   └── stats/         # 统计页面
│   ├── api/               # API 路由
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── header.tsx        # 导航栏
│   ├── hero.tsx          # 首页 Hero
│   └── ...
├── db/                    # 数据库
│   ├── schema.ts         # Drizzle ORM Schema
│   └── index.ts          # 数据库连接
├── lib/                   # 工具函数
│   ├── utils.ts          # 通用工具
│   └── ...
├── i18n/                  # 国际化
│   ├── messages/         # 翻译文件
│   ├── routing.ts        # 路由配置
│   └── request.ts        # 请求配置
├── middleware.ts          # Next.js 中间件
├── drizzle.config.ts     # Drizzle 配置
├── next.config.mjs       # Next.js 配置
├── tailwind.config.ts    # Tailwind CSS 配置
└── PRD.md                # 产品需求文档
```

## 📚 主要功能

### 职位聚合

- 自动爬取 V2EX、电鸭等平台职位
- 定时任务每 6 小时更新
- 数据清洗和去重

### 搜索与筛选

- 全文搜索（职位标题、描述、公司）
- 多维度筛选：
  - 职位类型（全职、兼职、合同工、实习）
  - 薪资区间
  - 技能标签
  - 远程类型
  - 发布时间
  - 来源平台

### 用户功能

- 收藏职位
- 发布职位
- 管理发布的职位
- 个人设置

### 数据统计

- 职位发布趋势
- 热门技能分析
- 薪资分布
- 来源分布

## 🔧 开发命令

```bash
# 开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码质量检查
pnpm lint              # ESLint 检查
pnpm lint:fix          # 自动修复 ESLint 问题
pnpm format            # Prettier 格式化
pnpm format:check      # 检查代码格式
pnpm type-check        # TypeScript 类型检查

# 数据库相关
pnpm db:generate       # 生成迁移
pnpm db:migrate        # 执行迁移
pnpm db:push           # 推送 schema 到数据库
pnpm db:studio         # 打开 Drizzle Studio

# Git Hooks
pnpm prepare           # 初始化 Husky
```

## 🎯 代码质量保证

### Git Hooks

项目集成了 Husky 和 lint-staged，提交代码时自动：

- ✅ ESLint 代码检查和修复
- ✅ Prettier 代码格式化
- ✅ Commit message 规范验证

```bash
# 初始化 Git Hooks
./scripts/setup-git-hooks.sh
```

### Commit Message 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
build: 构建系统
ci: CI 配置
chore: 其他修改
```

**示例：**

```bash
git commit -m "feat: add job search filter"
git commit -m "fix(api): resolve pagination issue"
```

### CI/CD

项目使用 GitHub Actions 进行持续集成和部署：

- **CI Workflow**: 自动运行 Lint、Type Check、Build 和 Test
- **Deploy Workflow**: 自动部署到 Vercel（仅 main 分支）
- **PR Check**: 自动添加标签和分配审查者

详细配置请查看 [GIT_HOOKS_GUIDE.md](./GIT_HOOKS_GUIDE.md)

## 🚀 部署到 Vercel

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/remote-jobs.git
git push -u origin main
```

### 2. 在 Vercel 上导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置环境变量（从 `.env.example` 复制）
5. 点击 "Deploy"

### 3. 配置数据库

使用 Vercel Postgres 或 Supabase：

**Vercel Postgres:**

```bash
vercel postgres create
```

**Supabase:**

1. 创建 Supabase 项目
2. 获取数据库 URL
3. 在 Vercel 环境变量中配置 `DATABASE_URL`

### 4. 执行数据库迁移

```bash
pnpm db:push
```

### 5. 配置 Cron Jobs

在 `vercel.json` 中配置定时任务：

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

## 📖 文档

- [PRD.md](./PRD.md) - 产品需求文档
- [ESLINT_GUIDE.md](./ESLINT_GUIDE.md) - ESLint & Prettier 使用指南
- [GIT_HOOKS_GUIDE.md](./GIT_HOOKS_GUIDE.md) - Git Hooks & CI/CD 指南
- [QUICKSTART.md](./QUICKSTART.md) - 快速开始指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建 Feature 分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建 Pull Request

**注意：**

- 请确保代码通过 ESLint 和 TypeScript 检查
- Commit message 必须遵循 Conventional Commits 规范
- PR 会自动运行 CI 检查

## 📄 许可证

[MIT License](LICENSE)

## 📧 联系方式

- 邮箱: your@email.com
- Twitter: [@yourusername](https://twitter.com/yourusername)
- 项目主页: [https://remote-jobs.dev](https://remote-jobs.dev)

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Clerk](https://clerk.com/)
- [Vercel](https://vercel.com/)

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
