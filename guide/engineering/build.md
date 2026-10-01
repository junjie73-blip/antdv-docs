# 构建部署

本项目基于 **Vite 8**（底层使用 Rolldown 打包器）构建，配置了 PWA、代码压缩、图片优化、构建分析等完整的工程化能力。全部构建配置集中在根目录的 `vite.config.ts` 中。

## Vite 8 构建配置详解

### 核心配置文件

```
vite.config.ts          → 唯一的构建配置入口（别名、开发服务器、插件、构建选项）
package.json            → 依赖与脚本（dev / build / preview / type-check / lint）
```

配置内部按职责拆成若干局部函数，均在 `vite.config.ts` 内定义：

| 函数 | 作用 |
|------|------|
| `loadEnv()` | 读取并按类型解析 `.env` / `.env.{mode}` |
| `createProxy()` | 把 `VITE_PROXY` 转为 dev server 代理表 |
| `viteArchiverPlugin()` | 构建结束把 `dist` 打包成 zip |
| `viteMetadataPlugin()` | 注入 `__APP_METADATA__`（应用名与版本） |
| `createPlugin()` | 汇总所有插件（含按环境变量开关的可选插件） |

### 路径别名

```ts
// vite.config.ts
resolve: {
  alias: {
    "~": join(import.meta.dirname, "./src"),    // 源码目录
    "#": join(import.meta.dirname, "./types"),  // 类型声明目录
  },
}
```

使用示例：
```ts
import { useTable } from '~/components/business/Table'
import type { RouteMeta } from '#/app-router'
```

> 别名只有 `~`（→ `src`）和 `#`（→ `types`）两个，与 `tsconfig.app.json` 的 `paths` 保持一致。

### 开发服务器配置

```ts
server: {
  port: envConfig.VITE_PORT,          // 从环境变量读取端口
  host: "0.0.0.0",                    // 允许局域网访问
  cors: true,                         // 启用跨域
  proxy: createProxy(envConfig.VITE_PROXY),  // API 代理
}
```

### 构建输出配置

```ts
build: {
  sourcemap: false,               // 生产环境不生成 sourcemap
  chunkSizeWarningLimit: 1000,    // chunk 体积告警阈值
  rolldownOptions: {
    output: {
      chunkFileNames: "js/[name]-[hash].js",     // chunk 文件
      assetFileNames: "assets/[name]-[hash].[ext]", // 静态资源
      entryFileNames: "js/[name]-[hash].js",     // 入口文件
      experimentalMinChunkSize: 20 * 1024,        // 最小分包体积
    },
  },
}
```

> Vite 8 使用 Rolldown 作为打包器，因此配置键是 `rolldownOptions`（不再是 `rollupOptions`）。

**分包策略（`codeSplitting.groups`）：**

| chunk 名称 | 命中规则 |
|-----------|---------|
| `vendor-ui` | `antdv-next` |
| `vendor-vue` | `vue` / `pinia` / `vue-router` |
| `vendor-echarts` | `echarts` |
| `vendor-utils` | `@vueuse` / `es-toolkit` / `dayjs` / `xlsx` |
| `vendor-office` | `@vue-office` |
| `vendor-pdfjs` | `pdfjs-dist` |
| `vendor-i18n` | `@intlify` / `vue-i18n` |
| `vendor-highlight` | `highlight.js` |
| `vendor-editor` | `@form-create` / `prosemirror` / `marked` |
| `vendor` | 其余 `node_modules` 依赖 |

**输出目录结构：**
```
dist/
├── assets/
│   ├── logo-[hash].svg
│   └── image-[hash].png
├── js/
│   ├── vendor-ui-[hash].js        (UI 框架 chunk)
│   ├── vendor-vue-[hash].js       (Vue 生态 chunk)
│   └── index-[hash].js            (入口)
└── index.html
```

## PWA 配置（Workbox）

通过 `vite-plugin-pwa` 集成 PWA 能力，由环境变量 `VITE_PWA` 控制开启：

```ts
// vite.config.ts 中配置
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'prompt',
  injectRegister: 'script-defer',
  strategies: 'generateSW',
  manifest: {
    name: envConfig.VITE_APP_TITLE,
    short_name: envConfig.VITE_APP_TITLE,
    description: '基于 Vue 3 + Antdv Next 的现代化后台管理系统',
    icons: [
      { src: 'pwa-icons/pwa-64x64.png', type: 'image/png', sizes: '64x64' },
      { src: 'pwa-icons/pwa-192x192.png', type: 'image/png', sizes: '192x192' },
      { src: 'pwa-icons/pwa-512x512.png', type: 'image/png', sizes: '512x512' },
      { src: 'pwa-icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: 'pwa-icons/apple-touch-icon-180x180.png', type: 'image/png', sizes: '180x180 180x180' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    maximumFileSizeToCacheInBytes: 1024 * 1024 * 20,
    runtimeCaching: [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
  includeAssets: ['favicon.ico', 'pwa-icons/*.png'],
  devOptions: { enabled: true },
})
```

