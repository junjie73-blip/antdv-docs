# 杂项工具

`~/utils` 下按用途分散的日期、字典、文件、事件、菜单等小工具。绝大多数**不在** barrel 中，需要按文件全路径导入。

## 导入路径

`~/utils` barrel 只导出以下模块（源码 `~/utils/index.ts`）：

```
cache / cn / crypto / event / helpers/menu / request / token / welcome
```

因此下表列出各工具的推荐导入路径：

| 工具 | 导入路径 |
|------|----------|
| 日期时间 | `~/utils/dayjs` |
| 字典 | `~/utils/dict` |
| 文件下载 | `~/utils/download` |
| Excel 导入模板 | `~/utils/template` |
| 文件分类 | `~/utils/file-category` |
| DOM 工具 | `~/utils/domUtils` |
| 事件总线 / 尺寸监听 | `~/utils/event`（也可 `~/utils`） |
| 菜单转换 | `~/utils/helpers/menu`（也可 `~/utils`） |
| 欢迎语 | `~/utils/welcome`（也可 `~/utils`） |
| 路由预加载 | `~/utils/routePreload` |
| CRUD 行操作 | `~/utils/crud-actions` |

## 日期时间（`~/utils/dayjs`）

在原生 dayjs 基础上加载了 utc / timezone / relativeTime / localizedFormat / customParseFormat / advancedFormat / duration / isSameOrAfter / isSameOrBefore / isBetween / quarterOfYear / weekOfYear 插件，并设置 `locale('zh-cn')`，默认时区 `Asia/Shanghai`。

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `dayjs` | `dayjs.Dayjs` 命名导出 + 默认导出 | 已扩展插件、已设中文 locale 的 dayjs 实例 |
| `getTimezone` | `() => string` | 获取当前时区标识 |
| `setTimezone` | `(timezone: string) => void` | 设置全局时区（空字符串直接忽略），同时影响 `dayjs.tz` 默认值 |
| `formatTz` | `(value, format?) => string` | 按当前时区格式化，默认格式 `YYYY-MM-DD HH:mm:ss`；空值返回 `''` |
| `nowTz` | `() => dayjs.Dayjs` | 当前时区下的“现在” |
| `parseTz` | `(value, format?) => dayjs.Dayjs` | 解析为指定时区时间，`format` 可选 |

```ts
import dayjs, { formatTz, nowTz, setTimezone } from '~/utils/dayjs'

formatTz(new Date())                 // '2024-09-23 15:30:00'
formatTz(new Date(), 'YYYY-MM-DD')   // '2024-09-23'
setTimezone('America/New_York')      // 全局切换时区
```

## 字典（`~/utils/dict`）

依赖 `useDictStore`，因此**只能在组件 / 组合式函数的响应式上下文中调用**。

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `getDictLabel` | `(dictType: string, value: any) => string` | 值转 label；`null` / `undefined` / `''` 返回 `-`，未匹配时原样返回字符串化后的值 |
| `getDictLabels` | `(dictType: string, value: string \| string[]) => string` | 多值场景；入参为数组或逗号分隔字符串，结果用 `、` 连接；空值返回 `-` |

```ts
import { getDictLabel } from '~/utils/dict'

const text = getDictLabel('sys_user_status', record.status)
```

## 下载与文件

### downloadBlob（`~/utils/download`）

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `downloadBlob` | `(request: () => Promise<any>, filename: string) => Promise<void>` | 执行传入的请求拿到二进制，包装成 Blob 后触发浏览器下载 |

```ts
import { downloadBlob } from '~/utils/download'

await downloadBlob(() => getGenCodeDownloadUrl(id), `${tableName}.zip`)
```

> 限制：Blob 的 MIME 被固定写死为 xlsx（`download.ts:4`），文件名扩展名不会改变它。实际项目里也被用来下载 `.zip`（`views/tool/code/index.vue:42`）。

### generateTemplate（`~/utils/template`）

生成并下载 Excel 导入模板（两行：表头 + 示例行），基于 xlsx 直接 `writeFile`。

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `generateTemplate` | `(filename: string, columns: TemplateColumn[], sheetName?: string) => void` | 生成 `.xlsx` 文件，`sheetName` 默认 `Sheet1` |
| `TemplateColumn` | `interface` | 列定义：`header`（表头）、`example?`（示例值）、`width?`（列宽，默认 18）、`key?`（列键名） |

```ts
import { generateTemplate } from '~/utils/template'

generateTemplate('用户导入模板', [
  { header: '用户名*', example: 'zhangsan', width: 16 },
  { header: '真实姓名*', example: '张三', width: 14 },
])
```

### file-category（`~/utils/file-category`）

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `getFileCategory` | `(filename: string) => FileCategory` | 按扩展名归类，未命中返回 `'other'` |
| `getExt` | `(filename: string) => string` | 取小写扩展名（含点），无扩展名返回空串；目前仅被 `getFileCategory` 内部使用 |
| `FileCategory` | 联合类型 | `image` / `video` / `audio` / `pdf` / `word` / `excel` / `pptx` / `markdown` / `text` / `archive` / `other` |

```ts
import { getFileCategory } from '~/utils/file-category'

getFileCategory('报告.pdf')  // 'pdf'
```

