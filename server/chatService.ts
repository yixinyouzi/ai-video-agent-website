import { StoryboardOutline, parseStoryboardOutline, serializeStoryboardOutline } from '../shared/storyboardOutline';
import { createProjectMessage, VideoIntentAction } from './chatRepository';
import { analyzeUserIntent, IntentAnalysisResult } from './intentAnalysis';
import { getProjectByUuid, ProjectRecord, updateProjectStoryboardOutline } from './projectRepository';
import { generateVideoOutline } from './videoOutlineService';

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
    action: analysis.action,
    reason: analysis.reason,
  });

  return {
    assistantMessage,
    analysis,
    project: actionResult.project,
    outline: actionResult.outline,
  };
}

async function routeIntentAction(input: {
  action: VideoIntentAction;
  reason: string;
  userPrompt: string;
  project: ProjectRecord;
}): Promise<{
  reply: string;
  project: ProjectRecord;
  outline: StoryboardOutline | null;
}> {
  switch (input.action) {
    case 'generate_video_outline':
      return handleGenerateVideoOutline(input);
    case 'regenerate_video_outline':
      return handleRegenerateVideoOutline(input);
    case 'add_scene':
      return {
        reply: handleAddScene(input),
        project: input.project,
        outline: null,
      };
    case 'delete_scene':
      return {
        reply: handleDeleteScene(input),
        project: input.project,
        outline: null,
      };
    case 'regenerate_scene':
      return {
        reply: handleRegenerateScene(input),
        project: input.project,
        outline: null,
      };
    case 'unsupported':
    default:
      return {
        reply: handleUnsupportedInstruction(input),
        project: input.project,
        outline: null,
      };
  }
}

async function handleGenerateVideoOutline(input: {
  reason: string;
  userPrompt: string;
  project: ProjectRecord;
}): Promise<{
  reply: string;
  project: ProjectRecord;
  outline: StoryboardOutline;
}> {
  const outline = await generateVideoOutline({
    mode: input.project.type,
    userPrompt: resolveProjectPrompt(input.project, input.userPrompt),
    requestInstruction: input.userPrompt,
  });

  const project = await updateProjectStoryboardOutline(input.project.uuid, serializeStoryboardOutline(outline));
  return {
    reply: buildOutlineReply(outline, input.reason),
    project,
    outline,
  };
}

async function handleRegenerateVideoOutline(input: {
  reason: string;
  userPrompt: string;
  project: ProjectRecord;
}): Promise<{
  reply: string;
  project: ProjectRecord;
  outline: StoryboardOutline;
}> {
  const outline = await generateVideoOutline({
    mode: input.project.type,
    userPrompt: resolveProjectPrompt(input.project, input.userPrompt),
    requestInstruction: input.userPrompt,
    existingOutline: input.project.storyboardOutline,
    regenerate: true,
  });

  const project = await updateProjectStoryboardOutline(input.project.uuid, serializeStoryboardOutline(outline));
  return {
    reply: buildOutlineReply(outline, input.reason),
    project,
    outline,
  };
}

function buildOutlineReply(outline: StoryboardOutline, reason: string): string {
  return [
    `已完成视频大纲生成，共拆分 ${outline.scenes.length} 个分镜。`,
    `识别理由：${reason}`,
    `视频概述：${outline.summary}`,
    ...(outline.globalImageStylePrompt ? [`全局图像风格：${outline.globalImageStylePrompt}`] : []),
  ].join('\n');
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
