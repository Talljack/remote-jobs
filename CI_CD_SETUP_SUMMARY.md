# Git Hooks & CI/CD 配置完成总结

## ✅ 已完成的配置

### 1. 📦 依赖包更新

#### 新增的开发依赖

```json
{
  "@commitlint/cli": "^19.6.1",
  "@commitlint/config-conventional": "^19.6.0",
  "husky": "^9.1.7",
  "lint-staged": "^15.2.11"
}
```

#### ESLint & Prettier 相关

```json
{
  "@typescript-eslint/eslint-plugin": "^8.20.0",
  "@typescript-eslint/parser": "^8.20.0",
  "eslint": "^9.18.0",
  "eslint-config-prettier": "^9.1.0",
  "eslint-plugin-import": "^2.31.0",
  "eslint-plugin-jsx-a11y": "^6.10.2",
  "eslint-plugin-react": "^7.37.3",
  "eslint-plugin-react-hooks": "^5.1.0",
  "prettier": "^3.4.2",
  "prettier-plugin-tailwindcss": "^0.6.11"
}
```

### 2. 🎣 Git Hooks (Husky)

#### 已创建的 Hooks

- **`.husky/pre-commit`**
  - 提交前自动运行 `lint-staged`
  - 检查并修复 ESLint 问题
  - 格式化代码

- **`.husky/commit-msg`**
  - 验证 commit message 格式
  - 遵循 Conventional Commits 规范

#### Lint-staged 配置

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### 3. 📝 Commit Message 规范

#### Commitlint 配置

- **`commitlint.config.js`**
  - 基于 Conventional Commits
  - 支持的类型：feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

#### Git Commit 模板

- **`.gitmessage`**
  - 提供 commit message 模板
  - 包含类型说明和示例

### 4. 🚀 GitHub Actions CI/CD

#### Workflow 文件

1. **`.github/workflows/ci.yml`** - 持续集成
   - Lint & Type Check
   - Build
   - Test
   - Commit Message Validation (PR only)
2. **`.github/workflows/deploy.yml`** - 生产部署
   - 自动部署到 Vercel
   - 仅在 main 分支触发

3. **`.github/workflows/pr-check.yml`** - PR 检查
   - 显示 PR 信息
   - 自动添加 PR 大小标签
   - 自动分配审查者

#### PR 模板

- **`.github/PULL_REQUEST_TEMPLATE.md`**
  - 标准化 PR 描述格式
  - 包含 Checklist

#### Labels 配置

- **`.github/labels.yml`**
  - 定义项目标签
  - 包含 size, type, priority, status, area 等分类

### 5. ⚙️ ESLint & Prettier 配置

#### 配置文件

- **`.eslintrc.json`**
  - Next.js + TypeScript 规则
  - React Hooks 规则
  - Import 自动排序
  - 可访问性检查

- **`.prettierrc`**
  - 代码格式化规则
  - Tailwind CSS 类名自动排序

- **`.prettierignore`**
  - 忽略文件配置

### 6. 🛠️ VS Code 配置

- **`.vscode/settings.json`**
  - 保存时自动格式化
  - 保存时自动修复 ESLint 问题

- **`.vscode/extensions.json`**
  - 推荐的 VS Code 扩展

### 7. 📚 文档

- **`ESLINT_GUIDE.md`** - ESLint & Prettier 使用指南
- **`GIT_HOOKS_GUIDE.md`** - Git Hooks & CI/CD 完整指南
- **`CI_CD_SETUP_SUMMARY.md`** - 本文档

### 8. 🔧 设置脚本

- **`scripts/setup-git-hooks.sh`**
  - 一键初始化所有 Git Hooks
  - 自动配置和测试

---

## 🚀 快速开始

### 方式 1：使用自动化脚本（推荐）

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs

# 运行设置脚本
./scripts/setup-git-hooks.sh
```

### 方式 2：手动设置

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs

# 1. 安装依赖
pnpm install

# 2. 初始化 Husky
npx husky install

# 3. 设置 hooks 权限
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# 4. 配置 Git commit 模板
git config commit.template .gitmessage
```

---

## ✅ 验证安装

### 1. 测试 Pre-commit Hook

```bash
# 创建一个测试文件
echo "const test = 'hello'" >> test.ts

# 添加并提交
git add test.ts
git commit -m "test: test pre-commit hook"

# 应该看到：
# 🔍 Running pre-commit checks...
# ✓ ESLint checking...
# ✓ Prettier formatting...
# ✅ Pre-commit checks passed!
```

### 2. 测试 Commit Message 验证

```bash
# ❌ 错误的格式（会被拒绝）
git commit --allow-empty -m "add something"

# ✅ 正确的格式（会通过）
git commit --allow-empty -m "feat: add something"
```

### 3. 查看可用的命令

