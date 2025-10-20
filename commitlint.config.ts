import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", // 修复 bug
        "docs", // 文档更新
        "style", // 代码格式调整
        "refactor", // 重构
        "perf", // 性能优化
        "test", // 测试相关
        "build", // 构建系统或外部依赖
        "ci", // CI 配置
        "chore", // 其他修改
        "revert", // 回退
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
  },
};

export default config;
