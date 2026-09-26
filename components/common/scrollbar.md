# Scrollbar 滚动条

自定义滚动条组件，隐藏系统滚动条并在容器内渲染可拖拽的滚动条（横 / 纵双向），仅在鼠标悬浮时显示，内部基于 `Bar` 子组件与 `ResizeObserver` 实现尺寸自适应。

## 基础用法

```vue
<script setup lang="ts">
import { Scrollbar } from '~/components/common/Scrollbar'
import { ref } from 'vue'

const list = ref(Array.from({ length: 30 }, (_, i) => i + 1))
</script>

<template>
  <!-- 需要一个有固定高度的容器 + overflow-hidden，由 Scrollbar 接管滚动 -->
  <div class="h-80 overflow-hidden">
    <Scrollbar class="h-full p-4">
      <div v-for="i in list" :key="i">Item {{ i }}</div>
    </Scrollbar>
  </div>
</template>
```

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `native` | 是否使用原生滚动条 | `boolean` | `projectConfig.scrollbar?.native ?? false` |
| `wrapStyle` | 外层滚动容器样式 | `StyleValue` | `''` |
| `wrapClass` | 外层滚动容器类名 | `string \| any[]` | `''` |
| `viewClass` | 内部视图层类名 | `string \| any[]` | `''` |
| `viewStyle` | 内部视图层样式 | `StyleValue` | `''` |
| `noresize` | 容器尺寸不变时开启可优化性能 | `boolean` | `false` |
| `tag` | 内部视图层渲染的标签 | `string` | `'div'` |
| `scrollHeight` | 用于监控内部 `scrollHeight` 变化以重算滚动条 | `number` | `0` |

> `native` 未显式传入时取 `projectConfig.scrollbar.native` 的配置值；为 `true` 时保留原生滚动条，不渲染自定义 `Bar`。

## 组件实例方法

通过 ref 获取：

```ts
const scrollbarRef = ref<InstanceType<typeof Scrollbar>>()

// 外层滚动容器 DOM 元素
scrollbarRef.value?.wrap
```

| 属性 | 说明 | 类型 |
|------|------|------|
| `wrap` | 外层滚动容器 DOM 引用（可直接操作 `scrollTop` 等） | `Ref<HTMLElement>` |

## 插槽

| 插槽名 | 说明 |
|--------|------|
| `default` | 滚动内容 |

## 典型使用场景

### 横向滚动

```vue
<div class="h-32 overflow-hidden">
  <Scrollbar>
    <div class="flex min-w-max gap-3 p-4">
      <div v-for="item in items" :key="item">{{ item }}</div>
    </div>
  </Scrollbar>
</div>
```

### 内容变化后重算滚动条

当滚动内容由非尺寸变化引起（如列表数据增删）时，传入 `scrollHeight` 触发重新计算：

```vue
<Scrollbar :scroll-height="list.length">
  <div v-for="i in list" :key="i">{{ i }}</div>
</Scrollbar>
```

### 长列表 + 定位父容器

```vue
<div class="relative flex-1 overflow-hidden">
  <Scrollbar class="h-full">
    <slot />
  </Scrollbar>
</div>
```

## 已知限制

- 自定义滚动条在**鼠标悬浮**时才显示（`group-hover` 控制透明度）。
- 组件依赖 `~/utils` 中的 `addResizeListener` / `removeResizeListener` 监听尺寸变化；若容器尺寸恒定，建议传 `noresize` 避免持续监听。
- `index.ts` 除导出 `Scrollbar` 外还 re-export 了 `BarMap`、`BarMapItem`、`ScrollbarType` 三个类型，可直接从 `~/components/common/Scrollbar` 引入。
- 传入的 `height` 属性并非组件 prop，不会参与滚动计算；请在外部容器上控制高度。
