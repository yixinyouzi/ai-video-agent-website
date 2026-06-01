# VisionCraft AI

VisionCraft AI 是一个 AI 视频创作工作台，支持通过自然语言创建、管理和继续编辑视频项目。

当前支持两种创作模式：

- `slideshow`：图片轮播视频
- `html`：HTML 网页动画视频

项目已经打通了“提示词 -> 意图识别 -> 视频大纲生成 -> 前端分镜展示 -> 历史对话继续编辑”的基础链路。

## 当前能力

### 项目管理

- 在首页创建新视频项目
- 在首页直接查看历史记录，并点击进入已有项目
- 在创作页左侧查看、切换和删除历史项目
- 自动加载项目历史对话，不需要为了查看历史记录而新建对话
- 项目和聊天消息写入 MySQL

### AI 对话与意图识别

后端会识别用户在对话中的创作意图，目前支持：

- `generate_video_outline`
- `regenerate_video_outline`
- `add_scene`
- `delete_scene`
- `regenerate_scene`
- `unsupported`

### 视频大纲生成

当用户意图被识别为生成或重新生成视频大纲时，后端会调用 AI 返回结构化 JSON，内容包括：

- `summary`：视频整体概述
- `fullScript`：完整逐字稿
- `scenes`：分镜列表

每个分镜包含：

- `sceneNumber`
- `title`
- `narration`
- `visualPrompt`
- `durationSeconds`

不同模式下，`visualPrompt` 的用途不同：

- 图片轮播模式：生成图片提示词，供后续文生图使用
- HTML 动画模式：生成网页动画提示词，供后续 HTML/CSS/SVG/Canvas 动画生成使用

### 创作页 UI

- 左侧显示历史项目
- 中间显示当前项目预览和分镜列表
- 右侧显示 AI 对话面板
- 支持加载历史对话
- 对话中的大纲结果会以卡片形式展示
- 支持弹窗查看完整大纲内容
- 右侧面板支持拖拽调整宽度
- 主要文字内容支持复制

## 最近更新

- 首页新增“历史记录”面板，可以直接打开已有项目查看历史对话。
- 点击首页历史项目时只进入已有项目，不会创建新对话。
- 首页历史记录文案统一为简体中文 UTF-8。
- 修复 Windows 环境下 `npm run dev` 可能因为直接 spawn `npm.cmd` 出现 `spawn EINVAL` 的问题。

## 技术栈

- 前端：React 19 + Vite + TypeScript + Tailwind CSS
- 后端：Express + TypeScript
- 数据库：MySQL
- AI 调用：OpenAI SDK 兼容接口

## 项目结构

```text
.
├── server/        # Express API、AI 调用、数据库读写
├── shared/        # 前后端共享类型和解析逻辑
├── src/           # React 前端
├── sql/           # 建表 SQL
├── scripts/       # 本地开发脚本
├── package.json
└── README.md
```

关键文件：

- `src/App.tsx`：首页和创作页切换逻辑
- `src/components/HomeView.tsx`：首页、新建项目入口、历史记录入口
- `src/components/StudioView.tsx`：创作页主界面
- `src/lib/projectApi.ts`：前端 API 调用封装
- `server/index.ts`：Express API 入口
- `server/chatService.ts`：聊天动作处理
- `server/videoOutlineService.ts`：视频大纲生成
- `server/intentAnalysis.ts`：用户意图识别
- `shared/storyboardOutline.ts`：大纲共享结构和解析逻辑

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

- `OPENAI_BASE_URL` 支持任意 OpenAI SDK 兼容网关。
- `VITE_API_BASE_URL` 为空时，前端默认走本地 `/api` 代理。
- `npm run dev` 会自动寻找可用端口。如果 `3001` 被占用，会自动换到下一个空闲端口，并同步更新前端代理目标。

### 4. 初始化数据库

执行 `sql/project.sql` 中的建表语句。

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

- `npm run dev` 会自动切换端口。
- `npm run dev:server` 会提示修改 `API_PORT`。

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

其中 `project.storyboard_outline` 会保存结构化的视频大纲 JSON 字符串。

## 上传到 GitHub

当前远程仓库地址已经配置为：

```bash
https://github.com/yixinyouzi/ai-video-agent-website.git
```

### 发布步骤

检查当前改动：

```bash
git status
```

确认构建无误：

```bash
npm run lint
npm run build
```

添加本次需要提交的文件：

```bash
git add README.md scripts/dev.mjs src/App.tsx src/components/HomeView.tsx
```

如果你确认 `.env.example` 和 `package-lock.json` 的改动也需要上传，可以一并加入：

```bash
git add .env.example package-lock.json
```

提交：

```bash
git commit -m "feat: add home history access"
```

推送到 GitHub：

```bash
git push origin main
```
