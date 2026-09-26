# MarkdownEditor 编辑器组件

基于 [tiptap](https://tiptap.dev/)（`@tiptap/vue-3`）封装的富文本编辑器组件，支持工具栏配置、图片/视频上传、字数统计和全屏。

组件的对外契约沿用了迁移前的 wangEditor 实现：工具栏 key 命名、`toolbarConfig` 语义、事件与方法名保持兼容，`getMarkdown` / `setMarkdown` 也继续以 HTML 承接（Markdown 只是历史命名，并非真正的 Markdown 语法）。

## 基础用法

```vue
<script setup lang="ts">
import { MarkdownEditor } from '~/components/business/MarkdownEditor'
import { ref } from 'vue'

const content = ref('')

function handleChange(html: string, text: string) {
  console.log('HTML:', html)
  console.log('纯文本:', text)
}
</script>

<template>
  <MarkdownEditor
    v-model:value="content"
    :height="400"
    placeholder="请输入内容..."
    @change="handleChange"
  />
</template>
```

> 组件使用 `v-model:value`（prop `value` + 事件 `update:value`），不是 `v-model`。

## 组件 Props

### 基础属性

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `value` | 编辑器内容（`v-model:value`） | `string` | `''` |
| `height` | 固定高度（设置后不再随内容伸缩） | `string \| number` | - |
| `minHeight` | 最小高度 | `string \| number` | `160` |
| `maxHeight` | 最大高度 | `string \| number` | `500` |
| `mode` | 编辑器模式 | `'edit' \| 'preview' \| 'split'` | `'edit'` |
| `theme` | 主题风格（见「主题切换」） | `'light' \| 'dark'` | `'light'` |
| `placeholder` | 占位文本 | `string` | `'请输入内容...'` |
| `readonly` | 是否只读 | `boolean` | `false` |
| `disabled` | 是否禁用 | `boolean` | `false` |

### 功能控制

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `showToolbar` | 是否显示工具栏 | `boolean` | `true` |
| `toolbarConfig` | 工具栏配置 | `MarkdownEditorToolbarConfig` | - |
| `imageUpload` | 图片上传配置 | `ImageUploadConfig` | - |
| `videoUpload` | 视频上传配置 | `VideoUploadConfig` | - |
| `autoFocus` | 是否自动聚焦 | `boolean` | `false` |
| `maxLength` | 最大字数限制 | `number` | - |
| `showCount` | 是否显示字数统计 | `boolean` | `true` |
| `compact` | 紧凑模式 | `boolean` | `false` |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `update:value` | 内容变化（`v-model:value`） | `(value: string) => void` |
| `change` | 内容变化详情 | `(html: string, text: string) => void` |
| `focus` | 获得焦点 | `(editor: Editor) => void` |
| `blur` | 失去焦点 | `(editor: Editor) => void` |
| `uploadSuccess` | 图片/视频上传成功 | `(file: File, response: UploadResponse) => void` |
| `uploadError` | 图片/视频上传失败 | `(file: File, error: Error) => void` |
| `maxLength` | 输入超过字数限制（该次输入被拦截） | `(currentLength, maxLength) => void` |
| `created` | 编辑器创建完成 | `(editor: Editor) => void` |
| `destroyed` | 编辑器销毁 | - |

> `Editor` 为 `@tiptap/vue-3` 导出的编辑器类型；`change` 的第一个参数是 HTML，第二个参数是纯文本。

## 组件实例方法

通过 ref 调用：

```ts
const editorRef = ref<MarkdownEditorInstance>()

// 获取 tiptap 编辑器实例
const editor = editorRef.value?.getEditor()

// 获取/设置内容
editorRef.value?.getHtml()
editorRef.value?.setHtml('<p>新内容</p>')

// 操作
editorRef.value?.focus()
editorRef.value?.clear()
```

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getEditor` | 获取 tiptap 编辑器实例 | `Editor \| null` |
| `getHtml` | 获取 HTML 内容 | `string` |
| `getMarkdown` | 获取内容（同 `getHtml`） | `string` |
| `getText` | 获取纯文本内容 | `string` |
| `setHtml` | 设置 HTML 内容 | `(html: string) => void` |
| `setMarkdown` | 设置内容（同 `setHtml`） | `(html: string) => void` |
| `clear` | 清空内容 | `void` |
| `focus` | 聚焦编辑器 | `void` |
| `blur` | 失焦编辑器 | `void` |
| `undo` | 撤销 | `void` |
| `redo` | 重做 | `void` |
| `insertText` | 插入文本 | `(text: string) => void` |
| `insertHtml` | 插入 HTML | `(html: string) => void` |
| `insertImage` | 插入图片节点 | `(url: string, alt?: string, href?: string) => void` |
| `insertVideo` | 插入视频节点 | `(url: string, poster?: string) => void` |
| `selectAll` | 全选 | `void` |
| `getStats` | 获取字数统计 | `{ textLength, htmlLength }` |

## 工具栏配置

### 默认工具栏

内置默认工具栏（`DEFAULT_TOOLBAR_KEYS`）包含以下功能按钮：

```
标题选择 | 加粗 斜体 下划线 删除线 文字颜色 背景颜色 |
字号 字体 行高 |
无序列表 有序列表 待办 对齐方式 |
插入链接 上传图片 插入视频 插入表格 代码块 |
撤销 重做 | 全屏
```

### 自定义工具栏

`toolbarConfig` 的类型为：

```ts
interface MarkdownEditorToolbarConfig {
  /** 完整自定义按键列表；一旦配置，excludeKeys 不再生效 */
  toolbarKeys?: MarkdownEditorToolbarKey[]
  /** 从默认按键中排除若干项 */
  excludeKeys?: MarkdownEditorToolbarKey[]
}
```

可用 key（沿用 wangEditor 命名）：`|`、`headerSelect`、`bold`、`italic`、`underline`、`through`、`color`、`bgColor`、`fontSize`、`fontFamily`、`lineHeight`、`bulletedList`、`numberedList`、`todo`、`justifyLeft`、`justifyCenter`、`justifyRight`、`insertLink`、`uploadImage`、`uploadVideo`、`insertTable`、`codeBlock`、`undo`、`redo`、`fullScreen`。

```vue
<script setup lang="ts">
import { MarkdownEditor } from '~/components/business/MarkdownEditor'
import type { MarkdownEditorToolbarConfig } from '~/components/business/MarkdownEditor'

// 只保留需要的按钮
const toolbarConfig: MarkdownEditorToolbarConfig = {
  toolbarKeys: [
    'headerSelect',
    '|',
    'bold',
    'italic',
    'underline',
    '|',
    'bulletedList',
    'numberedList',
    '|',
    'insertLink',
    'uploadImage',
    '|',
    'undo',
    'redo',
  ],
}
</script>

<template>
  <MarkdownEditor v-model:value="content" :toolbar-config="toolbarConfig" />
</template>
```

也可以只做减法：

```ts
const toolbarConfig: MarkdownEditorToolbarConfig = {
  excludeKeys: ['fullScreen'],
}
```

## 编辑器模式

### edit 模式（默认）

完整编辑模式，显示工具栏和编辑区域：

```vue
<MarkdownEditor v-model:value="content" mode="edit" />
```

### preview 模式

只读预览：隐藏工具栏并禁止编辑。

```vue
<MarkdownEditor v-model:value="content" mode="preview" />
```

### split 模式

`'split'` 保留在类型定义中，但当前实现未提供分栏预览（行为与 `edit` 一致）。需要左右对照时，请自行组合两个实例。

## 图片上传配置

### 配置接口说明

```ts
interface UploadResponse {
  fileId: string
  filename: string
  url: string
  size: number
  mimeType?: string
}

interface ImageUploadConfig {
  server?: string              // 上传服务地址，不传则走内置上传接口
  fieldName?: string           // 上传字段名，默认 'file'
  meta?: Record<string, unknown>    // 额外上传参数
  maxFileSize?: number         // 最大文件大小（MB），默认 5
  allowedFileTypes?: string[]  // 允许的 MIME，默认 png/jpeg/jpg/gif/webp
  customUpload?: (file: File, insertFn: (url: string, alt?: string, href?: string) => void) => void
  onSuccess?: (file: File, response: UploadResponse) => void
  onError?: (file: File, error: Error) => void
  onProgress?: (file: File, percent: number) => void
}
```

### 服务端上传示例

```vue
<script setup lang="ts">
const imageUpload = {
  server: '/api/upload/image',
  fieldName: 'file',
  meta: {
    type: 'article',
  },
  maxFileSize: 10,
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
}
</script>

<template>
  <MarkdownEditor v-model:value="content" :image-upload="imageUpload" />
</template>
```

### 自定义上传方法

对接 OSS 或其他存储服务时使用：

```vue
<script setup lang="ts">
const imageUpload = {
  customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
    // uploadToOss 需自行实现（项目内暂无内置的 OSS 上传工具）
    uploadToOss(file).then((result) => {
      // 将 URL 插入到编辑器中
      insertFn(result.url, file.name, result.url)
    })
  },
}
</script>

