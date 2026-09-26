# Loading 加载

`Loading` 目录围绕 Antdv Next `Spin` 封装了一套加载能力，共包含 **5 种彼此独立的用法**，请按场景选用：

| 形态 | 引入方式 | 说明 |
|------|----------|------|
| `Loading` 组件 | `import { Loading } from '~/components/common/Loading'` | 遮罩式加载，支持全屏 / 容器内（`absolute`） |
| `PageLoading` 组件 | `import PageLoading from '~/components/common/Loading/PageLoading.vue'` | 布局层整页加载，绝对定位于父容器 |
| `RouteLoadingBar` 组件 | `import RouteLoadingBar from '~/components/common/Loading/RouteLoadingBar.vue'` | 顶部路由进度条，自动监听路由变化 |
| `v-loading` 指令 | `import { vLoading } from '~/components/common/Loading'` | 在元素上直接声明加载态 |
| 函数式 API | `useLoading` / `createLoading` / `createFullscreenLoading` / `createContainerLoading` | 在组件外或 setup 中编程式控制加载 |

> `~/components/common/Loading` 的 `index.ts` 只导出 `Loading`、`useLoading`、`createLoading`、`createFullscreenLoading`、`createContainerLoading`、`vLoading` 与相关类型；`PageLoading`、`RouteLoadingBar` **未从入口导出**，需按文件路径引入。

## Loading 组件

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { Loading } from '~/components/common/Loading'

const loading = ref(false)
</script>

<template>
  <!-- 容器内加载：父元素需为定位元素 -->
  <div class="relative h-40">
    <Loading :loading="loading" :absolute="true" tip="加载中..." />
  </div>

  <!-- 全屏加载 -->
  <Loading :loading="loading" theme="dark" background="rgba(0,0,0,0.6)" />
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `tip` | 加载提示文本 | `string` | - |
| `size` | 尺寸 | `'default' \| 'small' \| 'large'` | `'default'` |
| `absolute` | 是否容器内绝对定位（`false` 为全屏） | `boolean` | `false` |
| `loading` | 是否显示 | `boolean` | `false` |
| `background` | 自定义背景色 | `string` | - |
| `theme` | 主题色（设置 `background` 时以背景色为准） | `'light' \| 'dark'` | `'light'` |

> 提示文本的 prop 名是 `tip`，不是 `description`。

## PageLoading 页面加载

布局层整页加载遮罩，绝对定位铺满最近的定位父元素（`inset-0`），带背景模糊与深浅色自适应。

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

import PageLoading from '~/components/common/Loading/PageLoading.vue'

const isRouteLoading = ref(false)
</script>

<template>
  <main class="relative">
    <PageLoading :loading="isRouteLoading" text="页面加载中..." />
    <router-view />
  </main>
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `loading` | 是否显示 | `boolean` | `false` |
| `text` | 加载提示文本 | `string` | `'页面加载中...'` |

> 内部通过 `appStore.themeMode` 判断深浅色；父容器需要 `position: relative`/`absolute`，否则遮罩会铺满错误的区域。

## RouteLoadingBar 路由进度条

固定在页面顶部的进度条，自动监听路由变化：`route.path` 变化与 `onBeforeRouteUpdate` 都会启动加载，并在最短时长后完成。

### 基础用法

```vue
<script setup lang="ts">
import RouteLoadingBar from '~/components/common/Loading/RouteLoadingBar.vue'
</script>

<template>
  <RouteLoadingBar :height="3" :show-percentage="true" :cancellable="true" />
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `color` | 进度条颜色（为空时按主题与状态自动取色） | `string` | `''` |
| `height` | 高度（px） | `number` | `3` |
| `duration` | 进度递增 / 过渡间隔（ms） | `number` | `300` |
| `enabled` | 是否启用 | `boolean` | `true` |
| `showComplete` | 是否延长完成态停留时间 | `boolean` | `true` |
| `showPercentage` | 是否显示百分比文字 | `boolean` | `false` |
| `cancellable` | 是否显示取消按钮 | `boolean` | `false` |
| `slowThreshold` | 慢加载告警阈值（ms），`0` 关闭 | `number` | `3000` |

### 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `cancel` | 用户点击取消 | - |
| `retry` | 用户点击重试 | - |
| `slow` | 超过 `slowThreshold` 仍加载中 | `(duration: number) => void` |

### 组件实例方法

通过 ref 调用：

```ts
const barRef = ref<InstanceType<typeof RouteLoadingBar>>()

