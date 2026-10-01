# useCRUD 增删改查封装

`useCRUD` 是项目内置的通用 CRUD 组合式函数，覆盖新增、编辑、删除、批量删除、导出、导入六大操作，统一处理 loading 状态、表单重置、容器开关与消息提示，让业务页面只关注接口定义。

## 快速上手

```vue
<script setup lang="ts">
import { BasicModal, useModal } from '~/components/business/Modal'
import { BasicForm, useForm } from '~/components/business/Form'
import { BasicTable, useTable } from '~/components/business/Table'
import { useCRUD } from '~/composables/useCRUD'
import { createUser, updateUser, deleteUser } from '~/api/system/user'
import type { UserRecord } from '~/api/system/user'

// ① 容器 (Modal / Drawer)
const [modalRegister, modalMethods] = useModal()

// ② 表单
const [formRegister, formMethods] = useForm()

// ③ 表格
const [tableRegister, tableMethods] = useTable()

// ④ CRUD
const {
  isEditing,
  loading,
  handleAdd,
  handleEdit,
  handleDelete,
  handleSave,
} = useCRUD<UserRecord>({
  containerType: 'modal',
  modalMethods,
  formMethods,
  tableMethods,
  idKey: 'userId',
  onCreate: (values) => createUser(values),
  onUpdate: (id, values) => updateUser(id, values),
  onDelete: (record) => deleteUser(record.userId),
})
</script>

<template>
  <BasicTable @register="tableRegister">
    <template #toolbar>
      <a-button type="primary" @click="handleAdd()">新增</a-button>
    </template>
    <template #action="{ record }">
      <a-button size="small" @click="handleEdit(record)">编辑</a-button>
      <a-popconfirm title="确定删除？" @confirm="handleDelete(record)">
        <a-button size="small" danger>删除</a-button>
      </a-popconfirm>
    </template>
  </BasicTable>

  <BasicModal
    :title="isEditing ? '编辑用户' : '新增用户'"
    @register="modalRegister"
    @ok="handleSave"
  >
    <BasicForm @register="formRegister" />
  </BasicModal>
</template>
```

---

## 完整配置项（UseCRUDOptions）

```ts
interface UseCRUDOptions<RecordType, FormValues> {
  /** 容器类型，默认 'modal' */
  containerType?: 'modal' | 'drawer'

  /** Modal 方法（containerType 为 modal 时使用） */
  modalMethods?: Pick<ModalMethods, 'openModal' | 'closeModal'>

  /** Drawer 方法（containerType 为 drawer 时使用） */
  drawerMethods?: Pick<DrawerMethods, 'openDrawer' | 'closeDrawer'>

  /** Form 方法（必填） */
  formMethods: Pick<FormActionType, 'setFieldsValue' | 'clearValidate' | 'validate' | 'resetFields'>

  /** 表格方法（可选，提供则保存/删除后自动刷新） */
  tableMethods?: { value: TableActionType | null }

  /** 主键字段名，默认 'id' */
  idKey?: string

  /** 创建接口 */
  onCreate?: (values: FormValues) => Promise<any>

  /** 更新接口 */
  onUpdate?: (id: string, values: FormValues) => Promise<any>

  /** 删除接口 */
  onDelete?: (record: RecordType) => Promise<any>

  /** 批量删除接口（不提供时自动逐条调 onDelete） */
  onBatchDelete?: (records: RecordType[]) => Promise<any>

  /** 导出接口（可选） */
  onExport?: (params?: { selectedRows?: RecordType[]; queryParams?: Record<string, any> }) => Promise<any>

  /** 导入接口（可选） */
  onImport?: (file: File) => Promise<any>

  /** 编辑时从行记录提取表单回填值 */
  getFormValues?: (record: RecordType) => FormValues

  /** 新增时获取空表单默认值 */
  getEmptyValues?: () => FormValues

  /** 自定义提示消息 */
  messages?: CRUDMessages

  /** 新增前钩子，返回 false 中断 */
  beforeCreate?: (values: FormValues) => boolean | Promise<boolean>

  /** 编辑前钩子，返回 false 中断 */
  beforeUpdate?: (record: RecordType, values: FormValues) => boolean | Promise<boolean>

  /**
   * 删除前钩子，返回 false 中断。
   * 删除确认弹窗请在此钩子内处理，不要依赖 useCRUD 内置 Modal
   */
  beforeDelete?: (record: RecordType) => boolean | Promise<boolean>

  /** 保存成功后回调 */
  onSaved?: (isEdit: boolean, values: FormValues) => void

  /** 删除成功后回调 */
  onDeleted?: (record: RecordType) => void

  /** 编辑时获取详情（回填更完整的数据） */
  onFetchDetail?: (id: string) => Promise<RecordType>
}
```

