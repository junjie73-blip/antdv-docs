# Auth 认证组件族

一组用于构建登录 / 注册页的「品牌面板 + 表单面板」组合式组件，配套一个集中管理样式的组合式函数 `useAuthStyles`。它们不处理任何认证逻辑，只负责视觉呈现与槽位编排——表单校验、接口请求、路由跳转等仍由页面自行实现。

## 概述

认证页的本质是「左品牌、右表单」的双栏卡片：桌面端左右分栏（`grid-cols-5`，品牌占 2、表单占 3），移动端品牌面板隐藏、仅保留表单面板内的紧凑 Logo。整族组件围绕这一结构拆分：

- **背景层**：`AuthBackground` 铺满视口的渐变、光斑、网格、噪点等装饰，`aria-hidden` 且 `pointer-events-none`。
- **品牌层**：`AuthBrandPanel` 内部组合 `AuthBrandLogo` → `AuthFeatureTags` → `AuthBrandStats`（可选）→ `AuthBrandPreview`。
- **表单层**：`AuthFormPanel` 提供右侧容器与移动端 Logo，内部通过默认插槽放入 `AuthHeader`、原生表单以及 `AuthFooterLink` / `AuthDivider` / `AuthSocialLogin` / `AuthTrustBadges` 等附属块。
- **样式层**：所有类名集中在 `useAuthStyles`，组件本身不散落样式字符串。

`AuthBrandPanel`、`AuthFormPanel`、`AuthBackground` 是页面直接使用的「骨架」，其余为骨架内部或页面内按需拼装的「零件」。

## 组件清单

| 组件 | 文件 | 职责 |
|------|------|------|
| `AuthBackground` | `Auth/components/AuthBackground.vue` | 铺满视口的装饰性背景层（渐变 / 光斑 / 网格 / 噪点等 9 层），无 props |
| `AuthBrandPanel` | `Auth/components/AuthBrandPanel.vue` | 左侧品牌面板骨架，组合 Logo、标题、特性、指标与预览 |
| `AuthBrandLogo` | `Auth/components/AuthBrandLogo.vue` | 品牌 Logo + 标题胶囊，被 `AuthBrandPanel` 内部使用 |
| `AuthBrandPreview` | `Auth/components/AuthBrandPreview.vue` | 品牌面板底部的「窗口占位 + 版权」装饰，被 `AuthBrandPanel` 内部使用 |
| `AuthBrandStats` | `Auth/components/AuthBrandStats.vue` | 品牌面板的三列数据指标，被 `AuthBrandPanel` 内部使用 |
| `AuthFeatureTags` | `Auth/components/AuthFeatureTags.vue` | 品牌面板的特性胶囊标签组，被 `AuthBrandPanel` 内部使用 |
| `AuthFormPanel` | `Auth/components/AuthFormPanel.vue` | 右侧表单面板骨架，含移动端 Logo 与默认插槽 |
| `AuthHeader` | `Auth/components/AuthHeader.vue` | 表单头部：徽标 + 主标题 + 副标题 |
| `AuthFooterLink` | `Auth/components/AuthFooterLink.vue` | 底部「xxx？立即 yyy」跳转提示，点击触发 `action` 事件 |
| `AuthDivider` | `Auth/components/AuthDivider.vue` | 带默认插槽的分隔线（默认文案「或」） |
| `AuthSocialLogin` | `Auth/components/AuthSocialLogin.vue` | 第三方登录图标按钮组，点击回调 `click` 事件 |
| `AuthTrustBadges` | `Auth/components/AuthTrustBadges.vue` | 底部信任标识（默认 SSL 加密 / 隐私保护 / 数据隔离） |

> 全部 12 个组件均已通过 `unplugin-vue-components` 全局自动注册（见 `frontend/types/components.d.ts`），页面中可直接以标签形式使用，无需手动 import。

## 逐组件说明

### AuthBackground

