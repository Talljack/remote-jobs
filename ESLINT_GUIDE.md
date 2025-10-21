# ESLint & Prettier 配置指南

## 📦 已安装的工具

### ESLint 相关

- **eslint** `^9.18.0` - 最新版本的 ESLint
- **eslint-config-next** `^15.2.3` - Next.js 官方配置
- **@typescript-eslint/parser** `^8.20.0` - TypeScript 解析器
- **@typescript-eslint/eslint-plugin** `^8.20.0` - TypeScript 规则
- **eslint-plugin-react** `^7.37.3` - React 规则
- **eslint-plugin-react-hooks** `^5.1.0` - React Hooks 规则
- **eslint-plugin-jsx-a11y** `^6.10.2` - 可访问性规则
- **eslint-plugin-import** `^2.31.0` - Import 排序和验证

### Prettier 相关

- **prettier** `^3.4.2` - 代码格式化工具
- **prettier-plugin-tailwindcss** `^0.6.11` - Tailwind CSS 自动排序
- **eslint-config-prettier** `^9.1.0` - 禁用与 Prettier 冲突的 ESLint 规则

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 运行 Lint 检查

```bash
# 检查代码问题
pnpm lint

# 自动修复可修复的问题
pnpm lint:fix

# 检查代码格式
pnpm format:check

# 格式化所有文件
pnpm format

# 类型检查
pnpm type-check
```

---

## ⚙️ 配置文件说明

### `.eslintrc.ts` (TypeScript 配置)

ESLint 主配置文件，使用 TypeScript 格式提供类型安全和智能提示，包含：

- ✅ Next.js 推荐配置
- ✅ TypeScript 严格模式
- ✅ React 19 支持
- ✅ React Hooks 规则
- ✅ 可访问性检查
- ✅ Import 自动排序
- ✅ Prettier 集成

**关键规则：**

```typescript
{
  "react/react-in-jsx-scope": "off",  // React 19 不需要导入 React
  "@typescript-eslint/no-unused-vars": "warn",  // 警告未使用的变量
  "@typescript-eslint/no-explicit-any": "warn",  // 警告使用 any 类型
  "no-console": ["warn", { "allow": ["warn", "error"] }],  // 允许 console.warn/error
  "import/order": "warn"  // 强制 import 排序
}
```

### `prettier.config.ts` (TypeScript 配置)

Prettier 格式化配置，使用 TypeScript 格式：

```typescript
import type { Config } from "prettier";

const config: Config = {
  semi: true, // 使用分号
  trailingComma: "es5", // ES5 风格的尾逗号
  singleQuote: false, // 使用双引号
  printWidth: 100, // 每行最多 100 字符
  tabWidth: 2, // 2 空格缩进
  plugins: ["prettier-plugin-tailwindcss"], // Tailwind 类名排序
};

export default config;
```

### `.vscode/settings.json`

VS Code 编辑器配置：

- ✅ 保存时自动格式化
- ✅ 保存时自动修复 ESLint 问题
- ✅ 使用项目的 TypeScript 版本

---

## 📝 使用示例

### 在命令行中使用

```bash
# 检查所有文件
pnpm lint

# 只检查特定目录
pnpm next lint app/

# 自动修复 + 格式化
pnpm lint:fix && pnpm format

# 完整检查（lint + 类型 + 格式）
pnpm lint && pnpm type-check && pnpm format:check
```

### 在 VS Code 中使用

1. **安装推荐扩展：**
   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

2. **自动修复：**
   - 保存文件时自动运行 ESLint 修复
   - 保存文件时自动格式化代码

3. **手动触发：**
   - `Cmd + Shift + P` → "Format Document" (格式化)
   - `Cmd + Shift + P` → "ESLint: Fix all auto-fixable Problems" (修复)

### 在 Git Hooks 中使用（可选）

安装 Husky + lint-staged：

```bash
pnpm add -D husky lint-staged

# 初始化 husky
npx husky init
```

在 `package.json` 中添加：

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

在 `.husky/pre-commit` 中添加：

```bash
npx lint-staged
```

---

## 🎨 Import 排序规则

ESLint 会自动按以下顺序排序 imports：

1. **React** 相关

   ```typescript
   import React from "react";
   ```

2. **Next.js** 相关

   ```typescript
   import { useRouter } from "next/navigation";
   import Image from "next/image";
   ```

3. **第三方库**

   ```typescript
   import axios from "axios";
   import { clsx } from "clsx";
   ```

4. **内部模块** (`@/...`)

   ```typescript
   import { db } from "@/db";
   import { Button } from "@/components/ui/button";
   ```

5. **相对路径**
   ```typescript
   import { JobCard } from "./job-card";
   import styles from "./styles.module.css";
   ```

**示例：**

```typescript
import React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import axios from "axios";
import { clsx } from "clsx";

import { db } from "@/db";
import { jobs } from "@/db/schema";
import { Button } from "@/components/ui/button";

import { JobCard } from "./job-card";
import type { JobListProps } from "./types";
```

---

## 🔧 自定义规则

如果需要修改规则，编辑 `.eslintrc.json`：

```json
{
  "rules": {
    // 禁用某个规则
    "@typescript-eslint/no-explicit-any": "off",

    // 修改规则级别
    "no-console": "error", // error | warn | off

    // 添加新规则
    "max-len": ["warn", { "code": 120 }]
  }
}
```

---

## 🐛 常见问题

### 1. ESLint 报错：Module not found

**原因：** TypeScript 路径别名配置问题

**解决：** 确保 `tsconfig.json` 中有正确的 `paths` 配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 2. Prettier 和 ESLint 冲突

**原因：** 某些 ESLint 规则与 Prettier 格式化冲突

**解决：** 已通过 `eslint-config-prettier` 自动禁用冲突规则

### 3. Import 排序不生效

**解决：** 运行 `pnpm lint:fix` 手动触发修复

### 4. VS Code 保存时不自动格式化

**解决：**

1. 安装 Prettier 扩展
2. 检查 `.vscode/settings.json` 是否存在
3. 重启 VS Code

---

## 📚 推荐 VS Code 扩展

创建 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 🎯 最佳实践

### 1. 提交前检查

```bash
# 完整检查
pnpm lint && pnpm type-check && pnpm format:check
```

### 2. 团队协作

- ✅ 提交 `.eslintrc.json` 和 `.prettierrc` 到 Git
- ✅ 提交 `.vscode/settings.json` 到 Git（团队统一配置）
- ✅ 不要提交 `.vscode/extensions.json`（个人选择）

### 3. CI/CD 集成

在 GitHub Actions 中添加：

```yaml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm format:check
```

---

## 📦 更新日志

### 2025-10-20

- ✅ 升级 ESLint 从 `8.57.1` 到 `9.18.0`
- ✅ 添加 TypeScript ESLint 插件 `8.20.0`
- ✅ 集成 Prettier `3.4.2`
- ✅ 添加 Tailwind CSS 自动排序
- ✅ 配置 Import 自动排序
- ✅ 添加可访问性规则
- ✅ 创建 VS Code 配置

---

## 🔗 相关链接

- [ESLint 官方文档](https://eslint.org/)
- [Prettier 官方文档](https://prettier.io/)
- [Next.js ESLint 配置](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [React Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
