import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseStoryboardOutline } from '../shared/storyboardOutline';
import { ProjectRecord, updateProjectVideoSource } from './projectRepository';

interface StoryboardImageSource {
  path: string;
  url: string;
  prompt: string;
  generatedAt: string;
}

interface ProjectVideoSource {
  version: 1;
  type: 'storyboard_assets';
  scenes: Record<string, StoryboardImageSource>;
}

interface EvolinkCreateResponse {
  task_id?: string;
  id?: string;
  data?: {
    task_id?: string;
    id?: string;
  };
}

interface EvolinkTaskResponse {
  status?: string;
  error?: string | { message?: string };
  results?: Array<string | { url?: string }>;
  generated?: Array<string | { url?: string }>;
  images?: Array<string | { url?: string }>;
  output?: string | { url?: string } | Array<string | { url?: string }>;
  data?: {
    status?: string;
    error?: string | { message?: string };
    results?: Array<string | { url?: string }>;
    generated?: Array<string | { url?: string }>;
    images?: Array<string | { url?: string }>;
    output?: string | { url?: string } | Array<string | { url?: string }>;
  };
}

export interface GenerateStoryboardImageResult {
  project: ProjectRecord;
  sceneNumber: number;
  image: StoryboardImageSource;
  skipped: boolean;
}

const IMAGE_ROOT_DIR = path.resolve(process.cwd(), 'project-images');

export async function generateStoryboardImage(input: {
  project: ProjectRecord;
  sceneNumber: number;
  force?: boolean;
  signal?: AbortSignal;
}): Promise<GenerateStoryboardImageResult> {
  const logPrefix = `[storyboard-image] project=${input.project.uuid} scene=${input.sceneNumber}`;
  console.log(`${logPrefix} Starting generation`);
  const outline = parseStoryboardOutline(input.project.storyboardOutline);
  if (!outline || outline.mode !== 'slideshow') {
    throw new Error('Only slideshow projects with a generated outline can generate storyboard images.');
  }

  const scene = outline.scenes.find((item) => item.sceneNumber === input.sceneNumber);
  if (!scene) {
    throw new Error('Scene not found in storyboard outline.');
  }
  if (!containsChineseText(scene.visualPrompt)) {
    throw new Error(`Scene ${input.sceneNumber} image prompt must be written in Chinese. Please regenerate the video outline.`);
  }
  if (scene.visualPrompt.length > 2000) {
    throw new Error(`Scene ${input.sceneNumber} image prompt exceeds Evolink's 2000-character limit.`);
  }

  const videoSource = parseProjectVideoSource(input.project.videoSource);
  const existingImage = videoSource.scenes[String(input.sceneNumber)];
  if (!input.force && existingImage?.path && existingImage?.url) {
    console.log(`${logPrefix} Skipped because an image already exists`);
    return {
      project: input.project,
      sceneNumber: input.sceneNumber,
      image: existingImage,
      skipped: true,
    };
  }

  const apiKey = process.env.EVOLINK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('EVOLINK_API_KEY is required to generate storyboard images.');
  }

  const remoteImageUrl = await createAndPollEvolinkImage({
    apiKey,
    prompt: scene.visualPrompt,
    logPrefix,
    signal: input.signal,
  });
  console.log(`${logPrefix} Task completed, downloading generated image`);
  const image = await downloadProjectImage({
    projectUuid: input.project.uuid,
    sceneNumber: input.sceneNumber,
    prompt: scene.visualPrompt,
    remoteImageUrl,
    signal: input.signal,
  });

  const nextVideoSource: ProjectVideoSource = {
    ...videoSource,
    scenes: {
      ...videoSource.scenes,
      [String(input.sceneNumber)]: {
        ...(existingImage ?? {}),
        ...image,
      },
    },
  };
  const updatedProject = await updateProjectVideoSource(input.project.uuid, JSON.stringify(nextVideoSource, null, 2));
  console.log(`${logPrefix} Saved image=${image.path} and updated project.video_source`);

  return {
    project: updatedProject,
    sceneNumber: input.sceneNumber,
    image,
    skipped: false,
  };
}

export function getProjectImagePath(projectUuid: string, fileName: string): string {
  return path.join(IMAGE_ROOT_DIR, projectUuid, fileName);
}

function parseProjectVideoSource(raw: string): ProjectVideoSource {
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as ProjectVideoSource;
      if (parsed.version === 1 && parsed.scenes) {
        return { ...parsed, type: 'storyboard_assets' };
      }
    } catch {
      // Fall back to a fresh source index if legacy content is not JSON.
    }
  }

  return {
    version: 1,
    type: 'storyboard_assets',
    scenes: {},
  };
}

