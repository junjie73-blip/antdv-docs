# WebSocket

本项目通过 `useWebSocket()` 提供全局单例 WebSocket 连接，支持站内通知、强制下线、分片上传合并回调等实时消息推送。

## 核心设计原则

- **全局单例**：整个应用共享同一个 WebSocket 连接，避免多实例造成重复消息
- **Token 感知**：监听 `useUserStore().token` 变化，token 出现时自动连接，token 清除时断开
- **无限重连**：连接异常后按指数退避策略自动重连（最长 30 秒间隔）
- **事件总线**：消息通过 `eventBus`（基于 mitt）分发，支持多处订阅同一事件

---

## 快速使用

```ts
import { useWebSocket } from '~/utils/ws'

const ws = useWebSocket()
```

::: warning 只用 `useWebSocket()`
- 禁止自己 `new WebSocket(...)`
- 禁止直接调用 `useWebSocketComposable()`（内部实现）
- 禁止在多个组件里各自创建连接

只要调用 `useWebSocket()`，连接会自动建立并复用。
:::

---

## API 方法

### `ws.notice`

全局共享的最近一条站内通知（`Ref<NotificationItem | null>`）：

```vue
<script setup lang="ts">
import { useWebSocket } from '~/utils/ws'
const { notice } = useWebSocket()
</script>

<template>
  <div v-if="notice">
    最新通知：{{ notice.title }}
  </div>
</template>
```

### `ws.status`

全局连接状态（`Ref<WsConnState>`）：

```ts
type WsConnState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed'
```

```vue
<template>
  <a-badge
    :status="ws.status.value === 'connected' ? 'success' : 'error'"
    :text="ws.status.value"
  />
</template>
```

### `ws.onNotice(fn)`

订阅站内通知事件，返回取消订阅函数：

```ts
const off = ws.onNotice((notice) => {
  console.log('收到通知:', notice.title, notice.content)
  // 更新未读数徽标、刷新通知列表等
})

// 组件卸载时取消订阅（防内存泄漏）
onUnmounted(() => off())
```

**`NotificationItem` 结构：**

```ts
interface NotificationItem {
  noticeId: string
  title: string
  content: string
  noticeType: number    // 1=通知 2=公告 3=提醒
  status: string
  publishTime?: string | null
  createdAt: string
  isRead: 0 | 1
  priority: number
}
```

### `ws.onForceLogout(fn)`

订阅强制下线事件：

```ts
const off = ws.onForceLogout((data) => {
  // data?.reason：下线原因文案（已由 useWebSocket 弹出通知，业务侧按需处理额外逻辑）
  console.log('被强制下线:', data?.reason)
})
onUnmounted(() => off())
```

::: warning 消息类型注意
后端推送的强制下线消息类型为 `force-logout`（**短横线**），禁止写成 `forceLogout`（驼峰）。
:::

### `ws.onStatusChange(fn)`

监听连接状态变化：

```ts
const off = ws.onStatusChange((status) => {
  if (status === 'reconnecting') {
    message.warning('WebSocket 连接断开，正在重连...')
  }
  if (status === 'connected') {
    message.success('WebSocket 已重新连接')
  }
})
onUnmounted(() => off())
```

### `ws.onUploadMerge(fn)`

订阅分片上传合并完成事件（由 `ChunkUpload` 组件内部使用）：

```ts
const off = ws.onUploadMerge((data) => {
  console.log('文件合并完成:', data.filename, data.url)
})
onUnmounted(() => off())
```

**`UploadMergeMessage` 结构：**

```ts
interface UploadMergeMessage {
  taskId: string
  status: 'pending' | 'merging' | 'uploading' | 'completed' | 'failed'
  fileId?: string
  url?: string
  size?: number
  filename?: string
  errorMsg?: string
}
```

### `ws.reconnect()`

手动触发重连（例如用户点击重连按钮）：

```ts
ws.reconnect()
```

### `ws.disconnect()`

手动断开连接（通常由登出流程自动触发，无需手动调用）：

```ts
ws.disconnect()
```

---

## 消息类型协议