装饰性背景层，渲染 9 个绝对定位的图层（径向渐变底、上下角光晕、4 个流动光斑、3 个同心圆环、对角光束、网格、点阵、漂浮点、噪点纹理）。根节点带 `aria-hidden="true"`，整体不接收指针事件。

**Props**

无。

**Emits**

无。

**Slots**

无。

**关键行为**

- 所有类名来自 `useAuthStyles`，本身不含任何可配置项。
- 需置于认证页根容器（`containerClassName`，`relative isolate`）内部，依赖父级定位铺满。

### AuthBrandPanel

左侧品牌面板骨架，纵向堆叠 Logo、标题区、特性标签、可选指标与底部预览。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `appTitle` | 应用标题，透传给 Logo 与预览版权 | `string` | -（必填） |
| `logo` | Logo 图片地址，用于 `img.src` 与 `alt` | `string` | -（必填） |
| `headline` | 主标题，支持用 `\n` 换行（`whitespace-pre-line`） | `string` | -（必填） |
| `subhead` | 副标题 | `string` | -（必填） |
| `features` | 特性胶囊列表 | `AuthFeature[]` | -（必填） |
| `stats` | 数据指标列表 | `AuthStat[]` | `[]` |

**Emits**

无。

**Slots**

无。

**关键行为**

- `stats` 经 `hasStats`（`length > 0`）判断，为空时不渲染 `AuthBrandStats`。
- 当前年份 `new Date().getFullYear()` 在组件内部计算并传给 `AuthBrandPreview`。
- 桌面端容器为 `hidden lg:flex lg:col-span-2`，小屏隐藏。

### AuthBrandLogo

品牌 Logo 胶囊，展示图标与标题。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `title` | 标题文本，同时作为图片 `alt` | `string` | -（必填） |
| `logo` | Logo 图片地址 | `string` | -（必填） |

**Emits**

无。

**Slots**

无。

**关键行为**

- 仅被 `AuthBrandPanel` 内部使用，未在业务视图中直接引用。

### AuthBrandPreview

品牌面板底部的窗口占位装饰，含三色控制点、占位线条与版权行。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `year` | 版权年份 | `number` | -（必填） |
| `appTitle` | 版权署名中的应用名 | `string` | -（必填） |

**Emits**

无。

**Slots**

无。

**关键行为**

- 仅被 `AuthBrandPanel` 内部使用，且永远渲染（无开关）。

### AuthBrandStats

三列数据指标，顶部带分隔线。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `stats` | 指标列表 | `AuthStat[]` | -（必填） |
| `className` | 追加类名 | `string` | - |

**Emits**

无。

**Slots**

无。

**类型**

```ts
export interface AuthStat {
  icon: string   // Iconify 图标名
  value: string  // 指标数值
  label: string  // 指标说明
}
```

**关键行为**

- 以 `stat.label` 作为 `v-for` 的 key。
- 仅被 `AuthBrandPanel` 内部使用。

### AuthFeatureTags

可换行的特性胶囊标签组。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `features` | 特性列表 | `AuthFeature[]` | -（必填） |
| `className` | 追加类名 | `string` | - |

**Emits**

无。

**Slots**

无。

**类型**

```ts
export interface AuthFeature {
  icon: string  // Iconify 图标名
  text: string  // 特性文案
}
```

**关键行为**

- 以 `feature.text` 作为 `v-for` 的 key。
- 仅被 `AuthBrandPanel` 内部使用。

### AuthFormPanel

右侧表单面板骨架，含小屏可见的紧凑 Logo 与默认插槽。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `appTitle` | 移动端 Logo 旁的应用名 | `string` | -（必填） |
| `logo` | 移动端 Logo 图片地址 | `string` | -（必填） |

**Emits**

无。

**Slots**

| 插槽名 | 说明 |
|--------|------|
| `default` | 表单面板内容，通常为 `AuthHeader` + 表单 + 附属块 |

