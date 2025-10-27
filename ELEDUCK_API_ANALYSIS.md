# 电鸭社区 API 分析和实现方案

## API 基本信息

### Base URL

```
https://svc.eleduck.com/api/v1/
```

### 关键端点

1. **获取职位列表**

```
GET /posts?category=5&page={page}
```

2. **获取单个职位详情**

```
GET /posts/{id}
```

3. **获取分类信息**

```
GET /categories
```

---

## 数据统计

- **总职位数**: 8,773个
- **总页数**: 351页
- **每页数量**: 25个
- **类别ID**: 5（招聘&找人）

---

## 数据结构

### Post（职位）对象

```typescript
interface EleduckPost {
  id: string; // 职位ID
  title: string; // 标题
  full_title: string; // 完整标题
  summary: string; // 摘要
  content: string; // 详细内容（HTML格式）

  // 状态信息
  closed: boolean; // 是否已关闭
  published_at: string; // 发布时间
  modified_at: string; // 修改时间
  visibility: string; // 可见性

  // 统计信息
  views_count: number; // 浏览数
  comments_count: number; // 评论数
  upvotes_count: number; // 点赞数
  marks_count: number; // 收藏数

  // 分类信息
  category: {
    id: number;
    name: string;
    code: string;
  };

  // 标签（关键！）
  tags: Array<{
    id: number;
    name: string;
    category: string;
  }>;

  // 作者信息
  author: {
    id: string;
    nickname: string;
    avatar_url: string;
  };
}
```

### 分页信息

```typescript
interface Pager {
  total_pages: number; // 总页数
  current_page: number; // 当前页
  total_count: number; // 总数量
  limit_value: number; // 每页数量
}
```

---

## 标签系统（Tags）

### 工作方式标签（重要！）

| Tag ID | 名称     | 英文              |
| ------ | -------- | ----------------- |
| 16     | 全职坐班 | Full-time On-site |
| 17     | 远程工作 | Remote Work ⭐    |
| 18     | 线上兼职 | Online Part-time  |
| 19     | 同城驻场 | Local On-site     |

### 招聘类型

- 外包零活
- 企业直招
- 猎头中介
- 员工内推
- 组队合伙

### 职业分类

- 开发、产品、设计、运营、写作、运维、其它

### 领域

- 区块链&Web3
- AI/人工智能
- 企业服务
- 低代码
- 电商/消费
- 内容/媒体
- 工具/开源
- 其他

### 城市

北京、上海、广州、深圳、杭州、成都、西安、厦门、武汉、长沙、苏州、郑州、南京、云南、海南、大理、海外、其他

---

## 远程工作识别

### 方法1: 通过Tag ID

```typescript
const isRemote = post.tags.some((tag) => tag.id === 17); // 远程工作
const isPartTime = post.tags.some((tag) => tag.id === 18); // 线上兼职
```

### 方法2: 通过Tag名称

```typescript
const remoteKeywords = ["远程工作", "线上兼职"];
const isRemote = post.tags.some((tag) => remoteKeywords.includes(tag.name));
```

---

## 实现建议

### 1. 抓取策略

**方案A: 全量抓取（不推荐）**

- 抓取所有351页，共8773个职位
- 耗时长，数据量大
- 大部分可能已过期

**方案B: 增量抓取（推荐）** ⭐

- 只抓取前5-10页（最新的125-250个职位）
- 按发布时间过滤（只要近30天内的）
- 定期运行（每天1-2次）

### 2. 筛选条件

```typescript
// 推荐的筛选逻辑
function shouldIncludeJob(post: EleduckPost): boolean {
  // 1. 必须是招聘类别
  if (post.category.id !== 5) return false;

  // 2. 未关闭
  if (post.closed) return false;

  // 3. 包含远程工作或线上兼职标签
  const hasRemoteTag = post.tags.some((tag) => tag.id === 17 || tag.id === 18);
  if (!hasRemoteTag) return false;

  // 4. 发布时间在30天内
  const publishedDate = new Date(post.published_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (publishedDate < thirtyDaysAgo) return false;

  return true;
}
```

