# 组合式函数

`src/composables/` 下是项目自研的组合式函数（composable），覆盖请求、缓存、通知、文件读取、上传、打印、水印、主题切换、SSE、ECharts 等场景。

## 导入路径

统一出口 `~/composables`（`src/composables/index.ts`）导出 `useCRUD`、`usePermission`、`useSSE`、`useWatermark`、`useCache` 以及请求系（`export * from './web/request'`）；其余组合式函数必须按全路径导入：

| 组合式函数 | 导入路径 |
|-----------|---------|
| `useCRUD` | `~/composables`（见 [useCRUD 增删改查](/components/plans/use-crud)） |
| `usePermission` | `~/composables`（见 [权限系统](/guide/features/permission)） |
| `useSSE` | `~/composables` 或 `~/composables/web/sse` |
| `useWatermark` | `~/composables` 或 `~/composables/web/useWatermark` |
| `useAppRequest` / `useAppWatcher` / `useAppParallelRequest` | `~/composables`（源码位于 `~/composables/web/request/`） |
| `useCache` | `~/composables` 或 `~/composables/useCache` |
| `useNotice` | `~/composables/useNotice` |
| `useFileReader` | `~/composables/useFileReader` |
| `usePrint` | `~/composables/print` |
| `useEcharts` / `setupEcharts` | `~/composables/echarts/useEcharts`、`~/composables/echarts/setup` |
| `usePasswordPolicy` | `~/composables/usePasswordPolicy` |
| `useRouteLoading` | `~/composables/useRouteLoading` |
| `useChunkUpload` | `~/composables/useChunkUpload` |
| `useThemeTransition` | `~/composables/web/useThemeTransition` |

::: tip 别名
文档站与源码统一使用 `~` 指向 `src`（`#` 指向 `types`），不存在 `@/` 别名。

`useLocale`（[国际化](/guide/features/i18n)）、WebSocket 封装（[WebSocket](/guide/modules/websocket)）已单独成文。
:::

---

## useAppRequest

对 alova `useRequest` 的封装（`src/composables/web/request/`），在原生能力上增加了响应体自动解构（`{ code, data }` → `data`）和统一提示。

### 选项

`useAppRequest(methodHandler: () => Method<any>, options?: UseAppRequestOptions<T>)`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `immediate` | `boolean` | `false` | 是否创建后立即执行 |
| `initialData` | `T` | - | 初始数据 |
| `showSuccess` | `boolean` | `false` | 成功时是否弹 `message.success` |
| `successMessage` | `string` | `'操作成功'` | 成功提示文案 |
| `showError` | `boolean` | `true` | 失败时是否弹 `message.error` |
| `errorMessage` | `string \| ((e: Error) => string)` | - | 自定义失败文案，未传则取响应体 `message` / `Error.message` |
| `onSuccess` | `(data: T) => void` | - | 成功回调（拿到解构后的数据） |
| `onError` | `(e: Error) => void` | - | 失败回调 |
| `unwrapResponse` | `boolean` | `true` | 是否自动解构 `{ code, data }` |

### 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `Ref<T \| undefined>` | 解构后的数据（`computed`） |
| `loading` | `Ref<boolean>` | 加载状态（alova 原生） |
| `error` | `Ref<Error \| undefined>` | 错误（alova 原生） |
| `send` | `(force?: boolean) => Promise<T>` | 执行请求；`force=true` 忽略缓存强制请求 |
| `abort` | `() => void` | 中止请求 |
| `update` | `(newData: T) => void` | 本地更新数据 |

```ts
import { ref } from 'vue'
import { useAppRequest } from '~/composables'
import { get } from '~/api/request'

const params = ref({ page: 1, pageSize: 10 })
const { data, loading, send } = useAppRequest(() => get('/user/list', params.value), {
  initialData: [],
  immediate: true,
})

params.value = { page: 2, pageSize: 10 }
await send()
```

::: warning send 会把错误继续抛出
`send` 内部已经做过一次 `message.error` 提示，但 `catch` 之后仍会 `throw e`。调用方需自行 `catch`，否则会产生控制台未捕获的 Promise rejection。
:::

### useAppWatcher

监听响应式状态，变化时自动请求。选项在 `useAppRequest` 基础上多一个：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `force` | `boolean` | `false` | 依赖变化时是否强制请求 |

`useAppWatcher(methodHandler, watchingStates, options)`，返回值同 `useAppRequest`。

