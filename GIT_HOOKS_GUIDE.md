# Git Hooks & CI/CD 指南

## 📋 目录

- [Pre-commit Hook](#pre-commit-hook)
- [Commit Message 规范](#commit-message-规范)
- [GitHub Actions CI](#github-actions-ci)
- [快速开始](#快速开始)
- [常见问题](#常见问题)

---

## 🎯 Pre-commit Hook

### 功能说明

每次执行 `git commit` 前，自动运行以下检查：

1. ✅ **ESLint** - 代码质量检查
2. ✅ **Prettier** - 代码格式化
3. ✅ **TypeScript** - 类型检查（通过 ESLint）

### 配置文件

- **`.husky/pre-commit`** - Pre-commit 脚本
- **`package.json`** 中的 `lint-staged` 配置

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### 工作流程

```bash
git add .
git commit -m "feat: add new feature"

# 自动触发：
# 🔍 Running pre-commit checks...
# ✓ ESLint checking...
# ✓ Prettier formatting...
# ✅ Pre-commit checks passed!
```

---

## 📝 Commit Message 规范

### Conventional Commits

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 支持的 Type

| Type       | 说明         | 示例                                    |
| ---------- | ------------ | --------------------------------------- |
| `feat`     | 新功能       | `feat: add job search filter`           |
| `fix`      | Bug 修复     | `fix: resolve pagination issue`         |
| `docs`     | 文档更新     | `docs: update README`                   |
| `style`    | 代码格式调整 | `style: format code with prettier`      |
| `refactor` | 重构         | `refactor: simplify job card component` |
| `perf`     | 性能优化     | `perf: optimize database queries`       |
| `test`     | 测试相关     | `test: add unit tests for api`          |
| `build`    | 构建系统     | `build: update dependencies`            |
| `ci`       | CI 配置      | `ci: add github actions workflow`       |
| `chore`    | 其他修改     | `chore: update .gitignore`              |
| `revert`   | 回退         | `revert: revert previous commit`        |

### ✅ 正确示例

```bash
# 基本格式
git commit -m "feat: add user authentication"

# 带 scope
git commit -m "feat(auth): add Clerk integration"

# 带详细描述
git commit -m "fix(api): resolve job listing pagination

- Update offset calculation
- Add proper error handling
- Fix edge cases for empty results"

# Breaking change
git commit -m "feat!: migrate to Drizzle ORM

BREAKING CHANGE: Replaced Prisma with Drizzle ORM"
```

### ❌ 错误示例

```bash
# ❌ 没有 type
git commit -m "add new feature"

# ❌ type 大写
git commit -m "Feat: add feature"

# ❌ 标题末尾有句号
git commit -m "feat: add feature."

# ❌ 标题超过 100 字符
git commit -m "feat: this is a very long commit message that exceeds the maximum allowed length..."

# ❌ subject 为空
git commit -m "feat:"
```

### 提交规范验证

```bash
# 每次提交时自动验证：
git commit -m "add feature"  # ❌ 会被拒绝

# 📝 Validating commit message...
# ⧗ input: add feature
# ✖ type must be one of [feat, fix, docs, ...] [type-enum]
```

---

## 🚀 GitHub Actions CI

### CI Workflow (`.github/workflows/ci.yml`)

**触发条件：**

- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**执行任务：**

#### 1. Lint & Type Check

```yaml
✓ ESLint 检查
✓ TypeScript 类型检查
✓ Prettier 格式检查
```

#### 2. Build

```yaml
✓ 构建 Next.js 应用
✓ 上传构建产物（保留 7 天）
```

#### 3. Test

```yaml
✓ 运行测试（当前为占位）
```

#### 4. Commit Message Validation (仅 PR)

```yaml
✓ 验证 PR 中所有 commit message
```

### Deploy Workflow (`.github/workflows/deploy.yml`)

**触发条件：**

- Push 到 `main` 分支

**执行任务：**

```yaml
✓ Lint 检查
✓ Type 检查
✓ 构建应用
✓ 部署到 Vercel（需配置）
```

### PR Check Workflow (`.github/workflows/pr-check.yml`)

**触发条件：**

- Pull Request opened/updated

**执行任务：**

```yaml
✓ 显示 PR 信息
✓ 自动添加 PR 大小标签（XS/S/M/L/XL）
✓ 自动分配审查者
```

---

## 🔧 快速开始

### 1. 初始化 Git Hooks

```bash
# 安装依赖
pnpm install

# 初始化 Husky（会自动运行 prepare 脚本）
pnpm prepare

# 如果需要手动初始化
npx husky install
```

### 2. 设置 Hooks 权限

```bash
# 给 hooks 添加执行权限
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### 3. 测试 Pre-commit Hook

```bash
# 修改一个文件
echo "console.log('test')" >> app/page.tsx

# 暂存并提交
git add app/page.tsx
git commit -m "test: test pre-commit hook"

# 应该会看到：
# 🔍 Running pre-commit checks...
# ✓ ESLint checking and fixing...
# ✓ Prettier formatting...
# ✅ Pre-commit checks passed!
```

### 4. 测试 Commit Message Hook

```bash
# ❌ 错误的 commit message
git commit -m "add something"
# 会被拒绝

# ✅ 正确的 commit message
git commit -m "feat: add something"
# 会通过验证
```

### 5. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

```
Settings → Secrets and variables → Actions → New repository secret
```

**必需的 Secrets：**

```bash
DATABASE_URL                      # PostgreSQL 连接字符串
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY # Clerk 公钥
CLERK_SECRET_KEY                  # Clerk 密钥
NEXT_PUBLIC_APP_URL               # 应用 URL
```

---

## 💡 使用技巧

### 跳过 Hooks（不推荐）

```bash
# 跳过 pre-commit hook
git commit --no-verify -m "feat: emergency fix"

# 或使用简写
git commit -n -m "feat: emergency fix"
```

> ⚠️ **警告：** 只在紧急情况下使用，会跳过所有代码检查！

### 手动运行检查

```bash
# 运行 lint-staged（检查暂存的文件）
npx lint-staged

# 验证 commit message
echo "feat: test message" | npx commitlint

# 验证最近的 commit
npx commitlint --from HEAD~1 --to HEAD --verbose
```

### 批量修复代码

```bash
# 修复所有文件
pnpm lint:fix
pnpm format

# 只修复特定目录
pnpm next lint app/
pnpm prettier --write "app/**/*.{ts,tsx}"
```

---

## 🐛 常见问题

### 1. Husky hooks 不工作

**问题：** 提交时没有触发 hooks

**解决：**

```bash
# 1. 检查 .husky 目录
ls -la .husky/

# 2. 重新安装 Husky
rm -rf .husky
pnpm prepare

# 3. 确保 hooks 有执行权限
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# 4. 检查 Git hooks 路径
git config core.hooksPath
# 应该返回: .husky
```

### 2. Pre-commit 检查失败

**问题：** Pre-commit hook 报错

**解决：**

```bash
# 1. 手动运行检查，查看具体错误
npx lint-staged

# 2. 修复 ESLint 错误
pnpm lint:fix

# 3. 格式化代码
pnpm format

# 4. 如果是特定文件问题，可以暂时排除
# 在 .eslintignore 中添加：
# path/to/problematic/file.ts
```

### 3. Commit message 验证失败

**问题：** Commitlint 报错

**解决：**

```bash
# 查看错误详情
echo "your commit message" | npx commitlint

# 常见错误：
# ❌ type-enum: type 必须是规定的类型之一
# ✅ 使用正确的 type: feat, fix, docs 等

# ❌ subject-empty: subject 不能为空
# ✅ 确保有描述内容

# ❌ header-max-length: 标题不能超过 100 字符
# ✅ 缩短标题或使用 body
```

### 4. CI 构建失败

**问题：** GitHub Actions 报错

**解决：**

```bash
# 1. 本地测试构建
pnpm build

# 2. 检查环境变量
# 确保 .github/workflows/ci.yml 中的环境变量正确

# 3. 查看 Actions 日志
# GitHub → Actions → 点击失败的 workflow → 查看详细日志

# 4. 检查 Node.js 版本
node --version  # 应该是 20.x
```

### 5. Lint-staged 很慢

**问题：** Pre-commit 检查耗时过长

**优化：**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings=0", // 添加 max-warnings
      "prettier --write"
    ],
    // 或者只对暂存的文件运行类型检查
    "*.{ts,tsx}": "bash -c 'tsc --noEmit'"
  }
}
```

### 6. 在 Windows 上使用 Husky

**问题：** Windows 下 shell 脚本执行问题

**解决：**

```bash
# 1. 使用 Git Bash 或 WSL

# 2. 或者修改 husky 脚本为 Node.js 脚本
# 将 .husky/pre-commit 改为 .husky/pre-commit.js

# 3. 安装 cross-env（已安装）
pnpm add -D cross-env
```

---

## 📊 CI 状态徽章

在 `README.md` 中添加 CI 状态徽章：

```markdown
![CI](https://github.com/your-username/remote-jobs/workflows/CI/badge.svg)
![Deploy](https://github.com/your-username/remote-jobs/workflows/Deploy%20to%20Production/badge.svg)
```

---

## 🔗 相关资源

- [Husky 文档](https://typicode.github.io/husky/)
- [lint-staged 文档](https://github.com/okonet/lint-staged)
- [Commitlint 文档](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## 📝 Commit Message 模板

在项目根目录创建 `.gitmessage`：

```bash
# type(scope): subject

# body

# footer

# Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
# Scope: auth, api, ui, db, crawler, etc.
# Subject: imperative mood, no capitalization, no period
#
# Body: explain what and why vs. how
# Footer: reference issues, breaking changes
```

使用模板：

```bash
git config commit.template .gitmessage
```

---

## 🎓 最佳实践

### 1. Commit 频率

```bash
# ✅ 好的实践：小而频繁的提交
feat: add job filter component
feat: add job filter logic
feat: integrate filter with job list
test: add tests for job filter

# ❌ 不好的实践：大而全的提交
feat: implement entire job filtering system with tests and docs
```

### 2. Commit 内容

```bash
# ✅ 每个 commit 只做一件事
feat: add search input field
style: format search input with Tailwind

# ❌ 一个 commit 做多件事
feat: add search input and fix unrelated bug and update docs
```

### 3. PR 管理

```bash
# ✅ 使用 feature branch
git checkout -b feat/job-search
# ... 多次 commit
git push origin feat/job-search
# 创建 PR

# ❌ 直接在 main 分支开发
git checkout main
git commit -m "feat: add feature"  # 不推荐
```

---

## 🚀 下一步

1. ✅ 配置完成后，尝试提交代码
2. ✅ 查看 GitHub Actions 执行结果
3. ✅ 创建第一个 Pull Request
4. ✅ 团队成员安装并配置 Git Hooks

**Happy Coding! 🎉**