**关键行为**

- 移动端 Logo 容器带 `lg:hidden`，桌面端隐藏。
- 内部内容宽度受限于 `formWrapClassName`（`max-w-[360px]`）。

### AuthHeader

表单头部，展示徽标、主标题与副标题。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `badgeText` | 徽标文案 | `string` | -（必填） |
| `title` | 主标题 | `string` | -（必填） |
| `subtitle` | 副标题 | `string` | -（必填） |
| `className` | 追加类名 | `string` | - |

**Emits**

无。

**Slots**

无。

### AuthFooterLink

底部操作提示，形如「还没有账号？立即注册」。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `text` | 前置说明文本 | `string` | -（必填） |
| `actionText` | 操作按钮文本 | `string` | -（必填） |
| `className` | 追加类名 | `string` | - |

**Emits**

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `action` | 点击操作按钮时触发 | - |

**Slots**

无。

### AuthDivider

居中分隔线，中缝显示插槽内容。

**Props**

无。

**Emits**

无。

**Slots**

| 插槽名 | 说明 |
|--------|------|
| `default` | 中缝内容，缺省为「或」 |

### AuthSocialLogin

第三方登录图标按钮组，固定四列网格。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `items` | 第三方登录项列表 | `SocialItem[]` | -（必填） |
| `className` | 追加类名 | `string` | - |

**Emits**

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `click` | 点击某个第三方按钮时触发 | `(key: string) => void` |

**Slots**

无。

**类型**

```ts
export interface SocialItem {
  key: string           // 唯一标识，随 click 事件回传
  label: string         // 名称，用于按钮 title 提示
  icon: string          // Iconify 图标名
  iconClassName: string // Tailwind 颜色类，如 'text-[#07C160]'
}
```

**关键行为**

- `v-for` 以 `item.key` 作为 key。
- 按钮 `title` 固定为 `使用 {label} 登录`。
- 图标类名由 `socialIconClassName` 与 `item.iconClassName` 经 `cn` 合并。

### AuthTrustBadges

底部信任标识行，可换行居中。

**Props**

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `badges` | 信任标识列表 | `TrustBadge[]` | `[SSL 加密 / 隐私保护 / 数据隔离]`（见下） |
| `className` | 追加类名 | `string` | - |

默认值：

```ts
[
  { icon: 'carbon:locked', text: 'SSL 加密' },
  { icon: 'carbon:shield-alert', text: '隐私保护' },
  { icon: 'carbon:data-base', text: '数据隔离' },
]
```

**Emits**

无。

**Slots**

无。

**类型**

```ts
export interface TrustBadge {
  icon: string  // Iconify 图标名
  text: string  // 标识文案
}
```

**关键行为**

- 以 `badge.text` 作为 `v-for` 的 key。

## useAuthStyles 组合式函数

集中托管认证页全部样式类名，供上述组件与页面复用。

**签名**

```ts
export function useAuthStyles(): AuthStyles

// 兼容别名
export const useLoginStyles = useAuthStyles
```

**参数**

无。

**返回值**

返回一个对象，键对应各类名。其中 `containerClassName` 为 `ComputedRef<string>`（响应式），其余为 `string`：

| 分组 | 键 |
|------|----|
| 容器 | `containerClassName`（ComputedRef）、`bgLayerClassName` |
| 背景层 | `bgGradientClassName`、`blob1ClassName`、`blob2ClassName`、`blob3ClassName`、`blob4ClassName`、`gridClassName`、`dotsClassName`、`ring1ClassName`、`ring2ClassName`、`ring3ClassName`、`raysClassName`、`cornerGlowTopClassName`、`cornerGlowBottomClassName`、`sparklesClassName`、`noiseClassName` |
| 卡片 | `cardClassName` |
| 品牌面板 | `brandPanelClassName`、`brandGlowClassName`、`brandGridClassName`、`brandContentClassName`、`brandLogoClassName`、`brandLogoIconClassName`、`brandFeatureClassName`、`brandPreviewClassName` |
| 表单面板 | `formPanelClassName`、`formWrapClassName`、`formHeaderBadgeClassName`、`inputClassName`、`submitButtonClassName` |
| 第三方 / 信任 | `socialButtonClassName`、`socialIconClassName`、`trustBadgeClassName` |

