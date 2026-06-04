import { useState } from 'react';
import { THEME_STYLES } from './data';
import { ThemeStyleId, VideoRatio, AnimationState } from './types';
import VideoViewport from './components/VideoViewport';
import StyleSidebar from './components/StyleSidebar';
import { Sparkles, Monitor, Info, Film, Layers } from 'lucide-react';

export default function App() {
  const [currentStyleId, setCurrentStyleId] = useState<ThemeStyleId>('cyberpunk');
  const [currentRatio, setCurrentRatio] = useState<VideoRatio>('16_9');
  
  // Set initial texts based on the default 'cyberpunk' theme
  const initialTexts = THEME_STYLES.find((s) => s.id === 'cyberpunk')?.demoText || {
    title: '',
    keyword: '',
    descFirst: '',
    descSecond: '',
    metaText: ''
  };
  const [customTexts, setCustomTexts] = useState(initialTexts);

  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: true,
    progress: 0,
    speed: 1.0,
    loop: true,
    key: 0,
  });

  const handleSelectStyle = (id: ThemeStyleId) => {
    setCurrentStyleId(id);
    const selectedStyle = THEME_STYLES.find((s) => s.id === id);
    if (selectedStyle) {
      setCustomTexts(selectedStyle.demoText);
    }
    // Auto trigger reset and play on selection
    setAnimationState((prev) => ({
      ...prev,
      isPlaying: true,
      key: prev.key + 1,
    }));
  };

  const handleTogglePlay = () => {
    setAnimationState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const handleResetAnimation = () => {
    setAnimationState((prev) => ({
      ...prev,
      key: prev.key + 1,
      isPlaying: true,
    }));
  };

  const handleUpdateTexts = (texts: typeof customTexts) => {
    setCustomTexts(texts);
    // Restart animation briefly so editing feels incredibly responsive and visual
    setAnimationState((prev) => ({
      ...prev,
      key: prev.key + 1,
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-200 antialiased selection:bg-indigo-500 selection:text-white pb-12">
      {/* Upper Navigation Header */}
      <header className="border-b border-zinc-850 bg-zinc-950/80 px-6 py-4 sticky top-0 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Film className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 id="app_title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                HTML动画视频风格展示器
                <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/80 px-2 py-0.5 rounded-full font-semibold">
                  PRO SETUPS
                </span>
              </h1>
              <p className="text-xs text-zinc-400 font-medium">适合知识讲解与科技博主的视频级HTML排版及样式提炼</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>实时渲染就绪 (HTML Direct Canvas)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* Architectural guidelines context */}
        <div className="mb-6 p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-zinc-300 text-xs leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <span>
              <b>设计理念：</b>视频动画应该追求<b>极高大字易读性</b>和<b>极简对称美</b>，排除多余的侧边栏或网页式组件。本工具针对这一特性深度定制，提供的
              HTML 代码仅对布局、尺寸安全线和文字大小等物理要素提供样式规范。
            </span>
          </div>
          <a
            href="#guidelines_helper"
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 whitespace-nowrap self-end sm:self-auto cursor-pointer"
          >
            什么是“视频级”？
          </a>
        </div>

        {/* Dynamic Studio Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Canvas Panel (7 cols in desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            {/* Embedded Active Title Card */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                  ACTIVE STUDIO CANVAS
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  当前效果：{THEME_STYLES.find((s) => s.id === currentStyleId)?.name}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-805 text-xs text-zinc-400 select-none font-mono">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span>FPS: 60 (VSYNC)</span>
              </div>
            </div>

            {/* Video Canvas Component */}
            <VideoViewport
              styleId={currentStyleId}
              ratio={currentRatio}
              customTexts={customTexts}
              animationState={animationState}
              onTogglePlay={handleTogglePlay}
              onResetAnimation={handleResetAnimation}
            />

            {/* Feature Description Card (Lower Info Box) */}
            <div id="guidelines_helper" className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col gap-4 text-left">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-indigo-400" />
                为何禁止使用网页和 PPT 的常规设计思路？
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-400 leading-relaxed">
                <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl flex flex-col gap-2">
                  <h4 className="font-semibold text-zinc-305 text-indigo-400">网页设计 vs 视频渲染</h4>
                  <p>
                    普通网页要容纳侧栏、表单、提示弹窗，且文字极多。但<b>视频一转即逝</b>，观众注意力至多留存数秒。为此，画面务必做到纯净（0无关细微文本），核心短语需极巨，对比度饱满。
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl flex flex-col gap-2">
                  <h4 className="font-semibold text-zinc-305 text-amber-400">PPT 演示 vs 视频镜头</h4>
                  <p>
                    PPT 习惯罗列密密麻麻的小段落以及过时的翻页线。而优秀的视频包装应当具有 <b>“电影镜头感”</b>。通过顺置安全指导线、弹性动画回弹、代码流式点缀等微弱呼吸感的动画，保持画面的运动生命力。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls Panel (5 cols in desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 h-full">
            <div className="bg-zinc-950 lg:sticky lg:top-24 border-zinc-850">
              <StyleSidebar
                styles={THEME_STYLES}
                currentStyleId={currentStyleId}
                currentRatio={currentRatio}
                animationState={animationState}
                customTexts={customTexts}
                onSelectStyle={handleSelectStyle}
                onSelectRatio={setCurrentRatio}
                onUpdateTexts={handleUpdateTexts}
                onUpdateSpeed={(speed) => setAnimationState((prev) => ({ ...prev, speed }))}
                onUpdateLoop={(loop) => setAnimationState((prev) => ({ ...prev, loop }))}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

