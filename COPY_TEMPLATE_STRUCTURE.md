# 📋 完整模板结构复制指南

## 🎯 目标

**从模板完整复制项目结构**，而不仅仅是UI组件！

模板路径：`/Users/yugangcao/apps/template/shipany_template`  
目标路径：`/Users/yugangcao/apps/my-apps/remote-jobs`

---

## 📦 完整目录结构对比

### 模板项目结构

```
shipany_template/
├── app/                    ✅ 已有（但需要补充）
├── components/             ⚠️  部分复制
│   ├── blocks/            ❌ 需要复制
│   ├── console/           ❌ 需要复制
│   ├── dashboard/         ❌ 需要复制
│   └── ui/                ⚠️  部分复制
├── services/              ❌ 需要复制 ← 重要！
├── hooks/                 ❌ 需要复制 ← 重要！
├── contexts/              ❌ 需要复制 ← 重要！
├── types/                 ❌ 需要复制 ← 重要！
├── lib/                   ⚠️  部分复制
├── models/                ⚠️  参考（我们用 Drizzle）
└── ...
```

---

## 🚀 一键复制脚本

### 创建复制脚本

创建文件：`scripts/copy-from-template.sh`

```bash
#!/bin/bash

TEMPLATE="/Users/yugangcao/apps/template/shipany_template"
TARGET="/Users/yugangcao/apps/my-apps/remote-jobs"

echo "🚀 开始从模板复制项目结构..."

# 1. Services (服务层)
echo "📦 复制 services..."
cp -r "$TEMPLATE/services" "$TARGET/"

# 2. Hooks (React Hooks)
echo "🎣 复制 hooks..."
cp -r "$TEMPLATE/hooks" "$TARGET/"

# 3. Contexts (React Context)
echo "🔄 复制 contexts..."
cp -r "$TEMPLATE/contexts" "$TARGET/"

# 4. Types (TypeScript 类型)
echo "📝 复制 types..."
cp -r "$TEMPLATE/types" "$TARGET/"

# 5. Lib 工具函数
echo "🛠️  复制 lib 工具..."
cp "$TEMPLATE/lib/tools.ts" "$TARGET/lib/"
cp "$TEMPLATE/lib/time.ts" "$TARGET/lib/"
cp "$TEMPLATE/lib/cache.ts" "$TARGET/lib/"
cp "$TEMPLATE/lib/hash.ts" "$TARGET/lib/"
cp "$TEMPLATE/lib/browser.ts" "$TARGET/lib/"
cp "$TEMPLATE/lib/resp.ts" "$TARGET/lib/"
cp "$TEMPLATE/lib/storage.ts" "$TARGET/lib/"

# 6. Components - Blocks
echo "🧩 复制 components/blocks..."
mkdir -p "$TARGET/components/blocks"
cp -r "$TEMPLATE/components/blocks/editor" "$TARGET/components/blocks/"
cp -r "$TEMPLATE/components/blocks/mdeditor" "$TARGET/components/blocks/"
cp -r "$TEMPLATE/components/blocks/empty" "$TARGET/components/blocks/"
cp -r "$TEMPLATE/components/blocks/table" "$TARGET/components/blocks/"
cp -r "$TEMPLATE/components/blocks/form" "$TARGET/components/blocks/"

# 7. Components - Console
echo "💻 复制 components/console..."
cp -r "$TEMPLATE/components/console" "$TARGET/components/"

# 8. Components - Dashboard
echo "📊 复制 components/dashboard..."
cp -r "$TEMPLATE/components/dashboard" "$TARGET/components/"

# 9. Components - UI (缺失的)
echo "🎨 复制缺失的 UI 组件..."
UI_COMPONENTS=(
  "avatar"
  "dropdown-menu"
  "tabs"
  "switch"
  "radio-group"
  "tooltip"
  "separator"
  "accordion"
  "collapsible"
  "sheet"
  "alert"
  "breadcrumb"
  "carousel"
  "navigation-menu"
)

for comp in "${UI_COMPONENTS[@]}"; do
  if [ -f "$TEMPLATE/components/ui/${comp}.tsx" ]; then
    cp "$TEMPLATE/components/ui/${comp}.tsx" "$TARGET/components/ui/"
  fi
done

# 10. Theme 配置
echo "🎨 复制主题配置..."
cp "$TEMPLATE/app/theme.css" "$TARGET/app/"
cp "$TEMPLATE/app/md.css" "$TARGET/app/"

# 11. Providers
echo "🔌 复制 providers..."
mkdir -p "$TARGET/providers"
cp -r "$TEMPLATE/providers"/* "$TARGET/providers/"

echo "✅ 复制完成！"
echo ""
echo "📋 下一步："
echo "1. pnpm install  # 安装新的依赖"
echo "2. 检查类型错误"
echo "3. 适配 Clerk 认证（替换 next-auth）"
```

### 使用脚本