```ts
const keyword = ref('')
const { data } = useAppWatcher(
  () => get('/user/search', { keyword: keyword.value }),
  [keyword],
  { initialData: [] },
)
```

### useAppParallelRequest

并行发起多个请求：

`useAppParallelRequest(fetchers, options?)`

| 选项字段 | 类型 | 默认值 |
|---------|------|--------|
| `immediate` | `boolean` | `false` |
| `showError` | `boolean` | `true` |

返回值：`{ data, loading, error, send }`。其中 `data` 是 `{ [key]: Ref }` 的映射，`loading` 为整体加载态，`send()` 返回 `Promise<void>`。

```ts
const { data, send } = useAppParallelRequest(
  {
    users: () => get('/user/list'),
    roles: () => get('/role/list'),
  },
  { immediate: true },
)

console.log(data.users.value)
```

::: warning 并行请求的差异
该函数**始终**解构 `{ code, data }`，没有 `unwrapResponse` 开关；也不提供单个请求的细粒度 loading / 错误回调，任一请求失败即整体 `error` 并抛出。
:::

---

## usePasswordPolicy

密码策略校验（`src/composables/usePasswordPolicy.ts`）。首次调用拉取接口，之后复用模块级缓存。

`usePasswordPolicy()` 无参数，返回值：

| 字段 | 类型 | 说明 |
|------|------|------|
| `policy` | `Ref<PasswordPolicy>` | 当前策略，初始为默认值 |
| `loading` | `Ref<boolean>` | 拉取中 |
| `load` | `() => Promise<void>` | 手动加载（已缓存则直接返回） |
| `policyText` | `ComputedRef<string>` | 策略描述，如 `6-64 位 · 含数字`，用于 helpMessage |
| `validate` | `(value: string) => { ok: boolean; message?: string }` | 校验单个密码 |

默认策略（接口失败时兜底）：

| 字段 | 默认值 |
|------|--------|
| `minLength` | `6` |
| `maxLength` | `64` |
| `requireUppercase` / `requireLowercase` / `requireNumber` / `requireSymbol` | `false` |

```ts
import { usePasswordPolicy } from '~/composables/usePasswordPolicy'

const { policy, policyText, validate } = usePasswordPolicy()
const result = validate('abc123')
```

::: warning 只在 setup 里用、且进程内只拉一次
内部执行 `onMounted(load)`，因此必须在组件 `setup` 作用域内调用。`cachedPolicy` 是模块级变量，整个应用生命周期只请求一次；策略在服务端变更后需要刷新页面才会生效。加载失败时静默回退默认策略（仅 `console.warn`）。
:::

---

## useRouteLoading

路由切换 Loading 状态管理（`src/composables/useRouteLoading.ts`），内置最小显示时间、进度估算与慢加载判定。

`useRouteLoading(options?)`

| 选项字段 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `minDuration` | `number` | `300` | 最小显示时间（ms），防闪烁 |
| `auto` | `boolean` | `true` | 是否自动监听路由变化 |

返回值：

| 字段 | 类型 | 说明 |
|------|------|------|
| `isLoading` / `isComplete` / `isError` | `ComputedRef<boolean>` | 状态 |
| `progress` | `ComputedRef<number>` | 进度（未完成时最高 90） |
| `elapsed` | `ComputedRef<number>` | 从 `start` 起的耗时（ms） |
| `isSlow` | `ComputedRef<boolean>` | 加载超过 3000ms 且仍在加载 |
| `start` / `complete` / `error` / `cancel` / `reset` | `() => void` | 手动控制 |
| `withLoading` | `<T>(fn: () => Promise<T>) => Promise<T>` | 包裹一次完整的加载-完成流程 |

```ts
import { useRouteLoading } from '~/composables/useRouteLoading'

const { isLoading, progress, withLoading } = useRouteLoading()

const data = await withLoading(() => fetchData())
```

::: warning auto 模式会注册全局路由守卫
`auto: true`（默认）时，源码会同时 `watch(route.path)` 并注册 `router.beforeEach` / `router.afterEach`。这些守卫只在 `tryOnScopeDispose` 里走了 `reset()`（仅清定时器），**并未被移除**；组件卸载后守卫仍会执行 `start()` / `complete()`。多处调用容易相互叠加，若需要精确控制，建议显式传 `{ auto: false }` 并手动调用 `withLoading`。
:::

---

## useChunkUpload

