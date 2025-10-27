# GitHub Actions 爬虫配置指南

本项目使用 GitHub Actions 自动运行爬虫，每天两次从电鸭社区和V2EX抓取远程工作职位。

## 📅 运行时间

- **早上 8:00** (北京时间) = UTC 0:00
- **晚上 8:00** (北京时间) = UTC 12:00

## 🔧 配置步骤

### 1. 配置 GitHub Secrets

在你的 GitHub 仓库中添加以下 Secrets：

1. 进入仓库页面
2. 点击 `Settings` > `Secrets and variables` > `Actions`
3. 点击 `New repository secret`
4. 添加以下 secrets：

#### 必需的 Secrets

| Secret 名称      | 说明                 | 示例值                                               |
| ---------------- | -------------------- | ---------------------------------------------------- |
| `DATABASE_URL`   | 生产数据库连接字符串 | `postgresql://user:password@host:5432/dbname`        |
| `V2EX_API_TOKEN` | V2EX API 令牌        | 从 [V2EX](https://www.v2ex.com/settings/tokens) 获取 |

#### 可选的 Secrets

如果你使用了 Vercel Postgres 或其他托管数据库：

| Secret 名称    | 说明                       |
| -------------- | -------------------------- |
| `POSTGRES_URL` | Vercel Postgres 连接字符串 |

### 2. 数据库配置

#### 方案 A：使用 Vercel Postgres（推荐）

1. 在 Vercel 项目中创建 Postgres 数据库
2. 获取连接字符串（在 Vercel Dashboard > Storage > Postgres）
3. 添加到 GitHub Secrets：
   ```
   DATABASE_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require
   ```

#### 方案 B：使用其他托管数据库

支持任何 PostgreSQL 数据库：

- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [Neon](https://neon.tech/)
- AWS RDS
- 自建 PostgreSQL

### 3. 获取 V2EX API Token

1. 访问 [V2EX Token 设置页](https://www.v2ex.com/settings/tokens)
2. 登录你的 V2EX 账号
3. 创建新的 Personal Access Token
4. 复制 token 并添加到 GitHub Secrets

### 4. 验证配置

推送代码后，可以手动触发测试：

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 选择 `Crawl Remote Jobs` workflow
4. 点击 `Run workflow` > `Run workflow`

## 📊 监控运行状态

### 查看运行日志

1. 进入 `Actions` 标签
2. 点击最近的 workflow 运行
3. 查看详细日志

### 运行结果示例

成功运行时会显示：

```
✅ 爬虫任务成功！
触发时间: 2025-10-22 00:00:00 UTC
工作流: Crawl Remote Jobs

V2EX: 60 jobs crawled successfully
Eleduck: 36 jobs crawled successfully
```

## 🔄 Workflow 文件说明

### 文件位置

```
.github/workflows/crawl-jobs.yml
```

### 触发方式

1. **定时触发**：每天自动运行两次

   ```yaml
   schedule:
     - cron: "0 0 * * *" # UTC 0:00
     - cron: "0 12 * * *" # UTC 12:00
   ```

2. **手动触发**：可以随时手动运行
   ```yaml
   workflow_dispatch:
   ```

### 调整运行时间

如果需要修改运行时间，编辑 `crawl-jobs.yml` 中的 cron 表达式：

```yaml
schedule:
  # 格式: 分 时 日 月 星期 (UTC时间)
  - cron: "0 0 * * *" # 每天 0:00 UTC
  - cron: "0 12 * * *" # 每天 12:00 UTC
```

**时区转换**：

- UTC 0:00 = 北京 8:00
- UTC 6:00 = 北京 14:00
- UTC 12:00 = 北京 20:00
- UTC 18:00 = 北京 次日 2:00

## 🚨 常见问题

### 1. 爬虫失败：Database connection error

**原因**：DATABASE_URL 配置错误或数据库无法访问

**解决**：

- 检查 GitHub Secret 中的 DATABASE_URL 是否正确
- 确保数据库允许来自 GitHub Actions 的连接
- Vercel Postgres 默认允许外部连接

### 2. V2EX API 错误

**原因**：V2EX_API_TOKEN 无效或过期

**解决**：

- 重新生成 V2EX token
- 更新 GitHub Secret

### 3. 爬虫运行但没有新数据

**原因**：可能是去重机制（已存在的职位不会重复添加）

**正常行为**：这是预期的，说明爬虫正常工作

### 4. 想要临时停止自动爬虫

**方法 1**：禁用 workflow

1. 进入 `Actions` 标签
2. 选择 `Crawl Remote Jobs`
3. 点击 `...` > `Disable workflow`

**方法 2**：删除或注释掉 schedule 触发器

## 📈 优化建议

### 1. 添加通知（可选）

可以配置失败时发送通知：

- Slack webhook
- Discord webhook
- Email（GitHub 默认会发邮件）

### 2. 保存爬虫日志

可以将爬虫结果保存为 artifact：

```yaml
- name: Upload crawl logs
  uses: actions/upload-artifact@v4
  with:
    name: crawl-logs
    path: logs/
```

### 3. 增加重试机制

如果爬虫偶尔失败，可以添加重试：

```yaml
- name: Run crawlers
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npx tsx scripts/run-crawler.ts
```

## 📝 本地测试

在提交到 GitHub 之前，建议先本地测试：

```bash
# 运行爬虫
npx tsx scripts/run-crawler.ts

# 检查结果
psql $DATABASE_URL -c "SELECT source, COUNT(*) FROM jobs GROUP BY source;"
```

## 🔐 安全注意事项

1. ⚠️ **永远不要** 将数据库密码提交到代码仓库
2. ✅ **始终使用** GitHub Secrets 存储敏感信息
3. ✅ **定期轮换** API tokens 和数据库密码
4. ✅ **限制数据库访问**：只允许必要的 IP 访问

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cron 表达式生成器](https://crontab.guru/)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)

---

**最后更新**: 2025-10-22