<template>
  <MarkdownEditor v-model:value="content" :image-upload="imageUpload" />
</template>
```

> 体积与格式校验在调用 `customUpload` 之前统一执行，超限会提示并中断本次上传。

## 视频上传配置

`VideoUploadConfig` 与图片配置结构一致（`customUpload` 的 `insertFn` 签名为 `(url, poster?)`），默认 `maxFileSize` 为 `100`，默认允许 `mp4 / webm / ogg / quicktime`：

```vue
<script setup lang="ts">
const videoUpload = {
  server: '/api/upload/video',
  maxFileSize: 200,
}
</script>

<template>
  <MarkdownEditor v-model:value="content" :video-upload="videoUpload" />
</template>
```

## 字数统计与限制

### 显示字数统计

底部会自动显示当前纯文本字数（`showCount` 默认开启）：

```vue
<MarkdownEditor v-model:value="content" :show-count="true" />
<!-- 输出：256 字 -->
```

### 设置最大字数限制

超过 `maxLength` 的输入会被直接拦截，同时抛出 `maxLength` 事件：

```vue
<MarkdownEditor
  v-model:value="content"
  :max-length="5000"
  @max-length="(current, max) => message.warning(`已超过最大字数 ${max}`)"
/>
<!-- 底部输出：3200 字 / 5000 上限 -->
```

## 主题切换

```vue
<MarkdownEditor v-model:value="content" theme="light" />
```

暗色外观由全局 `.dark` 根类驱动（组件内使用 `:global(.dark)` 覆盖内容区样式），因此跟随项目整体深浅色切换即可。`theme` prop 目前仅声明并保留，尚未参与样式计算。

## 与 wangEditor 的差异

- tiptap 输出的列表项内部会多包一层 `<p>`（`<li><p>…</p></li>`），组件内已用 CSS 压平 `li > p` 的间距，视觉上与旧版一致。
- 已移除 `editorConfig` prop，编辑器配置固定在组件内部（见 `extensions/`）。
- `getMarkdown` / `setMarkdown` 不再做 Markdown 语法转换，行为等同于 `getHtml` / `setHtml`。

## 典型使用场景

### 文章编辑页面

```vue
<script setup lang="ts">
import { MarkdownEditor } from '~/components/business/MarkdownEditor'
import type { MarkdownEditorInstance } from '~/components/business/MarkdownEditor'
import { ref } from 'vue'

const content = ref('')
const editorRef = ref<MarkdownEditorInstance>()

async function handleSubmit() {
  const html = editorRef.value?.getHtml() || ''
  await api.saveArticle({ content: html })
  message.success('保存成功')
}

async function handlePreview() {
  const html = editorRef.value?.getHtml() || ''
  // 打开预览弹窗...
}
</script>

<template>
  <div class="space-y-4">
    <!-- 标题输入 -->
    <a-input placeholder="文章标题" size="large" />

    <!-- 编辑器 -->
    <MarkdownEditor
      ref="editorRef"
      v-model:value="content"
      :height="600"
      :image-upload="imageUploadConfig"
      :max-length="10000"
    />

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-3">
      <a-button @click="handlePreview">预览</a-button>
      <a-button type="primary" @click="handleSubmit">发布</a-button>
    </div>
  </div>
</template>
```
