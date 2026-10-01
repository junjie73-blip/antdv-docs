# Upload 上传组件

基于 [Antdv Next Upload](https://antdv-next.com/components/upload) 封装的文件上传组件，支持文件类型限制、上传前校验（大小 / 数量）以及图片预览。

> 组件内部通过 `customRequest` 调用系统 http 封装（自动携带 token 与租户请求头），因此**不需要也不接受 `action`**；大文件分片上传请使用同模块导出的 `ChunkUpload` 组件 / `useChunkUploader`。

## 基础用法

```vue
<script setup lang="ts">
import type { UploadFile } from 'antdv-next'

import { ref } from 'vue'

import { Upload } from '~/components/common/Upload'

const fileList = ref<UploadFile[]>([])

function handleSuccess(_response: unknown, file: UploadFile) {
  console.log('上传成功:', file.name)
}

function handleError(error: Error) {
  console.error('上传失败:', error.message)
}
</script>

<template>
  <Upload
    v-model:value="fileList"
    :max-size="10"
    accept=".jpg,.png,.pdf"
    @success="handleSuccess"
    @error="handleError"
  />
</template>
```

## 组件 Props

| 属性             | 说明                       | 类型                                                | 默认值       |
| ---------------- | -------------------------- | --------------------------------------------------- | ------------ |
| `value`          | 文件列表（v-model）        | `UploadFile[]`                                      | `[]`         |
| `multiple`       | 是否支持多选               | `boolean`                                           | `false`      |
| `maxCount`       | 最大文件数量               | `number`                                            | -            |
| `maxSize`        | 单文件大小限制（MB）       | `number`                                            | -            |
| `accept`         | 接受的文件类型             | `string`                                            | -            |
| `showUploadList` | 是否显示文件列表           | `boolean`                                           | `true`       |
| `listType`       | 列表展示类型               | `'text' \| 'picture' \| 'picture-card'`             | `'text'`     |
| `uploadText`     | 上传按钮文本               | `string`                                            | `'点击上传'` |
| `disabled`       | 是否禁用                   | `boolean`                                           | `false`      |
| `readonly`       | 是否只读                   | `boolean`                                           | `false`      |
| `data`           | 附加到 FormData 的额外字段 | `Record<string, unknown>`                           | -            |
| `name`           | 后端接收的字段名           | `string`                                            | `'file'`     |
| `onRemove`       | 删除文件回调               | `(file: UploadFile) => boolean \| Promise<boolean>` | -            |
| `beforeUpload`   | 上传前钩子                 | `(file, fileList) => boolean \| Promise<boolean>`   | -            |

> 组件类型上继承自 Antdv Next `Upload`，但运行时**只透传上表列出的字段**（外加 `className` 用于外层容器），`action`、`customRequest` 等其余属性不会生效。

## 组件事件

| 事件名         | 说明                    | 回调参数                                   |
| -------------- | ----------------------- | ------------------------------------------ |
| `update:value` | 文件列表变化（v-model） | `(fileList: UploadFile[]) => void`         |
| `change`       | 文件状态变化            | `(fileList: UploadFile[]) => void`         |
| `success`      | 上传成功                | `(response, file: UploadFile) => void`     |
| `error`        | 上传失败                | `(error: Error, file: UploadFile) => void` |

## 组件实例方法

通过 ref 调用：

```ts
const uploadRef = ref<UploadInstance>()

// 获取当前文件列表
uploadRef.value?.getFileList()

// 设置文件列表（用于编辑回显）
uploadRef.value?.setFileList(existingFiles)

// 清空所有文件
uploadRef.value?.clear()
```

| 方法          | 说明         | 返回值                             |
| ------------- | ------------ | ---------------------------------- |
| `getFileList` | 获取文件列表 | `UploadFile[]`                     |
| `setFileList` | 设置文件列表 | `(fileList: UploadFile[]) => void` |
| `clear`       | 清空文件列表 | `void`                             |

## 支持的文件类型配置

### 图片类型

```vue
<Upload
  v-model:value="imageList"
  accept="image/*"
  list-type="picture-card"
  :max-count="9"
  :max-size="5"
/>
```

### 文档类型

```vue
<Upload
  v-model:value="docList"
  accept=".pdf,.doc,.docx,.xls,.xlsx"
  :max-size="20"
/>
```

### 所有文件类型

```vue
<Upload
  v-model:value="allFiles"
  :multiple="true"
  :max-count="10"
/>
```

## 常见 MIME 类型速查

| 类型   | accept 值                           | 说明         |
| ------ | ----------------------------------- | ------------ |
| 图片   | `image/*` 或 `.jpg,.png,.gif,.webp` | 所有图片格式 |
| PDF    | `.pdf`                              | PDF 文档     |
| Word   | `.doc,.docx`                        | Word 文档    |
| Excel  | `.xls,.xlsx`                        | Excel 表格   |
| 视频   | `video/*` 或 `.mp4,.avi`            | 视频文件     |
| 音频   | `audio/*` 或 `.mp3,.wav`            | 音频文件     |
| 压缩包 | `.zip,.rar,.7z`                     | 压缩文件     |

## 上传前钩子 (beforeUpload)

在上传前进行自定义校验和处理：

```vue
<script setup lang="ts">
import type { UploadFile } from 'antdv-next'

import { message } from 'antdv-next'

function handleBeforeUpload(file: UploadFile, fileList: UploadFile[]): boolean {
  void fileList
  // 自定义文件类型检查
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type || '')) {
    message.error('仅支持 JPG、PNG、GIF 格式')
    return false
  }
  return true
}
</script>

<template>
  <Upload
    v-model:value="fileList"
    :before-upload="handleBeforeUpload"
  />
</template>
```

内置的上传前校验：
- **文件大小**：超过 `maxSize`（MB）时自动拦截并提示
- **文件数量**：超过 `maxCount` 时自动拦截并提示

## 大文件分片上传

::: warning 使用 `ChunkUpload` 必须显式传入 `chunkSize`
组件的 `chunkSize` 默认值是 `0`，而任务记录会把该原始值直接存进 `task.chunkSize`；hash worker 又用 `Math.ceil(size / chunkSize)` 反推总分片数，除数为 `0` 时结果为 `Infinity`，`hashing` 阶段因此**永不结束**（任务卡住、CPU 持续占用）。

所以请务必写全 `:chunk-size="5 * 1024 * 1024"` 这类显式值，不要依赖默认值。
:::

### 基础 `Upload` 的进度限制

基础 `Upload` 通过 `customRequest` 调用 `uploadSingleFile`（`POST /upload/file`），整个文件一次性提交，并且**没有把 `options.onProgress` 回传给 Antdv Next**，所以文件卡片上的进度环不会推进，上传完成后直接进入 `done` 状态。

需要真实进度、暂停/续传、秒传等能力时，改用同模块导出的 `ChunkUpload` 组件（或 `useChunkUploader`）。

### 什么时候用 `ChunkUpload`

| 场景                                  | 推荐          |
| ------------------------------------- | ------------- |
| 小文件、只关心「传完 / 失败」两个结果 | `Upload`      |
| 需要真实进度、速度、剩余时间          | `ChunkUpload` |
| 大文件、弱网、需要暂停 / 继续 / 重试  | `ChunkUpload` |
| 需要秒传（同一文件重复上传直接命中）  | `ChunkUpload` |
| 刷新页面 / 断网后要接着传（断点续传） | `ChunkUpload` |

`ChunkUpload` 的实际流程：

1. 在 Web Worker 中用 spark-md5 计算**整个文件**的 MD5，此阶段状态为 `hashing`（列表里显示 hash 百分比）——注意是**全量 hash**，不是抽样 hash，因此秒传与续传的判断是准确的；
2. 用 hash 派生出一个 UUID 形态的 `uploadId`，先调 `GET /upload/check` 查询服务端已存在的分片；
3. 若服务端已有分片数 ≥ 总分片数，直接进入 `success`（秒传）；
4. 否则把「服务端已上传分片」与「本地 localStorage 断点记录」求并集，只上传剩余分片；
5. 分片全部上传完成后调用 `POST /upload/merge` 合并，任务进入 `merging` 状态，后续入库由后端 / WebSocket 侧处理。

### 引入与基础用法

```vue
<script setup lang="ts">
import type { ChunkUploadInstance, ChunkUploadTask } from '~/components/common/Upload'

import { ref } from 'vue'

import { ChunkUpload } from '~/components/common/Upload'

const uploadRef = ref<ChunkUploadInstance>()

function handleChange(tasks: ChunkUploadTask[]) {
  // 每次进度更新都会触发，可用来做外部进度联动
  console.log('当前任务数:', tasks.length)
}

function handleSuccess(task: ChunkUploadTask) {
  console.log('分片上传成功:', task.filename, task.uploadId)
}
</script>

<template>
  <ChunkUpload
    ref="uploadRef"
    :chunk-size="5 * 1024 * 1024"
    :concurrency="3"
    :max-retry="3"
    :max-size="2048"
    accept=".zip,.mp4,.iso"
    @change="handleChange"
    @success="handleSuccess"
  />
</template>
```

### 组件 Props

默认值来自组件内的 `withDefaults`。

| 属性          | 说明                                                     | 类型      | 默认值 |
| ------------- | -------------------------------------------------------- | --------- | ------ |
| `chunkSize`   | 单个分片大小（字节）。`0` 表示不指定，按文件大小自动计算 | `number`  | `0`    |
| `concurrency` | 并发上传的分片数                                         | `number`  | `3`    |
| `maxRetry`    | 单个分片的最大重试次数                                   | `number`  | `3`    |
| `autoStart`   | 选择文件后是否立即开始上传                               | `boolean` | `true` |
| `resume`      | 是否支持断点续传（仅声明，见「已知限制」）               | `boolean` | `true` |
| `maxSize`     | 单文件大小上限，单位 **MB**，超出的文件跳过并提示        | `number`  | -      |
| `maxCount`    | 任务数量上限，超出后本次选择整体被拒绝                   | `number`  | -      |
| `accept`      | 原生 `input[accept]`，文件类型限制                       | `string`  | -      |
| `multiple`    | 是否多选                                                 | `boolean` | `true` |

> 显式传入的 `chunkSize` 会先被钳到 `[1MB, 20MB]`（仅用于估算分片总数，实际切分仍用 `task.chunkSize` 原值）；自动模式下按「目标约 200 个分片」在预设阶梯（1/2/4/5/10/15/20 MB）里向上取值。

### 组件事件

| 事件名     | 说明                                                           | 回调参数                             |
| ---------- | -------------------------------------------------------------- | ------------------------------------ |
| `change`   | 任意任务的状态或进度变化（含每次进度刷新）                     | `(tasks: ChunkUploadTask[]) => void` |
| `success`  | 单个任务成功（秒传或后端同步返回合并完成）                     | `(task: ChunkUploadTask) => void`    |
| `error`    | 单个任务失败                                                   | `(task: ChunkUploadTask) => void`    |
| `complete` | 所有任务都已结束（success / error / canceled）且至少有一个成功 | `(tasks: ChunkUploadTask[]) => void` |

### 组件实例方法

通过 ref 调用，`defineExpose` 暴露的就是 `ChunkUploadInstance` 的全部内容：

```ts
const uploadRef = ref<ChunkUploadInstance>()

// 手动追加文件并开始（不依赖「选择文件」按钮）
const tasks = uploadRef.value?.addFiles(files) ?? []
tasks.forEach((t) => uploadRef.value?.start(t.uid))

// 暂停 / 继续 / 取消 / 重试单个任务
uploadRef.value?.pause(uid)
uploadRef.value?.resume(uid)
uploadRef.value?.cancel(uid)
uploadRef.value?.retry(uid)

// 移除单个任务、清空全部任务
uploadRef.value?.remove(uid)
uploadRef.value?.clear()

// 读取当前任务列表
uploadRef.value?.getTasks()
```

| 方法       | 说明                                                | 签名                                   |
| ---------- | --------------------------------------------------- | -------------------------------------- |
| `addFiles` | 追加文件，返回新建的任务数组，不会自动开始          | `(files: File[]) => ChunkUploadTask[]` |
| `start`    | 开始上传；不传 `uid` 时启动所有 `waiting` 任务      | `(uid?: string) => void`               |
| `pause`    | 暂停；不传 `uid` 时暂停所有进行中的任务             | `(uid?: string) => void`               |
| `resume`   | 继续；不传 `uid` 时恢复所有 `paused` / `error` 任务 | `(uid?: string) => void`               |
| `cancel`   | 取消并清理断点记录；不传 `uid` 时取消全部           | `(uid?: string) => void`               |
| `remove`   | 先 `cancel` 再从列表移除单个任务                    | `(uid: string) => void`                |
| `retry`    | 重试（仅当任务状态为 `error` 时生效）               | `(uid: string) => void`                |
| `clear`    | 取消所有任务并清空列表                              | `() => void`                           |
| `getTasks` | 返回任务数组快照                                    | `() => ChunkUploadTask[]`              |

### 自定义分片逻辑（`useChunkUploader`）

不想用内置 UI 时，直接使用同模块导出的 composable。

#### 配置项（options）

| 配置           | 说明                                                       | 类型                              | 默认值 |
| -------------- | ---------------------------------------------------------- | --------------------------------- | ------ |
| `chunkSize`    | 分片大小（字节），`0` / 不传表示自动计算                   | `number`                          | `1MB`  |
| `concurrency`  | 并发上传分片数                                             | `number`                          | `3`    |
| `maxRetry`     | 单分片最大重试次数                                         | `number`                          | `3`    |
| `onUpdate`     | 任意任务状态 / 进度变化                                    | `(task: ChunkUploadTask) => void` | -      |
| `onMergeStart` | 分片上传完毕、进入合并阶段（可提示用户「可以关闭窗口了」） | `(task: ChunkUploadTask) => void` | -      |
| `onSuccess`    | 任务成功                                                   | `(task: ChunkUploadTask) => void` | -      |
| `onError`      | 任务失败                                                   | `(task: ChunkUploadTask) => void` | -      |

#### 返回值

| 成员                                                                                             | 说明                     | 类型                                |
| ------------------------------------------------------------------------------------------------ | ------------------------ | ----------------------------------- |
| `tasks`                                                                                          | 任务表，`uid` → 任务     | `Ref<Map<string, ChunkUploadTask>>` |
| `addFiles` / `start` / `pause` / `resume` / `cancel` / `remove` / `retry` / `clear` / `getTasks` | 与上节实例方法同名同签名 | -                                   |

#### 典型用法

```ts
import { useChunkUploader } from '~/components/common/Upload'

const uploader = useChunkUploader({
  chunkSize: 5 * 1024 * 1024,
  concurrency: 3,
  maxRetry: 3,
  onUpdate: (task) => console.log(`${task.filename} ${task.loaded}/${task.total}`),
  onMergeStart: (task) => console.log(`${task.filename} 分片已传完，正在合并`),
  onSuccess: (task) => console.log('成功:', task.filename),
  onError: (task) => console.error('失败:', task.filename, task.error),
})

// 添加文件并逐个开始
for (const task of uploader.addFiles(files)) {
  uploader.start(task.uid)
}

// 任务列表（模板里可直接遍历 uploader.tasks.value.values()）
const list = uploader.getTasks()
```

### 内部机制细节

- **分片大小**：估算分片总数时，显式传入的 `chunkSize` 会被钳到 `[1MB, 20MB]`（实际切分按 `task.chunkSize` 原值）；未指定时按 `fileSize / 200` 的期望值在预设阶梯里向上取，小文件（≤ 1MB）则整文件一片。
- **Hash**：在 Worker 中使用 spark-md5 做流式全量 hash，主线程以 transfer 方式零拷贝传输 `ArrayBuffer`；计算时会先把 `${fileName}:${fileSize}:` 作为前缀一起 append，避免同名同大小的文件互相命中。进度按 60ms 节流上报。
- **uploadId**：由 hash 映射成 UUID 形态的字符串（不依赖后端生成），因此同一文件在不同设备得到同一个 `uploadId`。
- **秒传**：`GET /upload/check` 返回的服务端分片数与总分片数相等时直接成功。
- **断点续传**：每个分片上传成功后把已上传索引写入 `localStorage`（key `chunk-upload:{hash}`，有效期 7 天）；再次上传（含刷新页面后重新选择同一文件）时，本地记录与服务端已传分片取并集，只补传缺失分片。
- **并发**：固定 worker 数的并发池，实际并发为 `min(concurrency, 待上传分片数)`；分片仍是「原子上传」，单分片内部不细分进度，进度靠分片完成后的累计值驱动。
- **重试**：单分片失败后按 `1000 * 2^(attempt-1) + 随机 0~500ms` 退避重试，超过 `maxRetry` 才让整个任务进入 `error`；`task.retryCount` 会累计失败重试次数。
- **暂停 / 继续 / 取消**：`pause` 通过 `AbortController` 中断 hash 或分片上传，任务落到 `paused`；`resume` 会从头走一遍流程，但 hash 与已传分片会被复用，所以只补传剩余部分；`cancel` 中断并清除该文件的断点记录。
- **合并**：`POST /upload/merge`（`timeout` 传 `50 * 60 * 60`，按毫秒计即约 3 分钟），返回的 `status` 为 `completed` 时任务立即变为 `success`；否则任务停在 `merging`，等 WebSocket 侧更新。合并阶段 UI 不提供暂停按钮（后端合并不可中断）。
- **速度 / 剩余时间**：基于 2 秒滑动窗口计算 `task.speed`（字节/秒）与 `task.remaining`（秒）。

### 任务对象 `ChunkUploadTask` 常用字段

| 字段                                           | 说明                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `uid`                                          | 任务 id（组件内部生成）                                                                              |
| `file` / `filename` / `size` / `mimeType`      | 原始文件信息                                                                                         |
| `hash` / `uploadId`                            | 全量 hash 与派生出的上传 id                                                                          |
| `status`                                       | `waiting` \| `hashing` \| `uploading` \| `paused` \| `merging` \| `success` \| `error` \| `canceled` |
| `loaded` / `total`                             | 已上传字节 / 总字节                                                                                  |
| `chunkSize` / `totalChunks` / `uploadedChunks` | 分片大小、分片总数、已上传分片索引集合                                                               |
| `speed` / `remaining`                          | 上传速度（字节/秒）、预计剩余秒数                                                                    |
| `hashProgress`                                 | hash 计算百分比（0-100）                                                                             |
| `retryCount`                                   | 累计重试次数                                                                                         |
| `error`                                        | 失败原因文案                                                                                         |
| `taskId` / `mergeStatus` / `mergeStartedAt`    | 合并任务 id、合并阶段状态、合并开始时间                                                              |
| `result`                                       | 成功后由外部（WS 等）回填的文件信息 `{ fileId?, url?, size?, filename? }`                            |

### 后端接口约定

分片上传依赖以下接口（模块内 `api.ts` 已封装，也可直接 import 使用）：

| 接口             | 方法 | 参数                                                                                                | 说明                                                 |
| ---------------- | ---- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/upload/file`   | POST | `FormData`：`file` + `extraData`                                                                    | 小文件整体上传                                       |
| `/upload/check`  | GET  | query：`uploadId`、`filename`、`size`                                                               | 返回 `{ uploadedChunks: number[] }`，用于秒传 / 续传 |
| `/upload/chunk`  | POST | `FormData`：`uploadId`、`chunkIndex`、`totalChunks`、`file`（filename 为 `{filename}.part{index}`） | 上传单个分片                                         |
| `/upload/merge`  | POST | body：`uploadId`、`filename`、`size`、`totalChunks`、`mimeType`                                     | 返回 `{ taskId, status }`                            |
| `/upload/delete` | POST | body：`{ url }`                                                                                     | 删除物理文件                                         |

### 其他导出

除组件与 composable 外，`~/components/common/Upload` 还导出了：

- `computeFileHash`（Worker 版文件 hash）、`HashTask` 类型；
- `uploadSingleFile`、`checkChunks`、`uploadChunk`、`mergeChunks`、`deletePhysicalFile` 及对应类型 `UploadedFileResult`、`ChunkCheckResult`、`ChunkMergeResult`、`ProgressCallback`；
- 工具函数 `formatBytes`、`formatDuration`。

### 已知限制

- **不传 `chunkSize` 会让任务卡死在 `hashing`**：`withDefaults` 给出的默认值是 `0`，`addFiles` 会把这个原始值原样写进 `task.chunkSize`（自动分片 `calcChunkSize` 只被用来估算分片总数，没有回写到任务上），而 hash 计算与后续切分用的都是 `task.chunkSize`，于是 `Math.ceil(fileSize / 0) === Infinity`，worker 侧的进度永远不会等于总分片数，任务再也走不到上传阶段。这是当前实现的一个缺陷，绕开方式就是始终显式传 `chunkSize`。
- **`resume` prop 只声明未生效**：断点续传逻辑（localStorage 记录 + 服务端分片合并）始终开启，没有开关可关。
- **异步合并场景下 `success` / `complete` 不会触发**：`POST /upload/merge` 返回 `pending` 时任务停在 `merging`，后续状态需要业务侧自行监听 WebSocket 更新 `task.result`，组件本身不接 WS。
- **`ChunkCheckResult.uploaded` 字段未被使用**：秒传判断基于 `uploadedChunks` 的数量，而非该布尔字段。
- **`maxCount` 统计的是任务总数**（含已成功 / 已取消的任务），达到上限后再次选择文件会被整体拒绝并提示。
- **断点记录依赖 `localStorage`**：隐私模式或存储被禁用时静默降级，仅表现为无法续传。
- 需要后端按上表约定提供 `/upload/check`、`/upload/chunk`、`/upload/merge` 三个接口，否则分片上传无法工作。

## 图片预览

当 `list-type` 为 `'picture'` 或 `'picture-card'` 时，点击已上传的图片可触发预览功能：

```vue
<Upload
  v-model:value="imageList"
  accept="image/*"
  list-type="picture-card"
  :max-count="6"
/>
```

配合 Antdv Next 的图片预览能力实现大图查看。

## 编辑回显场景

在编辑页面中回显已上传的文件列表：

```vue
<script setup lang="ts">
import type { UploadFile } from 'antdv-next'

import { onMounted, ref } from 'vue'

import { Upload } from '~/components/common/Upload'
import type { UploadInstance } from '~/components/common/Upload'

const props = defineProps<{
  id: string
}>()

const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadFile[]>([])

onMounted(async () => {
  // 从接口获取已有文件
  const data = await api.getDetail(props.id)
  // 回显到上传组件
  uploadRef.value?.setFileList(
    data.files.map((file) => ({
      uid: file.id,
      name: file.name,
      status: 'done',
      url: file.url,
    })),
  )
})
</script>

<template>
  <Upload
    ref="uploadRef"
    v-model:value="fileList"
  />
</template>
```
