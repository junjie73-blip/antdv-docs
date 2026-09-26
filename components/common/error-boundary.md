# ErrorBoundary 错误边界

基于 Vue 3 `onErrorCaptured` 的错误边界组件，用于捕获子组件树中未处理的运行时错误，展示友好的降级 UI，避免整页白屏。同时内置 `Suspense`，可承载异步子组件。

> 注意：Vue 的 `onErrorCaptured` **无法捕获**事件处理器、异步回调（如 `setTimeout`、Promise 未链式 `.catch`）中抛出的错误，因此本组件主要覆盖渲染阶段同步错误。

## 基础用法

```vue
<script setup lang="ts">
import ErrorBoundary from '~/components/common/ErrorBoundary.vue'
</script>

<template>
  <ErrorBoundary @error="(err) => console.error(err)" @reset="() => console.log('已重置')">
    <YourComponent />
  </ErrorBoundary>
</template>
```

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `fallback` | 自定义降级渲染函数，接收错误与重置方法，返回 VNode | `(error: Error, reset: () => void) => VNode` | - |
| `resetOnError` | 捕获错误后是否允许重置重试 | `boolean` | `true` |
| `maxStackDepth` | 错误堆栈显示的最大深度 | `number` | `5` |

> `fallback` 是 **prop（函数）**，不是事件；写法为 `:fallback="fn"`。源码注释中出现的 `@fallback` 写法与实现不符。
>
> `maxStackDepth` 目前在组件内未被实际使用，堆栈展示由开发环境的 `<details>` 控制。

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `error` | 捕获到错误时触发 | `(error: Error) => void` |
| `reset` | 重置（点击重试或调用重置）时触发 | - |

## 插槽

| 插槽名 | 说明 |
|--------|------|
| `default` | 被保护的子内容，作用域参数为 `{ key }`（重置时 `key` 变化以强制重新渲染） |
| `loading` | `Suspense` 的 fallback，用于异步子组件加载中；未提供时显示默认转圈 |

## 典型使用场景

### 自定义降级 UI

```vue
<script setup lang="ts">
import { h } from 'vue'

import ErrorBoundary from '~/components/common/ErrorBoundary.vue'

function renderFallback(error: Error, reset: () => void) {
  return h('div', { class: 'p-4 text-center' }, [
    h('p', `出错了：${error.message}`),
    h('button', { onClick: reset }, '重试'),
  ])
}
</script>

<template>
  <ErrorBoundary :fallback="renderFallback">
    <RiskPanel />
  </ErrorBoundary>
</template>
```

### 承载异步组件

```vue
<template>
  <ErrorBoundary>
    <AsyncChart />

    <template #loading>
      <PageSkeleton variant="card" />
    </template>
  </ErrorBoundary>
</template>
```

## 已知限制

- 默认降级 UI 在开发环境会展示错误堆栈，内部使用全局注册的 `PerfectScrollbar`（由 `vue3-perfect-scrollbar` 插件提供）；若未注册该插件，堆栈区域会报错。
- 仅在 `import.meta.env.DEV` 下输出控制台详细错误信息。
