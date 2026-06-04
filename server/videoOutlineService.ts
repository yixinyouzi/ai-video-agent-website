import {
  StoryboardOutline,
  StoryboardProjectMode,
  parseStoryboardOutline,
} from '../shared/storyboardOutline';
import { getLlmModel, getOpenAIClient, normalizeLlmError } from './llmClient';

export async function generateVideoOutline(input: {
  mode: StoryboardProjectMode;
  userPrompt: string;
  requestInstruction?: string;
  existingOutline?: string;
  regenerate?: boolean;
}): Promise<StoryboardOutline> {
  const prompt = buildOutlinePrompt(input);

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: getLlmModel(),
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(input.mode),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      throw new Error('Video outline response did not include assistant content.');
    }

    return parseGeneratedOutline(rawContent, input.mode, input.userPrompt);
  } catch (error) {
    throw normalizeLlmError(error, 'Video outline generation');
  }
}

function buildSystemPrompt(mode: StoryboardProjectMode): string {
  const visualPromptInstruction =
    mode === 'slideshow'
      ? [
          '所有分镜的 visualPrompt 必须使用简体中文撰写，不得使用英文句子；专业术语也尽量使用中文表达。',
          'visualPrompt 必须是一段可直接用于文生图模型的中文画面提示词。',
          '当前模式是“图片轮播视频”。',
          '在完成 fullScript 后，先根据完整脚本的主题、时代、情绪和叙事类型，选择最适合整支视频的一套统一图像风格。',
          '将统一风格写入 globalImageStylePrompt，使用简体中文描述整体艺术风格、色彩系统、光影、材质、画面质感、镜头语言和人物一致性要求。',
          'globalImageStylePrompt 应是一组可复用的全局图像风格提示词，建议 80 到 300 个中文字符，不要包含某个分镜独有的主体、动作或场景。',
          '每个分镜的 visualPrompt 必须以完整的 globalImageStylePrompt 开头，再补充该分镜独有的主体、动作、场景和构图内容。',
          '每个分镜的 visualPrompt 必须是图片生成提示词，用于后续文生图。',
          '提示词要描述主体、构图、镜头、光线、风格、环境、材质和氛围。',
          '不要写成网页、代码、动画分镜语言，不要出现 HTML、CSS、SVG、Canvas、JS 等词。',
        ].join('\n')
      : [
          '当前模式是“HTML动画视频”。',
          '每个分镜的 visualPrompt 必须是网页动画提示词，用于后续生成 HTML/CSS/SVG/Canvas 动画。',
          '提示词要明确视觉元素、布局结构、动画节奏、镜头运动感、颜色系统、交互层次和技术表现。',
          '不要写成静态图片生成语言，要强调动画、时间线、形状变化、粒子、路径、转场等动态效果。',
        ].join('\n');

  return `${mode === 'html' ? '你是一个网页动画视频设计工程师，擅长把叙事脚本拆解为可通过 HTML、CSS、JavaScript、SVG、Canvas 实现的动态网页分镜。' : '你是一名专业的视频脚本与分镜导演，需要根据用户输入生成结构化视频大纲。'}

请严格遵守以下要求：
1. 先根据用户提示词写出完整的视频脚本逐字稿 fullScript，要求可直接用于旁白朗读。
2. 再把这份逐字稿拆分成 6 到 30 个分镜 scenes。
3. 每个分镜必须包含：
   - sceneNumber：从 1 开始的整数编号
   - title：分镜标题
   - narration：该分镜对应的旁白
   - visualPrompt：该分镜的画面提示词
   - durationSeconds：该分镜建议时长，取 3 到 12 秒之间的整数
4. summary 需要用 1 到 2 句话概括整支视频的叙事方向与视觉基调。
5. scenes 的 narration 必须覆盖并拆分 fullScript 的主要内容，不能只写关键词。
6. 图片轮播模式必须生成 globalImageStylePrompt；HTML 动画模式将其设置为空字符串。
7. 只输出 JSON，不要输出 Markdown，不要输出任何额外说明。
8. 返回 JSON 必须严格符合这个结构：
{
  "version": 1,
  "mode": "${mode}",
  "userPrompt": "string",
  "summary": "string",
  "fullScript": "string",
  "visualPromptType": "${mode === 'slideshow' ? 'image' : 'html_animation'}",
  "globalImageStylePrompt": "${mode === 'slideshow' ? '根据完整视频脚本选择的全局中文图像风格提示词' : ''}",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "string",
      "narration": "string",
      "visualPrompt": "string",
      "durationSeconds": 5
    }
  ]
}

${visualPromptInstruction}`;
}

