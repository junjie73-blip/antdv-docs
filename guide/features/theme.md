# 主题系统

本项目提供了灵活强大的主题定制能力，支持 **亮色/暗色切换**、**多套主题风格**、**自定义主题色**、**圆角调节** 以及 **无障碍辅助模式**。

## 主题架构总览

```
App.vue
  └── ConfigProvider (:theme="themeConfig")
        ├── algorithm（defaultAlgorithm / darkAlgorithm）
        ├── token（Design Token）
        └── components（组件级覆盖）

settings/theme.ts
  └── getThemeConfig(style, isDark, appSetting) → ThemeConfig
```

---

## 亮色/暗色模式切换

### 切换原理

暗色模式通过两套机制协同工作：

1. **HTML class 切换** — 为 `<html>` 元素添加/移除 `dark` 类，驱动 Tailwind CSS 暗色样式
2. **Antdv Next Algorithm 切换** — 将 `darkAlgorithm` 注入 ConfigProvider，驱动组件库暗色主题

### 实现代码

```vue
<!-- App.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { getThemeConfig } from '~/settings'
import { useAppStore } from '~/stores/modules/app'

const appStore = useAppStore()

// 生成 Antdv Next 主题配置
const themeConfig = computed(() => getThemeConfig(
  appStore.themeStyle,
  appStore.themeMode === 'dark',  // 是否暗色
  appStore.appSetting,
))

// HTML class 管理（驱动 Tailwind 暗色模式）
watchEffect(() => {
  const html = document.documentElement
  html.classList.toggle('dark', appStore.themeMode === 'dark')
  html.classList.toggle('color-weak', appStore.colorWeak)
  html.classList.toggle('gray-mode', appStore.grayMode)
})
</script>
```

### 切换方法

```ts
// stores/modules/app.ts —— 通过 updateSetting 写入主题模式
const appStore = useAppStore()

appStore.updateSetting({ theme: 'dark' })
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useAppStore } from '~/stores/modules/app'
import { useThemeTransition } from '~/composables/web/useThemeTransition'
import { cn } from '~/utils/cn'

const appStore = useAppStore()
const { toggleThemeWithAnimation } = useThemeTransition()

const cardClassName = cn(
  'bg-white', 'text-gray-900', 'shadow-sm',
  'dark:bg-gray-800', 'dark:text-gray-100',
)
</script>

<template>
  <a-button @click="toggleThemeWithAnimation($event)">
    {{ appStore.themeMode === 'dark' ? '🌙 暗色' : '☀️ 亮色' }}
  </a-button>
  <div :class="cardClassName">自适应明暗的内容卡片</div>
</template>
```

---

## 11 种主题风格说明

主题风格（`ThemeStyle`）由 `AppSetting.themeStyle` 控制，项目内置 **11 种风格**。除配色、圆角由 `getThemeConfig` 统一输出外，各风格的差异化外观主要通过布局层的 CSS 类（如 `sidebar-geek`）实现。

### 风格一览表

| 风格 Key | 说明 |
|----------|------|
| `default` | 默认风格 |
| `dark` | 暗黑风格 |
| `compact` | 紧凑风格 |
| `mui` | 类 Material Design 风格 |
| `shadcn` | 类 shadcn 风格 |
| `cartoon` | 卡通风格 |
| `illustration` | 插画风格 |
| `bootstrap` | 类 Bootstrap 风格 |
| `skeuomorphism` | 拟物化风格 |
| `glass` | 玻璃拟态风格 |
| `geek` | 极客风格 |

### 主题配置生成

`getThemeConfig(style, isDark, appSetting)` 是唯一的主题配置出口：

```ts
// src/settings/theme.ts
export function getThemeConfig(style: ThemeStyle, isDark: boolean, appSetting: AppSetting): ThemeConfig {
  const preset: ThemeConfig = {
    algorithm: defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 6,
    },
  }

  const algorithm = []
  if (isDark && style !== 'dark') {
    algorithm.push(darkAlgorithm)
  } else {
    algorithm.push(defaultAlgorithm)
  }

  const token = {
    ...preset.token,
    fontSize: appSetting?.fontSize || 16,
    borderRadius: appSetting?.borderRadius * 8, // 圆角倍率 × 8
    colorPrimary: appSetting?.primaryColor,
  }
  if (isDark) {
    token.colorBgContainer = '#101828'
  }

  return { algorithm, token, components: preset.components }
}
```

---

## 自定义主题色配置

### 通过 SettingDrawer 配置

项目内置 **设置抽屉 (SettingDrawer)**，可在界面中实时调整主题色：

