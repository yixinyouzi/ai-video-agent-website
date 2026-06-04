import { useState } from 'react';
import { ThemeStyleId, VideoRatio, StyleDefinition, AnimationState } from '../types';
import { Copy, Check, Sliders, FileText, Sparkles, RefreshCw, Layout, Smartphone } from 'lucide-react';

interface StyleSidebarProps {
  styles: StyleDefinition[];
  currentStyleId: ThemeStyleId;
  currentRatio: VideoRatio;
  animationState: AnimationState;
  customTexts: {
    title: string;
    keyword: string;
    descFirst: string;
    descSecond: string;
    metaText: string;
  };
  onSelectStyle: (id: ThemeStyleId) => void;
  onSelectRatio: (ratio: VideoRatio) => void;
  onUpdateTexts: (texts: {
    title: string;
    keyword: string;
    descFirst: string;
    descSecond: string;
    metaText: string;
  }) => void;
  onUpdateSpeed: (speed: number) => void;
  onUpdateLoop: (loop: boolean) => void;
}

export default function StyleSidebar({
  styles,
  currentStyleId,
  currentRatio,
  animationState,
  customTexts,
  onSelectStyle,
  onSelectRatio,
  onUpdateTexts,
  onUpdateSpeed,
  onUpdateLoop,
}: StyleSidebarProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const currentStyle = styles.find((s) => s.id === currentStyleId) || styles[0];

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentStyle.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleTextChange = (key: keyof typeof customTexts, value: string) => {
    onUpdateTexts({
      ...customTexts,
      [key]: value,
    });
  };

  const loadPresetForStyle = (styleId: ThemeStyleId) => {
    const targetStyle = styles.find((s) => s.id === styleId);
    if (targetStyle) {
      onUpdateTexts({ ...targetStyle.demoText });
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1">
      {/* 1. Style theme cards selection */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>选择视频动画风格主题</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {styles.map((style) => {
            const isSelected = style.id === currentStyleId;
            return (
              <button
                key={style.id}
                onClick={() => {
                  onSelectStyle(style.id);
                  // Optionally load default text for this style to keep demo perfectly tailored
                  loadPresetForStyle(style.id);
                }}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-zinc-800/80 border-indigo-500 shadow-lg shadow-indigo-500/5 translate-x-1'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/40'
                }`}
              >
                {/* Active Indicator Pillar */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r" />
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-zinc-100">{style.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {style.badge}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mt-1.5 font-sans leading-relaxed">
                  {style.tagline}
                </p>

                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  {style.description}
                </p>

                {/* Mini Swatches representing the style */}
                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-zinc-800/40">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    配色方案 (Palette):
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Background */}
                    <div
                      className="w-4 h-4 rounded-full border border-zinc-700"
                      style={{ backgroundColor: style.bgColor }}
                      title="视频背景色"
                    />
                    {/* Primary Text */}
                    <div
                      className="w-4 h-4 rounded-full border border-zinc-700"
                      style={{ backgroundColor: style.textColor }}
                      title="主文字颜色"
                    />
                    {/* Primary Accent */}
                    <div
                      className="w-4 h-4 rounded-full border border-zinc-700"
                      style={{ backgroundColor: style.primaryColor }}
                      title="特色色调颜色"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Audio/Format video settings */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs border-b border-zinc-800 pb-2">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>格式与演示参数</span>
        </div>

        {/* Video Canvas Switcher */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-zinc-400 font-medium">视频画幅尺寸 (Aspect Ratio)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectRatio('16_9')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs rounded transition-all cursor-pointer ${
                currentRatio === '16_9'
                  ? 'bg-indigo-600 font-semibold text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-850'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>16:9 横屏 (中长视频)</span>
            </button>
            <button
              onClick={() => onSelectRatio('9_16')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs rounded transition-all cursor-pointer ${
                currentRatio === '9_16'
                  ? 'bg-indigo-600 font-semibold text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-850'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 竖屏 (短视频/抖音)</span>
            </button>
          </div>
        </div>

        {/* Playback speed ticker */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-zinc-400 font-medium">模拟演示语速 & 周期</label>
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-zinc-800 p-0.5 rounded text-xs gap-1">
              {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onUpdateSpeed(spd)}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    animationState.speed === spd
                      ? 'bg-zinc-700 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={animationState.loop}
                onChange={(e) => onUpdateLoop(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-zinc-800 border-zinc-700 focus:ring-indigo-500"
              />
              <span>循环播放</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Text customizer script */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-4">
        <div className="flex items-center justify-between text-zinc-200 font-semibold text-xs border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>实时视频内容脚本编辑</span>
          </div>
          <button
            onClick={() => loadPresetForStyle(currentStyleId)}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-indigo-400 transition cursor-pointer"
            title="恢复模板默认示范脚本"
          >
            <RefreshCw className="w-3 h-3" />
            <span>恢复默认</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 text-left">
          {/* Main Title Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">
              Main Title / 主大标题 [文字要大]
            </label>
            <input
              type="text"
              value={customTexts.title}
              onChange={(e) => handleTextChange('title', e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              placeholder="请输入主标题..."
              maxLength={24}
            />
          </div>

          {/* Highlight word Badge */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">
              Keyword Highlight / 核心高亮词
            </label>
            <input
              type="text"
              value={customTexts.keyword}
              onChange={(e) => handleTextChange('keyword', e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              placeholder="请输入关键聚焦高亮词..."
              maxLength={20}
            />
          </div>

          {/* Line 1 */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">
              Status Tag / 辅助短句标签
            </label>
            <input
              type="text"
              value={customTexts.descFirst}
              onChange={(e) => handleTextChange('descFirst', e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              placeholder="说明、标签、或前置分类..."
              maxLength={40}
            />
          </div>

          {/* Line 2 */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">
              Explanation Sentence / 展开讲解正文 (支持逐字/逐词播放)
            </label>
            <textarea
              value={customTexts.descSecond}
              onChange={(e) => handleTextChange('descSecond', e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs h-16 resize-none focus:outline-none focus:border-indigo-500 transition"
              placeholder="输入长串的解释话语..."
              maxLength={120}
            />
          </div>

          {/* Metadata corner line */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">
              Metadata Tracker / 画面角标参数
            </label>
            <input
              type="text"
              value={customTexts.metaText}
              onChange={(e) => handleTextChange('metaText', e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 text-xs focus:outline-none focus:border-indigo-500 transition"
              placeholder="如 SYSTEM ID, ACC, 版权信息等..."
              maxLength={40}
            />
          </div>
        </div>
      </div>

      {/* 4. Prompts Generation Block */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>动画生成提示词 (仅限定风格)</span>
          </div>

          <button
            onClick={handleCopyPrompt}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition cursor-pointer ${
              copied
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制风格' : '复制提示词'}</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 text-left leading-relaxed">
          提示词旨在对字体大小、布局对齐、背景纯净、和缓时间曲线等样式属性做出硬性规范，不掺杂任何特定内容。<b>可以直接复制下列提示词应用或者发送给AI生成同种模板。</b>
        </p>

        <div className="relative">
          {/* Blurred overlay hint */}
          <div className="w-full bg-zinc-950 max-h-[160px] overflow-y-auto rounded-lg p-3 text-left border border-zinc-800 font-mono text-[10px] text-zinc-400 leading-normal scrollbar">
            <pre className="whitespace-pre-wrap select-all">{currentStyle.prompt}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
