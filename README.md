# VisionCraft AI

VisionCraft AI 是一个 AI 视频创作工作台，支持通过自然语言创建、管理和继续编辑视频项目。

当前支持两种创作模式：

- `slideshow`：图片轮播视频
- `html`：HTML 网页动画视频

项目已经打通两套视频创作链路：

- 图片轮播：提示词 -> 意图识别 -> 视频脚本与分镜大纲 -> 统一图像风格 -> 分镜图片 -> 旁白音频 -> 前端预览与播放
- HTML 动画：提示词 -> 意图识别 -> 网页动画分镜大纲 -> 选择视觉风格 -> 逐分镜 HTML 动画 -> 旁白音频 -> 前端预览与播放

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
- `globalImageStylePrompt`：图片轮播模式根据完整脚本生成的全局中文图像风格提示词
- `scenes`：分镜列表

每个分镜包含：

- `sceneNumber`
- `title`
- `narration`
- `visualPrompt`
- `durationSeconds`

不同模式下，`visualPrompt` 的用途不同：

- 图片轮播模式：AI 根据完整视频脚本选择统一画面风格，并将全局中文图像风格提示词添加到每个分镜图片提示词开头
- HTML 动画模式：系统角色设定为网页动画视频设计工程师，生成可通过 HTML、CSS、JavaScript、SVG、Canvas 实现的网页动画提示词

### HTML 动画分镜生成

HTML 动画项目生成视频大纲后，也可以使用“一键生成”和“中断生成”：

- 每个分镜对应一个独立、自包含的 HTML 网页动画。
- AI 可以使用内联 HTML、CSS、JavaScript、SVG 和 Canvas，不允许依赖外部脚本、字体、图片或网络资源。
- 前端按分镜顺序生成动画；生成当前分镜时，会把紧邻的上一分镜 HTML 代码附加到上下文中，供 AI 延续色彩、字体、形状、光影和运动语言。
- 已生成的分镜 HTML 源码保存在 `project.video_source` 的对应 Scene 中。
- HTML 动画生成完成后，才会继续生成该分镜旁白。
- 单独重新生成分镜画面时，HTML 项目会重新生成该 Scene 的网页动画，并保留已有旁白。

### HTML 视频视觉风格

HTML 项目右侧提示词输入框下方提供视觉风格选择按钮。点击后可在动画 Demo 卡片中选择：

- `cyberpunk`：赛博朋克
- `minimalist`：极简现代主义
- `pop`：爆款高亮波普

每套风格独立存放在 `shared/htmlVideoStyles/`，包含风格描述、适合拼接到分镜生成请求中的提示词，以及用于选择弹窗预览的自包含动画 Demo。

- 用户选择的风格 ID 保存到 `project.video_source.htmlStyleId`。
- 生成或重新生成 HTML 分镜时，服务端会把对应风格提示词一并发送给 AI。
- 用户没有主动选择时，默认使用第一种 `cyberpunk` 风格。
- 切换风格不会清空已生成资源，只影响后续生成或重新生成的 HTML 分镜。

### 图片轮播分镜资源生成

图片轮播项目生成视频大纲后，创作页会显示“一键生成”和“中断生成”按钮：

- 生成大纲时，AI 会先根据完整脚本确定全局艺术风格、色彩、光影、材质、镜头语言和人物一致性要求。
- 全局风格保存到 `globalImageStylePrompt`，服务端会确保它位于每个分镜 `visualPrompt` 的开头，使不同分镜保持统一视觉风格。
- 点击“一键生成”后，前端按照分镜顺序先调用 Evolink Z Image Turbo 生成图片，再调用 `qwen3-tts-flash` 生成分镜旁白。
- 每个分镜使用自身的中文 `visualPrompt` 作为图片生成提示词。
- 已经存在的图片或旁白音频会自动跳过，适合中断后继续生成。
- 点击“中断生成”会停止当前请求和后续分镜生成；已经生成并保存的图片和音频不会丢失。
- 生成期间会显示当前 Scene、完成数量、进度条和正在生成的分镜卡片状态。
- 生成失败时，创作页会显示具体错误原因。
- 图片生成完成后，会显示在分镜卡片缩略图和上方画面预览区域。
- 分镜旁白生成完成后，分镜卡片右上角的喇叭图标会变为橙色，点击即可播放或停止旁白。
- 在完整大纲弹窗中，每个分镜卡片会展示当前画面，并支持播放当前分镜旁白。
- 完整大纲弹窗支持单独“重新生成画面”和“重新生成旁白”；重新生成会覆盖对应资源，同时保留另一类已有资源。

