import { parseStoryboardOutline } from '../shared/storyboardOutline';
import { getLlmModel, getOpenAIClient, normalizeLlmError } from './llmClient';
import { ProjectRecord, updateProjectVideoSource } from './projectRepository';
import { DEFAULT_HTML_VIDEO_STYLE_ID, getHtmlVideoStyle, HtmlVideoStyleId } from '../shared/htmlVideoStyles';

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
  html?: string;
  audio?: StoryboardAudioSource;
}

interface ProjectVideoSource {
  version: 1;
  type: 'storyboard_assets';
  htmlStyleId?: HtmlVideoStyleId;
  scenes: Record<string, StoryboardSceneSource>;
}

export interface GenerateStoryboardHtmlResult {
  project: ProjectRecord;
  sceneNumber: number;
  animation: {
    html: string;
    prompt: string;
    generatedAt: string;
  };
  skipped: boolean;
}

export async function generateStoryboardHtml(input: {
  project: ProjectRecord;
  sceneNumber: number;
  force?: boolean;
  signal?: AbortSignal;
}): Promise<GenerateStoryboardHtmlResult> {
  const outline = parseStoryboardOutline(input.project.storyboardOutline);
  if (!outline || outline.mode !== 'html') {
    throw new Error('Only HTML video projects with a generated outline can generate storyboard animations.');
  }

  const scene = outline.scenes.find((item) => item.sceneNumber === input.sceneNumber);
  if (!scene) {
    throw new Error('Scene not found in storyboard outline.');
  }

  const videoSource = parseProjectVideoSource(input.project.videoSource);
  const selectedStyle = getHtmlVideoStyle(videoSource.htmlStyleId ?? DEFAULT_HTML_VIDEO_STYLE_ID);
  const sceneKey = String(input.sceneNumber);
  const existingScene = videoSource.scenes[sceneKey] ?? {};
  if (!input.force && existingScene.html) {
    return {
      project: input.project,
      sceneNumber: input.sceneNumber,
      animation: {
        html: existingScene.html,
        prompt: existingScene.prompt ?? scene.visualPrompt,
        generatedAt: existingScene.generatedAt ?? new Date().toISOString(),
      },
      skipped: true,
    };
  }

  const previousScene = outline.scenes.find((item) => item.sceneNumber === scene.sceneNumber - 1);
  const previousHtml = previousScene ? videoSource.scenes[String(previousScene.sceneNumber)]?.html : null;

  try {
    const completion = await getOpenAIClient().chat.completions.create(
      {
        model: getLlmModel(),
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: buildHtmlSystemPrompt(),
          },
          {
            role: 'user',
            content: buildHtmlUserPrompt({
              title: scene.title,
              prompt: scene.visualPrompt,
              durationSeconds: scene.durationSeconds,
              stylePrompt: selectedStyle.prompt,
              previousHtml,
            }),
          },
        ],
      },
      { signal: input.signal },
    );
    const rawHtml = completion.choices[0]?.message?.content;
    if (typeof rawHtml !== 'string' || !rawHtml.trim()) {
      throw new Error('HTML animation response did not include assistant content.');
    }

    const animation = {
      html: normalizeGeneratedHtml(rawHtml),
      prompt: scene.visualPrompt,
      generatedAt: new Date().toISOString(),
    };
    const nextVideoSource: ProjectVideoSource = {
      ...videoSource,
      scenes: {
        ...videoSource.scenes,
        [sceneKey]: {
          ...existingScene,
          ...animation,
        },
      },
    };
    const project = await updateProjectVideoSource(input.project.uuid, JSON.stringify(nextVideoSource, null, 2));
    return { project, sceneNumber: input.sceneNumber, animation, skipped: false };
  } catch (error) {
    throw normalizeLlmError(error, 'Storyboard HTML animation generation');
  }
}

function buildHtmlSystemPrompt(): string {
  return `You are a web animation video design engineer. Create one self-contained HTML webpage for a single video storyboard scene.

Requirements:
- Return only a complete HTML document. Do not use Markdown fences or explanations.
- Use HTML, CSS, JavaScript, SVG, and Canvas as needed to create an animated 16:9 scene.
- The animation must start automatically, loop smoothly, fill the viewport, and remain visually useful without user interaction.
- Do not load external scripts, fonts, images, video, audio, or network resources.
- Keep all code inline and ensure it runs inside a sandboxed iframe.
- CSS animations will be paused and resumed by the host player. If you build a custom JavaScript animation loop, listen for the "visioncraft-playback" document event and pause/resume it using event.detail.isPlaying.
- Prefer polished motion design, clear visual hierarchy, and efficient animation.
- Respect prefers-reduced-motion where practical.
- When previous-scene HTML is supplied, preserve its design language: palette, typography, shapes, lighting, density, and motion character.`;
}

function buildHtmlUserPrompt(input: {
  title: string;
  prompt: string;
  durationSeconds: number;
  stylePrompt: string;
  previousHtml?: string | null;
}): string {
  const sections = [
    `Scene title: ${input.title}`,
    `Target loop duration: ${input.durationSeconds} seconds`,
    `Storyboard animation brief:\n${input.prompt}`,
    `Mandatory visual style specification:\n${input.stylePrompt}`,
  ];
  if (input.previousHtml) {
    sections.push(`Previous scene HTML for visual style reference only:\n${input.previousHtml}`);
  } else {
    sections.push('This is the first scene. Establish a coherent visual system that later scenes can continue.');
  }
  return sections.join('\n\n');
}

function normalizeGeneratedHtml(value: string): string {
  const html = value.trim().replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
  if (!/<html[\s>]/i.test(html) || !/<body[\s>]/i.test(html)) {
    throw new Error('Generated animation must be a complete HTML document.');
  }
  return html;
}

function parseProjectVideoSource(raw: string): ProjectVideoSource {
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as ProjectVideoSource & { type?: string };
      if (parsed.version === 1 && parsed.scenes) {
        return {
          version: 1,
          type: 'storyboard_assets',
          htmlStyleId: parsed.htmlStyleId ?? DEFAULT_HTML_VIDEO_STYLE_ID,
          scenes: parsed.scenes,
        };
      }
    } catch {
      // Start a fresh source index for invalid legacy content.
    }
  }
  return { version: 1, type: 'storyboard_assets', htmlStyleId: DEFAULT_HTML_VIDEO_STYLE_ID, scenes: {} };
}