---

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `isEditing` | `Ref<boolean>` | 当前是否为编辑态 |
| `currentRecord` | `Ref<RecordType \| null>` | 当前操作的行记录 |
| `loading` | `Ref<boolean>` | 操作加载中 |
| `handleAdd(initial?)` | Function | 打开新增容器 |
| `handleEdit(record, initial?)` | Function | 打开编辑容器并回填数据 |
| `handleDelete(record)` | Function | 执行删除 |
| `handleBatchDelete(records?)` | Function | 批量删除（不传则取表格选中行） |
| `handleSave()` | Function | 校验表单并保存（新增/更新） |
| `handleExport(exportSelected?)` | Function | 触发导出 |
| `handleImport(file)` | Function | 触发导入 |
| `reset()` | Function | 重置内部状态 |

---

## 核心方法详解

### `handleAdd(initialValues?)`

打开容器并重置表单为空值，可传入预设值：

```ts
// 打开新增弹窗
handleAdd()

// 打开并预填部门 ID
handleAdd({ deptId: currentDeptId })
```

**流程：**
1. 执行 `beforeCreate` 钩子（若有）
2. 设置 `isEditing = false`，清空 `currentRecord`
3. 打开容器
4. `nextTick` 后重置表单，然后填入 `getEmptyValues()` + `initialValues`

### `handleEdit(record, initialValues?)`

打开容器并回填行数据，可额外传入覆盖值：

```ts
// 打开编辑弹窗
handleEdit(record)

// 打开编辑弹窗，并额外预填某些字段
handleEdit(record, { remark: '来自批量操作' })
```

**流程：**
1. 执行 `beforeUpdate` 钩子（若有）
2. 设置 `isEditing = true`，暂存 `currentRecord`
3. 打开容器并重置表单
4. 若配置了 `onFetchDetail`，调接口获取完整详情（失败则使用行数据兜底）
5. 调 `getFormValues(record)` 转换并回填表单

### `handleSave()`

表单校验通过后根据 `isEditing` 分别调 `onCreate` / `onUpdate`：

```ts
// 在 Modal/Drawer 的 @ok 事件中调用
async function handleOk() {
  await handleSave()
}
```

**流程：**
1. `await formMethods.validate()` 校验
2. 新增 → `onCreate(values)` → 成功提示 → 关闭容器 → 刷新表格
3. 编辑 → `onUpdate(id, values)` → 成功提示 → 关闭容器 → 刷新表格
4. 异常 → `message.error(msgs.saveFailed)`

### `handleDelete(record)`

直接调 `onDelete` 删除，确认弹窗由调用侧（`popConfirm`）负责：

```ts
// 在 actions.ts 的行操作中使用 popConfirm 确认，不要在 beforeDelete 里再弹一次
{
  label: '删除',
  danger: true,
  popConfirm: {
    title: `确定删除「${record.username}」吗？`,
    confirm: () => handleDelete(record),
  },
}
```

::: warning 不要双重确认
单条删除（`handleDelete`）没有内置 `Modal.confirm`，确认弹窗由行操作的 `popConfirm` 属性负责；只有批量删除（`handleBatchDelete`）内置 `Modal.confirm`。避免出现两次弹窗。
:::

### `handleBatchDelete(records?)`

```ts
// 删除表格当前选中行（自动读取 tableMethods.getSelectRows()）
handleBatchDelete()

// 删除指定记录
handleBatchDelete(selectedRecords)
```

内部调用 `Modal.confirm` 展示"确定删除选中的 N 项吗？"，用户确认后：
- 优先调 `onBatchDelete(records)`
- 未配置 `onBatchDelete` 则并发调 `onDelete` 逐条删除

---

## 常用配置模式

### 模式一：最简 Modal CRUD