图片生成采用两阶段异步流程：

1. 调用 `POST /v1/images/generations` 创建 Evolink 图片生成任务。
2. 每隔 2 秒调用 `GET /v1/tasks/:id` 查询任务状态。
3. 任务完成后立即下载图片到本地，避免 Evolink 临时图片链接过期。

图片和旁白 MP3 按项目保存到 `project-images/<project_uuid>/`，不会把不同项目的媒体文件混在一起。该目录属于运行时文件，默认不会提交到 Git。

### 图片轮播预览与播放

- 主预览区直接作为全尺寸画面播放器，当前分镜图片会铺满预览区域。
- 点击画面中央播放按钮、底部播放按钮或进度条区域，可以开始或控制播放。
- 播放从当前时间点继续；播放结束后再次播放会从第一个分镜开始。
- 有旁白音频的分镜使用音频真实时长；没有旁白音频的分镜默认展示 3 秒。
- 视频总时长为所有分镜实际时长之和，进度显示格式为 `当前播放时间/视频总时长`。
- 图片播放期间会缓慢放大，模拟镜头推进效果。
- 分镜切换采用淡入淡出叠化效果。
- 播放时会同步播放当前分镜旁白音频。

### HTML 动画预览与播放

- 每个 HTML 分镜通过受限沙箱 `iframe srcDoc` 独立渲染。
- 主预览区、下方分镜小卡片和完整大纲弹窗都会同步展示生成的动画。
- 主播放器会向当前动画发送播放与暂停状态；CSS 动画和支持 `visioncraft-playback` 事件的 JavaScript 动画可同步暂停或恢复。
- 分镜切换使用淡入淡出叠化效果，并同步播放当前分镜旁白。
- 没有旁白音频时，使用大纲中的 `durationSeconds` 作为分镜播放时长。

### 字幕同步

- 字幕显示在画面靠近底部的居中位置，并使用较大字号和文字阴影保证可读性。
- 每个分镜旁白会按照逗号、句号、问号、感叹号等标点拆分为短句，字幕不显示句末标点。
- 较长短句会继续按最多约 20 个字符拆分。
- 每个短句的有效字数占整个分镜旁白有效字数的比例，会作为该短句在分镜音频时间中的显示比例。
- 字幕会根据当前分镜播放进度自动切换，与旁白音频保持近似同步。
- 创作页顶部的“字幕”按钮可以开启或关闭字幕显示。

### 创作页 UI

- 左侧显示历史项目
- 中间显示全画面视频预览、播放进度和分镜列表
- 右侧显示 AI 对话面板
- HTML 项目右侧输入框提供视觉风格选择按钮和动态 Demo 弹窗
- 支持加载历史对话
- 对话中的大纲结果会以卡片形式展示
- 支持弹窗查看完整大纲、分镜画面和旁白音频
- 支持在完整大纲弹窗中单独重新生成分镜画面或旁白
- 右侧面板支持拖拽调整宽度
- 主要文字内容支持复制

## 当前实现状态

