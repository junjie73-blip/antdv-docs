# CronEditor Cron 表达式编辑器

可视化编辑 Cron 表达式的表单控件，提供「常用预设」与「自定义」两种模式，并基于 [cronstrue](https://github.com/bradymholt/cronstrue) 实时输出中文可读描述。

表达式使用 **6 位格式：秒 分 时 日 月 周**；输入 5 位表达式时会自动补一个秒字段（补 `0`）。

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

import CronEditor from '~/components/common/CronEditor/index.vue'

const cron = ref('0 0 0 * * *')
</script>

<template>
  <CronEditor v-model="cron" @change="(val) => console.log(val)" />
</template>
```

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `modelValue` | Cron 表达式（`v-model`） | `string` | `''` |
| `disabled` | 是否禁用 | `boolean` | `false` |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `update:modelValue` | 表达式变化（`v-model`） | `(value: string) => void` |
| `change` | 表达式变化 | `(value: string) => void` |

## 使用说明

- **常用预设模式**：提供 12 个常用表达式（每分钟、每 5 分钟、每小时、每天 0 点、每周一 0 点等），点击即选中。
- **自定义模式**：以 6 个下拉框分别配置「秒 / 分 / 时 / 日 / 月 / 周」，下拉项含通配 `*`、区间内单值，以及常用间隔（如 `*/5`、`*/2`）。
- 切换回预设模式时，若当前表达式不在预设列表中，会自动回退为第一个预设值并触发 `change`。
- 底部输入框展示当前完整表达式，并实时显示中文描述；表达式非法时显示「表达式无效」。

## 典型使用场景

### 在 BasicForm 中使用

定时任务表单中通过插槽渲染：

```vue
<template #cronEditor="{ model, field }">
  <CronEditor
    :model-value="model[field]"
    @update:model-value="(val) => formMethods.setFieldsValue({ [field]: val })"
  />
</template>
```

### 只读展示

```vue
<CronEditor :model-value="job.cron" disabled />
```