**用途**

页面只需从 `useAuthStyles` 取用容器、卡片、输入框、提交按钮等类名，组件则取用各自分区类名，从而让样式集中、可统一调整。页面典型用法：

```ts
const { containerClassName, cardClassName, inputClassName, submitButtonClassName } = useAuthStyles()
```

> 别名 `useLoginStyles` 目前无业务引用；`views/login/composables/useLoginStyles.ts` 是本仓库另一个同名但不同的组合式函数，勿混淆。

## 完整使用示例

以下示例还原登录页的组合方式（省略表单校验与接口逻辑）：

```vue
<script setup lang="ts">
import { ref } from 'vue'

import logoIconUrl from '~/assets/images/logo.png'
import AuthBackground from '~/components/common/Auth/components/AuthBackground.vue'
import AuthBrandPanel from '~/components/common/Auth/components/AuthBrandPanel.vue'
import AuthDivider from '~/components/common/Auth/components/AuthDivider.vue'
import AuthFooterLink from '~/components/common/Auth/components/AuthFooterLink.vue'
import AuthFormPanel from '~/components/common/Auth/components/AuthFormPanel.vue'
import AuthHeader from '~/components/common/Auth/components/AuthHeader.vue'
import AuthSocialLogin from '~/components/common/Auth/components/AuthSocialLogin.vue'
import AuthTrustBadges from '~/components/common/Auth/components/AuthTrustBadges.vue'
import { useAuthStyles } from '~/components/common/Auth/composables/useAuthStyles'

const appTitle = import.meta.env.VITE_APP_TITLE || 'Antdv Next Admin'
const { containerClassName, cardClassName, inputClassName, submitButtonClassName } = useAuthStyles()

const brandFeatures = [
  { icon: 'carbon:flash', text: '极速开发体验' },
  { icon: 'carbon:color-palette', text: '现代化 UI 设计' },
  { icon: 'carbon:security', text: '企业级安全' },
]

const brandStats = [
  { icon: 'carbon:user-multiple', value: '10K+', label: 'Active Users' },
  { icon: 'carbon:application', value: '500+', label: 'Deployments' },
  { icon: 'carbon:star', value: '4.9', label: 'Rating' },
]

const socialLogins = [
  { key: 'wechat', label: '微信', icon: 'ri:wechat-fill', iconClassName: 'text-[#07C160]' },
  { key: 'github', label: 'GitHub', icon: 'mdi:github', iconClassName: 'text-slate-800 dark:text-slate-200' },
  { key: 'google', label: 'Google', icon: 'flat-color-icons:google', iconClassName: '' },
  { key: 'gitee', label: 'Gitee', icon: 'simple-icons:gitee', iconClassName: 'text-[#C71D23]' },
]

const username = ref('')
const password = ref('')

function handleLogin() {
  // 表单提交逻辑
}

function handleSocialLogin(key: string) {
  // key 为 SocialItem.key
  console.log(key)
}

function handleRegister() {
  // 跳转注册
}
</script>

<template>
  <div :class="containerClassName">
    <AuthBackground />

    <div :class="cardClassName">
      <!-- 左侧品牌 -->
      <AuthBrandPanel
        :app-title="appTitle"
        :logo="logoIconUrl"
        headline="欢迎登录&#10;管理平台"
        subhead="或许我们只是差点运气"
        :features="brandFeatures"
        :stats="brandStats"
      />

      <!-- 右侧表单 -->
      <AuthFormPanel :app-title="appTitle" :logo="logoIconUrl">
        <AuthHeader badge-text="账号密码登录" title="登录" subtitle="请输入用户名 · 请输入密码" />

        <a-form layout="vertical" @finish="handleLogin">
          <a-form-item class="!mb-4">
            <a-input v-model:value="username" size="large" placeholder="用户名" :class="inputClassName" />
          </a-form-item>
          <a-form-item class="!mb-4">
            <a-input-password v-model:value="password" size="large" placeholder="密码" :class="inputClassName" />
          </a-form-item>

          <a-button
            type="primary"
            html-type="submit"
            size="large"
            block
            :class="submitButtonClassName"
          >
            登 录
          </a-button>
        </a-form>

        <AuthFooterLink text="还没有账号？" action-text="立即注册" @action="handleRegister" />

        <AuthDivider>或使用以下方式登录</AuthDivider>

        <AuthSocialLogin :items="socialLogins" @click="handleSocialLogin" />

        <AuthTrustBadges />
      </AuthFormPanel>
    </div>
  </div>
</template>
```

