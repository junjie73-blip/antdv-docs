# ImportExport 导入导出

把「导出」「导入」「下载导入模板」三个按钮组合在一起的业务组件，基于 Antdv Next `Upload` 与 [xlsx](https://www.npmjs.com/package/xlsx) 实现。它按 `module` 约定自动请求 `${module}/export` 与 `${module}/import`，页面里不需要再手写上传与下载逻辑。

## 基础用法

```vue
<script setup lang="ts">
import ImportExport from '~/components/business/ImportExport.vue'
import { useTable } from '~/components/business/Table'
import { type TemplateColumn } from '~/utils/template'

const [tableRegister, tableMethods] = useTable()

const userImportTemplate: TemplateColumn[] = [
  { header: '用户名', key: 'username', width: 16, example: 'zhangsan' },
  { header: '真实姓名', key: 'real_name', width: 16, example: '张三' },
  { header: '邮箱', key: 'email', width: 30, example: 'zhangsan@example.com' },
]
</script>

<template>
  <ImportExport
    filename="用户列表"
    module="/user"
    :export-params="{ ids: tableMethods?.getSelectRowKeys() }"
    :import-template="userImportTemplate"
  />
</template>
```

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `module` | 模块路径，自动调用 `${module}/export` 与 `${module}/import`（必填） | `string` | - |
| `filename` | 导出文件名前缀，缺省时取 `module` 的最后一段 | `string` | - |
| `fieldName` | 导入上传时的 FormData 字段名 | `string` | `'file'` |
| `accept` | 接受的文件类型 | `string` | `'.xlsx,.xls'` |
| `maxSizeMB` | 单文件大小限制（MB） | `number` | `10` |
| `exportParams` | 导出的额外查询参数，其中 `ids` 用于导出选中行 | `Record<string, any>` | - |
| `disableExport` | 是否禁用导出 | `boolean` | `false` |
| `disableImport` | 是否禁用导入 | `boolean` | `false` |
| `exportText` | 导出按钮文案 | `string` | `'导出'` |
| `importText` | 导入按钮文案 | `string` | `'导入'` |
| `importTemplate` | 导入模板列定义，未配置时导入会被拦截 | `TemplateColumn[]` | - |
| `onImportSuccess` | 导入成功后的回调 | `(result: ImportResult) => void` | - |
| `onExportSuccess` | 导出成功后的回调 | `() => void` | - |
| `onImportError` | 导入部分失败时的自定义处理，返回 `true` 表示已处理，不再弹默认结果弹窗 | `(result: ImportResult) => boolean \| void` | - |

> 注意 `onImportSuccess` / `onExportSuccess` / `onImportError` 是 **Props 形式的回调**，不是组件事件，模板中写作 `:on-import-success="..."`。

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `exportError` | 导出失败（请求异常或返回数据格式不正确） | `(error: Error) => void` |
| `importError` | 导入失败（请求抛错） | `(error: Error) => void` |

## 数据类型

`importTemplate` 使用 `TemplateColumn`（来自 `~/utils/template`）：

```ts
interface TemplateColumn {
  header: string          // Excel 表头
  example?: string | number // 示例值（模板第二行）
  width?: number          // 列宽（字符数）
  key?: string            // 列键名
}
```

导入接口返回的结果结构：

```ts
interface ImportResult {
  successCount: number
  failCount: number
  errors: string[]
  summary?: Record<string, any>
}
```

## 交互说明

- **导出**：点击时读取 `exportParams.ids`，为空数组会提示「请选择导出数据」并中止；非空时以逗号拼接成字符串，随其他参数请求 `${module}/export`。响应按 blob 下载，文件名形如 `用户列表_2026-09-26_1727....xlsx`。
- **导入**：交由 `before-upload` 做前置校验——未配置 `importTemplate` 直接拦截，文件类型需匹配 `accept`，大小不能超过 `maxSizeMB`；通过后以 `fieldName` 字段 POST 到 `${module}/import`。
- **导入结果**：全部成功直接提示「导入成功 N 条」；存在失败记录时默认弹出结果弹窗（最多展示 20 条错误）。若 `onImportError` 返回 `true`，则跳过默认弹窗自行处理。
- **下载模板**：用 `importTemplate` 通过 `generateTemplate` 生成 Excel 模板文件。

## 典型使用场景

### 用户列表工具栏

用户管理页把导入导出按钮放在表格工具栏中，导出时带上当前勾选的行（取自 `src/views/system/user/index.vue`）：

```vue
<script setup lang="ts">
import ImportExport from '~/components/business/ImportExport.vue'
import { type ActionItem, BasicTable, TableAction, useTable } from '~/components/business/Table'

import { USER_IMPORT_TEMPLATE, userActionColumn, userColumns, userRowKey } from './columns'

const [tableRegister, tableMethods] = useTable()
</script>

<template>
  <BasicTable
    :columns="userColumns"
    :action-column="userActionColumn"
    :row-key="userRowKey"
    @register="tableRegister"
  >
    <template #toolbar>
      <!-- 导出选中行：getSelectRowKeys() 返回当前勾选的 userId 数组 -->
      <ImportExport
        filename="用户列表"
        module="/user"
        :export-params="{ ids: tableMethods?.getSelectRowKeys() }"
        :import-template="USER_IMPORT_TEMPLATE"
      />
    </template>
  </BasicTable>
</template>
```

导入模板通常定义在页面模块的 `columns.ts` 中：

```ts
// src/views/system/user/columns.ts
export const USER_IMPORT_TEMPLATE: TemplateColumn[] = [
  { header: '用户名', key: 'username', width: 16, example: 'zhangsan' },
  { header: '真实姓名', key: 'real_name', width: 16, example: '张三' },
  { header: '邮箱', key: 'email', width: 30, example: 'zhangsan@example.com' },
  { header: '手机号', key: 'phone', width: 16, example: '13800000000' },
]
```

### 导入成功后刷新列表

```vue
<template>
  <ImportExport
    module="/user"
    :import-template="USER_IMPORT_TEMPLATE"
    :on-import-success="() => tableMethods?.reload()"
  />
</template>
```
