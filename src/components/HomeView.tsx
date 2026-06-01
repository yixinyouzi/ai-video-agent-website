import React, { useEffect, useState } from 'react';
import { Sparkles, Image, Code, Play, ArrowRight, Video, Cpu, RefreshCw, History } from 'lucide-react';
import { formatProjectCreatedAt, getDefaultPrompt } from '../lib/projectContent';
import { fetchProjects } from '../lib/projectApi';
import { ApiProjectRecord, ProjectMode } from '../types';

interface HomeViewProps {
  onStartCreation: (mode: ProjectMode, prompt: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
}

export default function HomeView({ onStartCreation, onOpenProject }: HomeViewProps) {
  const [selectedMode, setSelectedMode] = useState<ProjectMode>('slideshow');
  const [prompt, setPrompt] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ApiProjectRecord[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadProjectHistory() {
      try {
        setIsLoadingProjects(true);
        setProjectLoadError(null);
        const records = await fetchProjects();

        if (isCurrent) {
          setProjects(records);
        }
      } catch (error) {
        if (isCurrent) {
          setProjectLoadError(error instanceof Error ? error.message : '加载项目历史失败');
          setProjects([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingProjects(false);
        }
      }
    }

    void loadProjectHistory();

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrompt = prompt.trim() || getDefaultPrompt(selectedMode);

    setCreateError(null);
    setIsCreatingProject(true);

    try {
      await onStartCreation(selectedMode, finalPrompt);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '项目创建失败，请稍后重试。');
      setIsCreatingProject(false);
    }
  };

  const PROMPT_SUGGESTIONS = {
    slideshow: [
      '未来新农业垂直农场，暖紫色LED补光，全自动手臂灵巧采摘，晶莹水珠',
      '火星殖民地温室大棚，猩红地表外景，科研人员在进行样本比对，落日余晖',
      '深海科研潜艇，探照灯打在发光水母群上，蔚蓝深邃色调，气泡升腾'
    ],
    html: [
      '用克莱因蓝和亮橙色的脉冲粒子、旋转的正多面体展示数字网络节点的生命力',
      '纯白背景上，黑色圆点以斐波那契螺旋排列，做有节奏的聚拢和扩散呼吸律动',
      '亮蓝色和紫色的网格线条横纵交织，做经典的三维推近和无限拉伸动态效果'
    ]
  };

  return (
    <div id="home-view-container" className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#020617] text-[#dae2fd]">
      {isCreatingProject && (
        <div className="absolute inset-0 z-30 bg-[#020617]/92 backdrop-blur-md flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-[#ddb7ff]/20 bg-[#131b2e]/95 p-6 text-center shadow-[0_0_30px_rgba(221,183,255,0.12)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#ddb7ff]/20 bg-[#ddb7ff]/10">
              <RefreshCw className="h-7 w-7 animate-spin text-[#ddb7ff]" />
            </div>
            <h2 className="text-lg font-bold text-white">正在创建项目</h2>
            <p className="mt-2 text-sm text-[#cfc2d6]">
              已写入项目基础信息，正在等待数据库返回结果。创建成功后会自动进入创作页面。
            </p>
          </div>
        </div>
      )}

      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* Top Brand Bar */}
      <header id="home-header" className="px-8 py-6 flex justify-between items-center border-b border-[#1e293b]/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ddb7ff] to-[#adc6ff] flex items-center justify-center shadow-[0_0_20px_rgba(221,183,255,0.3)]">
            <Video className="w-5 h-5 text-[#2c0051]" />
          </div>
          <div>
            <span className="font-display-lg text-xl font-bold tracking-tight bg-gradient-to-r from-[#ddb7ff] to-[#adc6ff] bg-clip-text text-transparent">
              VisionCraft AI
            </span>
            <span className="ml-2.5 px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest text-[#ddb7ff] bg-[#ddb7ff]/10 rounded-full border border-[#ddb7ff]/20">
              v2.0 PRO
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[#cfc2d6]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#4cd7f6] rounded-full animate-ping"></span>
            AI ENGINE ONLINE
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col justify-center items-center gap-10 z-10">
        <div className="text-center max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171f33]/80 border border-[#ddb7ff]/20 text-xs text-[#ddb7ff]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>智能多模态 AI 视频生产工作流</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display-lg font-extrabold tracking-tight text-white leading-tight">
            智能视频创作引擎<br />
            <span className="bg-gradient-to-r from-[#ddb7ff] via-[#b76dff] to-[#4cd7f6] bg-clip-text text-transparent">
              让灵感即刻成片
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[#cfc2d6] font-light max-w-lg mx-auto">
            支持 AI 精美画幅轮播运镜与矢量前端网页动画两种前沿生产模式，一键生成脚本、分镜、配音、配乐并极速录屏输出。
          </p>
        </div>

        {/* Custom Mode Select Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Mode 1: Image Slideshow */}
          <div 
            onClick={() => setSelectedMode('slideshow')}
            className={`cursor-pointer group relative p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between ${
              selectedMode === 'slideshow' 
                ? 'bg-[#171f33]/90 border-2 border-[#ddb7ff] shadow-[0_0_25px_rgba(221,183,255,0.15)] translate-y-[-4px]' 
                : 'bg-[#131b2e]/60 border border-[#1e293b] hover:border-[#ddb7ff]/40 hover:bg-[#131b2e]/90 hover:translate-y-[-2px]'
            }`}
          >
            {/* Visual preview dots/patterns */}
            <div className="absolute top-4 right-4 flex gap-1">
              <span className={`w-2 h-2 rounded-full ${selectedMode === 'slideshow' ? 'bg-[#ddb7ff] animate-pulse' : 'bg-gray-600'}`}></span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg transition-colors ${
                  selectedMode === 'slideshow' ? 'bg-[#ddb7ff]/20 text-[#ddb7ff]' : 'bg-[#1e293b] text-gray-400'
                }`}>
                  <Image className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    图片轮播模式
                  </h3>
                  <p className="text-xs text-[#ddb7ff]/70 font-mono">IMAGE SLIDESHOW MODE</p>
                </div>
              </div>

              <p className="text-xs text-[#cfc2d6] leading-relaxed">
                利用最先进的文生图 AI 模型生成精美的超清电影级分镜，赋予镜头数字深度变焦（Ken Burns）及电影级雾化过渡。搭配高质旁白语音与沉浸配乐，打造完美的叙事视觉体验。
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {['电影级画质', 'Ken Burns 运镜', '高采样语音'].map((b, i) => (
                  <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#ddb7ff]/10 text-[#ddb7ff] border border-[#ddb7ff]/10 font-medium">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Selection indicator */}
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-[#1e293b]/40">
              <span className="text-xs text-[#cfc2d6]">适合：短视频、纪录片、产品广告</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                selectedMode === 'slideshow' ? 'bg-[#ddb7ff] text-[#2c0051]' : 'bg-transparent border border-[#1e293b]'
              }`}>
                {selectedMode === 'slideshow' && <Play className="w-3.5 h-3.5 fill-current" />}
              </div>
            </div>
          </div>

          {/* Mode 2: HTML Animation */}
          <div 
            onClick={() => setSelectedMode('html')}
            className={`cursor-pointer group relative p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between ${
              selectedMode === 'html' 
                ? 'bg-[#171f33]/90 border-2 border-[#ddb7ff] shadow-[0_0_25px_rgba(221,183,255,0.15)] translate-y-[-4px]' 
                : 'bg-[#131b2e]/60 border border-[#1e293b] hover:border-[#ddb7ff]/40 hover:bg-[#131b2e]/90 hover:translate-y-[-2px]'
            }`}
          >
            <div className="absolute top-4 right-4 flex gap-1">
              <span className={`w-2 h-2 rounded-full ${selectedMode === 'html' ? 'bg-[#4cd7f6] animate-pulse' : 'bg-gray-600'}`}></span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg transition-colors ${
                  selectedMode === 'html' ? 'bg-[#4cd7f6]/20 text-[#4cd7f6]' : 'bg-[#1e293b] text-gray-400'
                }`}>
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    HTML 视频模式
                  </h3>
                  <p className="text-xs text-[#4cd7f6]/70 font-mono">HTML ANIMATION MODE</p>
                </div>
              </div>

              <p className="text-xs text-[#cfc2d6] leading-relaxed">
                利用生成式 AI 技术开发高帧率的前端网页动画（CSS 规则、SVG 结构及 Canvas 画布）。视频动画支持原生无损放大与高频流畅渲染，创造极度解压、顺滑的前置数学几何表达。
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {['矢量无损级', '60FPS 极速渲染', 'CSS/Canvas 驱动'].map((b, i) => (
                  <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/10 font-medium">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Selection indicator */}
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-[#1e293b]/40">
              <span className="text-xs text-[#cfc2d6]">适合：科技动态、平面动效、抽象艺术</span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                selectedMode === 'html' ? 'bg-[#4cd7f6] text-[#001f26]' : 'bg-transparent border border-[#1e293b]'
              }`}>
                {selectedMode === 'html' && <Play className="w-3.5 h-3.5 fill-current" />}
              </div>
            </div>
          </div>
        </div>

        <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Prompt Input Form */}
        <form onSubmit={handleStart} className="w-full bg-[#131b2e] border border-[#1e293b] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-[#ddb7ff] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              创意描述词 (Prompt)
            </span>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectedMode === 'slideshow' 
                  ? '例如：赛博朋克风格的孤独漫游者步入雨夜中的地下酒馆，霓虹闪烁，水坑倒影...' 
                  : '例如：用克莱因蓝和亮橙色的脉冲粒子、旋转的正多面体展示数字网络节点的生命力...'}
                disabled={isCreatingProject}
                className="w-full bg-[#0b1326] border border-[#1e293b]/80 rounded-xl px-4 py-3.5 pr-24 text-sm text-[#dae2fd] placeholder-gray-500 focus:outline-none focus:border-[#ddb7ff] focus:ring-1 focus:ring-[#ddb7ff]/20 min-h-[96px] transition-all custom-scrollbar resize-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button 
                type="submit" 
                disabled={isCreatingProject}
                className="absolute right-3.5 bottom-3.5 px-5 py-2 rounded-lg bg-[#ddb7ff] text-[#2c0051] font-bold text-xs flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(221,183,255,0.4)] transition-all cursor-pointer hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200 disabled:shadow-none"
              >
                <span>{isCreatingProject ? '创建中...' : '立即创作'}</span>
                {isCreatingProject ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {createError && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {createError}
            </div>
          )}