适合字段较少（≤ 5 个）的管理页：

```ts
const { isEditing, handleAdd, handleEdit, handleDelete, handleSave } = useCRUD({
  containerType: 'modal',
  modalMethods,
  formMethods,
  tableMethods,
  idKey: 'roleId',
  onCreate: createRole,
  onUpdate: (id, val) => updateRole(id, val),
  onDelete: (r) => deleteRole(r.roleId),
})
```

### 模式二：Drawer CRUD（复杂表单）

字段较多（> 5 个）或需要预览时使用 Drawer：

```ts
const { isEditing, handleAdd, handleEdit, handleSave } = useCRUD({
  containerType: 'drawer',    // ← 切换为 drawer
  drawerMethods,              // ← 传 drawerMethods
  formMethods,
  tableMethods,
  idKey: 'orderId',
  onCreate: createOrder,
  onUpdate: (id, val) => updateOrder(id, val),
  onDelete: (r) => deleteOrder(r.orderId),
  // 编辑时拉取完整详情（行数据可能只有部分字段）
  onFetchDetail: (id) => getOrderDetail(id),
})
```

### 模式三：自定义表单值转换

行数据结构与表单字段不完全一致时：

```ts
const { handleEdit } = useCRUD<DeptRecord>({
  // ...
  getFormValues: (record) => ({
    deptId: record.deptId,
    deptName: record.deptName,
    parentId: record.parentId,
    // 将嵌套数据拍平
    leaderName: record.leader?.name || '',
    leaderPhone: record.leader?.phone || '',
    // 将逗号字符串转为数组
    tags: record.tags?.split(',') || [],
  }),

  getEmptyValues: () => ({
    deptId: '',
    deptName: '',
    parentId: '',
    leaderName: '',
    leaderPhone: '',
    tags: [],
  }),
})
```

### 模式四：操作前钩子

在执行之前做额外校验或确认：

```ts
const { handleDelete } = useCRUD({
  // ...
  beforeDelete: async (record) => {
    if (record.hasChildren) {
      message.warning('存在子部门，请先删除子部门')
      return false   // 中断删除
    }
    return true      // 允许继续
  },
})
```

### 模式五：带导出导入

```ts
const { handleExport, handleImport } = useCRUD({
  // ...
  onExport: ({ selectedRows }) => {
    exportToExcel({
      filename: '用户列表',
      columns: exportColumns,
      data: selectedRows?.length ? selectedRows : tableData.value,
    })
  },
  onImport: async (file) => {
    await importUsers(file)
    // 成功后 useCRUD 会自动刷新表格
  },
})
```

---

## 完整页面示例

以用户管理为例，展示标准 CRUD 页面结构：

```vue
<!-- views/system/user/index.vue -->
<script setup lang="ts">
import { BasicModal, useModal } from '~/components/business/Modal'
import { BasicForm, useForm } from '~/components/business/Form'
import { BasicTable, useTable } from '~/components/business/Table'
import { useCRUD } from '~/composables/useCRUD'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getUserDetail,
} from '~/api/system/user'
import { userColumns, userSearchSchemas } from './columns'
import { userFormSchemas } from './schemas'
import { getUserActions } from './actions'
import type { UserRecord } from './types'

// 容器
const [modalRegister, modalMethods] = useModal()

// 表单
const [formRegister, formMethods] = useForm()

// 表格
const [tableRegister, tableMethods] = useTable()

// CRUD 核心
const {
  isEditing,
  loading,
  handleAdd,
  handleEdit,
  handleDelete,
  handleSave,
  handleBatchDelete,
} = useCRUD<UserRecord>({
  containerType: 'modal',
  modalMethods,
  formMethods,
  tableMethods,
  idKey: 'userId',
  onCreate: createUser,
  onUpdate: updateUser,
  onDelete: (r) => deleteUser(r.userId),
  onFetchDetail: getUserDetail,
  getFormValues: (record) => ({
    username: record.username,
    realname: record.realname,
    email: record.email,
    phone: record.phone,
    deptId: record.deptId,
    roleIds: record.roles?.map((r) => r.roleId) || [],
    status: record.status,
  }),
  getEmptyValues: () => ({
    username: '',
    realname: '',
    email: '',
    phone: '',
    deptId: '',
    roleIds: [],
    status: '1',
  }),
  messages: {
    createSuccess: '用户创建成功',
    updateSuccess: '用户信息更新成功',
    deleteSuccess: '用户已删除',
  },
})

// 行操作（注入 ctx）
function getActionColumn(record: UserRecord) {
  return getUserActions(record, {
    onEdit: handleEdit,
    onDelete: handleDelete,
  })
}

async function fetchApi(params: Record<string, any>) {
  return getUserList(params)
}
</script>

<template>
  <BasicTable
    :columns="userColumns"
    :api="fetchApi"
    :use-search-form="true"
    :form-config="{ schemas: userSearchSchemas }"
    @register="tableRegister"
  >
    <template #toolbar>
      <a-button type="primary" @click="handleAdd()">
        <IconifyIcon icon="lucide:plus" class="mr-1" />新增用户
      </a-button>
      <a-button danger @click="handleBatchDelete()">批量删除</a-button>
    </template>

    <template #action="{ record }">
      <ActionItems :items="getActionColumn(record)" />
    </template>
  </BasicTable>

  <BasicModal
    :title="isEditing ? '编辑用户' : '新增用户'"
    :loading="loading"
    @register="modalRegister"
    @ok="handleSave"
  >
    <BasicForm :schemas="userFormSchemas" @register="formRegister" />
  </BasicModal>
</template>
```