```vue
<!-- LayoutHeader.vue 中的触发入口 -->
<a-button @click="showSetting = true">
  <Icon icon="carbon:settings" /> 设置
</a-button>
<SettingDrawer v-model:open="showSetting" />
```

### 代码中动态修改

```ts
import { useAppStore } from '~/stores/modules/app'

const appStore = useAppStore()

// 修改主题色
appStore.updateSetting({ primaryColor: '#722ed1' })

// 修改圆角倍率（0 / 0.25 / 0.5 / 0.75 / 1）
appStore.updateSetting({ borderRadius: 0.75 })

// 切换主题风格
appStore.updateSetting({ themeStyle: 'geek' })

// 切换明暗
appStore.updateSetting({ theme: 'dark' })
```

### CSS 变量同步

主题色变更时会同步更新 CSS 变量，确保非组件库部分也能感知变化：

```ts
// App.vue
watch(
  () => appStore.primaryColor,
  (color) => {
    document.documentElement.style.setProperty('--ant-color-primary', color)
  },
  { immediate: true },
)
```

### 在样式中使用 CSS 变量

```css
/* 自定义组件可引用 Antdv Next 的 CSS 变量 */
.my-custom-button {
  background-color: var(--ant-color-primary);
  border-radius: var(--ant-border-radius);
}
```

---

## 圆角设置

全局圆角通过 `borderRadius` 配置项控制，它表示 **圆角倍率**，在 `getThemeConfig` 中乘以 8 后写入 Antdv Next 的 `token.borderRadius`：

```ts
// 可选倍率：0 / 0.25 / 0.5 / 0.75 / 1（默认 0.5，即 4px）
const borderRadiusOptions = [
  { label: '无圆角', value: 0 },
  { label: '小圆角', value: 0.25 },
  { label: '默认圆角', value: 0.5 },
  { label: '中大圆角', value: 0.75 },
  { label: '大圆角', value: 1 },
]

// 使用
appStore.updateSetting({ borderRadius: 0.75 })
```

---

## 色弱模式

色弱模式通过 CSS 滤镜实现，帮助色觉障碍用户更好地识别界面内容：

```ts
// App.vue 中的 class 处理
html.classList.toggle('color-weak', appStore.colorWeak)

// 全局 CSS（通常在 base 样式中定义）
html.color-weak {
  filter: invert(80%);
}
```

### 切换方法

```ts
appStore.toggles.colorWeak()
```

### 效果说明

启用色弱模式后，整个页面会应用颜色反转滤镜，提高色彩对比度，使色弱用户能区分原本难以分辨的颜色差异。

---

## 灰度模式

灰度模式将整个界面转为灰色调，适用于特殊场景（如哀悼日）：

```ts
// App.vue 中的 class 处理
html.classList.toggle('gray-mode', appStore.grayMode)

// 全局 CSS
html.gray-mode {
  filter: grayscale(100%);
}
```

### 切换方法

```ts
appStore.toggles.grayMode()
```

---

## 水印功能

项目集成了 `watermark-plus` 库，支持页面水印功能。

### 配置项

```ts
// settings/index.ts
export const DEFAULT_SETTING: AppSetting = {
  enableWatermark: false,              // 是否启用水印
  watermarkContent: 'Admin',           // 水印文字内容
}
```

### useWatermark 组合式函数

```ts
// src/composables/web/useWatermark.ts
import { useWatermark } from '~/composables/web/useWatermark'

const {
  watermarkInstance,
  createWatermark,     // 创建水印
  destroyWatermark,    // 销毁水印
  updateWatermark,     // 更新水印内容
} = useWatermark({
  content: watermarkContent,  // 水印文字
  enabled: enableWatermark,  // 是否启用
})
```

### 默认水印参数

```ts
const defaultOptions = {
  width: 200,          // 水印宽度
  height: 150,         // 水印高度
  rotate: 330,         // 旋转角度
  alpha: 0.15,         // 透明度
  fontSize: 14,        // 字体大小
  fontWeight: 'normal',
  fontFamily: 'sans-serif',
  color: '#666666',    // 水印颜色
}
```

### 在布局中使用

```vue
<!-- DefaultLayout.vue -->
<script setup lang="ts">
import { useWatermark } from '~/composables/web/useWatermark'
import { useAppStore } from '~/stores/modules/app'

const appStore = useAppStore()

useWatermark({
  content: computed(() => appStore.watermarkContent),
  enabled: computed(() => appStore.enableWatermark),
})
</script>
```

### 动态控制

```ts
// 切换水印开关
appStore.toggles.enableWatermark()

// 修改水印文字
appStore.updateSetting({ watermarkContent: '机密文件' })
```