### 3. 速率限制

电鸭API没有明确的速率限制文档，建议：

- 请求间隔：1-2秒
- 每次运行抓取页数：5-10页
- 运行频率：每天2次（早晚各一次）

### 4. 字段映射

```typescript
// 电鸭 -> 我们的数据库
{
  title: post.full_title || post.title,
  companyName: extractCompanyFromTitle(post.title), // 需要从标题提取
  description: post.content, // HTML内容
  type: mapJobType(post.tags), // 从tags推断
  remoteType: post.tags.some(t => t.id === 17) ? 'FULLY_REMOTE' : 'OCCASIONAL',
  applyMethod: `https://eleduck.com/posts/${post.id}`,
  source: 'ELEDUCK',
  sourceUrl: `https://eleduck.com/posts/${post.id}`,
  publishedAt: new Date(post.published_at),
  status: post.closed ? 'CLOSED' : 'PUBLISHED',
}
```

---

## 示例代码骨架

```typescript
// lib/crawlers/eleduck.ts

const ELEDUCK_API_BASE = "https://svc.eleduck.com/api/v1";
const CATEGORY_JOB = 5; // 招聘&找人
const TAG_REMOTE = 17; // 远程工作
const TAG_ONLINE_PARTTIME = 18; // 线上兼职

interface EleduckPost {
  id: string;
  title: string;
  full_title: string;
  content: string;
  closed: boolean;
  published_at: string;
  tags: Array<{
    id: number;
    name: string;
    category: string;
  }>;
  // ... 其他字段
}

export async function crawlEleduck() {
  const pagesToFetch = 5; // 抓取前5页
  let allJobs: EleduckPost[] = [];

  for (let page = 1; page <= pagesToFetch; page++) {
    const response = await axios.get(`${ELEDUCK_API_BASE}/posts`, {
      params: {
        category: CATEGORY_JOB,
        page: page,
      },
      headers: {
        Accept: "application/json",
        "User-Agent": "RemoteJobs-Aggregator/1.0",
      },
    });

    const posts = response.data.posts || [];

    // 筛选远程工作
    const remoteJobs = posts.filter((post: EleduckPost) => {
      // 未关闭 + 包含远程标签
      return (
        !post.closed &&
        post.tags.some((tag) => tag.id === TAG_REMOTE || tag.id === TAG_ONLINE_PARTTIME)
      );
    });

    allJobs = allJobs.concat(remoteJobs);

    // 延迟1秒
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 保存到数据库...
  return {
    success: allJobs.length,
    total: allJobs.length,
  };
}
```

---

## 注意事项

### 1. API访问

- ✅ 无需认证
- ✅ 支持CORS
- ⚠️ 没有官方文档（基于RSSHub逆向）
- ⚠️ API可能会变更

### 2. 数据质量

- ✅ 数据结构清晰
- ✅ 标签分类完善
- ⚠️ 公司名需要从标题提取
- ⚠️ 薪资信息不在标准字段中

### 3. 内容格式

- content字段是**HTML格式**，需要转换或清理
- 可以提取关键信息（薪资、技术栈等）

### 4. 去重

电鸭的职位ID是唯一的，可以用`sourceUrl`去重：

```typescript
sourceUrl: `https://eleduck.com/posts/${post.id}`;
```

---

## 下一步行动

1. ✅ API分析完成
2. ⬜ 创建 `lib/crawlers/eleduck.ts`
3. ⬜ 实现数据抓取逻辑
4. ⬜ 测试数据质量
5. ⬜ 集成到定时任务
6. ⬜ 监控和优化

---

**文档创建时间**: 2025-10-22
**API状态**: ✅ 可用
**数据质量**: ⭐⭐⭐⭐⭐