- 支持图片轮播项目生成统一的全局中文图像风格提示词，并自动添加到每个分镜提示词开头。
- 支持 HTML 项目按分镜生成独立网页动画，并将上一分镜 HTML 作为视觉一致性参考。
- 支持赛博朋克、极简现代主义和爆款高亮波普三套 HTML 视频视觉风格，默认使用赛博朋克。
- 支持在主预览区、分镜卡片和完整大纲弹窗中渲染 HTML 动画。
- 支持一键依次生成分镜图片或 HTML 动画，再生成旁白音频，并支持随时中断、跳过已有资源和继续生成。
- 支持在创作页查看生成进度、当前处理阶段和具体错误原因。
- 支持在分镜卡片和主预览区域查看生成图片。
- 支持通过分镜卡片右上角的橙色喇叭按钮播放或停止旁白音频。
- 支持按分镜音频真实时长播放图片轮播视频，无音频分镜默认播放 3 秒。
- 支持播放进度跳转、播放时间显示、图片缓慢推进和分镜叠化切换。
- 支持按照旁白短句字数占比同步显示字幕。
- 支持在完整大纲弹窗中查看画面、试听音频，并强制重新生成单个分镜画面或旁白。
- 支持将图片、HTML 源码、音频和 HTML 风格 ID 以 JSON 形式写入 `project.video_source`。
- 支持通过历史项目继续查看对话和编辑视频大纲。
- 支持 Windows 环境下一键启动前后端，并自动寻找可用端口。

## 技术栈

- 前端：React 19 + Vite + TypeScript + Tailwind CSS
- 后端：Express + TypeScript
- 数据库：MySQL
- 大纲与意图 AI 调用：OpenAI SDK 兼容接口
- 图片生成：Evolink Z Image Turbo
- 旁白生成：OpenAI Audio 兼容接口 + `qwen3-tts-flash`

## 项目结构

