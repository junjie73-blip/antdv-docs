# Drawer 抽屉组件

基于 [Antdv Next Drawer](https://antdv-next.com/components/drawer) 封装的高级抽屉组件，与 Modal 组件 API 设计保持一致，支持四种弹出方向、Loading 状态、底部按钮自定义与关闭拦截等能力。

## 基础用法

```vue
<script setup lang="ts">
import { BasicDrawer, useDrawer } from '~/components/business/Drawer'

const [register, { openDrawer, closeDrawer, setDrawerProps }] = useDrawer()

function handleOpen() {
  openDrawer(true, { id: 1 })
}

function handleSubmit() {
  // 处理确认逻辑...
  closeDrawer()
}
</script>

<template>
  <a-button type="primary" @click="handleOpen">打开抽屉</a-button>

  <BasicDrawer
    title="用户详情"
    @register="register"
    @ok="handleSubmit"
  >
    <p>抽屉内容区域</p>
  </BasicDrawer>
</template>
```

## 组件 Props

### 基础属性

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `open` | 是否显示 | `boolean` | `false` |
| `title` | 抽屉标题 | `string` | - |
| `size` | 尺寸（推荐使用） | `string \| number` | left/right 为 `520`，top/bottom 为 `400` |
| `placement` | 弹出位置 | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` |

### 尺寸（已废弃，请改用 size）

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `width` | 宽度（left/right 时有效） | `string \| number` | `520` |
| `height` | 高度（top/bottom 时有效） | `string \| number` | `400` |

### 显示控制

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `useWrapper` | 内容区包装器（控制内容区内边距） | `boolean` | `true` |
| `closable` | 显示关闭按钮 | `boolean` | `true` |
| `maskClosable` | 点击蒙层关闭 | `boolean` | `true` |
| `keyboard` | ESC 键关闭 | `boolean` | `true` |
| `mask` | 显示蒙层 | `boolean` | `true` |
| `destroyOnHidden` | 关闭时销毁内容 | `boolean` | `false` |
| `zIndex` | 层级 | `number` | `1000` |

### 按钮配置

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `showCancelBtn` | 显示取消按钮 | `boolean` | `true` |
| `showOkBtn` | 显示确认按钮 | `boolean` | `true` |
| `showFooter` | 显示整个底部操作栏 | `boolean` | `true` |
| `cancelText` | 取消按钮文本 | `string` | `'关闭'` |
| `okText` | 确认按钮文本 | `string` | `'保存'` |
| `okType` | 确认按钮类型 | `'primary' \| 'danger' ...` | `'primary'` |
| `okButtonProps` | 确认按钮 Props | `ButtonProps` | - |
| `cancelButtonProps` | 取消按钮 Props | `ButtonProps` | - |

### Loading 与样式

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `loading` | Loading 状态 | `boolean` | `false` |
| `loadingTip` | Loading 提示文本 | `string` | - |
| `maskStyle` | 蒙层样式 | `CSSProperties` | - |
| `bodyStyle` | 内容区样式 | `CSSProperties` | - |
| `drawerStyle` | 抽屉样式 | `CSSProperties` | - |
| `headerStyle` | 头部样式 | `CSSProperties` | - |
| `footerStyle` | 底部样式 | `CSSProperties` | - |
| `wrapClassName` | 包裹层类名 | `string` | - |

### 回调函数

| 属性 | 说明 | 类型 |
|------|------|------|
| `closeFunc` | 关闭前回调，返回 true 才允许关闭 | `() => Promise<boolean>` |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `register` | 注册抽屉实例 | `(instance: DrawerMethods) => void` |
| `ok` | 点击确认按钮 | `(e: MouseEvent) => void` |
| `cancel` | 点击取消/关闭按钮 | `(e: MouseEvent) => void` |
| `visible-change` | 显示状态变化 | `(visible: boolean) => void` |
| `update:visible` | v-model 更新事件 | `(visible: boolean) => void` |

## 组件插槽

| 插槽名 | 说明 | 位置 |
|--------|------|------|
| **默认插槽** | 抽屉主体内容 | 内容区域 |
| `titleTip` | 标题右侧额外内容 | 标题栏右侧 |
| `footer` | 完全自定义底部 | 底部区域 |
| `insertFooter` | 取消按钮之前 | 底部操作区 |
| `centerFooter` | 取消和确认之间 | 底部操作区 |
| `appendFooter` | 确认按钮之后 | 底部操作区 |

## useDrawer API

声明式操控抽屉的核心 Hook：

```ts
const [register, methods] = useDrawer()
```

### Methods 方法列表

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `openDrawer` | 打开抽屉 | `<T>(visible?: boolean, data?: T)` | `Promise<void>` |
| `closeDrawer` | 关闭抽屉 | - | `Promise<void>` |
| `setDrawerProps` | 动态修改 props | `(props: Partial<DrawerProps>)` | `void` |
| `getVisible` | 获取当前显示状态 | - | `boolean` |

## useDrawerInner API

`useDrawerInner` 与 `useDrawer` 是同一个 Hook 的别名（`export { useDrawer as useDrawerInner }`），不存在独立的 `useDrawerInner.ts` 文件，因此返回值和方法列表与 `useDrawer` **完全一致**：

```ts
import { useDrawerInner } from '~/components/business/Drawer'

const [registerInner, { openDrawer, closeDrawer, setDrawerProps, getVisible }] = useDrawerInner()
```

> 它不支持接收 `openDrawer` 传入数据的回调参数，也不提供 `changeOkLoading` / `changeLoading` 方法。

## 不同方向的使用示例

### 右侧抽屉（最常用）

```vue
<BasicDrawer
  title="用户信息"
  placement="right"
  :size="520"
  @register="register"
>
  <!-- 内容 -->
</BasicDrawer>
```

### 左侧抽屉

```vue
<BasicDrawer
  title="导航菜单"
  placement="left"
  :size="300"
  :show-ok-btn="false"
  :show-cancel-btn="false"
  @register="register"
>
  <!-- 侧边导航内容 -->
</BasicDrawer>
```

### 底部抽屉

```vue
<BasicDrawer
  title="详细信息"
  placement="bottom"
  :size="400"
  @register="register"
>
  <!-- 详情内容 -->
</BasicDrawer>
```

### 顶部抽屉

```vue
<BasicDrawer
  title="通知中心"
  placement="top"
  :size="400"
  :show-ok-btn="false"
  @register="register"
>
  <!-- 通知列表 -->
</BasicDrawer>
```

## Drawer vs Modal 使用场景对比

| 维度 | Modal 弹窗 | Drawer 抽屉 |
|------|------------|-------------|
| **适用场景** | 确认操作、简单表单、警告提示 | 大量信息展示、复杂表单、多步骤操作 |
| **视觉焦点** | 强中断式，强制用户关注 | 非侵入式，不遮挡主内容 |
| **空间大小** | 中等（通常 520px 宽） | 可大可小（最大可到屏幕 80%+） |
| **交互模式** | 居中浮层 | 从边缘滑出 |
| **典型用途** | 新建/编辑弹窗、删除确认、提示信息 | 详情查看、长表单编辑、设置面板、日志查看 |
| **推荐场景** | 操作 ≤ 3 个字段 | 操作 > 3 个字段或需要预览 |

### 选择建议

- **使用 Modal**：新建/编辑少量字段、确认对话框、消息通知
- **使用 Drawer**：用户详情、订单详情、复杂表单、设置面板、数据对比

## 典型使用示例

### 表单编辑抽屉

```vue
<script setup lang="ts">
import { BasicDrawer, useDrawer } from '~/components/business/Drawer'
import { BasicForm, useForm } from '~/components/business/Form'

const [register, { openDrawer, closeDrawer }] = useDrawer()
const [registerForm, { validate }] = useForm()

const schemas = [
  { field: 'name', label: '名称', component: 'Input', required: true },
  { field: 'desc', label: '描述', component: 'InputTextArea' },
]

async function handleSubmit(values: Record<string, any>) {
  await api.saveData(values)
  message.success('保存成功')
  closeDrawer()
}

async function handleOk() {
  await handleSubmit(await validate())
}
</script>

<template>
  <a-button type="primary" @click="openDrawer(true)">编辑</a-button>

  <BasicDrawer
    title="数据编辑"
    :size="640"
    @register="register"
    @ok="handleOk"
  >
    <BasicForm :schemas="schemas" @register="registerForm" @submit="handleSubmit" />
  </BasicDrawer>
</template>
```

### 详情查看抽屉

默认插槽不会接收 `openDrawer` 传入的数据，需要自行用变量暂存：

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { BasicDrawer, useDrawer } from '~/components/business/Drawer'
import { Description } from '~/components/business/Description'

const [register, { openDrawer, setDrawerProps }] = useDrawer()

const currentData = ref<Record<string, any>>({})

const detailSchema = [
  { field: 'name', label: '名称' },
  { field: 'status', label: '状态' },
  { field: 'createTime', label: '创建时间' },
  { field: 'remark', label: '备注' },
]

function showDetail(record: Record<string, any>) {
  currentData.value = record
  setDrawerProps({ title: `详情 - ${record.name}`, showOkBtn: false })
  openDrawer(true)
}
</script>

<template>
  <a-button @click="showDetail(record)">查看详情</a-button>

  <BasicDrawer :size="720" @register="register">
    <Description :data="currentData" :schema="detailSchema" :column="2" />
  </BasicDrawer>
</template>
```
