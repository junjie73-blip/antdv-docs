# ECharts 图表

ECharts 图表方案由两部分组成：轻量包装组件 `ECharts`（`~/components/common/ECharts/index.vue`）与组合式函数 `useEcharts`（`~/composables/echarts/useEcharts.ts`）。前者开箱即用，后者提供自动初始化、重试、主题重建与可控 resize 策略，适合复杂图表页。

## 概述

| 能力 | `ECharts` 组件 | `useEcharts` 组合式函数 |
|------|---------------|------------------------|
| ECharts 引入方式 | 全量包 `import * as echarts from 'echarts'` | `import * as echarts from 'echarts/core'` |
| 是否依赖 `setupEcharts()` | 否（全量包已内置） | 是（按需注册后才可用） |
| 初始化时机 | `onMounted` 一次 | `onMounted` + `nextTick` + `rAF` + 最多 5 次定时重试 |
| 尺寸监听 | 仅 `window resize` | `ResizeObserver`（`content-box`）+ 全局 window resize 总线 |
| 暗色主题 | 无 | `isDark` 选项，切换时重建图表 |
| 暴露实例 | 无（未 `defineExpose`） | `containerRef` / `chart` / `isReady` 等 |

### 按需引入与注册（`setup.ts`）

`useEcharts` 使用 `echarts/core`，**必须**先执行一次 `setupEcharts()` 注册图表、组件与渲染器，否则 `echarts.init` 会因缺少模块而失败。该函数幂等（内部 `installed` 标志），项目已在 `src/main.ts` 启动时调用：

```ts
import { setupEcharts } from '~/composables/echarts/setup'

setupEcharts()
```

`setupEcharts()` 注册的内容（`src/composables/echarts/setup.ts`）：

| 类别 | 已注册项 |
|------|---------|
| 图表 | `LineChart`、`BarChart`、`PieChart`、`RadarChart`、`FunnelChart`、`GaugeChart`、`HeatmapChart`、`SankeyChart` |
| 组件 | `TitleComponent`、`TooltipComponent`、`LegendComponent`、`GridComponent`、`DataZoomComponent`、`VisualMapComponent`、`PolarComponent`、`GraphicComponent`、`MarkLineComponent`、`AriaComponent` |
| 渲染器 | `CanvasRenderer` |

::: warning 未注册的图表 / 渲染器需自行补充
`ScatterChart`、`MapChart`、`SunburstChart`、`WordcloudChart` 等不在默认列表中；`SvgRenderer` 也未注册，即使 `useEcharts` 的 `renderer` 支持 `'svg'`，也需先 `echarts.use([SvgRenderer])` 才能生效。
:::

---

## 组件 API

组件路径：`~/components/common/ECharts/index.vue`（目录下仅此一个文件）。

### Props

| 名称 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `option` | `EChartsOption` | 必填 | ECharts 配置项，深度监听变化并以 `setOption(opt, true)` 全量替换 |
| `height` | `string` | `'320px'` | 容器高度，直接写入根 `div` 的 `style.height` |
| `loading` | `boolean` | `false` | 为 `true` 时调用 `showLoading()`，否则 `hideLoading()` |

### Emits

| 事件名 | 说明 |
|--------|------|
| 无 | 组件未 `defineEmits` |

### Slots

| 插槽名 | 说明 |
|--------|------|
| 无 | 组件未使用插槽，仅渲染一个容器 `div` |

### 暴露方法

| 方法 | 说明 |
|------|------|
| 无 | 组件未 `defineExpose`，无法通过 ref 访问内部 `chart` 实例 |

::: tip 组件内部行为
- `onMounted` 调用 `echarts.init` 并 `setOption`；同时监听 `window` 的 `resize` 事件调用 `chart.resize()`。
- `onBeforeUnmount` 移除监听并 `chart.dispose()`。
- 组件使用**全量 echarts 包**，因此不依赖 `setupEcharts()`。
- 组件不处理容器尺寸为 0、暗色主题等场景，也不提供加载动画文案定制。
:::

---

## useEcharts 组合式函数

导入路径：`~/composables/echarts/useEcharts`。

### 函数签名

```ts
import type { EChartsOption } from 'echarts'

import { useEcharts, type ResizeStrategy } from '~/composables/echarts/useEcharts'

export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T)

export function useEcharts<T = unknown>(
  initialOption?: EChartsOption,
  options?: UseEchartsOptions,
): UseEchartsReturn<T>
```

`isDark` 支持 `ref` / `getter` / 原始值（`MaybeRefOrGetter`），其余均为原始值。