分片上传（`src/composables/useChunkUpload.ts`），把文件切片后交给 Web Worker 处理，主线程按 `concurrent` 并发调度。

`useChunkUpload(options?)`

| 选项字段 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `chunkSize` | `number` | `5 * 1024 * 1024` | 单片大小（字节） |
| `concurrent` | `number` | `3` | 并发分片数 |
| `workerUrl` | `string` | - | Worker 脚本地址 |

返回值：

| 字段 | 类型 | 说明 |
|------|------|------|
| `uploadFile` | `(file: File) => Promise<void>` | 开始上传（内部会先 `cancel()` 重置上一次） |
| `pause` / `resume` / `cancel` | `() => void` | 暂停 / 继续 / 取消 |
| `uploading` | `ComputedRef<boolean>` | 是否处于 `uploading` |
| `progress` | `Ref<number>` | 整体进度（0-100） |
| `chunks` | `Ref<ChunkInfo[]>` | 分片状态列表 |
| `status` | `Ref<UploadStatus>` | `idle \| uploading \| paused \| completed \| error` |
| `hash` | `Ref<string>` | 由 worker 回传的文件哈希（`chunk-done` 携带时写入） |

`ChunkInfo` 结构：`{ index: number; status: 'pending' | 'uploading' | 'done' | 'error'; progress: number }`。

```ts
import { useChunkUpload } from '~/composables/useChunkUpload'

const { uploadFile, pause, progress, chunks } = useChunkUpload({
  chunkSize: 5 * 1024 * 1024,
  concurrent: 3,
})

await uploadFile(file)
```

### Worker 协议约定

主线程向 worker 发送、以及 worker 回传的消息格式固定如下：

| 方向 | 消息 |
|------|------|
| 主线程 → worker | `{ type: 'process', chunk: ArrayBuffer, index, total, chunkSize, fileSize }` |
| worker → 主线程 | `{ type: 'progress', index, progress }`（0-100） |
| worker → 主线程 | `{ type: 'chunk-done', index, hash? }` |
| worker → 主线程 | `{ type: 'error', index, message }` |

::: warning 默认 worker 路径在仓库中不存在
未传 `workerUrl` 时源码会退回 `new URL('~/workers/upload.worker.ts', import.meta.url)`，但 `src/workers/` 目录并不存在（`useChunkUpload.ts:51`）。当前仓库里能用的 worker 是 `src/components/common/Upload/upload.worker.ts`，使用该组合式函数时请显式传入可用的 `workerUrl`，并保证 worker 遵循上面的协议，否则分片永远不会 resolve。
:::

---

## useWatermark

基于 `watermark-plus` 的水印（`src/composables/web/useWatermark.ts`）。

`useWatermark(options?)`

| 选项字段 | 类型 | 说明 |
|---------|------|------|
| `content` | `unknown` | 水印文本，可传 `ref`（内部 `unref`） |
| `enabled` | `unknown` | 是否启用，可传 `ref` |

内置默认样式：`width: 200`、`height: 150`、`rotate: 330`、`alpha: 0.15`、`fontSize: 14`、`fontWeight: 'normal'`、`fontFamily: 'sans-serif'`、`color: '#666666'`。

返回值：`{ watermarkInstance, createWatermark, destroyWatermark, updateWatermark }`。其中 `watermarkInstance` 是 `Ref<Watermark | null>`。

```ts
import { ref } from 'vue'
import { useWatermark } from '~/composables'

const enabled = ref(true)
useWatermark({ content: 'Antdv Admin', enabled })
```

行为：`onMounted` 时按 `enabled && content` 创建水印，`onUnmounted` 时销毁；同时监听 `content`、`enabled` 的变化自动重建或销毁。二者任一为假值时不会渲染水印。

---

## useThemeTransition

带圆形扩散 / 收缩动画的主题切换（`src/composables/web/useThemeTransition.ts`），基于 View Transition API。

| 导出 | 签名 | 说明 |
|------|------|------|
| `useThemeTransition()` | - | 返回下面两个方法 + `isDarkNow` |
| `switchThemeWithAnimation` | `(target: 'light' \| 'dark', event?: MouseEvent) => Promise<void>` | 切到指定主题，以 `event` 坐标为中心扩散 |
| `toggleThemeWithAnimation` | `(event?: MouseEvent) => Promise<void>` | 取反当前主题 |
| `isDarkNow` | `(theme: ThemeMode) => boolean` | 判断某主题在当前系统下是否为暗色 |