barRef.value?.start()    // 开始
barRef.value?.complete() // 完成
barRef.value?.error()    // 失败（红色并保持 3s）
barRef.value?.stop()     // 停止计时器
barRef.value?.cancel()   // 取消（需 cancellable）
barRef.value?.retry()    // 重试
```

| 方法 | 说明 |
|------|------|
| `start` | 开始加载 |
| `complete` | 正常完成 |
| `error` | 标记为加载失败 |
| `stop` | 停止并清理计时器（不重置状态） |
| `cancel` | 取消加载并重置 |
| `retry` | 重置后重新开始 |

## v-loading 指令

在任意元素上声明加载态，样式配置通过元素属性传入。

### 基础用法

```vue
<template>
  <div v-loading="isLoading" loading-tip="加载中..." loading-theme="dark" loading-size="large">
    内容区域
  </div>

  <!-- 全屏 / 挂载到 body -->
  <div v-loading.fullscreen="isLoading">内容区域</div>
</template>
```

| 元素属性 | 说明 | 取值 |
|----------|------|------|
| `loading-tip` | 提示文本 | `string` |
| `loading-background` | 背景色 | `string` |
| `loading-theme` | 主题 | `'light' \| 'dark'` |
| `loading-size` | 尺寸 | `'default' \| 'small' \| 'large'` |

| 修饰符 | 说明 |
|--------|------|
| `.fullscreen` | 全屏加载（等同挂载到 body） |
| `.body` | 挂载到 body |

> 非 body / 全屏模式下，指令会为宿主元素自动补 `position: relative`（仅当其为 `static` 时）。

## 函数式 API（useLoading / createLoading）

四种函数式 API 共用同一套配置项与实例方法。

### useLoading

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

import { useLoading } from '~/components/common/Loading'

const containerRef = useTemplateRef<HTMLElement>()

const loading = useLoading({
  target: () => containerRef.value!,
  body: false,
  tip: '加载中...',
})

async function submit() {
  loading.open()
  await doSomething()
  loading.close()
}
</script>
```

返回值 `LoadingInstance`：

| 方法 | 说明 |
|------|------|
| `open` | 打开加载 |
| `close` | 关闭加载（延迟 300ms 销毁，等待动画） |
| `setTip` | 动态修改提示文本 |
| `setLoading` | 动态设置加载状态 |

### createLoading

在组件外（如路由守卫、请求拦截器）创建实例，默认全屏：

```ts
import { createLoading } from '~/components/common/Loading'

const instance = createLoading({
  tip: '正在处理请求...',
  theme: 'dark',
  background: 'rgba(0, 0, 0, 0.6)',
  onClose: () => {
    // 关闭后的回调
  },
})

instance.open()
instance.setTip('即将完成...')
instance.close() // 关闭并销毁
```

### 快捷方法

| 方法 | 说明 | 签名 |
|------|------|------|
| `createFullscreenLoading` | 创建全屏实例 | `(tip?: string, options?) => LoadingInstance` |
| `createContainerLoading` | 创建容器内实例 | `(target: HTMLElement \| string, tip?: string, options?) => LoadingInstance` |

### 配置项

`UseLoadingOptions`（`createLoading` 在此基础上多一个 `onClose`）：

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `target` | 目标容器（CSS 选择器或元素） | `HTMLElement \| string` | `document.body` |
| `body` | 是否挂载到 body（全屏） | `boolean` | `true` |
| `wrapClass` | 包装器类名 | `string` | - |
| `tip` | 加载提示文本 | `string` | - |
| `size` | 尺寸 | `'default' \| 'small' \| 'large'` | `'default'` |
| `absolute` | 是否容器内绝对定位 | `boolean` | `false` |
| `loading` | 初始加载状态 | `boolean` | `false` |
| `background` | 自定义背景色 | `string` | - |
| `theme` | 主题色 | `'light' \| 'dark'` | `'light'` |
| `onClose` | 关闭回调（仅 `createLoading`） | `() => void` | - |

## 典型使用场景

### 表格数据加载

优先使用 Antdv Next `Table`/`a-spin` 的 `loading` 属性；需要统一遮罩风格时用 `Loading`：

```vue
<div class="relative">
  <BasicTable :api="fetchApi" />
  <Loading :loading="tableLoading" :absolute="true" />
</div>
```

### 请求拦截器全局加载

```ts
let requestLoading: LoadingInstance | null = null

request.interceptors.request.use((config) => {
  requestLoading = createLoading({ tip: '请求中...' })
  requestLoading.open()
  return config
})

request.interceptors.response.use(
  (response) => {
    requestLoading?.close()
    return response
  },
  (error) => {
    requestLoading?.close()
    return Promise.reject(error)
  },
)
```
