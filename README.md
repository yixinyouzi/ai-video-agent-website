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

- 图片轮播模式：生成简体中文图片提示词，供后续文生图使用
- HTML 动画模式：生成网页动画提示词，供后续 HTML/CSS/SVG/Canvas 动画生成使用

### 图片轮播分镜画面生成

图片轮播项目生成视频大纲后，创作页会显示“一键生成”和“中断生成”按钮：

- 点击“一键生成”后，前端按照分镜顺序逐个调用 Evolink Z Image Turbo 生成图片。
- 每个分镜使用自身的中文 `visualPrompt` 作为图片生成提示词。
- 已经存在图片的分镜会自动跳过，适合中断后继续生成。
- 点击“中断生成”会停止当前请求和后续分镜生成；已经生成并保存的图片不会丢失。
- 生成期间会显示当前 Scene、完成数量、进度条和正在生成的分镜卡片状态。
- 生成失败时，创作页会显示具体错误原因。
- 图片生成完成后，会显示在分镜卡片缩略图和上方画面预览区域。

图片生成采用两阶段异步流程：

1. 调用 `POST /v1/images/generations` 创建 Evolink 图片生成任务。
2. 每隔 2 秒调用 `GET /v1/tasks/:id` 查询任务状态。
3. 任务完成后立即下载图片到本地，避免 Evolink 临时图片链接过期。

图片按项目保存到 `project-images/<project_uuid>/`，不会把不同项目的图片混在一起。该目录属于运行时文件，默认不会提交到 Git。

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

- 新增图片轮播模式分镜画面一键生成与中断生成功能。
- 新增分镜图片生成进度条、当前 Scene 状态、错误反馈和前后端生成日志。
- 分镜图片提示词统一要求使用简体中文。
- 分镜图片按项目保存到本地，并将路径 JSON 写入 `project.video_source`。
- 修复图片生成请求可能被后端错误识别为客户端中断的问题。
- 首页新增“历史记录”面板，可以直接打开已有项目查看历史对话。
- 点击首页历史项目时只进入已有项目，不会创建新对话。
- 首页历史记录文案统一为简体中文 UTF-8。
- 修复 Windows 环境下 `npm run dev` 可能因为直接 spawn `npm.cmd` 出现 `spawn EINVAL` 的问题。

## 技术栈

- 前端：React 19 + Vite + TypeScript + Tailwind CSS
- 后端：Express + TypeScript
- 数据库：MySQL
- 大纲与意图 AI 调用：OpenAI SDK 兼容接口
- 图片生成：Evolink Z Image Turbo

## 项目结构

```text
.
├── server/        # Express API、AI 调用、数据库读写
├── project-images/ # 按项目保存的本地分镜图片，运行时生成
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
- `server/storyboardImageService.ts`：Evolink 图片任务创建、轮询、下载和路径持久化
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
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gemini-3-flash-preview
OPENAI_TIMEOUT_MS=30000

EVOLINK_API_KEY=
EVOLINK_BASE_URL=https://api.evolink.ai
EVOLINK_IMAGE_MODEL=z-image-turbo
EVOLINK_IMAGE_SIZE=16:9
EVOLINK_IMAGE_SEED=
EVOLINK_IMAGE_NSFW_CHECK=false
EVOLINK_IMAGE_POLL_INTERVAL_MS=2000
EVOLINK_IMAGE_MAX_POLL_ATTEMPTS=150

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
- `EVOLINK_API_KEY` 是图片生成必填项，需要在 Evolink 控制台创建。
- `EVOLINK_IMAGE_SIZE` 默认使用适合视频画面的 `16:9`。
- `EVOLINK_IMAGE_SEED` 留空时由服务随机生成；填写 `1` 到 `2147483647` 可复现相近画面。
- `EVOLINK_IMAGE_NSFW_CHECK` 控制是否启用内容安全检查。
- `EVOLINK_IMAGE_POLL_INTERVAL_MS` 默认每 2 秒查询一次任务状态。
- `EVOLINK_IMAGE_MAX_POLL_ATTEMPTS` 默认最多查询 150 次。
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

### 6. 查看图片生成日志

点击“一键生成”后，可以通过创作页状态条查看进度。浏览器控制台和后端终端还会输出带有 `[storyboard-image]` 前缀的日志，包括：

- 收到分镜生成请求
- 创建 Evolink 任务和任务 ID
- 每次轮询的任务状态
- 图片下载和本地保存路径
- `project.video_source` 更新结果
- 生成失败或用户中断原因

如果点击后立即失败，请优先检查：

- `.env` 中是否填写了有效的 `EVOLINK_API_KEY`
- 修改 `.env` 后是否重启了开发服务
- 当前图片轮播项目是否已经生成视频大纲
- 分镜 `visualPrompt` 是否为中文
- 后端终端中的 `[storyboard-image]` 错误日志

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

### 分镜图片

- `POST /api/projects/:uuid/storyboard-images`
  - 请求体：`{ "sceneNumber": 1 }`
  - 为指定分镜创建图片；已有图片时直接跳过。
- `GET /api/project-images/:uuid/:fileName`
  - 读取保存在本地项目图片目录中的分镜图片。

## 数据表

当前主要使用两张表：

- `project`
- `project_chat_message`

其中：

- `project.storyboard_outline` 保存结构化的视频大纲 JSON 字符串。
- `project.video_source` 保存分镜图片路径信息 JSON。

`project.video_source` 示例：

```json
{
  "version": 1,
  "type": "storyboard_images",
  "scenes": {
    "1": {
      "path": "project-images/<project_uuid>/scene-01-xxx.png",
      "url": "/api/project-images/<project_uuid>/scene-01-xxx.png",
      "prompt": "简体中文图片提示词",
      "generatedAt": "2026-06-04T00:00:00.000Z"
    }
  }
}
```

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