```ts
import { useThemeTransition } from '~/composables/web/useThemeTransition'

const { toggleThemeWithAnimation } = useThemeTransition()
// 以点击位置为圆心扩散
toggleThemeWithAnimation(event)
```

实现要点：DOM 层通过切换 `<html>` 的 `dark` class 生效（`applyThemeToDom`）；不支持 `document.startViewTransition` 时直接切换、无动画；store（`useAppStore`）在动画结束后才更新。

::: warning 遗留调试日志
源码中保留了 `console.log(isSwitchingToDark, target)`（`useThemeTransition.ts:72`），生产环境切主题会打日志。
:::

---

## useNotice

站内通知的统一状态源（`src/composables/useNotice.ts`）。**模块级单例**：`list` / `unreadCount` / `loading` 定义在模块作用域，所有调用方共享同一份数据。

`useNotice()` 无参数，返回值：

| 字段 | 类型 | 说明 |
|------|------|------|
| `list` | `Ref<NoticeRecord[]>` | 通知列表，实时推送时头部插入、最多保留 20 条 |
| `unreadCount` | `Ref<number>` | 未读数 |
| `loading` | `Ref<boolean>` | `loadList` 进行中 |
| `hasUnread` | `ComputedRef<boolean>` | `unreadCount > 0` |
| `loadList` | `(params?: { pageNum?: number; pageSize?: number }) => Promise<NoticeRecord[]>` | 拉取列表，默认 `pageNum=1` / `pageSize=10` |
| `refreshUnreadCount` | `() => Promise<void>` | 重新拉取未读数（失败静默） |
| `read` | `(item: NoticeRecord \| NotificationItem) => Promise<void>` | 单条已读，乐观更新，失败回滚并抛出 |
| `readAll` | `(params?: { source?: string; noticeType?: number }) => Promise<void>` | 全部已读，乐观更新，失败回滚并抛出 |
| `removeLocal` | `(noticeId: string) => void` | 仅从本地列表移除，不发请求 |

`NoticeRecord` 字段：`noticeId` / `noticeType` / `source`（`'notice' | 'workflow' | 'report' | 'system'`）/ `title` / `content` / `isRead`（`0 | 1`）/ `priority` / `publishTime` / `bizType` / `bizId` / `bizSource`。接口返回的 snake_case 字段会被 `transformItem` 兼容映射。

```ts
import { useNotice } from '~/composables/useNotice'

const { list, unreadCount, loadList, read, readAll } = useNotice()

await loadList({ pageNum: 1, pageSize: 20 })
await read(list.value[0]!)
```

::: warning 只在首次调用时注册 WS 监听
`initialized` 是模块级标志，**只有第一次调用 `useNotice()`** 才会注册 WebSocket 的 `onNotice` / `onRevoke` 监听并拉取一次未读数（`useNotice.ts:64-68`）。若应用启动后始终没有组件调用过它，后续任何页面都收不到实时推送，`loadList` 也只能拿到历史数据。

另外 `read` / `readAll` 的乐观更新会**直接改写传入对象的 `isRead`**（`removeLocal` 亦会改动共享的 `list`），若把列表项作为 props 往下传，需注意这层隐式响应式副作用。
:::

---

## useCache

响应式缓存组合式函数（`src/composables/useCache.ts`），基于 vueuse 的 `useStorage` + 项目 `cache` 单例，提供「读 ref 即读缓存、写 ref 即落缓存」的体验，并支持同浏览器跨标签页同步。

`useCache<T>(key: string, options?: UseCacheOptions)`

| 选项字段 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `defaultValue` | `T \| null` | `null` | 键不存在时的初始值 |
| `expire` | `number` | `0` | 过期时间（秒），`0` 表示永不过期 |
| `deep` | `boolean` | `true` | 深度监听 `value` 变化并自动写回 |
| `immediate` | `boolean` | - | 类型中已声明，**源码未使用** |

返回值（`UseCacheReturn<T>` = `{ key, value }` + `CacheInstance` 全量方法）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 当前缓存键 |
| `value` | `Ref<T \| null>` | 响应式值，读时反序列化、写时持久化；赋 `null` 会删除该项 |
| `getItem` / `setItem` / `removeItem` / `hasItem` | 同 `cache` 单例 | 透传的同步 KV 方法 |
| `clear` / `keys` / `getExpire` / `setExpire` / `touch` | 同 `cache` 单例 | 透传 |