async function createAndPollEvolinkImage(input: {
  apiKey: string;
  prompt: string;
  logPrefix: string;
  signal?: AbortSignal;
}): Promise<string> {
  const baseUrl = process.env.EVOLINK_BASE_URL?.trim() || 'https://api.evolink.ai';
  const model = process.env.EVOLINK_IMAGE_MODEL?.trim() || 'z-image-turbo';
  const size = process.env.EVOLINK_IMAGE_SIZE?.trim() || '16:9';
  const seed = parseOptionalInteger(process.env.EVOLINK_IMAGE_SEED);
  const nsfwCheck = parseBoolean(process.env.EVOLINK_IMAGE_NSFW_CHECK, false);
  const pollIntervalMs = parsePositiveInteger(process.env.EVOLINK_IMAGE_POLL_INTERVAL_MS, 2000);
  const maxPollAttempts = parsePositiveInteger(process.env.EVOLINK_IMAGE_MAX_POLL_ATTEMPTS, 150);
  console.log(`${input.logPrefix} Creating Evolink task model=${model} size=${size}`);
  const createResponse = await fetch(`${baseUrl}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: input.prompt,
      size,
      nsfw_check: nsfwCheck,
      ...(seed ? { seed } : {}),
    }),
    signal: input.signal,
  });

  if (!createResponse.ok) {
    throw new Error(`Evolink image task creation failed: ${await createResponse.text()}`);
  }

  const createData = (await createResponse.json()) as EvolinkCreateResponse;
  const taskId = createData.task_id || createData.id || createData.data?.task_id || createData.data?.id;
  if (!taskId) {
    throw new Error('Evolink did not return a task id.');
  }
  console.log(`${input.logPrefix} Evolink task created id=${taskId}; polling every ${pollIntervalMs}ms`);

  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    await sleep(pollIntervalMs, input.signal);

    const taskResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
      },
      signal: input.signal,
    });

    if (!taskResponse.ok) {
      throw new Error(`Evolink image task polling failed: ${await taskResponse.text()}`);
    }

    const taskData = (await taskResponse.json()) as EvolinkTaskResponse;
    const status = taskData.status || taskData.data?.status || '';
    console.log(`${input.logPrefix} Poll ${attempt + 1}/${maxPollAttempts} task=${taskId} status=${status || 'unknown'}`);
    if (isFailedStatus(status)) {
      throw new Error(getTaskErrorMessage(taskData) || `Evolink image task failed with status: ${status}`);
    }

    if (isCompletedStatus(status)) {
      const url = getTaskImageUrl(taskData);
      if (!url) {
        throw new Error('Evolink image task completed without an image URL.');
      }
      return url;
    }
  }

  throw new Error('Evolink image task timed out.');
}

async function downloadProjectImage(input: {
  projectUuid: string;
  sceneNumber: number;
  prompt: string;
  remoteImageUrl: string;
  signal?: AbortSignal;
}): Promise<StoryboardImageSource> {
  const response = await fetch(input.remoteImageUrl, { signal: input.signal });
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const extension = getImageExtension(contentType, input.remoteImageUrl);
  const projectDir = path.join(IMAGE_ROOT_DIR, input.projectUuid);
  const fileName = `scene-${String(input.sceneNumber).padStart(2, '0')}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const absolutePath = path.join(projectDir, fileName);

  await mkdir(projectDir, { recursive: true });
  await writeFile(absolutePath, Buffer.from(await response.arrayBuffer()));

  const relativePath = path.posix.join('project-images', input.projectUuid, fileName);

  return {
    path: relativePath,
    url: `/api/project-images/${input.projectUuid}/${fileName}`,
    prompt: input.prompt,
    generatedAt: new Date().toISOString(),
  };
}

function getImageExtension(contentType: string, imageUrl: string): string {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    return 'jpg';
  }
  if (contentType.includes('webp')) {
    return 'webp';
  }
  if (contentType.includes('png')) {
    return 'png';
  }

  const parsedExtension = new URL(imageUrl).pathname.split('.').pop()?.toLowerCase();
  return parsedExtension && /^[a-z0-9]{2,5}$/.test(parsedExtension) ? parsedExtension : 'png';
}

function isCompletedStatus(status: string): boolean {
  return ['completed', 'succeeded', 'success', 'done'].includes(status.toLowerCase());
}

function isFailedStatus(status: string): boolean {
  return ['failed', 'error', 'cancelled', 'canceled'].includes(status.toLowerCase());
}

function getTaskErrorMessage(taskData: EvolinkTaskResponse): string | null {
  const error = taskData.error || taskData.data?.error;
  if (!error) {
    return null;
  }

  return typeof error === 'string' ? error : error.message ?? null;
}

function getTaskImageUrl(taskData: EvolinkTaskResponse): string | null {
  const candidates = [
    taskData.results,
    taskData.generated,
    taskData.images,
    normalizeOutput(taskData.output),
    taskData.data?.results,
    taskData.data?.generated,
    taskData.data?.images,
    normalizeOutput(taskData.data?.output),
  ].find((items) => items && items.length > 0);
  const firstResult = candidates?.[0];

  return typeof firstResult === 'string' ? firstResult : firstResult?.url ?? null;
}

function normalizeOutput(
  output: string | { url?: string } | Array<string | { url?: string }> | undefined,
): Array<string | { url?: string }> | undefined {
  if (!output) {
    return undefined;
  }

  return Array.isArray(output) ? output : [output];
}

function containsChineseText(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOptionalInteger(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 2147483647 ? parsed : undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  return fallback;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      },
      { once: true },
    );
  });
}
