# PreviewDialog 文件预览弹窗

通用文件预览弹窗，按文件类型自动选择合适的查看器：图片、PDF、Word、Excel、PPT、视频、音频、Markdown、纯文本，未支持的类型提供下载入口。基于 Antdv Next `Modal` 与 `PerfectScrollbar` 实现。

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

import PreviewDialog from '~/components/common/PreviewDialog.vue'

const previewVisible = ref(false)
const current = ref({
  fileId: 'xxx',
  url: '',
  fileName: 'demo.pdf',
  mimeType: 'application/pdf',
})
</script>

<template>
  <a-button @click="previewVisible = true">预览</a-button>

  <PreviewDialog
    v-model="previewVisible"
    :file-id="current.fileId"
    :url="current.url"
    :file-name="current.fileName"
    :mime-type="current.mimeType"
  />
</template>
```

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `modelValue` | 是否显示（`v-model`） | `boolean` | - |
| `fileId` | 文件 ID（与 `url` 二选一，实际以 `fileId` 请求预览地址） | `string` | - |
| `url` | 文件原始地址 | `string` | - |
| `fileName` | 文件名，用于标题、类型判断与下载名 | `string` | - |
| `mimeType` | MIME 类型（可选） | `string` | - |
| `category` | 后端返回的文件分类（可选） | `string` | - |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `update:modelValue` | 显示状态变化（`v-model`） | `(value: boolean) => void` |

## 支持的文件类型

内部通过 `getFileCategory(fileName)` 依据**文件后缀**分类：

| 分类 | 后缀示例 |
|------|----------|
| `image` | `.jpg` `.png` `.gif` `.webp` `.svg` `.ico` `.bmp` `.tiff` `.heic` |
| `video` | `.mp4` `.mov` `.avi` `.mkv` `.webm` `.flv` `.m3u8` `.wmv` `.3gp` … |
| `audio` | `.mp3` `.wav` `.flac` `.aac` `.ogg` `.m4a` `.wma` `.ape` |
| `pdf` | `.pdf` |
| `word` | `.doc` `.docx` |
| `excel` | `.xls` `.xlsx` `.csv` |
| `pptx` | `.ppt` `.pptx` |
| `markdown` | `.md` `.markdown` `.mdown` `.mkd` |
| `text` | `.txt` `.log` `.json` `.xml` `.yaml` `.yml` `.html` `.css` `.js` `.vue` |
| `archive` / `other` | `.zip` 等 —— 不支持在线预览，展示「下载文件」按钮 |

## 已知限制

- 分类由 `fileName` 后缀决定，**`category` prop 当前会被内部计算值覆盖**，请确保 `fileName` 正确。
- 只有传入 `fileId` 才会调用 `previewFile` 获取预览地址；**仅传 `url` 时不会加载预览内容**（标题与下载仍可用）。
- 预览地址来自 `previewFile`，下载地址来自 `downloadFile`，二者均由 `~/api` 提供。
- Word / Excel / PPT 预览依赖 `@vue-office/*`，视频依赖 `@videojs-player/vue`，Markdown 依赖 `markdown-it`。
- 使用 `v-safe-html` 渲染 Markdown 结果，需项目已注册该指令。
- 音频 / 视频的 `volume` 默认 `0.6`，视频内置 `0.5 ~ 2.0` 倍速选项。

## 典型使用场景

### 文件列表点击预览

```vue
<script setup lang="ts">
import { ref } from 'vue'

import PreviewDialog from '~/components/common/PreviewDialog.vue'

const previewVisible = ref(false)
const current = ref<{ fileId: string; url: string; fileName: string; mimeType?: string; category?: string }>({
  fileId: '',
  url: '',
  fileName: '',
})

function handlePreview(record: { fileId: string; url: string; fileName: string; mimeType?: string; category?: string }) {
  current.value = record
  previewVisible.value = true
}
</script>

<template>
  <PreviewDialog
    v-model="previewVisible"
    :file-id="current.fileId"
    :url="current.url"
    :file-name="current.fileName"
    :mime-type="current.mimeType"
    :category="current.category"
  />
</template>
```
