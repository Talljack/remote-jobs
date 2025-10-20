#!/bin/bash

TEMPLATE="/Users/yugangcao/apps/template/shipany_template"
TARGET="/Users/yugangcao/apps/my-apps/remote-jobs"

echo "🚀 开始从模板复制项目结构..."
echo ""

# 1. Services (服务层)
echo "📦 复制 services..."
cp -r "$TEMPLATE/services" "$TARGET/"
echo "✅ Services 复制完成"

# 2. Hooks (React Hooks)
echo "🎣 复制 hooks..."
cp -r "$TEMPLATE/hooks" "$TARGET/"
echo "✅ Hooks 复制完成"

# 3. Contexts (React Context)
echo "🔄 复制 contexts..."
cp -r "$TEMPLATE/contexts" "$TARGET/"
echo "✅ Contexts 复制完成"

# 4. Types (TypeScript 类型)
echo "📝 复制 types..."
cp -r "$TEMPLATE/types" "$TARGET/"
echo "✅ Types 复制完成"

# 5. Lib 工具函数
echo "🛠️  复制 lib 工具..."
cp "$TEMPLATE/lib/tools.ts" "$TARGET/lib/" 2>/dev/null || echo "⚠️  tools.ts 不存在"
cp "$TEMPLATE/lib/time.ts" "$TARGET/lib/" 2>/dev/null || echo "⚠️  time.ts 不存在"
cp "$TEMPLATE/lib/cache.ts" "$TARGET/lib/" 2>/dev/null || echo "⚠️  cache.ts 不存在"
cp "$TEMPLATE/lib/hash.ts" "$TARGET/lib/" 2>/dev/null || echo "⚠️  hash.ts 不存在"
cp "$TEMPLATE/lib/browser.ts" "$TARGET/lib/" 2>/dev/null || echo "⚠️  browser.ts 不存在"
cp "$TEMPLATE/lib/resp.ts" "$TARGET/lib/" 2>/dev/null || echo "⚠️  resp.ts 不存在"
cp "$TEMPLATE/lib/storage.ts" "$TARGET/lib/" 2>/dev/null || echo "⚠️  storage.ts 不存在"
echo "✅ Lib 工具复制完成"

# 6. Components - Blocks
echo "🧩 复制 components/blocks..."
mkdir -p "$TARGET/components/blocks"
cp -r "$TEMPLATE/components/blocks/editor" "$TARGET/components/blocks/" 2>/dev/null || echo "⚠️  editor 不存在"
cp -r "$TEMPLATE/components/blocks/mdeditor" "$TARGET/components/blocks/" 2>/dev/null || echo "⚠️  mdeditor 不存在"
cp -r "$TEMPLATE/components/blocks/empty" "$TARGET/components/blocks/" 2>/dev/null || echo "⚠️  empty 不存在"
cp -r "$TEMPLATE/components/blocks/table" "$TARGET/components/blocks/" 2>/dev/null || echo "⚠️  table 不存在"
cp -r "$TEMPLATE/components/blocks/form" "$TARGET/components/blocks/" 2>/dev/null || echo "⚠️  form 不存在"
echo "✅ Blocks 复制完成"

# 7. Components - Console
echo "💻 复制 components/console..."
cp -r "$TEMPLATE/components/console" "$TARGET/components/"
echo "✅ Console 复制完成"

# 8. Components - Dashboard
echo "📊 复制 components/dashboard..."
cp -r "$TEMPLATE/components/dashboard" "$TARGET/components/"
echo "✅ Dashboard 复制完成"

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
  "form"
)

for comp in "${UI_COMPONENTS[@]}"; do
  if [ -f "$TEMPLATE/components/ui/${comp}.tsx" ]; then
    cp "$TEMPLATE/components/ui/${comp}.tsx" "$TARGET/components/ui/"
    echo "  ✓ ${comp}.tsx"
  fi
done
echo "✅ UI 组件复制完成"

# 10. Theme 配置
echo "🎨 复制主题配置..."
cp "$TEMPLATE/app/theme.css" "$TARGET/app/" 2>/dev/null || echo "⚠️  theme.css 不存在"
cp "$TEMPLATE/app/md.css" "$TARGET/app/" 2>/dev/null || echo "⚠️  md.css 不存在"
echo "✅ 主题配置复制完成"

# 11. Providers
echo "🔌 复制 providers..."
mkdir -p "$TARGET/providers"
cp -r "$TEMPLATE/providers"/* "$TARGET/providers/" 2>/dev/null || echo "⚠️  providers 不存在"
echo "✅ Providers 复制完成"

echo ""
echo "✅ 全部复制完成！"
echo ""
echo "📋 下一步："
echo "1. cd $TARGET"
echo "2. pnpm install  # 安装新的依赖"
echo "3. 检查 TypeScript 类型错误"
echo "4. 适配 Clerk 认证（替换 next-auth 相关代码）"
echo "5. pnpm dev  # 启动开发服务器"

