# PageTransition 页面切换动画

**布局层组件**，用于包裹布局中的页面出口（如 `router-view`），在路由或动画效果变化时播放入场动画。基于 [@vueuse/motion](https://motion.vueuse.org/) 实现。

它**没有对外 Props / 事件**，动画效果由应用 Store（`useAppStore().transitionEffect`）统一驱动，因此需要配合布局使用。

## 基础用法

在布局组件的 `<main>` 区域包裹页面渲染出口：

```vue
<script setup lang="ts">
import PageTransition from '~/components/layout/PageTransition.vue'
</script>

<template>
  <main class="relative overflow-hidden">
    <PageTransition>
      <router-view v-slot="{ Component, route }">
        <keep-alive :include="cachedRoutes">
          <component :is="markRaw(Component)" :key="route.path" />
        </keep-alive>
      </router-view>
    </PageTransition>
  </main>
</template>
```

## 组件 Props

无。

## 组件事件

无。

## 插槽

| 插槽名 | 说明 |
|--------|------|
| `default` | 被包裹的页面内容 |

## 动画效果

效果取自 `useAppStore().transitionEffect`，取值类型为 `TransitionEffect`：

| 取值 | 效果 | 时长 |
|------|------|------|
| `fade` | 淡入（默认） | 240ms |
| `slide` / `slide-right` | 从右滑入 | 280ms |
| `slide-left` | 从左滑入 | 280ms |
| `slide-up` | 从下滑入 | 280ms |
| `slide-down` | 从上滑入 | 280ms |
| `zoom` / `scale` | 缩放淡入 | 260ms |
| `fade-slide` | 淡入 + 上滑 | 300ms |
| `flip` | 翻转 | 420ms |

> 效果的显示名称与可选值由设置抽屉的 `TRANSITION_OPTIONS` 维护；`transitions.ts` 中的 `getTransitionVariants()` 负责将效果映射为 `initial` / `enter` 两组状态。

## 触发时机

- 首次挂载时播放一次。
- `route.fullPath` 变化（含 query）时重放。
- `appStore.transitionEffect` 变化时重放。

## 已知限制

- **无障碍**：检测到系统「减少动画」（`prefers-reduced-motion: reduce`）时不会播放动画，直接显示内容。
- 动画通过 `apply()` 动态应用（不重建 DOM、不改 key），因此不会与 `KeepAlive` / 组件缓存冲突。
- 若页面本身使用了 `Transition` 或微前端 / 大屏类页面，需注意动画叠加问题；项目布局中对 `route.meta.microApp`、`route.meta.noTransition` 的页面会绕过过渡处理。
- `transitions.ts` 中保留了 `effect === 'none'` 的判断，但 `TransitionEffect` 类型不含 `'none'`，该分支实际不可达。
