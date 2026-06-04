import {
  ApiChatMessageRecord,
  ApiGenerateStoryboardAudioResult,
  ApiGenerateStoryboardImageResult,
  ApiGenerateStoryboardHtmlResult,
  ApiProjectRecord,
  ApiSendMessageResult,
  ProjectMode,
} from '../types';
import { HtmlVideoStyleId } from '../../shared/htmlVideoStyles';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '';

export async function createProject(input: {
  mode: ProjectMode;
  prompt: string;
  title?: string;
}): Promise<ApiProjectRecord> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseProjectResponse(response);
}

export async function fetchProjects(): Promise<ApiProjectRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '加载项目列表失败'));
  }

  const data = (await response.json()) as { projects?: ApiProjectRecord[] };
  return data.projects ?? [];
}

export async function deleteProjectById(uuid: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${uuid}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '删除项目失败'));
  }
}

export async function fetchProjectMessages(projectUuid: string): Promise<ApiChatMessageRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectUuid}/messages`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '加载对话历史失败'));
  }

  const data = (await response.json()) as { messages?: ApiChatMessageRecord[] };
  return data.messages ?? [];
}

export async function sendProjectMessage(input: {
  projectUuid: string;
  content: string;
}): Promise<ApiSendMessageResult> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${input.projectUuid}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: input.content }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '发送消息失败'));
  }

  const data = (await response.json()) as Partial<ApiSendMessageResult>;

  if (!data.assistantMessage || !data.analysis || !data.project || data.outline === undefined) {
    throw new Error('服务端没有返回完整的意图分析结果');
  }

  return data as ApiSendMessageResult;
}

export async function confirmRegenerateVideoOutline(input: {
  projectUuid: string;
  confirmationMessageUuid: string;
}): Promise<ApiSendMessageResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/projects/${input.projectUuid}/regenerate-outline-confirmations/${input.confirmationMessageUuid}`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '确认重新生成视频大纲失败'));
  }

  const data = (await response.json()) as Partial<ApiSendMessageResult>;
  if (!data.assistantMessage || !data.analysis || !data.project || !data.outline) {
    throw new Error('服务端没有返回完整的重新生成结果');
  }

  return data as ApiSendMessageResult;
}

export async function generateStoryboardImage(input: {
  projectUuid: string;
  sceneNumber: number;
  force?: boolean;
  signal?: AbortSignal;
}): Promise<ApiGenerateStoryboardImageResult> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${input.projectUuid}/storyboard-images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sceneNumber: input.sceneNumber, force: input.force ?? false }),
    signal: input.signal,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '生成分镜图片失败'));
  }

  const data = (await response.json()) as Partial<ApiGenerateStoryboardImageResult>;

  if (!data.project || !data.image || typeof data.sceneNumber !== 'number') {
    throw new Error('服务端没有返回完整的分镜图片信息');
  }

  return data as ApiGenerateStoryboardImageResult;
}

export async function generateStoryboardHtml(input: {
  projectUuid: string;
  sceneNumber: number;
  force?: boolean;
  signal?: AbortSignal;
}): Promise<ApiGenerateStoryboardHtmlResult> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${input.projectUuid}/storyboard-html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneNumber: input.sceneNumber, force: input.force ?? false }),
    signal: input.signal,
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '生成分镜 HTML 动画失败'));
  }
  const data = (await response.json()) as Partial<ApiGenerateStoryboardHtmlResult>;
  if (!data.project || !data.animation || typeof data.sceneNumber !== 'number') {
    throw new Error('服务端没有返回完整的分镜 HTML 动画信息');
  }
  return data as ApiGenerateStoryboardHtmlResult;
}

export async function updateProjectHtmlStyle(input: {
  projectUuid: string;
  styleId: HtmlVideoStyleId;
}): Promise<ApiProjectRecord> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${input.projectUuid}/html-style`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ styleId: input.styleId }),
  });
  return parseProjectResponse(response);
}

export async function generateStoryboardAudio(input: {
  projectUuid: string;
  sceneNumber: number;
  force?: boolean;
  signal?: AbortSignal;
}): Promise<ApiGenerateStoryboardAudioResult> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${input.projectUuid}/storyboard-audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sceneNumber: input.sceneNumber, force: input.force ?? false }),
    signal: input.signal,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '生成分镜旁白失败'));
  }

  const data = (await response.json()) as Partial<ApiGenerateStoryboardAudioResult>;
  if (!data.project || !data.audio || typeof data.sceneNumber !== 'number') {
    throw new Error('服务端没有返回完整的分镜旁白信息');
  }

  return data as ApiGenerateStoryboardAudioResult;
}

async function parseProjectResponse(response: Response): Promise<ApiProjectRecord> {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, '创建项目失败'));
  }

  const data = (await response.json()) as { project?: ApiProjectRecord };

  if (!data.project) {
    throw new Error('服务端没有返回项目数据');
  }

  return data.project;
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}