WebSocket 服务端推送的消息格式统一为：

```json
{
  "type": "<消息类型>",
  "data": { ... }
}
```

| `type` 值 | 说明 | 处理方式 |
|-----------|------|----------|
| `notice:push` | 新站内通知 | 更新 `sharedNotice`，弹出 `notification` 提示，触发 `ws:notice` 事件 |
| `force-logout` | 强制下线 | 弹出警告通知，触发 `ws:force-logout` 事件，调用 `forceLogout()` |
| `notice:revoke` | 撤回通知 | 触发 `ws:revoke` 事件，业务侧处理通知列表刷新 |
| `upload:merge` | 文件合并进度 | 触发 `ws:upload-merge` 事件，由 `ChunkUpload` 处理任务状态更新 |
| `connected` | 连接建立确认 | 仅打印日志 |

---

## WS URL 格式

连接地址由 token 动态构建：

```ts
// buildWsUrl(token) 内部实现
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}&type=notice`
```

- 协议自动切换：HTTP 下使用 `ws:`，HTTPS 下使用 `wss:`
- token 作为 query 参数传递（不放 Header，WebSocket 不支持自定义 Header）

---

## 连接生命周期

```
useUserStore().token 变化
    │
    ▼
token 为空 → destroySocket() + 设置 status = 'idle'
    │
token 非空
    │
    ├─ 已有连接且 token 未变且已连接 → 复用（不重建）
    │
    ├─ 已有连接且 token 未变但连接断了 → 触发重连
    │
    └─ token 变化 / 无实例 → createSocket(token)
           │
           ▼
       useWebSocketComposable({ url, reconnect })
       注册 message / open / close / error 事件
       socketApi.connect()
```

**重连策略**：

```ts
reconnect: {
  retries: -1,       // -1 = 无限重连
  interval: 2000,    // 初始间隔 2 秒
  delayMultiplier: 2, // 指数退避倍率
  maxDelay: 30000,   // 最大延迟 30 秒
}
```

---

## 完整使用示例

### 通知中心组件

```vue
<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useWebSocket } from '~/utils/ws'
import type { NotificationItem } from '~/utils/ws'

const ws = useWebSocket()

const unreadCount = ref(0)
const noticeList = ref<NotificationItem[]>([])

// 订阅新通知
const offNotice = ws.onNotice((notice) => {
  unreadCount.value++
  noticeList.value.unshift(notice)
})

// 订阅连接状态
const offStatus = ws.onStatusChange((status) => {
  if (status === 'reconnecting') {
    console.warn('[通知中心] WebSocket 重连中')
  }
})

onUnmounted(() => {
  offNotice()
  offStatus()
})
</script>

<template>
  <a-badge :count="unreadCount" :overflow-count="99">
    <a-button shape="circle">
      <IconifyIcon icon="carbon:notification" />
    </a-button>
  </a-badge>
</template>
```

### 连接状态指示器

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useWebSocket } from '~/utils/ws'

const ws = useWebSocket()

const statusConfig = computed(() => {
  const map = {
    connected: { color: 'success', text: '已连接' },
    reconnecting: { color: 'warning', text: '重连中' },
    idle: { color: 'default', text: '未连接' },
    closed: { color: 'error', text: '已断开' },
    connecting: { color: 'processing', text: '连接中' },
  }
  return map[ws.status.value] || map.idle
})
</script>

<template>
  <a-badge :status="statusConfig.color" :text="statusConfig.text" />
</template>
```

---

## 注意事项

::: tip 在组件中订阅时务必清理
所有通过 `ws.onXxx()` 注册的监听器都返回一个取消函数，必须在 `onUnmounted` 中调用，否则组件销毁后监听器仍然存活，会造成内存泄漏和重复触发。

```ts
const off = ws.onNotice(fn)
onUnmounted(() => off())
```
:::

::: warning 不要在 `setup` 顶层直接读 `ws.notice.value`
`ws.notice` 是一个 `Ref`，在模板中绑定 `ws.notice` 或在 computed/watch 中访问 `.value` 才能响应更新。直接读取 `.value` 的调用不具备响应性。
:::
