import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Antdv Next Vue Admin",
  description: "现代化企业级后台管理系统模板 - 基于 Vue 3 + TypeScript + Antdv Next + Tailwind CSS",
  lang: "zh-CN",
  // GitHub Pages 部署路径，与仓库名保持一致
  base: "/antdv-docs/",
  ignoreDeadLinks: true,

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/logo.png" }],
    ["link", { rel: "apple-touch-icon", href: "/logo.png" }],
    ["meta", { name: "theme-color", content: "#1890ff" }],
  ],

  themeConfig: {
    // 与 public/pwa-icons/logo.png 保持一致，源图为 64×64，导航栏按原始尺寸渲染最清晰
    logo: "/logo.png",
    siteTitle: false,

    nav: [
      { text: "指南", link: "/guide/introduction" },
      { text: "组件", link: "/components/business/table" },
      {
        text: "更多",
        items: [
          { text: "更新日志", link: "/changelog" },
          { text: "GitHub", link: "https://github.com/junjie73-blip/antdv-next-admin.git" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "开始",
          items: [
            { text: "项目介绍", link: "/guide/introduction" },
            { text: "快速开始", link: "/guide/getting-started" },
            { text: "目录结构", link: "/guide/directory-structure" },
          ],
        },
        {
          text: "基础",
          items: [
            { text: "技术栈说明", link: "/guide/tech-stack" },
            { text: "开发规范", link: "/guide/conventions" },
            { text: "环境变量", link: "/guide/env-variables" },
          ],
        },
        {
          text: "功能特性",
          items: [
            { text: "权限系统", link: "/guide/features/permission" },
            { text: "国际化 i18n", link: "/guide/features/i18n" },
            { text: "主题系统", link: "/guide/features/theme" },
            { text: "数据导出与打印", link: "/guide/features/export-print" },
            { text: "微前端集成", link: "/guide/features/micro-app" },
          ],
        },
        {
          text: "工程化",
          items: [
            { text: "构建部署", link: "/guide/engineering/build" },
            { text: "版本发布", link: "/guide/engineering/release" },
            { text: "测试指南", link: "/guide/engineering/testing" },
          ],
        },
      ],
      "/components/": [
        {
          text: "布局组件",
          items: [
            { text: "PageTransition 页面过渡", link: "/components/layout/page-transition" },
            { text: "ReloadPrompt 更新提示", link: "/components/layout/reload-prompt" },
          ],
        },
        {
          text: "通用组件",
          items: [
            { text: "Icon 图标", link: "/components/common/icon" },
            { text: "Loading 加载", link: "/components/common/loading" },
            { text: "Upload 上传", link: "/components/common/upload" },
            { text: "Scrollbar 滚动条", link: "/components/common/scrollbar" },
            { text: "Skeleton 骨架屏", link: "/components/common/skeleton" },
            { text: "CronEditor 定时表达式", link: "/components/common/cron-editor" },
            { text: "ErrorBoundary 错误边界", link: "/components/common/error-boundary" },
            { text: "PreviewDialog 预览弹窗", link: "/components/common/preview-dialog" },
          ],
        },
        {
          text: "业务组件",
          items: [
            { text: "Table 表格", link: "/components/business/table" },
            { text: "Form 表单", link: "/components/business/form" },
            { text: "Modal 弹窗", link: "/components/business/modal" },
            { text: "Drawer 抽屉", link: "/components/business/drawer" },
            { text: "Description 描述列表", link: "/components/business/description" },
            { text: "TreeTable 树形表格", link: "/components/business/tree-table" },
            { text: "CountTo 数字动画", link: "/components/business/count-to" },
            { text: "MarkdownEditor 编辑器", link: "/components/business/markdown-editor" },
            { text: "ImportExport 导入导出", link: "/components/business/import-export" },
            { text: "TenantSelect 租户选择", link: "/components/business/tenant-select" },
            { text: "MicroAppContainer 微前端容器", link: "/components/business/micro-app-container" },
          ],
        },
        {
          text: "工具",
          items: [
            { text: "Excel 导出工具", link: "/components/utils/excel" },
            { text: "打印工具", link: "/components/utils/print" },
            { text: "缓存存储", link: "/components/utils/cache" },
            { text: "类名合并 (cn)", link: "/components/utils/cn" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/junjie73-blip/antdv-next-admin.git" },
    ],

    footer: {
      message: "基于 MIT 协议发布",
      copyright: "Copyright © 2024-present Antdv Next Team",
    },

    editLink: {
      pattern: "https://github.com/junjie73-blip/antdv-docs/edit/main/:path",
      text: "在 GitHub 上编辑此页",
    },

    lastUpdated: {
      text: "最后更新于",
    },

    search: {
      provider: "local",
    },
  },
});