---

## CSS 变量体系

Antdv Next 基于 Design Token 体系运行，所有设计参数都映射为 CSS 变量。以下是常用的 CSS 变量：

### 颜色变量

| CSS 变量 | 说明 | 默认值 |
|----------|------|--------|
| `--ant-color-primary` | 主题色 | `#1677ff` |
| `--ant-color-success` | 成功色 | `#52c41a` |
| `--ant-color-warning` | 警告色 | `#faad14` |
| `--ant-color-error` | 错误色 | `#ff4d4f` |
| `--ant-color-info` | 信息色 | `#1677ff` |
| `--ant-color-text-base` | 基础文本色 | `rgba(0, 0, 0, 0.88)` |
| `--ant-color-bg-container` | 容器背景色 | `#ffffff` |
| `--ant-color-bg-elevated` | 浮层背景色 | `#ffffff` |
| `--ant-color-border` | 边框色 | `#d9d9d9` |

### 尺寸变量

| CSS 变量 | 说明 |
|----------|------|
| `--ant-border-radius` | 全局圆角 |
| `--ant-font-family` | 字体族 |
| `--ant-font-size` | 基础字号 |
| `--ant-control-height` | 控件高度 |

### 自定义 CSS 变量覆盖

```vue
<style scoped>
.custom-panel {
  /* 使用 Antdv Next 的 CSS 变量保持一致 */
  background-color: var(--ant-color-bg-container);
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  color: var(--ant-color-text-base);
}

.custom-panel:hover {
  border-color: var(--ant-color-primary);
}
</style>
```

---

## 主题切换动画

主题切换使用浏览器 **View Transition API** 实现圆形扩散/收缩动画，见 `src/composables/web/useThemeTransition.ts`：

```ts
import { useThemeTransition } from '~/composables/web/useThemeTransition'

const { switchThemeWithAnimation, toggleThemeWithAnimation, isDarkNow } = useThemeTransition()

// 切换到指定主题（event 用于计算动画扩散中心）
await switchThemeWithAnimation('dark', event)

// 取反当前主题
await toggleThemeWithAnimation(event)
```

核心流程：

1. 调用 `document.startViewTransition()`，在回调中**同步**切换 `<html>` 的 `dark` 类与 `color-scheme`
2. 用 `clipPath: circle(...)` 配合 `::view-transition-new(root)` / `::view-transition-old(root)` 实现扩散（切暗）或收缩（切亮）
3. 动画结束后再 `updateSetting({ theme })` 同步 store，避免响应式干扰快照
4. 浏览器不支持 `startViewTransition` 时降级为直接切换

---

## 完整配置参考

```ts
// types/app.d.ts — AppSetting 完整接口
interface AppSetting {
  /** 主题模式：light / dark / auto */
  theme: ThemeMode
  /** 主题风格 */
  themeStyle: ThemeStyle
  /** 主题色 */
  primaryColor: string
  /** 圆角倍率：0 / 0.25 / 0.5 / 0.75 / 1 */
  borderRadius: number
  /** 基础字号（px） */
  fontSize: number
  /** 侧边栏暗色 */
  darkSidebar: boolean
  /** 顶栏暗色 */
  darkHeader: boolean
  /** 色弱模式 */
  colorWeak: boolean
  /** 灰度模式 */
  grayMode: boolean

  /* ---------- 布局 ---------- */
  layout: LayoutMode
  sidebarCollapsed: boolean
  sidebarWidth: number
  /** 菜单手风琴：仅展开一个子菜单 */
  menuAccordion: boolean
  showTabs: boolean
  tabShowIcon: boolean
  showBreadcrumb: boolean
  hideBreadcrumbWhenOnlyOne: boolean
  showBreadcrumbIcon: boolean

  /* ---------- 小部件 ---------- */
  widgetNotice: boolean
  widgetFullscreen: boolean
  widgetTheme: boolean
  widgetTimezone: boolean
  widgetLogout: boolean
  widgetSearch: boolean
  widgetPreferences: boolean

  /* ---------- 底栏 ---------- */
  showFooter: boolean
  showCopyright: boolean
  copyrightCompany: string
  copyrightIcp: string

  /* ---------- 通用 ---------- */
  componentSize: ComponentSize
  timezone: string
  enableWatermark: boolean
  watermarkContent: string
  enableWaterRipple: boolean
  notificationPosition: NotificationPosition
  transitionEffect: TransitionEffect
  /** 页面切换进度条 */
  showProgressBar: boolean
  locale: string
  /** 页面切换 Loading */
  showLoading: boolean
}
```
