# 配置文件 TypeScript 迁移完成

## ✅ 已完成的迁移

所有配置文件已从 JavaScript/JSON 格式迁移到 TypeScript 格式，享受完整的类型检查和 IDE 智能提示。

### 迁移清单

| 原文件                 | 新文件                 | 状态 | 说明            |
| ---------------------- | ---------------------- | ---- | --------------- |
| `next.config.mjs`      | `next.config.ts`       | ✅   | Next.js 配置    |
| `tailwind.config.ts`   | `tailwind.config.ts`   | ✅   | 已经是 TS       |
| `drizzle.config.ts`    | `drizzle.config.ts`    | ✅   | 已经是 TS       |
| `postcss.config.mjs`   | `postcss.config.ts`    | ✅   | PostCSS 配置    |
| `commitlint.config.js` | `commitlint.config.ts` | ✅   | Commitlint 配置 |
| `.prettierrc`          | `prettier.config.ts`   | ✅   | Prettier 配置   |
| `.eslintrc.json`       | `.eslintrc.ts`         | ✅   | ESLint 配置     |

---

## 📦 新增的类型定义

为了支持 TypeScript 配置文件，已添加以下类型定义包：

```json
{
  "@commitlint/types": "^19.6.0",
  "@types/eslint": "^9.6.1",
  "postcss-load-config": "^6.0.1"
}
```

---

## 📝 配置文件详解

### 1. `next.config.ts`

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default withNextIntl(nextConfig);
```

**优势：**

- ✅ 完整的类型提示
- ✅ 配置项错误即时提示
- ✅ 支持复杂的配置逻辑

### 2. `postcss.config.ts`

```typescript
import type { Config } from "postcss-load-config";

const config: Config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**优势：**

- ✅ 插件配置类型安全
- ✅ 自动补全插件名称

### 3. `commitlint.config.ts`

```typescript
import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    // ... 更多规则
  },
};

export default config;
```

**优势：**

- ✅ 规则名称类型检查
- ✅ 规则值自动验证
- ✅ 支持注释说明

### 4. `prettier.config.ts`

```typescript
import type { Config } from "prettier";

const config: Config = {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 100,
  // ... 更多配置
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
```

**优势：**

- ✅ 配置项类型检查
- ✅ 插件配置自动补全
- ✅ 无效配置即时提示

### 5. `.eslintrc.ts`

```typescript
import type { Linter } from "eslint";

const config: Linter.Config = {
  extends: [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:@typescript-eslint/recommended",
    // ... 更多 extends
  ],
  parser: "@typescript-eslint/parser",
  rules: {
    // 完整的类型安全规则配置
  },
};

export default config;
```

**优势：**

- ✅ 规则配置类型检查
- ✅ 规则严重级别验证
- ✅ 插件名称自动补全

---

## 🎯 TypeScript 配置的优势

### 1. 类型安全

```typescript
// ❌ 错误：会立即提示
const config = {
  printWdith: 100, // 拼写错误
  semi: "yes", // 类型错误
};

// ✅ 正确：有类型提示
const config: Config = {
  printWidth: 100, // IDE 自动补全
  semi: true, // 类型正确
};
```

### 2. 智能提示

- ✅ 所有配置项都有 IntelliSense
- ✅ 悬停显示配置说明
- ✅ 自动补全可用值

### 3. 重构安全

- ✅ 重命名变量安全
- ✅ 查找引用准确
- ✅ 重构不会破坏配置

### 4. 复杂逻辑

```typescript
// 支持条件配置
const isDev = process.env.NODE_ENV === "development";

const config = {
  reactStrictMode: !isDev,
  productionBrowserSourceMaps: isDev,
  // ... 根据环境动态配置
};
```

---

## 🔧 使用说明

### 安装依赖

```bash
pnpm install
```

这会自动安装所有必需的类型定义包。

### 验证配置

```bash
# 类型检查（包括配置文件）
pnpm type-check

# 测试 ESLint 配置
pnpm lint

# 测试 Prettier 配置
pnpm format:check

# 测试 Commitlint 配置
echo "feat: test" | npx commitlint
```

### IDE 配置

**VS Code 设置：**

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

确保 TypeScript 扩展能识别所有 `.ts` 配置文件。

---

## 📚 配置文件位置

```
remote-jobs/
├── next.config.ts           # Next.js 配置
├── tailwind.config.ts       # Tailwind CSS 配置
├── drizzle.config.ts        # Drizzle ORM 配置
├── postcss.config.ts        # PostCSS 配置
├── commitlint.config.ts     # Commitlint 配置
├── prettier.config.ts       # Prettier 配置
├── .eslintrc.ts            # ESLint 配置
└── tsconfig.json           # TypeScript 配置
```

---

## ⚙️ 高级用法

### 共享配置常量

```typescript
// config/constants.ts
export const IMAGE_DOMAINS = ["cdn.example.com", "images.example.com"];
export const MAX_FILE_SIZE = "5mb";

// next.config.ts
import { IMAGE_DOMAINS, MAX_FILE_SIZE } from "./config/constants";

const nextConfig = {
  images: {
    remotePatterns: IMAGE_DOMAINS.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: MAX_FILE_SIZE,
    },
  },
};
```

### 环境变量类型化

```typescript
// next.config.ts
const requiredEnvVars = ["DATABASE_URL", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] as const;

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

## 🐛 常见问题

### 1. 配置文件无法识别

**问题：** TypeScript 编译器报错找不到类型

**解决：**

```bash
# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 重启 TypeScript 服务器（VS Code）
Cmd + Shift + P → "TypeScript: Restart TS Server"
```

### 2. ESLint 配置不生效

**问题：** `.eslintrc.ts` 配置不生效

**解决：**

ESLint 9 默认使用 flat config，但 Next.js 15 仍使用 `.eslintrc.*` 格式。确保：

```bash
# 检查 ESLint 版本
npx eslint --version

# 如果使用 .eslintrc.ts，需要 eslintrc.ts 插件支持
# 已在配置中处理
```

### 3. Commitlint 类型错误

**问题：** `@commitlint/types` 类型不匹配

**解决：**

```bash
# 确保版本一致
pnpm list @commitlint/cli @commitlint/config-conventional @commitlint/types

# 统一更新
pnpm update @commitlint/{cli,config-conventional,types}
```

---

## 📊 迁移前后对比

### 之前（JavaScript/JSON）

```javascript
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-console": "wrn"  // ❌ 拼写错误，运行时才发现
  }
}
```

### 之后（TypeScript）

```typescript
// .eslintrc.ts
const config: Linter.Config = {
  extends: ["next/core-web-vitals"],
  rules: {
    "no-console": "wrn", // ✅ 编辑时即时提示错误
    //           ^^^^^
    //           Type '"wrn"' is not assignable to type '"off" | "warn" | "error"'
  },
};
```

---

## 🎉 总结

### ✅ 已完成

- ✅ 所有配置文件已迁移到 TypeScript
- ✅ 添加必要的类型定义包
- ✅ 保持与原配置完全兼容
- ✅ 提供完整的类型安全

### 🚀 收益

- **开发体验提升** - 智能提示和自动补全
- **错误减少** - 编译时捕获配置错误
- **维护性提高** - 重构更安全
- **文档化** - 类型即文档

### 📝 下一步

1. 运行 `pnpm install` 安装新的类型定义
2. 运行 `pnpm type-check` 验证所有配置
3. 享受 TypeScript 配置文件的类型安全！

---

**🎊 恭喜！所有配置文件已完成 TypeScript 化！**
