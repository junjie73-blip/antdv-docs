# 目录结构

```
antdv-next-admin/
├── .vscode/                      # 编辑器配置
├── dist/                         # 构建产物（已被 .gitignore 忽略）
├── public/                       # 静态资源
├── src/
│   ├── api/                      # API 接口定义
│   ├── assets/                   # 静态资源
│   │   ├── images/               #   图片与文件类型图标
│   │   └── styles/               #   全局样式（global.css）
│   ├── components/               # 公共组件
│   │   ├── business/             #   业务组件
│   │   │   ├── Table/            #     表格组件 ⭐
│   │   │   ├── Form/             #     表单组件 ⭐
│   │   │   ├── Modal/            #     弹窗组件（BasicModal）⭐
│   │   │   ├── Drawer/           #     抽屉组件（BasicDrawer）⭐
│   │   │   ├── Description/      #     描述列表
│   │   │   ├── CountTo/          #     数字动画
│   │   │   ├── TreeTable/        #     树形表格
│   │   │   ├── MarkdownEditor/   #     Markdown 编辑器（基于 Tiptap）
│   │   │   ├── ImportExport.vue  #     导入导出
│   │   │   ├── TenantSelect.vue  #     租户选择
│   │   │   └── MicroAppContainer.vue  # 微前端容器 ⭐
│   │   ├── common/               #   通用组件
│   │   │   ├── Icon/             #     图标 / 图标选择器
│   │   │   ├── Loading/          #     全局加载
│   │   │   ├── Scrollbar/        #     滚动条
│   │   │   ├── Skeleton/         #     骨架屏
│   │   │   ├── Upload/           #     上传组件（含 ChunkUpload 分片上传）
│   │   │   └── CronEditor/       #     Cron 表达式编辑器
│   │   └── layout/               #   布局通用组件
│   │       ├── PageTransition.vue  #   页面过渡动画
│   │       └── ReloadPrompt.vue    #   PWA 更新提示
│   ├── composables/              # 组合式函数
│   │   ├── useCRUD.ts            #   增删改查封装 ⭐
│   │   ├── useRequest.ts         #   请求封装
│   │   ├── useChunkUpload.ts     #   分片上传
│   │   ├── usePasswordPolicy.ts  #   密码策略
│   │   ├── useRouteLoading.ts    #   路由加载
│   │   └── web/                  #   Web 相关
│   │       ├── permission/       #     权限管理
│   │       ├── websocket/        #     WebSocket
│   │       ├── sse/              #     SSE 事件流
│   │       ├── useLocale.ts      #     语言切换 ⭐
│   │       ├── useThemeTransition.ts   # 主题切换过渡
│   │       ├── useWatermark.ts   #     水印功能
│   │       └── useWelcomeNotification.ts  # 欢迎通知
│   ├── config/                   # 项目配置
│   │   ├── color.ts              #   颜色常量
│   │   ├── constants.ts          #   全局常量
│   │   ├── micro-app.ts          #   微前端配置 ⭐
│   │   └── project.ts            #   项目元信息
│   ├── directives/               # 自定义指令
│   │   ├── permission/           #   权限指令 (v-permission)
│   │   └── lazy.ts               #   懒加载指令
│   ├── enums/                    # 枚举定义
│   │   ├── app.ts                #   应用枚举
│   │   ├── cache.ts              #   缓存枚举
│   │   ├── dict.ts               #   字典枚举
│   │   └── status.ts             #   状态枚举
│   ├── locales/                  # 国际化 ⭐
│   │   ├── index.ts              #   i18n 配置
│   │   └── lang/                 #   语言包
│   │       ├── zh-CN.ts         #     中文简体
│   │       └── en-US.ts         #     English
│   ├── layouts/                  # 布局系统
│   │   ├── components/           #   布局子组件
│   │   │   ├── LayoutHeader.vue  #     顶栏
│   │   │   ├── LayoutSidebar.vue #     侧边栏
│   │   │   ├── LayoutTabs.vue    #     页签栏
│   │   │   ├── LayoutFooter.vue  #     页脚
│   │   │   ├── AccountDrawer.vue #     账户抽屉
│   │   │   └── SettingDrawer/    #     主题设置
│   │   ├── composables/          #   布局组合式函数（useLayout.ts）
│   │   ├── widgets/              #   顶栏小部件（主题 / 通知 / 搜索 / 全屏等）
│   │   └── DefaultLayout.vue     #   默认布局
│   ├── router/                   # 路由配置
│   │   ├── index.ts              #   路由实例
│   │   ├── guards.ts             #   路由守卫
│   │   └── routes.ts             #   路由定义
│   ├── settings/                 # 应用设置
│   │   ├── index.ts              #   默认设置
│   │   └── theme/                #   主题 token
│   ├── stores/                   # Pinia 状态管理
│   │   └── modules/              #   Store 模块
│   │       ├── app.ts            #     应用状态
│   │       ├── auth.ts           #     历史遗留空壳，不推荐使用
│   │       ├── dict.ts           #     字典状态
│   │       ├── route.ts          #     路由状态
│   │       └── user.ts           #     用户状态
│   ├── utils/                    # 工具函数
│   │   ├── excel.ts              #   Excel 导出 ⭐
│   │   ├── print.ts              #   打印工具 ⭐
│   │   ├── ws.ts                 #   WebSocket 单例
│   │   ├── cache/                #   缓存存储（SM4 加密）
│   │   ├── cn/                   #   类名合并
│   │   ├── crypto/               #   加密工具（aes / hash / jwt）
│   │   ├── event/                #   事件总线（mitt）
│   │   ├── request/              #   HTTP 客户端（基于 alova）
│   │   └── token/                #   Token 管理
│   ├── views/                    # 页面视图
│   │   ├── workspace/            #   工作台
│   │   ├── analysis/             #   分析页
│   │   ├── account/              #   个人中心
│   │   ├── login/                #   登录
│   │   ├── register/             #   注册
│   │   ├── system/               #   系统管理
│   │   ├── micro-app/            #   微前端子应用视图（SubAppView.vue）
│   │   ├── error/                #   错误页（403 / 404 / 503）
│   │   └── components/           #   组件示例
│   ├── App.vue                   # 根组件
│   └── main.ts                   # 入口文件
├── types/                        # 全局类型声明（含自动生成的 d.ts）
├── .env                          # 环境变量
├── .env.development              # 开发环境变量
├── .env.production               # 生产环境变量
├── eslint.config.ts              # ESLint 配置
├── index.html                    # HTML 入口
├── lefthook.yml                  # Git hooks 配置
├── nginx.conf                    # Nginx 部署配置
├── oxlint.config.ts              # Oxlint 配置
├── package.json                  # 项目配置
├── playwright.config.ts          # Playwright E2E 配置
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
├── vitest.config.ts              # Vitest 测试配置
├── CHANGELOG.md                  # 更新日志
├── CODE_STANDARD.md              # 代码规范
├── LICENSE                       # MIT 协议
└── README.md                     # 项目说明
```
