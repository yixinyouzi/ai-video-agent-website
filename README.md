<div align="center">
  <img
    width="1200"
    height="475"
    alt="VisionCraft AI Banner"
    src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png"
  />
</div>

# VisionCraft AI

VisionCraft AI 是一个 AI 视频创作工作台，支持两种创作模式：

- `slideshow`：图片轮播视频
- `html`：HTML 网页动画视频

当前项目已经打通了一条完整的“提示词 -> 意图识别 -> 视频大纲生成 -> 前端分镜展示”链路：

- 首页创建视频项目
- 项目与聊天消息写入 MySQL
- AI 识别用户意图
- AI 生成完整逐字稿和结构化分镜大纲
- 创作页展示分镜卡片、旁白、提示词和完整大纲弹窗

## 技术栈

- 前端：React 19 + Vite + TypeScript + Tailwind CSS
- 后端：Express + TypeScript
- 数据库：MySQL
- AI 调用：OpenAI SDK 兼容接口

## 当前能力

### 1. 项目管理

- 创建项目
- 删除项目
- 读取历史项目列表
- 加载项目聊天记录

### 2. AI 聊天与意图识别

当前已接入这些动作识别：

- `generate_video_outline`
- `regenerate_video_outline`
- `add_scene`
- `delete_scene`
- `regenerate_scene`
- `unsupported`


### 3. 视频大纲生成

当用户意图被识别为生成大纲时，后端会调用 AI 返回结构化 JSON，内容包含：

- `summary`：视频整体概述
- `fullScript`：完整逐字稿
- `scenes`：6 到 30 个分镜

每个分镜包含：

- `sceneNumber`
- `title`
- `narration`
- `visualPrompt`
- `durationSeconds`

不同模式下，`visualPrompt` 的生成策略不同：

- 图片轮播模式：生成图片提示词，供后续文生图使用
- HTML 动画模式：生成网页动画提示词，供后续 HTML/CSS/SVG/Canvas 动画生成使用

### 4. 创作页 UI

- 左侧显示历史项目
- 中间显示当前项目预览与分镜列表
- 右侧显示 AI 对话面板
- 中间预览区在没有大纲时保持空状态
- 生成大纲后，按真实分镜动态渲染
- 对话中的大纲结果会以卡片形式展示
- 支持弹窗查看完整大纲内容
- 右侧面板支持拖拽调整宽度，最大可接近 1:1
- 主要文字内容支持复制

## 项目结构

```text
.
├── server/                # Express API、AI 调用、数据库读写
├── shared/                # 前后端共享类型
├── src/                   # React 前端
├── sql/                   # 建表 SQL
├── scripts/               # 本地开发脚本
├── package.json
└── README.md
```

几个关键文件：

- [server/index.ts](/home/yixinyou/ai-programming-projects/ai-video-agent/server/index.ts:1)：API 入口
- [server/chatService.ts](/home/yixinyou/ai-programming-projects/ai-video-agent/server/chatService.ts:1)：聊天动作路由
- [server/videoOutlineService.ts](/home/yixinyou/ai-programming-projects/ai-video-agent/server/videoOutlineService.ts:1)：视频大纲生成
- [server/intentAnalysis.ts](/home/yixinyou/ai-programming-projects/ai-video-agent/server/intentAnalysis.ts:1)：用户意图识别
- [shared/storyboardOutline.ts](/home/yixinyou/ai-programming-projects/ai-video-agent/shared/storyboardOutline.ts:1)：大纲共享结构
- [src/components/StudioView.tsx](/home/yixinyou/ai-programming-projects/ai-video-agent/src/components/StudioView.tsx:1)：创作页主界面

## 本地运行

### 1. 环境要求

- Node.js 18+
- MySQL 8+

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，然后填写下面这些变量：

```env
APP_URL=

OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gemini-3-flash-preview
OPENAI_TIMEOUT_MS=30000

API_PORT=3001
VITE_API_PROXY_TARGET=http://127.0.0.1:3001
VITE_API_BASE_URL=

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=ai-video-agent
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_CONNECTION_LIMIT=10
```

说明：

- `OPENAI_BASE_URL` 支持任意 OpenAI SDK 兼容网关
- `VITE_API_BASE_URL` 为空时，前端默认走本地 `/api` 代理
- `npm run dev` 会自动寻找可用端口，如果 `3001` 被占用，会自动换到下一个空闲端口，并同步更新前端代理

### 4. 初始化数据库

执行 [sql/project.sql](/home/yixinyou/ai-programming-projects/ai-video-agent/sql/project.sql:1) 中的建表语句。

### 5. 启动开发环境

一键启动前后端：

```bash
npm run dev
```

分别启动：

```bash
npm run dev:server
```

```bash
npm run dev:client
```

默认情况下：

- 前端运行在 `http://127.0.0.1:3000`
- 后端运行在 `http://127.0.0.1:3001`

如果端口被占用：

- `npm run dev` 会自动换端口
- `npm run dev:server` 会提示你修改 `API_PORT`

## 可用脚本

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run build
npm run lint
```

## API 概览

### 项目

- `GET /api/projects`
- `POST /api/projects`
- `DELETE /api/projects/:uuid`

### 消息

- `GET /api/projects/:uuid/messages`
- `POST /api/projects/:uuid/messages`

`POST /api/projects/:uuid/messages` 在生成视频大纲时，除了返回聊天消息，还会返回：

- `analysis`
- `project`
- `outline`

前端会利用这些结构化数据刷新当前项目和消息卡片。

## 数据表

当前主要使用两张表：

- `project`
- `project_chat_message`

其中 `project.storyboard_outline` 会保存结构化的大纲 JSON 字符串。

