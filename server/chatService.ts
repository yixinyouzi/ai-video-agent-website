import { StoryboardOutline, parseStoryboardOutline, serializeStoryboardOutline } from '../shared/storyboardOutline';
import {
  createProjectMessage,
  getLatestProjectMessage,
  listProjectMessages,
  VideoIntentAction,
} from './chatRepository';
import { analyzeUserIntent, IntentAnalysisResult } from './intentAnalysis';
import {
  getProjectByUuid,
  ProjectRecord,
  replaceProjectStoryboardOutline,
  updateProjectStoryboardOutline,
} from './projectRepository';
import { generateVideoOutline } from './videoOutlineService';

interface ActionResult {
  reply: string;
  project: ProjectRecord;
  outline: StoryboardOutline | null;
  assistantAction?: VideoIntentAction;
}

export async function handleProjectChatMessage(input: {
  projectUuid: string;
  content: string;
}): Promise<{
  assistantMessage: Awaited<ReturnType<typeof createProjectMessage>>;
  analysis: IntentAnalysisResult;
  project: ProjectRecord;
  outline: StoryboardOutline | null;
}> {
  await createProjectMessage({
    projectUuid: input.projectUuid,
    sender: 'user',
    content: input.content,
  });

  const project = await getProjectByUuid(input.projectUuid);
  if (!project) {
    throw new Error('Project not found.');
  }

  const analysis = await analyzeUserIntent({ userPrompt: input.content });
  const actionResult = await routeIntentAction({
    action: analysis.action,
    reason: analysis.reason,
    userPrompt: input.content,
    project,
  });

  const assistantMessage = await createProjectMessage({
    projectUuid: input.projectUuid,
    sender: 'assistant',
    content: actionResult.reply,
    action: actionResult.assistantAction ?? analysis.action,
    reason: analysis.reason,
  });

  return {
    assistantMessage,
    analysis,
    project: actionResult.project,
    outline: actionResult.outline,
  };
}

export async function confirmRegenerateVideoOutline(input: {
  projectUuid: string;
  confirmationMessageUuid: string;
}): Promise<{
  assistantMessage: Awaited<ReturnType<typeof createProjectMessage>>;
  analysis: IntentAnalysisResult;
  project: ProjectRecord;
  outline: StoryboardOutline;
}> {
  const latestMessage = await getLatestProjectMessage(input.projectUuid);
  if (
    !latestMessage ||
    latestMessage.uuid !== input.confirmationMessageUuid ||
    latestMessage.sender !== 'assistant' ||
    latestMessage.action !== 'regenerate_video_outline_confirmation'
  ) {
    throw new Error('该确认请求已过期，请重新发送修改大纲的需求。');
  }

  const messages = await listProjectMessages(input.projectUuid);
  const confirmationIndex = messages.findIndex((message) => message.uuid === input.confirmationMessageUuid);
  const userRequest = messages
    .slice(0, confirmationIndex)
    .reverse()
    .find((message) => message.sender === 'user');
  const project = await getProjectByUuid(input.projectUuid);

  if (!project || !userRequest) {
    throw new Error('无法找到待确认的大纲修改请求。');
  }

  const reason = latestMessage.reason || '用户已确认覆盖现有分镜画面和旁白音频。';
  const actionResult = await generateAndReplaceVideoOutline({
    reason,
    userPrompt: userRequest.content,
    project,
    clearGeneratedAssets: true,
    requiredLatestMessageUuid: input.confirmationMessageUuid,
  });
  const assistantMessage = await createProjectMessage({
    projectUuid: input.projectUuid,
    sender: 'assistant',
    content: actionResult.reply,
    action: 'regenerate_video_outline',
    reason,
  });

  return {
    assistantMessage,
    analysis: { action: 'regenerate_video_outline', reason },
    project: actionResult.project,
    outline: actionResult.outline,
  };
}

async function routeIntentAction(input: {
  action: VideoIntentAction;
  reason: string;
  userPrompt: string;
  project: ProjectRecord;
}): Promise<ActionResult> {
  switch (input.action) {
    case 'generate_video_outline':
      return handleGenerateVideoOutline(input);
    case 'regenerate_video_outline':
      return handleRegenerateVideoOutline(input);
    case 'add_scene':
      return { reply: handleAddScene(input), project: input.project, outline: null };
    case 'delete_scene':
      return { reply: handleDeleteScene(input), project: input.project, outline: null };
    case 'regenerate_scene':
      return { reply: handleRegenerateScene(input), project: input.project, outline: null };
    case 'regenerate_video_outline_confirmation':
    case 'unsupported':
    default:
      return { reply: handleUnsupportedInstruction(input), project: input.project, outline: null };
  }
}