```bash
# 给脚本执行权限
chmod +x scripts/copy-from-template.sh

# 运行脚本
./scripts/copy-from-template.sh
```

---

## 📝 手动复制详细步骤

如果不想用脚本，手动复制：

### 1. Services 层（重要！）

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs
mkdir -p services

# 复制整个 services 目录
cp -r /Users/yugangcao/apps/template/shipany_template/services/* ./services/
```

**Services 包含：**

- `user.ts` - 用户服务
- `page.ts` - 页面服务
- `constant.ts` - 常量定义
- `credit.ts`, `order.ts`, `affiliate.ts` 等

**用途：**

- 统一的业务逻辑层
- API 调用封装
- 数据处理

### 2. Hooks（重要！）

```bash
# 复制 hooks
cp -r /Users/yugangcao/apps/template/shipany_template/hooks/* ./hooks/
```

**Hooks 包含：**

- `use-mobile.tsx` - 移动端检测
- `useMediaQuery.tsx` - 媒体查询
- `useOneTapLogin.tsx` - One Tap 登录

**用途：**

- 可复用的 React 逻辑
- 响应式设计
- 用户交互

### 3. Contexts（重要！）

```bash
# 复制 contexts
cp -r /Users/yugangcao/apps/template/shipany_template/contexts/* ./contexts/
```

**Contexts 包含：**

- `app.tsx` - 全局应用状态

**用途：**

- 全局状态管理
- 用户信息
- 主题状态

### 4. Types（重要！）

```bash
# 复制 types
cp -r /Users/yugangcao/apps/template/shipany_template/types/* ./types/
```

**Types 包含：**

- `user.d.ts` - 用户类型
- `context.d.ts` - Context 类型
- `blocks/` - 区块组件类型
- `global.d.ts` - 全局类型

**用途：**

- TypeScript 类型安全
- 组件 Props 定义
- API 响应类型

### 5. Lib 工具函数

```bash
# 复制工具函数
cd /Users/yugangcao/apps/template/shipany_template/lib
cp tools.ts time.ts cache.ts hash.ts browser.ts resp.ts storage.ts \
   /Users/yugangcao/apps/my-apps/remote-jobs/lib/
```

**Lib 包含：**

- `tools.ts` - 通用工具
- `time.ts` - 时间处理
- `cache.ts` - 缓存管理
- `resp.ts` - 响应格式化

### 6. Components/Blocks

```bash
# 复制 blocks 组件
mkdir -p /Users/yugangcao/apps/my-apps/remote-jobs/components/blocks
cd /Users/yugangcao/apps/template/shipany_template/components/blocks

# 编辑器
cp -r editor /Users/yugangcao/apps/my-apps/remote-jobs/components/blocks/
cp -r mdeditor /Users/yugangcao/apps/my-apps/remote-jobs/components/blocks/

# 其他重要 blocks
cp -r empty /Users/yugangcao/apps/my-apps/remote-jobs/components/blocks/
cp -r table /Users/yugangcao/apps/my-apps/remote-jobs/components/blocks/
cp -r form /Users/yugangcao/apps/my-apps/remote-jobs/components/blocks/
```

### 7. Components/Console & Dashboard

```bash
# 复制控制台和仪表板布局
cp -r /Users/yugangcao/apps/template/shipany_template/components/console \
      /Users/yugangcao/apps/my-apps/remote-jobs/components/

cp -r /Users/yugangcao/apps/template/shipany_template/components/dashboard \
      /Users/yugangcao/apps/my-apps/remote-jobs/components/
```

### 8. Providers

```bash
# 复制 providers
mkdir -p /Users/yugangcao/apps/my-apps/remote-jobs/providers
cp -r /Users/yugangcao/apps/template/shipany_template/providers/* \
      /Users/yugangcao/apps/my-apps/remote-jobs/providers/
```

---

## 🔧 适配修改指南

复制后需要适配的地方：

### 1. Services - 用户服务

**模板使用 next-auth，我们用 Clerk**

创建新的 `services/user.ts`:

```typescript
// services/user.ts
import { currentUser } from "@clerk/nextjs/server";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export async function getUserInfo() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // 查找或创建用户
  let user = await db.select().from(users).where(eq(users.id, clerkUser.id)).limit(1);

  if (user.length === 0) {
    // 创建新用户
    await db.insert(users).values({
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      name: clerkUser.fullName,
      avatar: clerkUser.imageUrl,
    });

    user = await db.select().from(users).where(eq(users.id, clerkUser.id)).limit(1);
  }

  return user[0];
}

export async function getUserId() {
  const clerkUser = await currentUser();
  return clerkUser?.id || null;
}
```

### 2. Models vs Drizzle

**模板使用 models/，我们用 db/ + Drizzle**

不需要复制 models，但可以参考其结构：

```typescript
// models/ (模板)  →  db/ + services/ (我们的)
//
// 模板：models/user.ts 包含数据库操作
// 我们：db/schema.ts (Schema) + services/user.ts (业务逻辑)
```

### 3. Contexts - App Context

适配 Clerk：

```typescript
// contexts/app.tsx
"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface AppContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
}

const AppContext = createContext({} as AppContextValue);

export const useAppContext = () => useContext(AppContext);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser(); // Clerk hook
  const [theme, setTheme] = useState("system");
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showFeedback,
        setShowFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
```

### 4. Types - 用户类型

适配 Clerk：

```typescript
// types/user.d.ts
export interface User {
  id: string; // Clerk user ID
  email: string;
  name: string | null;
  avatar: string | null;
  role: "USER" | "ADMIN";
  emailNotification: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📦 需要安装的新依赖

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs

# 编辑器相关
pnpm add @uiw/react-md-editor

# Tiptap 已在 package.json 中

# 其他可能需要的
pnpm add moment  # 时间处理（如果模板使用）
```

---

## 🎯 复制后的项目结构

```
remote-jobs/
├── app/                      ✅
├── components/
│   ├── blocks/              ✅ 新增
│   │   ├── editor/          ✅
│   │   ├── mdeditor/        ✅
│   │   ├── empty/           ✅
│   │   ├── table/           ✅
│   │   └── form/            ✅
│   ├── console/             ✅ 新增
│   ├── dashboard/           ✅ 新增
│   └── ui/                  ✅ 完整
├── services/                ✅ 新增 ← 重要！
│   ├── user.ts
│   ├── job.ts (自己创建)
│   ├── page.ts
│   └── constant.ts
├── hooks/                   ✅ 新增 ← 重要！
│   ├── use-mobile.tsx
│   └── useMediaQuery.tsx
├── contexts/                ✅ 新增 ← 重要！
│   └── app.tsx
├── types/                   ✅ 新增 ← 重要！
│   ├── user.d.ts
│   ├── context.d.ts
│   ├── blocks/
│   └── global.d.ts
├── lib/                     ✅ 完整
│   ├── utils.ts
│   ├── tools.ts            ✅ 新增
│   ├── time.ts             ✅ 新增
│   ├── cache.ts            ✅ 新增
│   └── ...
├── providers/               ✅ 新增
│   └── theme.tsx
├── db/                      ✅ (Drizzle)
└── ...
```

---

## 🚀 立即执行

### 方式一：使用脚本（推荐）

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs

# 创建脚本目录
mkdir -p scripts

# 创建并运行复制脚本
# (将上面的脚本内容保存到 scripts/copy-from-template.sh)

chmod +x scripts/copy-from-template.sh
./scripts/copy-from-template.sh
```

### 方式二：手动复制

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs

# 1. Services
cp -r /Users/yugangcao/apps/template/shipany_template/services ./

# 2. Hooks
cp -r /Users/yugangcao/apps/template/shipany_template/hooks ./

# 3. Contexts
cp -r /Users/yugangcao/apps/template/shipany_template/contexts ./

# 4. Types
cp -r /Users/yugangcao/apps/template/shipany_template/types ./

# 5. 更多...（参考上面的详细步骤）
```

---

## ✅ 验证清单

复制完成后检查：

- [ ] `services/` 目录存在
- [ ] `hooks/` 目录存在
- [ ] `contexts/` 目录存在
- [ ] `types/` 目录存在
- [ ] `components/blocks/editor/` 存在
- [ ] `components/console/` 存在
- [ ] `lib/tools.ts` 存在
- [ ] `pnpm install` 成功
- [ ] TypeScript 编译成功
- [ ] 没有 import 错误

---

## 📝 使用示例

### 使用 Service 层

```typescript
// app/api/user/route.ts
import { getUserInfo } from "@/services/user";

export async function GET() {
  const user = await getUserInfo();
  return Response.json({ user });
}
```

### 使用 Hooks

```typescript
// components/mobile-menu.tsx
"use client";

import { useIsMobile } from "@/hooks/use-mobile";

export function MobileMenu() {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return <div>Mobile Menu</div>;
}
```

### 使用 Context

```typescript
// app/layout.tsx
import { AppContextProvider } from "@/contexts/app";

export default function RootLayout({ children }) {
  return (
    <AppContextProvider>
      {children}
    </AppContextProvider>
  );
}

// 在组件中使用
import { useAppContext } from "@/contexts/app";

export function MyComponent() {
  const { theme, setTheme } = useAppContext();
  // ...
}
```

---

## 🎉 预期效果

复制完成后：

1. ✅ **完整的项目结构** - 与模板一致
2. ✅ **Service 层** - 统一的业务逻辑
3. ✅ **可复用的 Hooks** - 提升开发效率
4. ✅ **类型定义完整** - TypeScript 类型安全
5. ✅ **工具函数丰富** - 减少重复代码

**节省时间：** 15-20 小时

---

**现在就开始复制吧！** 🚀

```bash
cd /Users/yugangcao/apps/my-apps/remote-jobs
# 执行上面的复制命令
```
