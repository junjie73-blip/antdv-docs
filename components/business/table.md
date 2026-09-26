# Table 表格组件

基于 Antdv Next Table 封装的企业级表格组件，支持丰富的功能和灵活的配置。

## 基础用法

```vue
<script setup lang="tsx">
import { BasicTable, useTable } from '~/components/business/Table'

const [tableRegister, tableMethods] = useTable({
  api: () => getUserList(),
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

操作列支持 Dropdown 折叠，避免按钮过多：

```tsx
const columns = [
  {
    title: '操作',
    width: 200,
    customRender: ({ record }) => (
      <a-space>
        <a-button type="link" size="small">编辑</a-button>
        <a-dropdown>
          <a-button type="link" size="small">更多</a-button>
          {{
            overlay: () => (
              <a-menu>
                <a-menu-item>详情</a-menu-item>
                <a-menu-item>删除</a-menu-item>
              </a-menu>
            ),
          }}
        </a-dropdown>
      </a-space>
    ),
  },
]
```

## API

### Props

继承 Antdv Next Table 的所有 Props，额外支持：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `api` | `Function` | - | 数据请求函数 |
| `columns` | `BasicColumn[]` | - | 列配置 |
| `pagination` | `boolean \| object` | - | 分页配置，未传时启用内置默认分页 |
| `rowSelection` | `object` | - | 行选择配置 |
| `showTableSetting` | `boolean` | true | 显示列设置 |
| `useSearchForm` | `boolean` | false | 启用搜索表单 |

### Methods

`useTable(props?)` 返回 `[register, tableMethods]` 元组，其中 `tableMethods` 是 `Ref<TableActionType | null>`，需要通过 `.value` 调用：

| 方法 | 说明 |
|------|------|
| `getDataSource()` | 获取当前数据源 |
| `getRawDataSource()` | 获取未经 `afterFetch` 处理的原始数据 |
| `reload(opt?)` | 重新加载数据 |
| `setLoading(loading)` | 设置加载状态 |
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
