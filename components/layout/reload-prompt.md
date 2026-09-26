# ReloadPrompt PWA 更新提示

**布局/应用层组件**，PWA（渐进式 Web 应用）的更新与离线就绪提示卡片。基于 `vite-plugin-pwa` 提供的 `useRegisterSW` 实现，固定在右下角展示。

它**没有对外 Props / 事件 / 插槽**，所有状态来自 Service Worker 注册器，因此应挂载在应用根部、配合布局与环境使用。

## 基础用法

在应用根组件挂载（本项目仅在 `production` 模式下渲染）：

```vue
<script setup lang="ts">
import ReloadPrompt from '~/components/layout/ReloadPrompt.vue'

const mode = import.meta.env.MODE
</script>

<template>
  <router-view />
  <ReloadPrompt v-if="mode === 'production'" />
</template>
```

## 组件 Props

无。

## 组件事件

无。

## 插槽

无。

## 行为说明

组件内部使用 `useRegisterSW` 获取三个状态：

| 状态 | 说明 |
|------|------|
| `offlineReady` | 应用已缓存到本地，可离线使用 |
| `needRefresh` | 检测到新版本，需重新加载 |
| `updateServiceWorker` | 触发更新（点击「立即更新」时调用） |

界面行为：

- 两个状态均为 `true` 时弹出右下角卡片，分「离线可用」（绿色）与「发现新版本」（蓝色）两种形态。
- 「发现新版本」时带 **10 秒倒计时**，倒计时结束会自动调用 `updateServiceWorker(true)` 完成更新；也可点击「立即更新」立即执行，或点击「稍后」/ 右上角关闭手动取消。
- 自动更新倒计时时长由源码常量 `AUTO_COUNTDOWN = 10`（秒）控制，设为 `0` 可关闭自动更新。
- Service Worker 注册成功且处于生产环境时，每小时调用一次 `registration.update()` 主动检查更新。

## 已知限制

- 依赖 `vite-plugin-pwa` 提供的虚拟模块 `virtual:pwa-register/vue`，**必须在已配置 PWA 插件的 Vite 环境中构建**，否则引入会报错。
- 需要在 Vite 配置中启用 Service Worker（`registerType` 建议 `prompt`，以配合「稍后」逻辑），并配置 `manifest`。
- 卡片使用全局注册的 `a-button` 与 `Icon`（`@iconify/vue`），并且挂载在 `ConfigProvider` 之外，不参与应用主题配置。
- 组件无 props，无法从外部调整倒计时或文案。