```ts
import { useCache } from '~/composables'

const { value, removeItem } = useCache<{ name: string }>('user-info', { expire: 3600 })

value.value = { name: 'Tom' } // 写入
console.log(value.value)      // 读取
```

::: warning 与 `cache` 单例的差异
`cache` 是纯同步 KV 存储（无响应式，键为 `前缀_key`、生产环境走 SM4 加密）；`useCache` 在其之上加了一层 ref，但有两点需注意：

1. 内部 `useStorage` 直接以**原始 `key`** 写入 `localStorage`，**未带 `cache` 的前缀与加密**。因此写一次 `value` 实际会产生两条记录：vueuse 的原始键（明文 JSON）与 `cache` 的前缀键（加密）。
2. 类型声明的 `immediate` 选项在实现中被忽略，不会「立即写回默认值」。

若只需要一次性读写、不关心响应式，直接用 `cache` 更省事。
:::

---

## useFileReader

`FileReader` 的 Promise 化封装（`src/composables/useFileReader.ts`），常用于选择图片后做本地预览。

`useFileReader()` 无参数，返回值：

| 字段 | 类型 | 说明 |
|------|------|------|
| `result` | `Readonly<Ref<string \| ArrayBuffer \| null>>` | 最近一次读取结果 |
| `isLoading` | `Readonly<Ref<boolean>>` | 读取中 |
| `error` | `Readonly<Ref<Error \| null>>` | 失败原因（固定 `new Error('文件读取失败')`） |
| `read` | `(file: File, readAs?: 'readAsDataURL' \| 'readAsText' \| 'readAsArrayBuffer') => Promise<string \| ArrayBuffer>` | 读取文件，默认 `readAsDataURL` |
| `reset` | `() => void` | 清空 `result` / `error` / `isLoading` |

```ts
import { useFileReader } from '~/composables/useFileReader'

const { result, isLoading, read, reset } = useFileReader()

await read(file)          // 默认转 DataURL，适合预览
console.log(result.value) // data:image/png;base64,...
reset()
```

::: warning 只读 ref 不可外部改写，且没有取消能力
`result` / `isLoading` / `error` 均被 `readonly()` 包裹，外部赋值无效（开发环境会告警）。每次 `read` 都新建一个 `FileReader`，**不提供 abort/取消**；连续调用时以最后完成的那次结果为准。若需读取文本或二进制，记得显式传 `readAs`。
:::

---

## usePrint

基于隐藏 iframe 的浏览器打印（`src/composables/print.ts`），完整用法、自定义样式与业务集成示例见 [打印工具 (usePrint)](/components/utils/print)。

`usePrint(options: PrintOptions): void` —— **同步执行、无返回值**。

| 选项字段 | 类型 | 默认值 | 说明 |
|---------|------|--------|------|
| `title` | `string` | `document.title` | 打印标题，同时作为 iframe 文档标题与页眉标题 |
| `target` | `string \| HTMLElement` | 必填 | 要打印的元素或 CSS 选择器 |
| `onBeforePrint` | `() => void` | - | 创建 iframe 前同步调用 |
| `onAfterPrint` | `() => void` | - | 打印（或取消）后调用，随后移除 iframe |
| `showHeader` | `boolean` | `true` | 页眉（标题 + 打印时间） |
| `showFooter` | `boolean` | `true` | 页脚（固定文案「第 / 页」，非真实页码） |
| `styles` | `string` | - | 追加到默认打印样式之后 |

```ts
import { usePrint } from '~/composables/print'

usePrint({ title: '用户列表', target: '#print-area' })
```

::: warning 三处实现细节
1. 找不到 `target` 元素、或无法创建 iframe 文档时，只 `message.error` 提示后**直接 return**，不抛错也不返回 Promise，调用方无法感知失败。
2. `onAfterPrint` 可能被触发两次：`contentWindow.onload` 中的 `setTimeout` 与 `afterprint` 监听各调一次（`print.ts:116-135`），且 `afterprint` 分支未做去重。
3. 打印内容取自 `el.innerHTML`，页面样式表不会被带入 iframe，仅内置默认样式 + `styles` 生效，需要其它样式请通过 `styles` 补齐。
:::

---

## useEcharts 与 ECharts 组件

ECharts 组合式函数位于 `src/composables/echarts/`，配套组件在 `src/components/common/ECharts/`，完整 API、`UseEchartsOptions` / `UseEchartsReturn` 逐字段说明与已知问题见 [ECharts 图表](/components/common/echarts)。

