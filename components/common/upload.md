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

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `value` | 文件列表（v-model） | `UploadFile[]` | `[]` |
| `multiple` | 是否支持多选 | `boolean` | `false` |
| `maxCount` | 最大文件数量 | `number` | - |
| `maxSize` | 单文件大小限制（MB） | `number` | - |
| `accept` | 接受的文件类型 | `string` | - |
| `showUploadList` | 是否显示文件列表 | `boolean` | `true` |
| `listType` | 列表展示类型 | `'text' \| 'picture' \| 'picture-card'` | `'text'` |
| `uploadText` | 上传按钮文本 | `string` | `'点击上传'` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `readonly` | 是否只读 | `boolean` | `false` |
| `data` | 附加到 FormData 的额外字段 | `Record<string, unknown>` | - |
| `name` | 后端接收的字段名 | `string` | `'file'` |
| `onRemove` | 删除文件回调 | `(file: UploadFile) => boolean \| Promise<boolean>` | - |
| `beforeUpload` | 上传前钩子 | `(file, fileList) => boolean \| Promise<boolean>` | - |

> 组件类型上继承自 Antdv Next `Upload`，但运行时**只透传上表列出的字段**（外加 `className` 用于外层容器），`action`、`customRequest` 等其余属性不会生效。

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `update:value` | 文件列表变化（v-model） | `(fileList: UploadFile[]) => void` |
| `change` | 文件状态变化 | `(fileList: UploadFile[]) => void` |
| `success` | 上传成功 | `(response, file: UploadFile) => void` |
| `error` | 上传失败 | `(error: Error, file: UploadFile) => void` |

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

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getFileList` | 获取文件列表 | `UploadFile[]` |
| `setFileList` | 设置文件列表 | `(fileList: UploadFile[]) => void` |
| `clear` | 清空文件列表 | `void` |

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

| 类型 | accept 值 | 说明 |
|------|-----------|------|
| 图片 | `image/*` 或 `.jpg,.png,.gif,.webp` | 所有图片格式 |
| PDF | `.pdf` | PDF 文档 |
| Word | `.doc,.docx` | Word 文档 |
| Excel | `.xls,.xlsx` | Excel 表格 |
| 视频 | `video/*` 或 `.mp4,.avi` | 视频文件 |
| 音频 | `audio/*` 或 `.mp3,.wav` | 音频文件 |
| 压缩包 | `.zip,.rar,.7z` | 压缩文件 |

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

## 进度显示

基础 `Upload` 内部的上传方法并没有上报 `onProgress`，所以文件卡片上的进度环不会推进，上传完成后直接进入 `done` 状态。

需要真实进度反馈时，请使用分片上传组件 `ChunkUpload`：

```vue
<script setup lang="ts">
import { ChunkUpload } from '~/components/common/Upload'
</script>

<template>
  <ChunkUpload :chunk-size="5 * 1024 * 1024" :concurrency="3" :max-retry="3" />
</template>
```

`ChunkUpload` 支持 `chunkSize`、`concurrency`、`maxRetry`、`autoStart`、`resume`、`maxSize`、`maxCount`、`accept`、`multiple` 等 props，并抛出 `change` / `success` / `error` / `complete` 事件。

### 自定义分片逻辑（useChunkUploader）

需要自己控制分片上传时，使用同模块导出的 composable：

```ts
import { useChunkUploader } from '~/components/common/Upload'

const uploader = useChunkUploader({
  chunkSize: 5 * 1024 * 1024,
  concurrency: 3,
  maxRetry: 3,
  onUpdate: (task) => console.log('进度:', task.loaded, '/', task.total),
  onSuccess: (task) => console.log('完成:', task.filename),
})

// 添加文件并开始上传
const [task] = uploader.addFiles(files)
uploader.start(task.uid)
```

返回值为 `{ tasks, addFiles, start, pause, resume, cancel, remove, retry, clear, getTasks }`。

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