async function handleGenerateVideoOutline(input: {
  reason: string;
  userPrompt: string;
  project: ProjectRecord;
}): Promise<ActionResult & { outline: StoryboardOutline }> {
  const outline = await generateVideoOutline({
    mode: input.project.type,
    userPrompt: resolveProjectPrompt(input.project, input.userPrompt),
    requestInstruction: input.userPrompt,
  });
  const project = await updateProjectStoryboardOutline(input.project.uuid, serializeStoryboardOutline(outline));

  return { reply: buildOutlineReply(outline, input.reason), project, outline };
}

async function handleRegenerateVideoOutline(input: {
  reason: string;
  userPrompt: string;
  project: ProjectRecord;
}): Promise<ActionResult> {
  if (hasGeneratedStoryboardAssets(input.project.videoSource)) {
    return {
      reply: '当前项目已有部分分镜画面或旁白音频。重新生成视频大纲会覆盖这些已有数据，请确认是否继续。',
      project: input.project,
      outline: null,
      assistantAction: 'regenerate_video_outline_confirmation',
    };
  }

  return generateAndReplaceVideoOutline({
    ...input,
    clearGeneratedAssets: false,
  });
}

async function generateAndReplaceVideoOutline(input: {
  reason: string;
  userPrompt: string;
  project: ProjectRecord;
  clearGeneratedAssets: boolean;
  requiredLatestMessageUuid?: string;
}): Promise<ActionResult & { outline: StoryboardOutline }> {
  const outline = await generateVideoOutline({
    mode: input.project.type,
    userPrompt: resolveProjectPrompt(input.project, input.userPrompt),
    requestInstruction: input.userPrompt,
    existingOutline: input.project.storyboardOutline,
    regenerate: true,
  });

  if (input.requiredLatestMessageUuid) {
    const latestMessage = await getLatestProjectMessage(input.project.uuid);
    if (latestMessage?.uuid !== input.requiredLatestMessageUuid) {
      throw new Error('该确认请求已过期，请重新发送修改大纲的需求。');
    }
  }

  const serializedOutline = serializeStoryboardOutline(outline);
  const project = input.clearGeneratedAssets
    ? await replaceProjectStoryboardOutline(
        input.project.uuid,
        serializedOutline,
        buildClearedVideoSource(input.project.videoSource),
      )
    : await updateProjectStoryboardOutline(input.project.uuid, serializedOutline);

  return { reply: buildOutlineReply(outline, input.reason), project, outline };
}

function buildOutlineReply(outline: StoryboardOutline, reason: string): string {
  return [
    `已完成视频大纲生成，共拆分 ${outline.scenes.length} 个分镜。`,
    `识别理由：${reason}`,
    `视频概述：${outline.summary}`,
    ...(outline.globalImageStylePrompt ? [`全局图像风格：${outline.globalImageStylePrompt}`] : []),
  ].join('\n');
}

function hasGeneratedStoryboardAssets(rawVideoSource: string): boolean {
  try {
    const parsed = JSON.parse(rawVideoSource) as { scenes?: Record<string, unknown> };
    return Boolean(parsed.scenes && Object.keys(parsed.scenes).length > 0);
  } catch {
    return false;
  }
}

function buildClearedVideoSource(rawVideoSource: string): string {
  try {
    const parsed = JSON.parse(rawVideoSource) as { htmlStyleId?: unknown };
    return JSON.stringify(
      {
        version: 1,
        type: 'storyboard_assets',
        ...(typeof parsed.htmlStyleId === 'string' ? { htmlStyleId: parsed.htmlStyleId } : {}),
        scenes: {},
      },
      null,
      2,
    );
  } catch {
    return '';
  }
}

function handleAddScene(input: { reason: string; userPrompt: string }): string {
  return `已识别为“新增一个分镜”。后续会把新的镜头插入现有分镜序列。识别理由：${input.reason}`;
}

function handleDeleteScene(input: { reason: string; userPrompt: string }): string {
  return `已识别为“删除一个分镜”。后续会根据你的描述定位并移除目标镜头。识别理由：${input.reason}`;
}

function handleRegenerateScene(input: { reason: string; userPrompt: string }): string {
  return `已识别为“重新生成某个分镜”。后续会对指定镜头重新创作。识别理由：${input.reason}`;
}

function handleUnsupportedInstruction(input: { reason: string; userPrompt: string }): string {
  return `已识别为“其他不支持的指令”。当前版本暂不处理该请求。识别理由：${input.reason}`;
}

function resolveProjectPrompt(project: ProjectRecord, fallbackPrompt: string): string {
  const outline = project.storyboardOutline.trim();
  const structuredOutline = parseStoryboardOutline(outline);
  if (structuredOutline?.userPrompt) {
    return structuredOutline.userPrompt;
  }

  const placeholderMatch = outline.match(/用户初始创意：([^\n]+)/);
  if (placeholderMatch?.[1]) {
    return placeholderMatch[1].trim();
  }

  return fallbackPrompt;
}