```ts
import { setupEcharts } from '~/composables/echarts/setup'
import { useEcharts } from '~/composables/echarts/useEcharts'

setupEcharts() // 幂等注册所需的图表 / 组件 / Canvas 渲染器

const { containerRef, chart, isReady, setOption, resize, dispose, showLoading, hideLoading } = useEcharts(option, {
  autoResize: true,
  resizeStrategy: 'raf', // 'raf' | 'debounce' | 'throttle' | 'none'
})
```

`useEcharts<T>(initialOption?, options?)` 会在容器尺寸为 0 时跳过初始化并自动重试（最多 5 次、间隔 100ms），`tryOnBeforeUnmount` 时自动 `dispose()`；`setData()` 目前是空实现，调用无效果。

---

## useSSE

服务端事件推送（`src/composables/web/sse/`），内部由 `SSEStateManager`（状态）、`SSEEventManager`（事件派发）、`SSEReconnectManager`（指数退避重连）三个管理器协作。

`useSSE(options: SSEOptions)` —— **参数必传**，没有默认值。

### 选项

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | `string` | 必填 | EventSource 地址 |
| `headers` | `Record<string, string>` | - | 已在类型中声明，但源码未使用（见下方 warning） |
| `reconnectEnabled` | `boolean` | `true` | 是否启用自动重连 |
| `reconnectInterval` | `number` | `1000` | 基础重连间隔（ms） |
| `maxReconnectAttempts` | `number` | `5` | 最大重连次数 |
| `reconnectDelayMultiplier` | `number` | `2` | 退避倍数 |
| `maxReconnectDelay` | `number` | `30000` | 单次重连延迟上限（ms） |
| `withCredentials` | `boolean` | `false` | 是否携带 Cookie |

重连延迟算法：`min(reconnectInterval * reconnectDelayMultiplier ** 当前次数, maxReconnectDelay)`。

### 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `connect` / `disconnect` | `() => void` | 建立 / 断开连接 |
| `reconnect` | `() => void` | 重置并重连 |
| `on` / `once` / `off` | `(eventType, callback) => void` | 事件订阅 / 单次订阅 / 取消 |
| `registerHandlers` | `(handlers: SSEEventHandlers) => () => void` | 批量注册，返回取消函数 |
| `readyState` | `Readonly<Ref<SSEState>>` | 当前状态枚举 |
| `isConnected` / `isConnecting` / `isDisconnected` / `isError` | `ComputedRef<boolean>` | 状态派生 |
| `reconnectAttempts` | `Readonly<Ref<number>>` | 已重连次数 |
| `lastEventId` | `Readonly<Ref<string \| null>>` | 最近一次事件 ID（重连时拼入 URL） |

```ts
import { useSSE } from '~/composables'

const sse = useSSE({ url: '/api/v1/notice/sse' })

const off = sse.on('event:message', (payload) => {
  console.log('收到数据', payload)
})

sse.connect()          // 需要手动开启
// 组件卸载时内部会自动 disconnect
```

### 事件

| 事件名 | 回调参数 | 触发时机 |
|--------|---------|---------|
| `open` | `Event` | 连接打开 |
| `message` | `MessageEvent` | 收到原始消息（`data` 为空字符串时只更新 `lastEventId` 并跳过） |
| `event:message` | `unknown` | 收到消息并尝试 `JSON.parse`，失败则回传原始字符串 |
| `error` | `Event` / `unknown` | 出错 |
| `close` | `Event` | 断开 |
| `stateChange` | `SSEState` | 状态变化 |

`on('event:xxx')` 前缀会路由到命名事件处理器（`SSEEventManager`）。

::: warning 三处需要注意
1. **不会自动连接。** 源码里没有 `immediate` 选项，创建后必须手动调用 `connect()`（`useSSE.ts:35`）。内部使用 `onUnmounted` 做清理，因此必须在 `setup` 作用域内调用。
2. **`headers` 不生效。** 类型上声明了 `headers`，但 `connect()` 只把 `url` 与 `withCredentials` 传给 `EventSource`（`types.ts:18`、`useSSE.ts:51-53`），实际不会带任何自定义请求头（EventSource 本身也不支持）。
3. **只监听默认 `message` 事件。** 源码仅设置 `eventSource.onmessage`，未对服务端自定义事件名调用 `addEventListener`，因此服务端 `event: foo` 这类命名事件收不到，需服务端统一走默认 message 通道。
:::