function buildOutlinePrompt(input: {
  mode: StoryboardProjectMode;
  userPrompt: string;
  requestInstruction?: string;
  existingOutline?: string;
  regenerate?: boolean;
}): string {
  const sections = [
    `创作模式：${input.mode === 'slideshow' ? '图片轮播视频' : 'HTML动画视频'}`,
    `项目核心提示词：${input.userPrompt}`,
  ];

  if (input.requestInstruction?.trim()) {
    sections.push(`用户当前请求：${input.requestInstruction.trim()}`);
  }

  const existingOutline = input.existingOutline ? parseStoryboardOutline(input.existingOutline) : null;
  if (input.regenerate && existingOutline) {
    sections.push(`当前已有完整分镜大纲：\n${input.existingOutline?.trim()}`);
    sections.push('请在保留核心主题的前提下，重新组织脚本和分镜，避免只是微调措辞。');
  }

  return sections.join('\n');
}

function parseGeneratedOutline(
  rawContent: string,
  expectedMode: StoryboardProjectMode,
  expectedPrompt: string,
): StoryboardOutline {
  const normalizedContent = rawContent.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
  const outline = parseStoryboardOutline(normalizedContent);

  if (!outline) {
    throw new Error('Video outline response was not valid JSON with the expected structure.');
  }

  if (outline.mode !== expectedMode) {
    throw new Error(`Video outline mode mismatch: expected ${expectedMode}, received ${outline.mode}.`);
  }

  if (outline.scenes.length < 6 || outline.scenes.length > 30) {
    throw new Error(`Video outline scene count must be between 6 and 30, received ${outline.scenes.length}.`);
  }

  if (expectedMode === 'slideshow') {
    const globalImageStylePrompt = outline.globalImageStylePrompt?.trim();
    if (!globalImageStylePrompt || !containsChineseText(globalImageStylePrompt)) {
      throw new Error('Slideshow outline globalImageStylePrompt must be written in Chinese.');
    }
    if (globalImageStylePrompt.length > 600) {
      throw new Error('Slideshow outline globalImageStylePrompt must not exceed 600 characters.');
    }

    const nonChineseScene = outline.scenes.find((scene) => !containsChineseText(scene.visualPrompt));
    if (nonChineseScene) {
      throw new Error(`Scene ${nonChineseScene.sceneNumber} image prompt must be written in Chinese.`);
    }

    const scenes = outline.scenes.map((scene) => {
      const visualPrompt = prefixGlobalImageStyle(globalImageStylePrompt, scene.visualPrompt);
      if (visualPrompt.length > 2000) {
        throw new Error(`Scene ${scene.sceneNumber} image prompt exceeds the 2000-character limit after adding global style.`);
      }

      return {
        ...scene,
        visualPrompt,
      };
    });

    return {
      ...outline,
      userPrompt: expectedPrompt.trim() || outline.userPrompt,
      globalImageStylePrompt,
      scenes,
    };
  }

  const normalizedPrompt = expectedPrompt.trim();
  return {
    ...outline,
    userPrompt: normalizedPrompt || outline.userPrompt,
  };
}

function containsChineseText(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function prefixGlobalImageStyle(globalStyle: string, scenePrompt: string): string {
  const normalizedScenePrompt = scenePrompt.trim();
  if (
    normalizedScenePrompt.startsWith(globalStyle) ||
    normalizedScenePrompt.startsWith(`全局风格要求：${globalStyle}`)
  ) {
    return normalizedScenePrompt;
  }

  return `全局风格要求：${globalStyle}\n分镜画面内容：${normalizedScenePrompt}`;
}
