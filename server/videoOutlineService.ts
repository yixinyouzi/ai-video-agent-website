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
          '当前模式是“图片轮播视频”。',
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

  return `你是一名专业的视频脚本与分镜导演，需要根据用户输入生成结构化视频大纲。

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
6. 只输出 JSON，不要输出 Markdown，不要输出任何额外说明。
7. 返回 JSON 必须严格符合这个结构：
{
  "version": 1,
  "mode": "${mode}",
  "userPrompt": "string",
  "summary": "string",
  "fullScript": "string",
  "visualPromptType": "${mode === 'slideshow' ? 'image' : 'html_animation'}",
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
    sections.push(`当前已有大纲摘要：${existingOutline.summary}`);
    sections.push(`当前已有分镜数：${existingOutline.scenes.length}`);
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

  const normalizedPrompt = expectedPrompt.trim();
  return {
    ...outline,
    userPrompt: normalizedPrompt || outline.userPrompt,
  };
}