          {/* Quick suggestions based on selected mode */}
          <div className="flex flex-col gap-2 pt-1 border-t border-[#1e293b]/40">
            <span className="text-[10px] uppercase tracking-wider font-mono text-[#cfc2d6]/60">推荐示例：</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PROMPT_SUGGESTIONS[selectedMode].map((suggestion, index) => (
                <div 
                  key={index} 
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-2 rounded-lg bg-[#0b1326] hover:bg-[#171f33] border border-[#1e293b]/40 hover:border-[#ddb7ff]/30 text-[11px] text-[#cfc2d6] cursor-pointer transition-all truncate"
                  title={suggestion}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        </form>

        <section className="flex min-h-[260px] flex-col rounded-2xl border border-[#1e293b] bg-[#131b2e] p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#ddb7ff]" />
              <span className="text-sm font-semibold text-white">历史记录</span>
            </div>
            {isLoadingProjects && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#ddb7ff]" />}
          </div>

          {projectLoadError ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {projectLoadError}
            </div>
          ) : projects.length > 0 ? (
            <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
              {projects.slice(0, 8).map((project) => (
                <button
                  key={project.uuid}
                  type="button"
                  onClick={() => onOpenProject(project.uuid)}
                  className="group w-full rounded-xl border border-[#1e293b]/70 bg-[#0b1326] p-3 text-left transition-all hover:border-[#ddb7ff]/40 hover:bg-[#171f33]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-200 group-hover:text-[#ddb7ff]">
                      {project.title}
                    </span>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-[#ddb7ff]" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${
                        project.type === 'slideshow'
                          ? 'border-[#ddb7ff]/10 bg-[#ddb7ff]/5 text-[#ddb7ff]/70'
                          : 'border-[#4cd7f6]/10 bg-[#4cd7f6]/5 text-[#4cd7f6]/70'
                      }`}
                    >
                      {project.type === 'slideshow' ? <Video className="h-2.5 w-2.5" /> : <Code className="h-2.5 w-2.5" />}
                      {project.type === 'slideshow' ? '图片轮播' : 'Web 动画'}
                    </span>
                    <span className="shrink-0 text-[10px] text-[#cfc2d6]/55">{formatProjectCreatedAt(project.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#1e293b]/80 bg-[#0b1326]/60 px-4 text-center text-xs leading-relaxed text-[#cfc2d6]/65">
              还没有历史记录，创建第一个对话后会出现在这里。
            </div>
          )}
        </section>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-6 text-center text-xs font-mono text-gray-500 tracking-wider z-10 border-t border-[#1e293b]/20">
        © 2026 VisionCraft AI Inc. Front-End Cinematic Render Engine.
      </footer>
    </div>
  );
}
