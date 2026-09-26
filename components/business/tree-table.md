# TreeTable 树形表格

左右分栏的业务组件：左侧是可搜索、可横向拖拽调整宽度的树形目录，右侧是基于 `BasicTable` 的列表。选中树节点后，右侧表格会以该节点的 `key` 作为 `treeKey` 自动重新请求数据。

## 基础用法

```vue
<script setup lang="ts">
import type { BasicColumn } from '~/components/business/Table/types'
import type { TreeDataNode } from '~/components/business/TreeTable'

import { TreeTable } from '~/components/business/TreeTable'

const treeData: TreeDataNode[] = [
  {
    key: 'dept-1',
    title: '总公司',
    children: [
      { key: 'dept-1-1', title: '技术部' },
      { key: 'dept-1-2', title: '产品部' },
    ],
  },
]

const columns: BasicColumn[] = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
  { title: '职位', dataIndex: 'position', key: 'position', width: 160 },
]

async function fetchTableData(params: { treeKey: string; page: number; pageSize: number }) {
  // treeKey 是左侧选中节点的 key，用它过滤出该目录下的数据
  const all = await getEmployeesByDept(params.treeKey)
  const start = (params.page - 1) * params.pageSize
  return { list: all.slice(start, start + params.pageSize), total: all.length }
}
</script>

<template>
  <TreeTable
    tree-title="组织架构"
    :tree-data="treeData"
    table-title="员工列表"
    :table-columns="columns"
    :table-api="fetchTableData"
  />
</template>
```

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `treeTitle` | 左侧树面板标题 | `string` | `'目录'` |
| `treeData` | 树形数据（必填） | `TreeDataNode[]` | - |
| `treeDefaultExpandAll` | 是否默认展开全部树节点 | `boolean` | `true` |
| `treeSearchPlaceholder` | 树搜索框占位文本 | `string` | `'请输入关键词搜索'` |
| `treeWidth` | 树面板初始宽度（px） | `number` | `260` |
| `treeMinWidth` | 拖拽缩放时的最小宽度（px） | `number` | `200` |
| `treeMaxWidth` | 拖拽缩放时的最大宽度（px） | `number` | `480` |
| `tableTitle` | 右侧列表面板标题 | `string` | `'列表'` |
| `tableColumns` | 表格列配置（必填） | `BasicColumn[]` | - |
| `tableApi` | 选中节点后加载列表的请求函数 | `(params: TreeTableFetchParams) => Promise<{ list: any[]; total: number }>` | - |
| `tableRowKey` | 表格行 key | `string` | `'id'` |
| `tablePageSize` | 请求参数缺省时的分页大小 | `number` | `10` |
| `showSearch` | 是否显示树搜索框 | `boolean` | `true` |
| `treeEmptyText` | 树无数据时的提示文本 | `string` | `'暂无数据'` |
| `tableEmptyText` | 列表无数据时的提示文本 | `string` | `'暂无数据'` |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `treeSelect` | 选中树节点时触发，随后右侧表格自动重载 | `(selectedKey: string, selectedNode: TreeDataNode) => void` |

## 数据类型

```ts
interface TreeDataNode {
  key: string
  title: string
  children?: TreeDataNode[]
  [key: string]: any
}

interface TreeTableFetchParams {
  treeKey: string
  page: number
  pageSize: number
}
```

## 交互说明

- **未选中节点不发请求**：右侧初始显示占位提示，只有 `treeData` 中某个节点被选中后才会创建表格并请求数据。
- **搜索**：输入关键词后按 `title` 递归过滤树节点，同时对搜索做 300ms 防抖；清空关键词恢复完整树。
- **拖拽调宽**：拖拽两栏之间的分隔条可在 `treeMinWidth` ~ `treeMaxWidth` 区间内调整左栏宽度。

## 典型使用场景

### 组织架构 - 成员管理

左侧树展示部门层级，右侧展示对应部门的成员列表（取自 `src/views/components/table/tree-table/index.vue`）：

```vue
<script setup lang="ts">
import type { BasicColumn } from '~/components/business/Table/types'
import type { TreeDataNode } from '~/components/business/TreeTable'

import { TreeTable } from '~/components/business/TreeTable'

const orgTree: TreeDataNode[] = [
  {
    key: 'dept-1',
    title: '总公司',
    children: [
      {
        key: 'dept-1-1',
        title: '技术部',
        children: [
          { key: 'dept-1-1-1', title: '前端开发组' },
          { key: 'dept-1-1-2', title: '后端开发组' },
        ],
      },
      { key: 'dept-1-2', title: '产品部' },
    ],
  },
]

const mockEmployees: Record<string, Array<Record<string, any>>> = {
  'dept-1-1-1': [{ id: 1, name: '张三', position: '前端开发工程师' }],
  'dept-1-1-2': [{ id: 2, name: '赵六', position: '后端架构师' }],
}

const columns: BasicColumn[] = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
  { title: '职位', dataIndex: 'position', key: 'position', width: 160 },
]

async function fetchTableData(params: { treeKey: string; page: number; pageSize: number }) {
  const allData = mockEmployees[params.treeKey] ?? []
  const start = (params.page - 1) * params.pageSize
  return {
    list: allData.slice(start, start + params.pageSize),
    total: allData.length,
  }
}

function handleTreeSelect(key: string, node: TreeDataNode) {
  // 选中节点后的额外逻辑，例如记录当前目录
  console.log('已选择:', key, node.title)
}
</script>

<template>
  <TreeTable
    tree-title="组织架构"
    :tree-data="orgTree"
    table-title="员工列表"
    :table-columns="columns"
    :table-api="fetchTableData"
    table-row-key="id"
    :tree-width="280"
    @treeSelect="handleTreeSelect"
  />
</template>
```
