export type ProjectMode = 'slideshow' | 'html';

export function getDefaultPrompt(mode: ProjectMode): string {
  return mode === 'slideshow'
    ? '赛博朋克风格的孤独漫游者步入雨夜中的地下酒馆，霓虹闪烁，水坑倒影'
    : '利用旋转立方体、缩放圆形、网格线，来表达极简主义的抽象几何空间之美，音乐带节奏感';
}

export function getDefaultProjectTitle(mode: ProjectMode, prompt: string): string {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt) {
    const normalized = trimmedPrompt.replace(/\s+/g, ' ');
    return normalized.length > 20 ? `${normalized.slice(0, 20)}...` : normalized;
  }

  return mode === 'slideshow' ? 'AI 创意轮播视频' : 'AI 动态矢量网页视频';
}

export function buildInitialStoryboardOutline(mode: ProjectMode, prompt: string): string {
  const normalizedPrompt = prompt.trim() || getDefaultPrompt(mode);
  const modeLabel = mode === 'slideshow' ? '图片轮播' : 'HTML 动画';

  return [
    `用户初始创意：${normalizedPrompt}`,
    `创作模式：${modeLabel}`,
    '',
    '分镜大纲：',
    '1. 正在等待 AI 生成完整的分镜拆解内容。',
    '2. 当前项目已创建，后续可在此字段中写入完整分镜大纲。',
  ].join('\n');
}