### UseEchartsOptions 选项

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoResize` | `boolean` | `true` | 开启 `ResizeObserver` 监听容器尺寸，并注册全局 window resize 回调；`resizeStrategy` 为 `'none'` 时整体跳过 |
| `resizeStrategy` | `ResizeStrategy` | `'raf'` | resize 触发策略，取值见下表 |
| `resizeDelay` | `number` | `100` | 仅 debounce / throttle 策略使用的延迟（ms） |
| `isDark` | `MaybeRefOrGetter<boolean>` | 无 | 暗色主题；为 `null` / `undefined` 时按 `false` 处理。变化时销毁并重建图表 |
| `onError` | `(err: unknown) => void` | 无 | 初始化、`setOption`、`resize`、`dispose` 失败时回调 |
| `renderer` | `'canvas' \| 'svg'` | `'canvas'` | 传给 `echarts.init` 的 `renderer`；`'svg'` 需自行注册 `SvgRenderer` |
| `applyInitial` | `boolean` | `true` | 初始化成功后是否自动 `setOption(initialOption)` |
| `debug` | `boolean` | `false` | 为 `true` 时打印 `[useEcharts]` 前缀调试日志 |

### ResizeStrategy 取值

| 取值 | 说明 |
|------|------|
| `'raf'` | 默认。`requestAnimationFrame` 内调用一次 `resize()`；环境无 `rAF` 时退化为立即执行 |
| `'debounce'` | 基于 `@vueuse/core` 的 `useDebounceFn`，延迟 `resizeDelay` |
| `'throttle'` | 基于 `@vueuse/core` 的 `useThrottleFn`，延迟 `resizeDelay` |
| `'none'` | 不执行任何 resize（`resize()` 为空操作），同时禁用 `autoResize` 的监听注册 |

### UseEchartsReturn 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `containerRef` | `Ref<HTMLElement \| null>` | 容器引用，必须绑定到模板 DOM 上供初始化使用 |
| `chart` | `Ref<ECharts \| null>` | ECharts 实例（`shallowRef`），未就绪时为 `null` |
| `isReady` | `Ref<boolean>` | 图表是否已初始化完成 |
| `setOption` | `(option: EChartsOption, notMerge?: boolean) => void` | 设置配置项；未就绪时入队，初始化后按序回放；`notMerge` 默认 `false` |
| `setData` | `(patch: Partial<T>) => void` | 预留接口，源码为空实现（见下方 warning） |
| `resize` | `() => void` | 按当前策略触发一次 resize |
| `dispose` | `() => void` | 销毁实例并清空待回放队列（组件卸载时自动调用） |
| `showLoading` | `() => void` | 显示加载动画，固定文案「加载中」、`maskColor: 'transparent'` |
| `hideLoading` | `() => void` | 隐藏加载动画 |

::: warning setData 目前不产生任何效果
`setData(_patch) {}` 为空函数（`useEcharts.ts:216`），传入的 `Partial<T>` 不会被应用。更新图表请使用 `setOption`。
:::

---

## 使用场景示例

### 组合式函数：完整可运行片段

```vue
<script setup lang="ts">
import type { EChartsOption } from 'echarts'

import { computed, ref, watch } from 'vue'

import { useEcharts } from '~/composables/echarts/useEcharts'

defineOptions({ name: 'TrafficChart' })

const props = withDefaults(defineProps<{ dark?: boolean }>(), { dark: false })

const option = ref<EChartsOption>({
  title: { text: '访问趋势' },
  tooltip: { trigger: 'axis' },
  grid: { left: 12, right: 12, bottom: 8, containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data: [120, 200, 150, 280, 190] }],
})

const { containerRef, isReady, setOption } = useEcharts(option.value, {
  isDark: computed(() => props.dark),
  resizeStrategy: 'raf',
  resizeDelay: 100,
})