**Workbox 缓存策略：**
| 资源类型 | 策略 | 说明 |
|---------|------|------|
| 预缓存资源（`globPatterns`） | Precache | 构建时写入 precache manifest |
| 图片（png/jpg/svg/gif/webp） | CacheFirst | 命中缓存直接返回，最多 50 条，30 天过期 |

## Gzip/Brotli 压缩

通过 `vite-plugin-compression` 实现构建时预压缩，由环境变量 `VITE_COMPRESS` 控制（取值 `gzip` / `brotli` / `none`）：

```ts
import viteCompressPlugin from 'vite-plugin-compression'

viteCompressPlugin({
  deleteOriginFile: false,  // 保留原始文件
  verbose: true,
  disable: false,
  threshold: 10240,         // 大于 10KB 才压缩
  ext: envConfig.VITE_COMPRESS === 'brotli' ? '.br' : '.gz',
})
```

Nginx 配合 `gzip_static on` 可直接返回预压缩文件，无需实时压缩。

## 构建分析可视化

使用 `vite-bundle-analyzer` 分析打包体积，由环境变量 `VITE_VISUALIZER` 控制开启：

```ts
import { analyzer } from 'vite-bundle-analyzer'

analyzer({
  fileName: 'stats.html',   // 输出文件名
})
```

开启 `VITE_VISUALIZER=true` 后执行构建会自动生成 `stats.html`：

```bash
# 执行带分析的构建
pnpm run build
# 打开 stats.html 查看分析结果
```

## 图片压缩

使用 `vite-plugin-imagemin` 在构建时自动压缩图片：

```ts
import viteImagemin from 'vite-plugin-imagemin'

viteImagemin({
  gifsicle: { optimizationLevel: 3 },
  optipng: { optimizationLevel: 7 },
  mozjpeg: { quality: 80 },
  pngquant: { quality: [0.8, 0.9] },
  webp: { quality: 80 },
})
```

**支持的格式和默认配置：**

| 格式 | 压缩工具 | 默认配置 |
|------|---------|---------|
| PNG | optipng | 压缩级别 7 |
| JPEG/JPG | mozjpeg | 质量 80% |
| GIF | gifsicle | 压缩级别 3 |
| 有损 PNG | pngquant | 质量区间 0.8 ~ 0.9 |
| WebP | webp | 质量 80% |

## 生产环境 console 移除

生产构建时通过 Rolldown 的压缩配置移除 `console`：

```ts
// vite.config.ts
rolldownOptions: {
  output: {
    minify: {
      compress: {
        dropConsole: isProd,       // 移除所有 console.*
        dropDebuggerger: isProd,   // 移除 debugger
      },
    },
  },
}
```

> 如果需要保留特定日志（如错误上报），可以使用自定义 logger 替代 `console.log`。

## 构建产物打包

环境变量 `VITE_ARCHIVER` 开启后，构建结束会把 `dist` 目录打包为 zip：

```ts
isProd && envConfig.VITE_ARCHIVER && plugins.push(viteArchiverPlugin({}))
```

打包使用 `archiver`（`zlib.level: 9`），产物为 `dist.zip`，完成后进程直接退出。

## Nginx 部署配置

项目根目录提供了 `nginx.conf` 作为参考配置：静态资源目录指向 `/usr/share/nginx/html`，`try_files` 解决 SPA 刷新 404，并把后端接口、上传文件、WebSocket 分别反代到后端服务：

```nginx
server {
    listen 80;
    server_name localhost;

    # 前端静态资源
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;   # 解决 SPA 刷新 404
    }

    # 代理 API 接口
    location /api/v1/ {
        proxy_pass http://app:3000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 代理静态资源（上传文件）
    location /uploads/ {
        proxy_pass http://app:3000/uploads/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # 代理 WebSocket
    location /ws {
        proxy_pass http://app:3000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

> 仓库当前只提供 `nginx.conf`，未内置 `Dockerfile` 或 `docker-compose`；如需容器化部署，请自行基于 `pnpm run build` 产物编写镜像文件。

## 构建与质量检查

`package.json` 中与构建相关的脚本：

```bash
pnpm run build        # rimraf dist && vite build
pnpm run preview      # vite preview（本地预览构建产物）
pnpm run type-check   # vue-tsc --build
pnpm run lint         # run-s "lint:*"（依次执行 lint:oxlint、lint:eslint）
pnpm run format       # oxfmt src/
```

典型的流水线步骤：

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  代码提交    │ → │  Lint 检查  │ → │  类型检查    │ → │   构建产物   │
│  git push   │    │  pnpm lint  │    │ vue-tsc     │    │  vite build │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

> 仓库当前未提交 CI 工作流文件（如 `.github/workflows`），上述步骤可在任意 CI 平台按需编排。
