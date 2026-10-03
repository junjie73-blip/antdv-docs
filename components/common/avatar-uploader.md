# 头像上传 (AvatarUploader)

`AvatarUploader` 是头像上传组件，封装了「选择图片 → 本地裁剪 → 上传服务端 → 回填 URL」的完整流程。组件对外通过 `v-model` 双向绑定头像地址，内部使用 [vue-cropper](https://github.com/xyxiao001/vue-cropper) 进行 1:1 裁剪，并复用 `useFileReader` 将图片读成 DataURL 用于预览。

> 组件只负责「拿到最终 URL 并回传」，不包含头像删除、默认头像兜底等业务语义；未设置 `modelValue` 时展示内置的占位图标。

## 组件 Props

| 属性 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| `modelValue` | 头像地址（`v-model` 绑定），有值时显示图片，无值时显示占位图标 | `string` | `''` |
| `maxSizeMb` | 单张图片大小上限（MB），超出即拦截并提示 | `number` | `5` |
| `outputSize` | 输出尺寸（px）。**仅用于弹窗内的说明文案**，不参与实际裁剪（见「注意事项」） | `number` | `256` |
| `round` | 头像预览是否圆形（`false` 时为 8px 圆角方形） | `boolean` | `true` |
| `size` | 头像预览尺寸（px），同时作用于 `a-avatar` 的 `size` 与容器宽高 | `number` | `80` |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `update:modelValue` | 上传成功后回填头像 URL（供 `v-model` 使用） | `(value: string) => void` |
| `uploaded` | 上传成功后的额外通知，与 `update:modelValue` 同时触发 | `(url: string) => void` |

## 插槽

无。

## 组件实例方法

无（组件未使用 `defineExpose`，不暴露任何方法或状态）。

## 内部依赖

### useFileReader

```ts
const { result: imgSrc, read: readFile } = useFileReader()
```

- `read(file)` 默认以 `readAsDataURL` 读取，返回 `Promise<string | ArrayBuffer>`；读取成功后 `result` 被赋值为 DataURL，作为 `VueCropper` 的 `:img` 源。
- `result` 在 `useFileReader` 内是 `readonly` 的 ref。

### useCache

本组件**未使用** `useCache`（源码中没有 import 或调用）。上传请求的鉴权、租户头等由接口层 `uploadFile` 的底层 http 封装统一处理，与本组件无关。

## 上传交互流程

1. 点击「上传头像 / 更换头像」按钮，`a-upload` 触发 `beforeUpload`。
2. `beforeUpload` 校验 MIME 类型（仅 `image/jpeg`、`image/png`、`image/webp`、`image/gif`）与文件大小（`maxSizeMb`），不通过则 `message.error` 并返回 `false`。
3. 校验通过后调用 `readFile(file)` 读取 DataURL，读取完成后打开裁剪弹窗，`nextTick` 中调用裁剪器 `refresh()` 刷新。
4. `beforeUpload` **始终返回 `false`**，用于阻止 `a-upload` 自带的上传行为——该组件在流程中仅充当「选文件」入口。
5. 用户在 `a-modal` 中拖动 / 缩放裁剪框（固定 1:1），点击「确认上传」触发 `handleConfirm`。
6. `getCropBlob` 取得裁剪结果 `Blob`；空 Blob（`size <= 0`）视为失败并抛出「裁剪失败」。
7. 将 Blob 包装为 `File`（文件名 `avatar_{时间戳}.png`，MIME 固定 `image/png`），调用 `uploadFile(file)`（`POST /upload/file`，`multipart/form-data`）。
8. 从返回结果中取 `res.data.url || res.url`，取不到则抛出「上传接口未返回 url」。
9. 依次 `emit('update:modelValue', url)`、`emit('uploaded', url)`，提示「头像上传成功」并关闭弹窗；任一步异常则 `message.error(e.message)`。
10. 弹窗关闭后，`watch(visible)` 会尝试将 `imgSrc.value` 置空（该赋值对只读 ref 无效，见「注意事项」）。

## 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

import AvatarUploader from '~/components/common/AvatarUploader.vue'

const avatar = ref('')

function handleUploaded(url: string) {
  console.log('新头像地址：', url)
}
</script>

<template>
  <!-- 基础用法：v-model 双向绑定头像地址 -->
  <AvatarUploader v-model="avatar" @uploaded="handleUploaded" />

  <!-- 方形预览、尺寸 64、单图限制 2MB -->
  <AvatarUploader v-model="avatar" :round="false" :size="64" :max-size-mb="2" />
</template>
```

## 注意事项

- **`outputSize` 不决定实际输出尺寸**：源码中 `VueCropper` 硬编码 `:output-size="1"`，输出尺寸随裁剪框原始像素而定；`outputSize` 只出现在弹窗底部文案「将按 1:1 输出 {{ outputSize }}x{{ outputSize }} PNG」中，文案与实际行为可能不一致。
- **输出格式恒为 PNG**：无论原图是 JPG / WebP / GIF，裁剪结果都被重新编码为 `image/png`；GIF 动图会退化为静态 PNG。
- **关闭弹窗时的清空无效**：`useFileReader` 返回的 `result` 是只读 ref，`watch` 中 `imgSrc.value = null` 在 Vue 下会告警且不生效，`imgSrc` 会保留上一次的 DataURL。
- **`beforeUpload` 恒为 `false`**：这是刻意为之——沿用 `a-upload` 的文件选择能力，但完全接管上传逻辑，因此不会触发 Antdv 内置的 `customRequest`。
- **类型与大小两道限制**：`accept` 属性与 `beforeUpload` 中的正则都会限制为 JPG / PNG / WebP / GIF，两处需保持一致。
- 组件无 `defineExpose`，无法通过 ref 调用方法；对外交互仅靠 `v-model` 与 `@uploaded`。
- `uploadFile` 返回结构做了 `res.data.url || res.url` 两种兼容，接口契约变更时需同步调整。

## 浏览器兼容性

依赖 `FileReader`、`File` / `Blob`、`FormData`、`Canvas`（vue-cropper 的 `getCropBlob` 基于 canvas 导出）等标准 Web API，Chrome / Edge / Firefox / Safari 等现代浏览器均可正常工作。Vue 3 与 Antdv Next 本身不支持 IE，故不提供 IE 兼容。