## DOM 与事件

### 事件总线（`~/utils/event`）

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `eventBus` | `EventBus` | 模块级单例，基于 mitt；项目内部（如 `~/utils/ws`）用它广播 WS 消息 |
| `createEventBus` | `() => EventBus` | 创建独立实例 |
| `addResizeListener` | `(element: any, fn: () => any) => void` | 用 ResizeObserver 监听元素尺寸变化 |
| `removeResizeListener` | `(element: any, fn: () => any) => void` | 移除监听，无监听者时断开 observer |
| `EventBus` / `EventHandler` | 类型 | `on` / `off` / `emit` / `once` / `clear` |

```ts
import { eventBus } from '~/utils'

const handler = (payload: unknown) => console.log(payload)
eventBus.on('my-event', handler)
eventBus.emit('my-event', { id: 1 })
eventBus.off('my-event', handler)
```

> `triggerWindowResize` 存在于 `event/resize.ts:37`，但**未从 barrel 导出**，需 `import { triggerWindowResize } from '~/utils/event/resize'`。

### domUtils（`~/utils/domUtils`）

导出 `getBoundingClientRect`、`hasClass`、`addClass`、`removeClass`、`getViewportOffset`、`hackCss`、`on`、`off`、`once`、`useRafThrottle`，以及类型 `ViewportOffsetResult`。

> 现状：未在 barrel 中，且全仓库没有任何页面/组件引用该文件，属于当前未被使用的工具集。

## 菜单与路由

### 菜单转换（`~/utils/helpers/menu`）

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `generateMenuList` | `(routes: RouteRecordRaw[]) => MenuItem[]` | 由 `route.meta`（`title` / `icon` / `hideInMenu` / `order`）生成菜单树 |
| `transformBackendMenuToItems` | `(menus: BackendMenu[], parentPath?: string) => MenuProps['items']` | 后端菜单转 antd Menu items；过滤停用、按钮（`menuType === 3`）与隐藏项 |
| `transformMenuConfigToItems` | `(menus: MenuConfig[], parentPath?: string) => MenuProps['items']` | 本地菜单配置转 antd Menu items；外链渲染为 `<a>` 并新窗口打开 |
| `flattenMenus` | `(menus: MenuItem[]) => MenuItem[]` | 拍平菜单树 |
| `findMenuByKey` | `(menus: MenuItem[], key: string) => MenuItem \| undefined` | 按 key 递归查找 |

当前页面实际使用的只有 `transformMenuConfigToItems`（`layouts/DefaultLayout.vue`、`layouts/components/LayoutSidebar.vue`），其余四个暂无引用。

### 路由预加载（`~/utils/routePreload`）

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `preloadRoute` | `(to: string \| RouteLocationRaw) => Promise<boolean>` | 解析并触发目标路由组件的动态导入 |
| `preloadRoutes` | `(routes: string[]) => Promise<void>` | 批量预加载，并发上限 2 |
| `useRoutePreloader` | `() => { isPreloading, preloadedPaths, prefetch, predictAndPreload, idlePreload, cleanup }` | 组合式封装，含邻近路径预测与空闲时预加载 |

> 现状：全仓库无引用；且 `preloadRoute` 内部直接调用 `useRouter()`（`routePreload.ts:63`），在非组件上下文中会拿不到 router，用于全局调用需要改造。

## 欢迎语（`~/utils/welcome`）

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `getPersonalizedWelcome` | `(username: string) => WelcomeConfig` | 按当前时段返回图标 / 标题 / 文案 / 图标色，文案拼上用户名 |
| `getTimeGreeting` | `() => string` | 只返回时段问候标题（如「早上好」） |

时段划分为早（6-12）、中午（12-14）、下午（14-18）、晚（18-22）、夜（其余）。

## CRUD 行操作（`~/utils/crud-actions`）

| 导出名 | 类型签名 | 说明 |
|--------|----------|------|
| `createCrudActions` | `<T>(record: T, options: CrudActionOptions<T>) => ActionItem[]` | 按「查看 → 编辑 → extra → 删除」顺序拼装通用行操作项，删除项自带 `popConfirm` |
| `CrudActionOptions` | `interface` | `onEdit` / `onDelete` / `onView` / `extra` / `deleteTitle` / `deleteContent` / `deleteLabel` |

> 现状：全仓库无引用，实际页面多各自在模块 `actions.ts` 中手写操作项。

## localStorageCacheStorage（`~/utils/cache`）

`cache` 实例的存储适配器，用于对接 vueuse `useStorage` 等按 `getItem` / `setItem` / `removeItem` 约定的场景。可从 `~/utils/cache` 或 `~/utils` 导入。

| 方法 | 类型签名 | 说明 |
|------|----------|------|
| `getItem` | `(key: string) => unknown` | 读取并解密（默认解密） |
| `setItem` | `(key: string, value: string) => void` | 写入（不传过期时间，即长期有效） |
| `removeItem` | `(key: string) => void` | 删除 |

```ts
import { useStorage } from '@vueuse/core'
import { localStorageCacheStorage } from '~/utils'

const value = useStorage('my-key', 'default', localStorageCacheStorage)
```