> 组件已全局自动注册，上述 import 仅为显式声明依赖，可省略（`useAuthStyles` 仍需手动引入）。

## 注意事项

- **无逻辑，只负责呈现**：这组组件不含登录 / 注册 / 校验 / 请求逻辑，全部由页面实现。示例中的 `handleLogin` 等仅为占位。
- **部分组件非「公用零件」**：`AuthBrandLogo`、`AuthBrandPreview`、`AuthBrandStats`、`AuthFeatureTags` 在实际视图中**未被直接使用**，只在 `AuthBrandPanel` 内部组合。单独引用它们通常没有意义。
- **`AuthBrandPreview` 无开关**：一旦渲染 `AuthBrandPanel`，底部版权预览必然出现，无法关闭。
- **`AuthBrandPanel` 与 `AuthFormPanel` 的 `logo` / `appTitle` 需成对传入**：品牌面板与表单面板各自独立接收，页面需重复传递。
- **无 `index.ts` 桶文件**：目录未提供统一出口，只能按文件路径引用，或依赖全局自动注册。
- **`useAuthStyles` 返回值类型不一致**：仅 `containerClassName` 是 `ComputedRef<string>`，其余为普通 `string`，模板中 `:class` 均可直接使用。
- **`useLoginStyles` 别名易混淆**：`useAuthStyles.ts` 中导出的 `useLoginStyles` 别名目前无引用；`views/login/composables/useLoginStyles.ts` 是另一个独立实现，命名相同但用途不同。
- **依赖品牌主色变量**：输入框聚焦态、链接等使用 `var(--ant-color-primary)`，需保证全局主题变量已注入。

## 浏览器兼容性

组件大量依赖现代 CSS 特性，在主流现代浏览器（Chrome / Edge 111+、Safari 16.4+、Firefox 113+）中可完整呈现。低版本浏览器会**优雅降级**（背景装饰变淡或缺失、毛玻璃失效），不影响表单功能。

| 特性 | 用途 | 说明 |
|------|------|------|
| `backdrop-filter`（Tailwind `backdrop-blur-*`） | 卡片与面板毛玻璃 | 不支持时降级为半透明背景 |
| `color-mix()` | 输入框聚焦光晕 | 不支持时仅缺少外层阴影 |
| `mask-image` / `-webkit-mask-image` | 网格、点阵、光束的边缘淡出 | 源码已同时提供两种写法 |
| `mix-blend-overlay` | 噪点纹理叠加 | 不支持时噪点减弱 |
| SVG `feTurbulence`（data-uri） | 噪点纹理生成 | 现代浏览器均支持 |
| `:is()`（Tailwind 生成） | 各类原子选择器 | 现代浏览器均支持 |

> 结论：面向现代浏览器即可；若需兼容 IE 或较旧的移动端内核，请自行提供降级样式。
