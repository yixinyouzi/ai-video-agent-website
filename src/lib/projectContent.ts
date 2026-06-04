import { StoryboardOutline, parseStoryboardOutline } from '../../shared/storyboardOutline';
import { ApiChatMessageRecord, ChatMessage, Project, ProjectMode, ProjectVideoSource, Scene } from '../types';

export function getDefaultPrompt(mode: ProjectMode): string {
  return mode === 'slideshow'
    ? '赛博朋克风格的孤独漫游者步入雨夜中的地下酒馆，霓虹闪烁，水坑倒影'
    : '利用旋转立方体、缩放圆形、网格线，来表达极简主义的抽象几何空间之美，音乐带节奏感';
}

export function getDefaultProjectTitle(mode: ProjectMode, prompt: string): string {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt) {
    return trimmedPrompt.length > 20 ? `${trimmedPrompt.slice(0, 20)}...` : trimmedPrompt;
  }

  return mode === 'slideshow' ? 'AI 创意轮播视频' : 'AI 动态矢量网页视频';
}

export function createProjectFromRecord(
  record: {
    uuid: string;
    title: string;
    createdAt: string;
    type: ProjectMode;
    storyboardOutline: string;
    videoSource: string;
  },
  options: {
    isActive: boolean;
    promptOverride?: string | null;
  },
): Project {
  const outline = parseStoryboardOutline(record.storyboardOutline);
  const videoSource = parseProjectVideoSource(record.videoSource);
  const prompt = options.promptOverride?.trim() || outline?.userPrompt || extractPromptFromOutline(record.storyboardOutline) || getDefaultPrompt(record.type);
  const scenes = outline ? mapScenesFromOutline(outline, videoSource) : [];

  return {
    id: record.uuid,
    title: record.title,
    mode: record.type,
    status: scenes.length > 0 ? 'completed' : 'idle',
    progress: scenes.length > 0 ? 100 : 0,
    currentStep: scenes.length > 0 ? '完成' : '等待生成视频大纲',
    scenes,
    bgMusic: record.type === 'slideshow' ? '霓虹深渊 (Neon Abyss)' : '极简脉冲 (Minimal Pulse)',
    createdAt: formatProjectCreatedAt(record.createdAt),
    prompt,
    storyboardOutline: record.storyboardOutline,
    outline,
    videoSource: record.videoSource,
    isActive: options.isActive,
    messages: [],
  };
}

export function mapApiChatMessage(record: ApiChatMessageRecord, outline?: StoryboardOutline | null): ChatMessage {
  return {
    id: record.uuid,
    sender: record.sender,
    text: record.content,
    timestamp: formatChatTimestamp(record.createdAt),
    action: record.action,
    reason: record.reason,
    outline: outline ?? null,
  };
}

export function attachOutlineToLatestMessage(messages: ChatMessage[], outline: StoryboardOutline | null): ChatMessage[] {
  if (!outline) {
    return messages;
  }

  let attached = false;

  return [...messages]
    .reverse()
    .map((message) => {
      if (
        !attached &&
        message.sender === 'assistant' &&
        (message.action === 'generate_video_outline' || message.action === 'regenerate_video_outline')
      ) {
        attached = true;
        return {
          ...message,
          outline,
        };
      }

      return message;
    })
    .reverse();
}

export function formatProjectCreatedAt(value: string): string {
  const created = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (Number.isNaN(created.getTime())) {
    return value;
  }

  if (diffMinutes < 1) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(created);
}

export function formatChatTimestamp(value: string): string {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) {
    return value;
  }

  const now = new Date();
  const isSameDay =
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate();

  return new Intl.DateTimeFormat('zh-CN', {
    month: isSameDay ? undefined : '2-digit',
    day: isSameDay ? undefined : '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(created);
}

function mapScenesFromOutline(outline: StoryboardOutline, videoSource: ProjectVideoSource | null): Scene[] {
  let cursor = 0;

  return outline.scenes.map((scene) => {
    const startTime = cursor;
    const endTime = cursor + scene.durationSeconds;
    cursor = endTime;
    const source = videoSource?.scenes[String(scene.sceneNumber)] ?? null;

    return {
      id: globalThis.crypto?.randomUUID?.() ?? `${scene.sceneNumber}-${startTime}`,
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      narration: scene.narration,
      visualPrompt: scene.visualPrompt,
      imageUrl: source?.url ?? null,
      imagePath: source?.path ?? null,
      audioUrl: source?.audio?.url ?? null,
      audioPath: source?.audio?.path ?? null,
      duration: scene.durationSeconds,
      startTime,
      endTime,
    };
  });
}

function parseProjectVideoSource(raw: string): ProjectVideoSource | null {
  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const candidate = parsed as ProjectVideoSource;
    if (candidate.version !== 1 || candidate.type !== 'storyboard_images' || !candidate.scenes) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

function extractPromptFromOutline(outline: string): string | null {
  const match = outline.match(/用户初始创意：([^\n]+)/);
  return match?.[1]?.trim() ?? null;
}