```text
.
├── server/        # Express API、AI 调用、数据库读写
├── project-images/ # 按项目保存的本地分镜图片和旁白音频，运行时生成
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
- `src/components/HTMLAnimationPlayer.tsx`：沙箱 iframe HTML 动画渲染与播放状态同步
- `src/lib/projectApi.ts`：前端 API 调用封装
- `server/index.ts`：Express API 入口
- `server/chatService.ts`：聊天动作处理
- `server/videoOutlineService.ts`：视频大纲生成
- `server/storyboardImageService.ts`：Evolink 图片任务创建、轮询、下载和路径持久化
- `server/storyboardHtmlService.ts`：逐分镜 HTML 动画生成、上一分镜参考和风格提示词拼接
- `server/storyboardAudioService.ts`：分镜旁白生成、音频保存和路径持久化
- `server/llmClient.ts`：OpenAI 兼容客户端和 TTS 客户端配置
- `server/intentAnalysis.ts`：用户意图识别
- `shared/storyboardOutline.ts`：大纲共享结构和解析逻辑
- `shared/htmlVideoStyles/`：HTML 视频风格定义、生成提示词和动画 Demo

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
OPENAI_TTS_API_KEY=
OPENAI_TTS_BASE_URL=
OPENAI_TTS_TIMEOUT_MS=60000
OPENAI_TTS_MODEL=qwen3-tts-flash
OPENAI_TTS_VOICE=Cherry
OPENAI_TTS_INSTRUCTIONS=请使用自然、清晰、有感染力的普通话进行旁白朗读。

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
- `OPENAI_TTS_API_KEY` 和 `OPENAI_TTS_BASE_URL` 留空时，TTS 默认复用 `OPENAI_API_KEY` 与 `OPENAI_BASE_URL`。
- 如果现有令牌未开放 `qwen3-tts-flash`，需要在服务商后台开放该模型，或填写一组具有 TTS 模型权限的专用 Key 和 Base URL。
- `OPENAI_TTS_TIMEOUT_MS` 控制语音生成请求超时时间，默认 60 秒。
- `OPENAI_TTS_MODEL` 默认使用 `qwen3-tts-flash`。
- `OPENAI_TTS_VOICE` 配置旁白音色，默认使用中文女声音色 `Cherry`。
- `OPENAI_TTS_INSTRUCTIONS` 配置旁白语气和朗读风格。
- TTS 请求会兼容直接音频响应，以及 JSON 中返回音频 URL 或 Base64 音频的服务商渠道。
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

### 6. 查看分镜资源生成日志

点击“一键生成”后，可以通过创作页状态条查看当前正在生成画面还是旁白。浏览器控制台和后端终端还会输出：

- `[storyboard-image]`：图片任务创建、轮询、下载和保存日志
- `[storyboard-audio]`：旁白生成、下载、解码和保存日志
- `[storyboard-assets]`：前端整批分镜资源生成日志

日志内容包括：

- 收到分镜生成请求
- 创建 Evolink 任务和任务 ID
- 每次轮询的任务状态
- 图片下载和本地保存路径
- TTS 模型、音色和旁白生成状态
- 音频下载、Base64 解码和本地保存路径
- `project.video_source` 更新结果
- 生成失败或用户中断原因

如果点击后立即失败，请优先检查：

- `.env` 中是否填写了有效的 `EVOLINK_API_KEY`
- 修改 `.env` 后是否重启了开发服务
- 当前图片轮播项目是否已经生成视频大纲
- 分镜 `visualPrompt` 是否为中文
- 当前令牌是否允许使用 `qwen3-tts-flash`
- 后端终端中的 `[storyboard-image]` 或 `[storyboard-audio]` 错误日志

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
- `PUT /api/projects/:uuid/html-style`
  - 请求体：`{ "styleId": "cyberpunk" }`
  - 更新 HTML 项目的视觉风格，并保留已有分镜资源。

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
  - 请求体：`{ "sceneNumber": 1, "force": false }`
  - 为指定分镜创建图片；已有图片时直接跳过。
  - 设置 `force: true` 时会重新生成图片，并保留当前分镜已有旁白。
- `GET /api/project-images/:uuid/:fileName`
  - 读取保存在本地项目媒体目录中的分镜图片或旁白音频。

### 分镜旁白

- `POST /api/projects/:uuid/storyboard-audio`
  - 请求体：`{ "sceneNumber": 1, "force": false }`
  - 使用分镜 `narration` 生成旁白 MP3；已有音频时直接跳过。
  - 设置 `force: true` 时会重新生成旁白，并保留当前分镜已有图片或 HTML 动画。

### 分镜 HTML 动画

- `POST /api/projects/:uuid/storyboard-html`
  - 请求体：`{ "sceneNumber": 1, "force": false }`
  - 为 HTML 项目的指定分镜生成完整网页动画；已有 HTML 时直接跳过。
  - 生成时会附加所选视觉风格提示词，并将紧邻上一分镜 HTML 作为视觉一致性参考。
  - 设置 `force: true` 时会重新生成 HTML 动画，并保留当前分镜已有旁白。

## 数据表

当前主要使用两张表：

- `project`
- `project_chat_message`

其中：

- `project.storyboard_outline` 保存结构化的视频大纲 JSON 字符串。
- `project.video_source` 保存 HTML 风格 ID、分镜图片、HTML 源码和旁白音频信息 JSON。

`project.video_source` 示例（同一结构兼容图片分镜和 HTML 动画分镜）：

```json
{
  "version": 1,
  "type": "storyboard_assets",
  "htmlStyleId": "cyberpunk",
  "scenes": {
    "1": {
      "path": "project-images/<project_uuid>/scene-01-xxx.png",
      "url": "/api/project-images/<project_uuid>/scene-01-xxx.png",
      "prompt": "当前分镜图片提示词或网页动画提示词",
      "html": "<!doctype html><html>...</html>",
      "generatedAt": "2026-06-04T00:00:00.000Z",
      "audio": {
        "path": "project-images/<project_uuid>/scene-01-narration-xxx.mp3",
        "url": "/api/project-images/<project_uuid>/scene-01-narration-xxx.mp3",
        "narration": "该分镜的旁白文本",
        "voice": "Cherry",
        "generatedAt": "2026-06-04T00:00:00.000Z"
      }
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

添加需要提交的源码与文档：

```bash
git add .env.example .gitignore README.md server shared src package-lock.json
```

提交：

```bash
git commit -m "完善图片轮播播放字幕和分镜重新生成"
```

推送到 GitHub：

```bash
git push origin main
```

注意：

- 不要提交包含密钥的 `.env`。
- `project-images/` 已加入 `.gitignore`，生成的图片和音频不会上传。
- 正常 `git push` 会保留 GitHub 上之前的提交历史。
