# 快速开始

## 环境要求

- **Node.js** >=22.0.0
- **pnpm** 10.12.4（推荐，见 `packageManager` 字段）
- **Git**

## 安装

```bash
# 克隆仓库
git clone https://github.com/junjie73-blip/antdv-next-admin.git

# 进入项目目录
cd antdv-next-admin

# 安装依赖（项目使用 pnpm）
pnpm install
```

## 启动开发服务器

```bash
pnpm dev
```

启动后访问 `http://localhost:5680`

> 默认账号：`admin` / 密码：`admin123`

## 构建生产版本

```bash
pnpm run build
```

构建产物输出到 `dist/` 目录。

## 预览生产构建

```bash
pnpm run preview
```

## 目录速览

首次接触项目时，建议按以下顺序了解：

1. [目录结构](/guide/directory-structure) — 了解项目文件组织
2. [开发规范](/guide/conventions) — 掌握编码约定
3. [环境变量](/guide/env-variables) — 配置项目参数
4. [组件文档](/components/business/table) — 学习业务组件使用

## 常见问题

### 端口被占用？

Vite 会自动尝试下一个可用端口（5680 → 5681 → 5682 ...）

### 接口请求连不上后端？

开发环境通过 `.env.development` 中的 `VITE_PROXY` 把 `/api/v1` 代理到 `http://localhost:3000`，请确认后端已启动，或按需调整代理目标。项目 `VITE_MOCK` 默认为 `false`。

### 样式不生效？

检查是否使用了 `cn()` 函数生成类名，禁止在模板中直接写 Tailwind 类名。

```vue
<!-- ✅ 正确 -->
<script setup>
import { cn } from '~/utils/cn'
const className = cn('bg-red-500', 'text-white')
</script>
<template>
  <div :class="className">内容</div>
</template>

<!-- ❌ 错误 -->
<template>
  <div class="bg-red-500 text-white">内容</div>
</template>
```