---

## 与 actions.ts 的配合

行操作保持无状态，副作用通过 ctx 注入（详见[开发规范](/guide/conventions)）：

```ts
// views/system/user/actions.ts
export interface UserActionContext {
  onEdit: (record: UserRecord) => void
  onDelete: (record: UserRecord) => void | Promise<void>
}

export function getUserActions(record: UserRecord, ctx: UserActionContext): ActionItem[] {
  return [
    {
      label: '编辑',
      icon: 'lucide:pencil',
      onClick: () => ctx.onEdit(record),
    },
    {
      label: '删除',
      icon: 'lucide:trash-2',
      danger: true,
      // 删除确认由 popConfirm 负责，不在 useCRUD 内部再弹一次
      popConfirm: {
        title: '删除用户',
        content: `确定删除「${record.username}」吗？`,
        confirm: () => ctx.onDelete(record),
      },
    },
  ]
}
```

---

## 最佳实践

### ✅ 推荐做法

| 场景 | 做法 |
|------|------|
| 字段较少（≤ 5 个）的 CRUD | 使用 `containerType: 'modal'` |
| 字段较多或含预览的 CRUD | 使用 `containerType: 'drawer'` |
| 行数据与表单字段不一致 | 配置 `getFormValues` 转换 |
| 编辑需要完整详情 | 配置 `onFetchDetail` |
| 删除前需要额外校验 | 使用 `beforeDelete` 钩子 |
| 删除确认弹窗 | 由 `popConfirm` 或 `beforeDelete` 内 `Modal.confirm` 处理 |

### ❌ 避免的做法

| 反模式 | 原因 |
|--------|------|
| 在 `beforeDelete` 里弹 `Modal.confirm`，同时 `actions.ts` 也有 `popConfirm` | 双重确认，用户体验差 |
| 在组件中手动管理 `isEditing` ref | 与 `useCRUD` 内部状态冲突 |
| 在 `onCreate`/`onUpdate` 里 `message.success` | `useCRUD` 会自动弹成功提示 |
| 在 `@ok` 里手动关闭容器 | `handleSave` 成功后会自动关闭 |
| `onFetchDetail` 失败不处理 | `useCRUD` 已有兜底（使用行数据），无需额外 try/catch |

---

## 类型定义速查

```ts
// 消息配置
interface CRUDMessages {
  createSuccess?: string        // 默认：'创建成功'
  updateSuccess?: string        // 默认：'更新成功'
  deleteSuccess?: string        // 默认：'删除成功'
  batchDeleteSuccess?: string   // 默认：'批量删除成功'
  saveFailed?: string           // 默认：'保存失败'
  deleteFailed?: string         // 默认：'删除失败'
  exportSuccess?: string        // 默认：'导出成功'
  importSuccess?: string        // 默认：'导入成功'
  exportFailed?: string         // 默认：'导出失败'
  importFailed?: string         // 默认：'导入失败'
}
```
