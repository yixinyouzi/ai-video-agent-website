export type StoryboardProjectMode = 'slideshow' | 'html';

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  narration: string;
  visualPrompt: string;
  durationSeconds: number;
}

export interface StoryboardOutline {
  version: 1;
  mode: StoryboardProjectMode;
  userPrompt: string;
  summary: string;
  fullScript: string;
  visualPromptType: 'image' | 'html_animation';
  scenes: StoryboardScene[];
}

export function parseStoryboardOutline(raw: string): StoryboardOutline | null {
  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isStoryboardOutline(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeStoryboardOutline(outline: StoryboardOutline): string {
  return JSON.stringify(outline, null, 2);
}

export function isStoryboardOutline(value: unknown): value is StoryboardOutline {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    (candidate.mode === 'slideshow' || candidate.mode === 'html') &&
    typeof candidate.userPrompt === 'string' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.fullScript === 'string' &&
    (candidate.visualPromptType === 'image' || candidate.visualPromptType === 'html_animation') &&
    Array.isArray(candidate.scenes) &&
    candidate.scenes.every(isStoryboardScene)
  );
}

function isStoryboardScene(value: unknown): value is StoryboardScene {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.sceneNumber === 'number' &&
    Number.isInteger(candidate.sceneNumber) &&
    candidate.sceneNumber > 0 &&
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    typeof candidate.narration === 'string' &&
    candidate.narration.trim().length > 0 &&
    typeof candidate.visualPrompt === 'string' &&
    candidate.visualPrompt.trim().length > 0 &&
    typeof candidate.durationSeconds === 'number' &&
    Number.isFinite(candidate.durationSeconds) &&
    candidate.durationSeconds > 0
  );
}
