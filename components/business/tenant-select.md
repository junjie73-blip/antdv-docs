# TenantSelect 租户选择

::: warning 当前无法直接使用
该组件依赖 `~/stores/modules/tenant` 的 `useTenantStore`，但仓库中**并不存在** `src/stores/modules/tenant.ts`（现有 store 只有 app / auth / dict / route / user），因此引入本组件会因模块解析失败而报错。同时全仓库没有任何页面调用它。

本文按源码如实记录其对外契约，供后续补齐 store 时参考，示例代码在 store 落地前无法运行。
:::

基于租户 Store（`useTenantStore`）的租户下拉框，封装 Antdv Next `Select`。通过 `valueType` 决定 v-model 绑定的是租户编码（登录场景）还是租户 ID（管理端场景），选项行内同时展示租户名称与编码。

## 基础用法

```vue
<script setup lang="ts">
import TenantSelect from '~/components/business/TenantSelect.vue'
import { ref } from 'vue'

const tenantCode = ref<string>()
</script>

<template>
  <TenantSelect v-model="tenantCode" />
</template>
```

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `modelValue` | v-model 绑定值：租户编码或租户 ID | `string` | - |
| `valueType` | 取值类型，`'code'` 取租户编码，`'id'` 取租户 ID | `'code' \| 'id'` | `'code'` |
| `placeholder` | 占位文本 | `string` | `'请选择租户'` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `allowClear` | 是否允许清空 | `boolean` | `true` |
| `size` | 尺寸 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| `onlyEnabled` | 是否只返回启用租户 | `boolean` | `true` |
| `immediate` | 是否挂载后立即加载租户列表 | `boolean` | `true` |
| `showSearch` | 是否显示搜索 | `boolean` | `true` |
| `class` | 自定义样式类 | `string` | - |
| `dropdownClass` | 下拉框自定义样式类 | `string` | - |

> `onlyEnabled` 目前仅在 Props 中声明，组件内部尚未据此过滤选项。

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `update:modelValue` | 选中值变化（v-model） | `(value: string \| undefined) => void` |
| `change` | 选中值变化，附带命中的选项对象 | `(value: string \| undefined, option: any) => void` |

> `change` 的第二个参数是命中的选项对象 `{ value, label, code, tenantId }`；清空或未命中时为 `undefined`。

## 组件实例方法

通过 ref 调用：

```ts
const tenantSelectRef = ref()

// 强制重新加载租户列表
tenantSelectRef.value?.refresh()
```

| 方法 | 说明 |
|------|------|
| `refresh` | 强制重新加载租户列表 |

## 依赖

组件通过 `useTenantStore`（`~/stores/modules/tenant`）读取 `options`、`loading`，并调用 `load()` 拉取数据。挂载时若 `immediate` 为 `true` 会静默加载，加载失败不弹提示，由父级自行处理。

## 典型使用场景

### 登录页选择租户（valueType="code"）

登录请求需要 `tenantCode`，可结合 `localStorage` 记住上次选择：

```vue
<script setup lang="ts">
import TenantSelect from '~/components/business/TenantSelect.vue'
import { ref, watch } from 'vue'

const tenantCode = ref<string>(localStorage.getItem('last_tenant_code') ?? '')

watch(tenantCode, (v) => {
  if (v) localStorage.setItem('last_tenant_code', v)
})
</script>

<template>
  <TenantSelect v-model="tenantCode" placeholder="请输入租户编码" />
</template>
```

### 管理端按租户 ID 过滤（valueType="id"）

管理端通常按 `tenantId` 查询，切换后重新加载列表：

```vue
<script setup lang="ts">
import TenantSelect from '~/components/business/TenantSelect.vue'
import { ref } from 'vue'

const tenantId = ref<string>()

function handleChange(value: string | undefined) {
  // 切换租户后刷新当前页数据
  tableMethods.value?.reload()
}
</script>

<template>
  <TenantSelect
    v-model="tenantId"
    value-type="id"
    placeholder="全部租户"
    @change="handleChange"
  />
</template>
```

### 手动刷新租户列表

新建租户后，可主动刷新下拉数据：

```vue
<script setup lang="ts">
import TenantSelect from '~/components/business/TenantSelect.vue'
import { ref } from 'vue'

const tenantSelectRef = ref()

async function handleTenantCreated() {
  await tenantSelectRef.value?.refresh()
}
</script>

<template>
  <TenantSelect ref="tenantSelectRef" v-model="tenantId" value-type="id" />
</template>
```
