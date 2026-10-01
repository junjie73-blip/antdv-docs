# 环境变量

## 变量列表

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `VITE_NAMESPACE` | string | antdv | 应用命名空间（代码未引用；缓存 key 前缀实际取自 `VITE_APP_TITLE`） |
| `VITE_APP_TITLE` | string | Antdv Admin | 项目标题（显示在浏览器标签页） |
| `VITE_PORT` | number | 5680（开发）/ 9080（生产） | 开发服务器端口 |
| `VITE_APP_BASE_API` | string | /api/v1 | API 基础路径 |
| `VITE_APP_BASE_URL` | string | http://localhost:3000 | 后端服务地址（开发环境） |
| `VITE_PROXY` | array | - | 开发代理配置：`[[前缀, 目标地址], ...]` |
| `VITE_MOCK` | boolean | false | 是否启用 Mock 数据 |
| `VITE_INJECT_APP_LOADING` | boolean | true | 是否注入应用启动加载动画 |
| `VITE_MICRO_APP` | boolean | false | 是否启用微前端（`src/config/micro-app.ts`） |
| `VITE_DEVTOOLS` | boolean | false（开发） | 是否启用 Vue DevTools |
| `VITE_PWA` | boolean | true | 是否启用 PWA |
| `VITE_VISUALIZER` | boolean | true（生产） | 是否启用构建分析可视化 |
| `VITE_COMPRESS` | string | gzip | 压缩格式：gzip / brotli / none |
| `VITE_ARCHIVER` | boolean | true（生产） | 是否启用打包归档（生成 dist.zip） |
| `VITE_ENABLE_LOGGING` | boolean | false（开发）/ true（生产） | 是否启用前端日志记录 |
| `VITE_LOG_ROUTE_CHANGE` | boolean | true | 操作日志是否记录路由跳转 |
| `VITE_LOG_MAX_ENTRIES` | number | 500（开发）/ 1000（生产） | 本地日志最大存储条数 |
| `VITE_CACHE_ENCRYPT_KEY` | string | - | 缓存加密密钥（SM4，必须为 32 字符） |
| `VITE_SENTRY_DSN` | string | - | Sentry 上报地址 |

## 配置文件

项目包含三个环境配置文件：

### `.env` — 公共变量

```bash
# 命名空间（缓存 key 前缀）
VITE_NAMESPACE=antdv

# 应用标题
VITE_APP_TITLE=Antdv Admin

# Mock 数据开关
VITE_MOCK=false

# 前端日志
VITE_ENABLE_LOGGING=false
VITE_LOG_ROUTE_CHANGE=true
VITE_LOG_MAX_ENTRIES=500
```

### `.env.development` — 开发环境

```bash
# 开发服务器端口
VITE_PORT=5680

# 注入应用加载动画
VITE_INJECT_APP_LOADING=true

# 关闭 Mock，直连后端
VITE_MOCK=false

# 启用 Vue DevTools
VITE_DEVTOOLS=false

# API 基础路径与后端地址
VITE_APP_BASE_API=/api/v1
VITE_APP_BASE_URL=http://localhost:3000

# 开发代理：前缀 -> 目标地址
VITE_PROXY=[['/api/v1', 'http://localhost:3000/api/v1'],['/uploads', 'http://localhost:3000/uploads'],['/ws', 'ws://localhost:3000/ws'],['/minio-api', 'http://121.4.127.82:9000']]

# 启用 PWA
VITE_PWA=true
```

### `.env.production` — 生产环境

```bash
# 生产环境压缩格式
VITE_COMPRESS=gzip

# 启用打包归档
VITE_ARCHIVER=true

# 生产端口
VITE_PORT=9080

# 注入应用加载动画
VITE_INJECT_APP_LOADING=true

# 生产启用 Mock
VITE_MOCK=true

# 启用构建分析可视化
VITE_VISUALIZER=true

# 启用 PWA
VITE_PWA=true

# API 基础路径
VITE_APP_BASE_API=/api/v1

# 生产开启前端日志
VITE_ENABLE_LOGGING=true
VITE_LOG_ROUTE_CHANGE=true
VITE_LOG_MAX_ENTRIES=1000

# 缓存加密密钥（SM4，必须为 32 字符，请替换为你自己的随机密钥）
VITE_CACHE_ENCRYPT_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sentry 上报地址
VITE_SENTRY_DSN=https://<key>@o<org>.ingest.us.sentry.io/<project>
```

## 使用方式

在代码中使用环境变量：

```ts
const appTitle = import.meta.env.VITE_APP_TITLE
const isMock = import.meta.env.VITE_MOCK === 'true'
```

> **注意**：只有以 `VITE_` 开头的变量才会暴露给客户端代码。
