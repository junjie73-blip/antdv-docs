# Skeleton 骨架屏

加载占位组件，在数据返回前展示与真实内容结构相近的灰色占位块，减少视觉跳变。基于 Tailwind 原子类实现，深浅色自适应。

`Skeleton` 目录提供两个组件，均从 `~/components/common/Skeleton` 导出：

```ts
import { PageSkeleton, TableSkeleton } from '~/components/common/Skeleton'
```

## PageSkeleton 页面骨架屏

支持 `page` / `card` / `form` / `detail` 四种版式，加载完成后渲染默认插槽。

### 基础用法

```vue
<script setup lang="ts">
import { PageSkeleton } from '~/components/common/Skeleton'
import { ref } from 'vue'

const isLoading = ref(true)
</script>

<template>
  <PageSkeleton :loading="isLoading" variant="page" :rows="6">
    <YourContent />
  </PageSkeleton>
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `loading` | 是否显示骨架屏 | `boolean` | `true` |
| `variant` | 骨架屏版式 | `'page' \| 'card' \| 'form' \| 'detail'` | `'page'` |
| `rows` | 文本行数（仅 `variant="page"` 生效） | `number` | `5` |
| `showTitle` | 是否显示标题骨架 | `boolean` | `true` |
| `showActions` | 是否显示操作按钮骨架 | `boolean` | `true` |
| `showSidebar` | 是否显示侧边栏骨架（仅 `variant="page"` 生效） | `boolean` | `false` |
| `class` | 自定义类名 | `string` | - |

> `card` 固定为 3 列卡片网格，`form` 固定 4 行表单项，`detail` 固定 6 个详情字段，`rows` / `showTitle` / `showActions` / `showSidebar` 对这三种版式不生效。

### 插槽

| 插槽名 | 说明 |
|--------|------|
| `default` | `loading` 为 `false` 时渲染的实际内容 |

## TableSkeleton 表格骨架屏

模拟真实表格的行列结构，含表头、斑马纹数据行、可选操作列与分页器。

### 基础用法

```vue
<script setup lang="ts">
import { TableSkeleton } from '~/components/common/Skeleton'
import { ref } from 'vue'

const isLoading = ref(true)
</script>

<template>
  <TableSkeleton :loading="isLoading" :columns="5" :rows="8" />
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `loading` | 是否显示骨架屏 | `boolean` | `true` |
| `columns` | 表格列数 | `number` | `5` |
| `rows` | 表格行数 | `number` | `8` |
| `showHeader` | 是否显示表头骨架 | `boolean` | `true` |
| `showActions` | 是否显示操作列骨架 | `boolean` | `true` |
| `showPagination` | 是否显示分页器骨架 | `boolean` | `true` |
| `class` | 自定义类名 | `string` | - |

### 插槽

| 插槽名 | 说明 |
|--------|------|
| `default` | `loading` 为 `false` 时渲染的实际内容 |

## 典型使用场景

### 配合 Suspense

```vue
<template>
  <Suspense>
    <AsyncDetail />
    <template #fallback>
      <PageSkeleton variant="detail" />
    </template>
  </Suspense>
</template>
```

### 列表页首屏加载

```vue
<PageSkeleton :loading="loading" variant="form">
  <BasicForm :schemas="schemas" @register="formRegister" />
</PageSkeleton>
```
