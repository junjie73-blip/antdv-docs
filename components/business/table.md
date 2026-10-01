# Table 表格组件

基于 Antdv Next Table 封装的企业级表格组件，支持丰富的功能和灵活的配置。

## 基础用法

```vue
<script setup lang="tsx">
import { BasicTable, useTable } from '~/components/business/Table'

const [tableRegister, tableMethods] = useTable({
  // 请求函数会收到分页、搜索等参数，需原样透传
  api: (params) => getUserList(params),
  columns: [
    { title: '姓名', dataIndex: 'name' },
    { title: '年龄', dataIndex: 'age' },
    { title: '地址', dataIndex: 'address' },
  ],
})

// 通过 ref 调用实例方法
function refresh() {
  tableMethods.value?.reload()
}
</script>

<template>
  <BasicTable @register="tableRegister" />
</template>
```

## 功能特性

### 列配置

| 功能 | 配置方式 |
|------|----------|
| 自定义渲染 | `customRender: ({ record }) => <span>{record.name}</span>` |
| 固定列 | `fixed: 'left' \| 'right'` |
| 排序 | `sorter: true` 或自定义排序函数 |
| 筛选 | `filters: [{ text: '男', value: 'male' }]` |
| 宽度拖拽 | `resizable: true` |
| 显隐控制 | 在 TableSetting 中配置 |

### 分页

```ts
useTable({
  pagination: {
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
  },
})
```

### 行选择

```ts
useTable({
  rowSelection: {
    type: 'checkbox', // 'checkbox' | 'radio'
    getCheckboxProps: (record) => ({
      disabled: record.status === 'disabled',
    }),
  },
})
```

### 操作列

通过 `actionColumn` 配置操作列，操作项由 `actions(record)` 返回 `ActionItem[]`。可见操作项超过 `maxShowCount`（默认 4）时会自动折叠进「更多」下拉，`popConfirm` / `dropdown` 会自动转为对应交互：

```tsx
useTable({
  actionColumn: {
    title: '操作',
    width: 200,
    fixed: 'right',
    actions: (record) => [
      { label: '编辑', onClick: () => handleEdit(record) },
      {
        label: '删除',
        danger: true,
        popConfirm: {
          title: '删除记录',
          content: `确定删除「${record.name}」吗？`,
          confirm: () => handleDelete(record),
        },
      },
    ],
  },
})
```

需要完全自定义渲染时，可改用 `actionColumn.render(record)` 返回 VNode。

## API

### Props

组件只转发部分 Antdv Next Table 的 Props（如 `bordered`、`tableLayout`、`sticky`、`scroll`、`size`、`locale`、`title` 等），并非全量透传；额外支持以下业务属性：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `api` | `Function` | - | 数据请求函数，接收分页、搜索等参数 |
| `columns` | `BasicColumn[]` | - | 列配置 |
| `actionColumn` | `ActionColumnProps` | - | 操作列配置，见「操作列」章节 |
| `pagination` | `boolean \| object` | - | 分页配置，未传时启用内置默认分页 |
| `rowSelection` | `object` | - | 行选择配置 |
| `showTableSetting` | `boolean` | true | 显示列设置 |
| `useSearchForm` | `boolean` | false | 启用搜索表单 |

### Methods

`useTable(props?)` 返回 `[register, tableMethods]` 元组，其中 `tableMethods` 是 `Ref<TableActionType | null>`，需要通过 `.value` 调用：

| 方法 | 说明 |
|------|------|
| `getDataSource()` | 获取当前数据源 |
| `getRawDataSource()` | 获取原始数据（`afterFetch` 处理后数据的深拷贝） |
| `reload(opt?)` | 重新加载数据（会重置到第 1 页） |
| `setLoading(loading)` | 设置加载状态 |
| `selectRows(keys)` | 按 key 设置选中行 |
| `getSelectRows()` | 获取选中行的数据 |
| `getSelectRowKeys()` | 获取选中行的 key |
| `clearSelectedRowKeys()` | 清空选中行 |
| `getPaginationRef()` | 获取分页信息 |
| `setPagination(pagination)` | 修改分页配置 |
| `setTableData(data)` | 手动设置数据 |

> 完整的实例方法（列操作、行选择、表单联动等）见 `TableActionType` 类型定义。

## TSX 渲染

当需要复杂自定义时，使用 TSX 的 `customRender`：

```tsx
{
  title: '状态',
  dataIndex: 'status',
  customRender: ({ record }: { record: any }) => {
    const statusMap = {
      active: { text: '运行中', color: 'green' },
      stopped: { text: '已停止', color: 'default' },
    }
    const { text, color } = statusMap[record.status] || {}
    return <a-tag color={color}>{text}</a-tag>
  },
}
```