```bash
# Lint 相关
pnpm lint              # 检查代码
pnpm lint:fix          # 修复代码
pnpm format            # 格式化代码
pnpm format:check      # 检查格式
pnpm type-check        # 类型检查

# Git Hooks 相关
npx lint-staged        # 手动运行 lint-staged
npx commitlint         # 手动验证 commit message
```

---

## 📋 工作流程

### 日常开发流程

```bash
# 1. 创建 feature branch
git checkout -b feat/new-feature

# 2. 开发功能
# ... 编写代码 ...

# 3. 提交代码（会自动触发 pre-commit hook）
git add .
git commit -m "feat: add new feature"

# 4. 推送到远程
git push origin feat/new-feature

# 5. 创建 Pull Request
# GitHub 会自动运行 CI 检查
```

### Commit Message 格式

```bash
# 基本格式
<type>(<scope>): <subject>

# 示例
feat: add user authentication
fix(api): resolve pagination bug
docs: update README
style(ui): format button component
refactor(db): simplify query logic
perf(crawler): optimize scraping speed
test: add unit tests for auth
build: update dependencies
ci: add GitHub Actions workflow
chore: update .gitignore
```

---

## 🔧 GitHub 配置

### 1. 配置 Secrets

在 GitHub 仓库设置中添加：

```
Settings → Secrets and variables → Actions → New repository secret
```

**必需的 Secrets：**

| Secret Name                         | 描述                  | 示例                                  |
| ----------------------------------- | --------------------- | ------------------------------------- |
| `DATABASE_URL`                      | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 公钥            | `pk_test_...`                         |
| `CLERK_SECRET_KEY`                  | Clerk 密钥            | `sk_test_...`                         |
| `NEXT_PUBLIC_APP_URL`               | 应用 URL              | `https://yourapp.vercel.app`          |

### 2. 启用 GitHub Actions

```
Settings → Actions → General
→ Allow all actions and reusable workflows
```

### 3. 配置分支保护规则（可选）

```
Settings → Branches → Add branch protection rule

分支名称：main

✓ Require status checks to pass before merging
  ✓ Require branches to be up to date before merging
  选择：
    - Lint & Type Check
    - Build
    - Test

✓ Require pull request reviews before merging
  Required approvals: 1

✓ Require conversation resolution before merging
```

---

## 📊 CI/CD 流程

### Push 到 main/develop

```
1. 触发 CI workflow
   ├─ Lint & Type Check
   ├─ Build
   └─ Test

2. 如果是 main 分支
   └─ 触发 Deploy workflow
      └─ 部署到 Vercel
```

### 创建 Pull Request

```
1. 触发 CI workflow
   ├─ Lint & Type Check
   ├─ Build
   ├─ Test
   └─ Commit Message Validation

2. 触发 PR Check workflow
   ├─ 显示 PR 信息
   ├─ 添加 size 标签
   └─ 分配审查者

3. 所有检查通过后
   └─ 可以合并到 main
```

---

## 🎯 最佳实践

### 1. Commit 规范

✅ **好的 commit：**

```bash
feat(auth): integrate Clerk authentication
fix(api): handle empty job results
docs: add API documentation
refactor(ui): extract job card component
```

❌ **不好的 commit：**

```bash
update files
fix bug
WIP
asdfasdf
```

### 2. PR 大小

- **XS** (< 10 lines): 小改动，快速审查
- **S** (10-99 lines): 小功能或修复
- **M** (100-499 lines): 中等功能
- **L** (500-999 lines): 大功能（考虑拆分）
- **XL** (1000+ lines): 超大功能（建议拆分）

### 3. Code Review

- 在提交 PR 前本地运行所有检查
- PR 描述要清晰，包含上下文
- 及时响应审查意见
- 保持 PR 聚焦单一功能

---

## 🐛 故障排除

### Husky 不工作

```bash
# 重新初始化
rm -rf .husky
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Pre-commit 很慢

```bash
# 只检查暂存的文件（默认行为）
# 如果还是慢，考虑减少检查项

# 临时跳过（不推荐）
git commit --no-verify -m "feat: emergency fix"
```

### CI 构建失败

```bash
# 本地测试
pnpm lint
pnpm type-check
pnpm build

# 检查日志
# GitHub → Actions → 查看失败的 workflow
```

---

## 📚 相关文档

- [ESLINT_GUIDE.md](./ESLINT_GUIDE.md) - ESLint & Prettier 完整指南
- [GIT_HOOKS_GUIDE.md](./GIT_HOOKS_GUIDE.md) - Git Hooks 详细说明
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky 文档](https://typicode.github.io/husky/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## 🎉 配置完成！

所有 Git Hooks 和 CI/CD 配置已经完成，现在你可以：

1. ✅ 运行 `./scripts/setup-git-hooks.sh` 初始化
2. ✅ 提交代码时自动检查和格式化
3. ✅ Commit message 自动验证
4. ✅ PR 自动运行 CI 检查
5. ✅ Main 分支自动部署

**Happy Coding! 🚀**
