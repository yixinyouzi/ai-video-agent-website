import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseStoryboardOutline } from '../shared/storyboardOutline';
import { getOpenAITtsClient, normalizeLlmError } from './llmClient';
import { ProjectRecord, updateProjectVideoSource } from './projectRepository';

interface StoryboardAudioSource {
  path: string;
  url: string;
  narration: string;
  voice: string;
  generatedAt: string;
}

interface StoryboardSceneSource {
  path?: string;
  url?: string;
  prompt?: string;
  generatedAt?: string;
  audio?: StoryboardAudioSource;
}

interface ProjectVideoSource {
  version: 1;
  type: 'storyboard_images';
  scenes: Record<string, StoryboardSceneSource>;
}

export interface GenerateStoryboardAudioResult {
  project: ProjectRecord;
  sceneNumber: number;
  audio: StoryboardAudioSource;
  skipped: boolean;
}

const MEDIA_ROOT_DIR = path.resolve(process.cwd(), 'project-images');

export async function generateStoryboardAudio(input: {
  project: ProjectRecord;
  sceneNumber: number;
  force?: boolean;
  signal?: AbortSignal;
}): Promise<GenerateStoryboardAudioResult> {
  const logPrefix = `[storyboard-audio] project=${input.project.uuid} scene=${input.sceneNumber}`;
  console.log(`${logPrefix} Starting narration generation`);

  const outline = parseStoryboardOutline(input.project.storyboardOutline);
  const scene = outline?.scenes.find((item) => item.sceneNumber === input.sceneNumber);
  if (!outline || !scene) {
    throw new Error('Scene not found in storyboard outline.');
  }

  const videoSource = parseProjectVideoSource(input.project.videoSource);
  const sceneSource = videoSource.scenes[String(input.sceneNumber)] ?? {};
  if (!sceneSource.path || !sceneSource.url) {
    throw new Error(`Scene ${input.sceneNumber} image must be generated before narration audio.`);
  }
  if (!input.force && sceneSource.audio?.path && sceneSource.audio?.url) {
    console.log(`${logPrefix} Skipped because narration audio already exists`);
    return {
      project: input.project,
      sceneNumber: input.sceneNumber,
      audio: sceneSource.audio,
      skipped: true,
    };
  }

  const model = process.env.OPENAI_TTS_MODEL?.trim() || 'qwen3-tts-flash';
  const voice = process.env.OPENAI_TTS_VOICE?.trim() || 'Cherry';
  const instructions = process.env.OPENAI_TTS_INSTRUCTIONS?.trim() || '请使用自然、清晰、有感染力的普通话进行旁白朗读。';
  console.log(`${logPrefix} Calling TTS model=${model} voice=${voice}`);

  try {
    const speech = await getOpenAITtsClient().audio.speech.create(
      {
        model,
        voice,
        input: scene.narration,
        instructions,
      },
      {
        signal: input.signal,
        headers: {
          Accept: 'application/json',
        },
      },
    );
    const projectDir = path.join(MEDIA_ROOT_DIR, input.project.uuid);
    const fileName = `scene-${String(input.sceneNumber).padStart(2, '0')}-narration-${Date.now()}-${randomUUID().slice(0, 8)}.mp3`;
    const absolutePath = path.join(projectDir, fileName);
    await mkdir(projectDir, { recursive: true });
    await writeFile(absolutePath, await resolveSpeechAudioBuffer(speech, input.signal));

    const audio: StoryboardAudioSource = {
      path: path.posix.join('project-images', input.project.uuid, fileName),
      url: `/api/project-images/${input.project.uuid}/${fileName}`,
      narration: scene.narration,
      voice,
      generatedAt: new Date().toISOString(),
    };
    const nextVideoSource: ProjectVideoSource = {
      ...videoSource,
      scenes: {
        ...videoSource.scenes,
        [String(input.sceneNumber)]: {
          ...sceneSource,
          audio,
        },
      },
    };
    const project = await updateProjectVideoSource(input.project.uuid, JSON.stringify(nextVideoSource, null, 2));
    console.log(`${logPrefix} Saved audio=${audio.path} and updated project.video_source`);

    return {
      project,
      sceneNumber: input.sceneNumber,
      audio,
      skipped: false,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('当前模型不在令牌允许的模型列表中') ||
        error.message.toLowerCase().includes('model') && error.message.toLowerCase().includes('allowed'))
    ) {
      throw new Error(
        `当前 TTS API 令牌无权使用 ${model}。请在服务商后台为令牌开放该模型，或在 .env 中配置有权限的 OPENAI_TTS_API_KEY 和 OPENAI_TTS_BASE_URL。`,
      );
    }

    throw normalizeLlmError(error, 'Storyboard narration generation');
  }
}

async function resolveSpeechAudioBuffer(response: Response, signal?: AbortSignal): Promise<Buffer> {
  const contentType = response.headers.get('content-type')?.toLowerCase() || '';
  const responseBuffer = Buffer.from(await response.arrayBuffer());

  if (contentType.startsWith('audio/') || contentType.includes('application/octet-stream')) {
    return responseBuffer;
  }

  const responseText = responseBuffer.toString('utf8');
  let payload: unknown;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`TTS provider returned unsupported content type "${contentType || 'unknown'}".`);
  }

  const audioUrl = findAudioUrl(payload);
  if (audioUrl) {
    const audioResponse = await fetch(audioUrl, { signal });
    if (!audioResponse.ok) {
      throw new Error(`Failed to download generated narration audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    return Buffer.from(await audioResponse.arrayBuffer());
  }

  const audioBase64 = findAudioBase64(payload);
  if (audioBase64) {
    return Buffer.from(audioBase64.replace(/^data:audio\/[^;]+;base64,/, ''), 'base64');
  }

  throw new Error(`TTS provider returned JSON without an audio URL or Base64 audio: ${responseText.slice(0, 500)}`);
}

function findAudioUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const output = asRecord(candidate.output);
  const audio = asRecord(candidate.audio) || asRecord(output?.audio);
  const data = asRecord(candidate.data);
  const dataAudio = asRecord(data?.audio);
  const values = [
    candidate.url,
    candidate.audio_url,
    audio?.url,
    output?.audio_url,
    data?.url,
    data?.audio_url,
    dataAudio?.url,
  ];

  return values.find((value): value is string => typeof value === 'string' && /^https?:\/\//i.test(value)) ?? null;
}

function findAudioBase64(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const output = asRecord(candidate.output);
  const audio = asRecord(candidate.audio) || asRecord(output?.audio);
  const data = asRecord(candidate.data);
  const dataAudio = asRecord(data?.audio);
  const values = [
    candidate.audio,
    candidate.audio_base64,
    audio?.data,
    audio?.base64,
    output?.audio_base64,
    data?.audio_base64,
    dataAudio?.data,
    dataAudio?.base64,
  ];

  return values.find((value): value is string => typeof value === 'string' && value.length > 100) ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function parseProjectVideoSource(raw: string): ProjectVideoSource {
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as ProjectVideoSource;
      if (parsed.version === 1 && parsed.type === 'storyboard_images' && parsed.scenes) {
        return parsed;
      }
    } catch {
      // Fall back to a fresh source index if legacy content is not JSON.
    }
  }

  return {
    version: 1,
    type: 'storyboard_images',
    scenes: {},
  };
}
