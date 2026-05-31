import { VideoIntentAction } from './chatRepository';
import { getLlmModel, getOpenAIClient, normalizeLlmError as normalizeLlmClientError } from './llmClient';

const SUPPORTED_ACTIONS: VideoIntentAction[] = [
  'generate_video_outline',
  'regenerate_video_outline',
  'add_scene',
  'delete_scene',
  'regenerate_scene',
  'unsupported',
];

const SYSTEM_PROMPT = `你是一个视频创作智能体，现在需要对用户输入的指令进行研判。

请分析用户行为属于以下哪一种 action，并给出简洁明确的 reason：
- generate_video_outline：生成视频大纲（包含完整脚本、分镜拆分列表，适用于用户要创作视频，或者直接给出一段视频脚本的情况）
- regenerate_video_outline：重新生成视频大纲
- add_scene：新增一个分镜
- delete_scene：删除一个分镜
- regenerate_scene：重新生成某个分镜
- unsupported：其他暂不支持的指令

只允许输出 JSON，不要输出 Markdown，不要输出额外解释。
返回结构必须严格符合以下示例：
{
  "action": "generate_video_outline",
  "reason": "用户正在请求根据提示词生成完整的视频脚本和分镜大纲。"
}`;

export interface IntentAnalysisResult {
  action: VideoIntentAction;
  reason: string;
}

export async function analyzeUserIntent(input: { userPrompt: string }): Promise<IntentAnalysisResult> {
  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: getLlmModel(),
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input.userPrompt },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      throw new Error('Intent analysis response did not include assistant content.');
    }

    return parseIntentAnalysis(rawContent);
  } catch (error) {
    throw normalizeLlmError(error);
  }
}

function parseIntentAnalysis(rawContent: string): IntentAnalysisResult {
  const normalizedContent = rawContent.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizedContent);
  } catch (error) {
    console.error('Intent analysis JSON validation failed: invalid JSON.', {
      rawContent,
      error: error instanceof Error ? error.message : error,
    });
    return {
      action: 'unsupported',
      reason: '模型返回内容不是合法 JSON，无法确认具体创作意图。',
    };
  }

  if (!isIntentAnalysisResult(parsed)) {
    console.error('Intent analysis JSON validation failed: invalid shape.', { rawContent, parsed });
    return {
      action: 'unsupported',
      reason: '模型返回 JSON 结构不符合预期，暂时按不支持指令处理。',
    };
  }

  return parsed;
}

function isIntentAnalysisResult(value: unknown): value is IntentAnalysisResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.reason === 'string' &&
    candidate.reason.trim().length > 0 &&
    typeof candidate.action === 'string' &&
    SUPPORTED_ACTIONS.includes(candidate.action as VideoIntentAction)
  );
}

function normalizeLlmError(error: unknown): Error {
  return normalizeLlmClientError(error, 'Intent analysis request');
}