watch(
  [option, isReady],
  ([opt, ready]) => {
    if (ready) setOption(opt)
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <!-- 容器必须有确定高度，且挂载时不能为 0，否则需等待重试 -->
  <div ref="containerRef" style="width: 100%; height: 320px" />
</template>
```

### 组件：最简用法

```vue
<script setup lang="ts">
import type { EChartsOption } from 'echarts'

import { ref } from 'vue'

import ECharts from '~/components/common/ECharts/index.vue'

defineOptions({ name: 'SimpleChart' })

const option = ref<EChartsOption>({
  tooltip: { trigger: 'item' },
  series: [{ type: 'pie', radius: '60%', data: [{ value: 40, name: 'A' }, { value: 60, name: 'B' }] }],
})
</script>

<template>
  <ECharts :option="option" height="320px" />
</template>
```

### 加载态

```vue
<script setup lang="ts">
import type { EChartsOption } from 'echarts'

import { ref } from 'vue'

import ECharts from '~/components/common/ECharts/index.vue'

defineOptions({ name: 'LoadingChart' })

const loading = ref(true)
const option = ref<EChartsOption>({ series: [] })
</script>

<template>
  <ECharts :option="option" :loading="loading" height="320px" />
</template>
```

::: tip 组件与 useEcharts 如何选择
- 静态或全量引入 echarts 的简单场景：直接用 `ECharts` 组件。
- 需要暗色主题重建、容器尺寸自适应、重试初始化、精细 resize 策略：用 `useEcharts`，并确保已执行 `setupEcharts()`。
:::

---

## 响应式与主题

### 自适应

- **组件**：只监听 `window` 的 `resize` 事件，不监听容器自身尺寸变化。若父容器尺寸在不触发窗口 resize 的情况下变化（如侧边栏折叠），图表不会自动重绘。
- **useEcharts**：
  - `autoResize: true`（默认）时，用 `ResizeObserver` 以 `box: 'content-box'` 观察容器，并用一个 rAF 合并的全局 resize 总线处理窗口变化，避免频繁重绘。
  - 容器尺寸为 0 时不会初始化；挂载后会在 `nextTick`、`rAF` 各尝试一次，随后定时重试，共最多 5 次、间隔 100ms。
  - `ResizeObserver` 回调里若发现尚未初始化，也会主动 `init()`。
  - `resizeStrategy: 'none'` 会同时关闭上述所有监听。

### 主题

- **组件**：无暗色处理，`echarts.init` 未传主题参数，始终使用默认主题。
- **useEcharts**：`isDark` 为真时以 `'dark'` 主题初始化。监听 `isDark` 变化后会先 `getOption()` 备份、`dispose()` 销毁，再在 `rAF` 中重建并回填配置。
- 主题色工具与调色板分别位于 `~/composables/echarts/theme` 与 `~/composables/echarts/constants`：

| 导出 | 来源 | 说明 |
|------|------|------|
| `textColor` / `subTextColor` / `borderColor` / `axisLineColor` / `tooltipBg` | `~/composables/echarts/theme` | 按 `isDark` 返回对应色值 |
| `gradient` | `~/composables/echarts/theme` | 生成 `LinearGradient`，第二参 `vertical` 控制方向 |
| `echartsTheme` | `~/composables/echarts/theme` | 返回 `'dark'` 或 `undefined` |
| `theme` | `~/composables/echarts/theme` | 上述函数的只读别名对象 |
| `PALETTE` / `PALETTE_LIST` | `~/composables/echarts/constants` | 主色板与列表 |
| `KPI_COLOR_MAP` / `SEVERITY_COLOR` / `SCOPE_COLOR` / `SCOPE_LABEL` / `TIME_RANGE_OPTIONS` | `~/composables/echarts/constants` | 业务配色与选项常量 |

---

## 依赖关系

以 `frontend/package.json` 与源码 `import` 为准：

| 依赖 | 版本 | 用途 |
|------|------|------|
| `echarts` | `^6.1.0` | 组件用全量 `echarts`；`useEcharts` 用 `echarts/core`、`echarts/charts`、`echarts/components`、`echarts/renderers` |
| `@vueuse/core` | `^14.4.0` | `tryOnMounted`、`tryOnBeforeUnmount`、`useDebounceFn`、`useThrottleFn` |
| `es-toolkit` | `^1.51.0` | `attempt`、`isNil`（错误捕获与空值判断） |
| `vue` | `^3.5.42` | `computed`、`watch`、`shallowRef`、`nextTick` 等 |

---

## 注意事项

- **销毁**：`useEcharts` 通过 `tryOnBeforeUnmount(dispose)` 自动销毁，`ECharts` 组件在 `onBeforeUnmount` 中 `dispose`。手动调用 `dispose()` 后复用同一实例需重新初始化。
- **容器尺寸为 0**：`useEcharts` 会跳过初始化并按 5 次 / 100ms 重试，容器务必有确定高度且初始可见（`v-show` 隐藏或 `display:none` 会导致尺寸为 0）。
- **未就绪的 setOption**：初始化前调用 `setOption` 会将配置入队，`init` 成功后依次回放；`dispose` 会清空该队列。
- **SSR**：`bindGlobalResize` 以 `typeof window === 'undefined'` 守卫，`tryOnMounted` / `tryOnBeforeUnmount` 仅在客户端执行；初始化不对 `document` 直接操作，SSR 下安全。
- **`isDark` 重建**：主题切换重建依赖容器仍存在且尺寸有效，否则 `init()` 会被跳过；回填使用 `getOption()` 的解析结果，可能与原始配置略有差异。
- **`renderer: 'svg'`**：`setup.ts` 仅注册 `CanvasRenderer`，使用 `'svg'` 前需自行 `echarts.use([SvgRenderer])`。
- **`debug` 注释与默认值不一致**：源码注释写「默认读 `import.meta.env.DEV`」，但实际默认值为 `false`（`useEcharts.ts:96`），调试日志默认关闭。

---

## 浏览器兼容性

- 依赖 `ResizeObserver`、`requestAnimationFrame`、Canvas 2D（或 SVG），需支持上述能力的现代浏览器（Chrome / Edge / Firefox / Safari 最新版）。
- 目标为 ECharts 6 支持的现代常青浏览器，**不支持 IE**。
- `useEcharts` 在缺少 `requestAnimationFrame` 时会退化为同步 resize，但 `ResizeObserver` 缺失时不注册容器监听（源码仅在 `typeof ResizeObserver !== 'undefined'` 时启用）。
