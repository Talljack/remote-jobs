#!/bin/bash

echo "🚀 Setting up Git Hooks and CI/CD..."
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root."
  exit 1
fi

# 1. 安装依赖
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
  pnpm install
else
  echo "⚠️  pnpm not found, using npm instead..."
  npm install
fi
echo "✅ Dependencies installed"
echo ""

# 2. 初始化 Husky
echo "🔧 Initializing Husky..."
npx husky install
echo "✅ Husky initialized"
echo ""

# 3. 设置 hooks 权限
echo "🔐 Setting hooks permissions..."
if [ -f ".husky/pre-commit" ]; then
  chmod +x .husky/pre-commit
  echo "✅ pre-commit hook executable"
fi

if [ -f ".husky/commit-msg" ]; then
  chmod +x .husky/commit-msg
  echo "✅ commit-msg hook executable"
fi
echo ""

# 4. 配置 Git commit 模板
echo "📝 Configuring Git commit template..."
if [ -f ".gitmessage" ]; then
  git config commit.template .gitmessage
  echo "✅ Git commit template configured"
else
  echo "⚠️  .gitmessage not found, skipping..."
fi
echo ""

# 5. 测试 hooks
echo "🧪 Testing hooks..."
echo "Running lint-staged test..."
if npx lint-staged --version &> /dev/null; then
  echo "✅ lint-staged is working"
else
  echo "⚠️  lint-staged test failed"
fi

echo "Running commitlint test..."
if echo "test: test message" | npx commitlint &> /dev/null; then
  echo "✅ commitlint is working"
else
  echo "⚠️  commitlint test failed"
fi
echo ""

# 6. 显示配置信息
echo "📋 Configuration Summary:"
echo "├─ Git hooks path: $(git config core.hooksPath || echo '.git/hooks')"
echo "├─ Commit template: $(git config commit.template || echo 'not set')"
echo "├─ Husky: $([ -d '.husky' ] && echo 'installed' || echo 'not found')"
echo "└─ Pre-commit hook: $([ -x '.husky/pre-commit' ] && echo 'executable' || echo 'not executable')"
echo ""

# 7. 完成
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Make a test commit: git commit -m 'test: test hooks'"
echo "2. Read the guide: cat GIT_HOOKS_GUIDE.md"
echo "3. Configure GitHub Secrets for CI/CD"
echo ""
echo "🎉 Happy coding!"

