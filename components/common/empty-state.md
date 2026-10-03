# 空状态 (EmptyState)

`EmptyState` 是一个纯展示的空状态占位组件：居中渲染一个圆形图标、标题与可选描述，并在末尾提供默认插槽用于追加自定义内容（如操作按钮）。组件内部无状态、无交互、无副作用，适用于列表为空、搜索无结果等场景。

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `title` | 主标题文案 | `string` | `'暂无数据'` |
| `description` | 补充描述，为空字符串时不渲染该行 | `string` | `''` |
| `icon` | 图标名（Iconify 图标标识） | `string` | `'ant-design:inbox-outlined'` |

## 组件事件

无。

## 插槽

| 插槽名 | 说明 |
|--------|------|
| `default` | 追加在标题 / 描述下方的自定义内容（如操作按钮），与 `title`、`description` 并存 |

## 组件实例方法

无（组件未使用 `defineExpose`，不暴露任何方法或状态）。

## 使用示例

```vue
<script setup lang="ts">
import EmptyState from '~/components/common/EmptyState.vue'
</script>

<template>
  <!-- 基础用法：使用默认标题与图标 -->
  <EmptyState />

  <!-- 自定义标题、描述与图标 -->
  <EmptyState
    title="暂无搜索结果"
    description="换个关键词试试吧"
    icon="ant-design:search-outlined"
  />

  <!-- 通过默认插槽追加操作按钮 -->
  <EmptyState title="还没有项目" description="创建你的第一个项目">
    <a-button type="primary">立即创建</a-button>
  </EmptyState>
</template>
```

## 注意事项

- `description` 为空字符串时通过 `v-if` 隐藏，不会占据空间；若需占位请传入非空文案。
- 默认插槽渲染在描述下方，与 `title` / `description` **叠加**而非替换；需要完全自定义内容时可不传 `title` / `description`，仅使用插槽。
- `icon` 传的是 Iconify 图标名（字符串），并非组件或 `VNode`，需保证图标集已按需注册 / 采集。
- 模板中的 `<Icon>` **未在本文件显式导入**（与 `AvatarUploader.vue`、`IconifyIcon.vue` 中 `import { Icon } from '@iconify/vue'` 的写法不一致），依赖全局 / 自动注册；`src` 内目前也没有 `EmptyState` 的引用与 barrel 导出，此写法存在隐患。
- 组件无任何交互逻辑，不触发事件，也不做数据请求；「点击重试」等行为需由使用方通过默认插槽自行实现。

## 浏览器兼容性

组件仅使用标准 HTML / CSS 布局与 Iconify 的 SVG 渲染，无特殊 API 依赖，Chrome / Edge / Firefox / Safari 等现代浏览器均可正常工作。Vue 3 与 Antdv Next 本身不支持 IE，故不提供 IE 兼容。
