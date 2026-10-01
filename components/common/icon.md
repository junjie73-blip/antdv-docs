# Icon 图标

`Icon` 目录提供三个图标相关组件，分别面向不同场景：

| 组件 | 导出名 | 适用场景 |
|------|--------|----------|
| `IconifyIcon.vue` | `IconifyIcon` | 渲染 Iconify 图标集（如 `lucide:search`），按需异步加载，最常用 |
| `SvgIcon.vue` | `SvgIcon` | 渲染本地 SVG Sprite 中的 `<symbol>`，用于项目内自维护的图标 |
| `IconPicker.vue` | `IconPicker` | 图标选择器（弹层 + 搜索 + 分页），用于表单里挑选图标 |

三者均从 `~/components/common/Icon` 统一导出：

```ts
import { IconifyIcon, IconPicker, SvgIcon } from '~/components/common/Icon'
```

## IconifyIcon

基于 [@iconify/vue](https://iconify.design/docs/icon-components/vue/) 的 `Icon` 组件封装，统一了尺寸、颜色与类名参数。

### 基础用法

```vue
<script setup lang="ts">
import { IconifyIcon } from '~/components/common/Icon'
</script>

<template>
  <IconifyIcon icon="lucide:search" />
  <IconifyIcon icon="carbon:star-filled" :size="24" color="#1677ff" />
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `icon` | 图标名（`集合:图标`） | `string` | - |
| `size` | 尺寸，同时作为 `width`/`height` | `number \| string` | `16` |
| `color` | 颜色 | `string` | - |
| `className` | 附加类名 | `string` | - |
| `inline` | 是否内联对齐 | `boolean` | `false` |
| `width` | 宽度（设置后覆盖 `size`） | `number \| string` | - |
| `height` | 高度（设置后覆盖 `size`） | `number \| string` | - |
| `horizontalFlip` | 水平翻转 | `boolean` | - |
| `verticalFlip` | 垂直翻转 | `boolean` | - |
| `rotate` | 旋转角度 | `number` | - |
| `mode` | 渲染模式 | `'svg' \| 'style' \| 'bg'` | `'svg'` |
| `ssr` | SSR 模式 | `boolean` | `false` |

> 当同时设置 `width` / `height` 时，二者优先于 `size`；只设置其中之一时，另一个仍回退到 `size`。

## SvgIcon

渲染对 `<svg><use xlink:href="#{prefix}-{name}" /></svg>` 的引用，用于本地 SVG Sprite 图标。

### 基础用法

```vue
<script setup lang="ts">
import { SvgIcon } from '~/components/common/Icon'
</script>

<template>
  <!-- 对应 sprite 中 id="icon-home" 的 symbol -->
  <SvgIcon name="home" />
  <SvgIcon name="logo" prefix="custom" :size="32" color="#ff4d4f" />
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `name` | 图标名，最终引用 `#{prefix}-{name}` | `string` | - |
| `prefix` | symbol id 前缀 | `string` | `'icon'` |
| `size` | 尺寸 | `number \| string` | `16` |
| `color` | 颜色 | `string` | `'currentColor'` |
| `className` | 附加类名 | `string` | `''` |

> `SvgIcon` 只负责引用 symbol，**不负责注册 Sprite**。使用前需要项目中已存在对应的 `<symbol id="icon-xxx">`（例如通过 `vite-plugin-svg-icons` 之类方案注入），否则会渲染为空白。

## IconPicker

基于 Antdv Next `Popover` + `Input` + `Select` / `Pagination` 的图标选择器，图标集来自 `@iconify-json/*`，按分类**懒加载**。

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { IconPicker } from '~/components/common/Icon'

const icon = ref('carbon:star-filled')

function handleChange(value: string) {
  // 包括清空时 value 为 ''
}
</script>

<template>
  <IconPicker v-model="icon" placeholder="点击选择图标" @change="handleChange" />
</template>
```

### 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `currentIcon` | 兜底图标（当 `v-model` 为空时展示） | `string` | `''` |
| `placeholder` | 输入框占位文本 | `string` | `'选择图标'` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `size` | 输入框尺寸 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| `allowClear` | 是否允许清空 | `boolean` | `true` |

### 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `update:modelValue` | 选中值变化（`v-model`） | `(value: string) => void` |
| `change` | 图标变更（含清空，清空时传 `''`） | `(value: string) => void` |
| `select` | 用户在网格中点击选择图标 | `(value: string) => void` |

> `update:modelValue` 由 `defineModel<string>()` 隐式提供，直接用 `v-model` 绑定即可；点击网格选中会同时触发 `change` 与 `select`，清空只触发 `change`。

### 内置图标集

| 分类 | prefix | 说明 |
|------|--------|------|
| Lucide | `lucide` | 通用线性（默认分类） |
| Material Design | `mdi` | Material |
| Ant Design | `ant-design` | Antd |
| Font Awesome | `fa6-regular` | FA Regular |
| Carbon | `carbon` | Carbon Icons |

### 已知限制

- 每个分类的 `icons.json` 由 Vite 打成独立 chunk，**切换到该分类时才会下载**，首次打开会有加载态。
- 搜索**只在当前分类内进行**，不跨分类。
- 网格每页固定 108 个，超过一页时才显示分页器。
- 依赖打包进 `@iconify-json/lucide`、`mdi`、`ant-design`、`fa6-regular`、`carbon` 五个图标集包；若未安装对应包，加载该分类会失败并显示空列表。

## 典型使用场景

### 表格/按钮中的操作图标

`IconifyIcon` 常被重命名为 `Icon` 使用：

```vue
<script setup lang="ts">
import { IconifyIcon as Icon } from '~/components/common/Icon'
</script>

<template>
  <a-button type="primary">
    <Icon icon="lucide:plus" class="mr-1" />
    新增
  </a-button>
</template>
```

### 表单中配置图标

菜单管理等需要填写图标名的表单，用 `IconPicker` 与 `BasicForm` 的插槽配合：

```vue
<template #iconPicker="{ model, field }">
  <IconPicker
    :model-value="model[field] || ''"
    @update:model-value="(val: string) => formMethods.setFieldsValue({ [field]: val })"
    @select="handleIconSelect"
  />
</template>
```
