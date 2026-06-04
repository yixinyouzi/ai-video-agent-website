import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeStyleId, VideoRatio, AnimationState } from '../types';
import { Play, Pause, RotateCcw, Shield, HelpCircle, AlertCircle, Eye } from 'lucide-react';

interface VideoViewportProps {
  styleId: ThemeStyleId;
  ratio: VideoRatio;
  customTexts: {
    title: string;
    keyword: string;
    descFirst: string;
    descSecond: string;
    metaText: string;
  };
  animationState: AnimationState;
  onTogglePlay: () => void;
  onResetAnimation: () => void;
}

export default function VideoViewport({
  styleId,
  ratio,
  customTexts,
  animationState,
  onTogglePlay,
  onResetAnimation,
}: VideoViewportProps) {
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [showCenterLines, setShowCenterLines] = useState<boolean>(false);
  const [ticker, setTicker] = useState<number>(0);

  // Restart keyframes when reset or text changes
  useEffect(() => {
    setTicker((prev) => prev + 1);
  }, [styleId, customTexts, animationState.key]);

  // Handle auto progress bar when playing
  const [simulatedProgress, setSimulatedProgress] = useState<number>(0);
  useEffect(() => {
    let intervalId: any;
    if (animationState.isPlaying) {
      intervalId = setInterval(() => {
        setSimulatedProgress((prev) => {
          if (prev >= 100) {
            if (animationState.loop) {
              onResetAnimation();
              return 0;
            } else {
              onTogglePlay();
              return 100;
            }
          }
          return prev + (1.5 * animationState.speed);
        });
      }, 50);
    }
    return () => clearInterval(intervalId);
  }, [animationState.isPlaying, animationState.loop, animationState.speed]);

  useEffect(() => {
    setSimulatedProgress(0);
  }, [ticker]);

  // Split description text to show kinetic pops in Pop style
  const popWords = customTexts.descSecond.split(/[，。\s+]/).filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Viewport Header containing video scale details */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 border-b border-zinc-800 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-xs tracking-wider">VIDEO FEED: ONLINE</span>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded uppercase">
            {ratio === '16_9' ? '16:9 Widescreen (1080p)' : '9:16 Portrait (Shorts)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition ${
              showGuidelines ? 'bg-indigo-950 text-indigo-400 border border-indigo-700/50' : 'bg-transparent hover:bg-zinc-800 text-zinc-500'
            }`}
            title="显示视频安全线以保障主要文字内容不被视频软件界面遮挡"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">安全指导线</span>
          </button>
          
          <button
            onClick={() => setShowCenterLines(!showCenterLines)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition ${
              showCenterLines ? 'bg-sky-950 text-sky-400 border border-sky-700/50' : 'bg-transparent hover:bg-zinc-800 text-zinc-500'
            }`}
            title="视频网格对齐辅助"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">中心准星</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Screen Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-zinc-950/80 relative overflow-hidden min-h-[360px] sm:min-h-[460px]">
        {/* Aspect Ratio Container */}
        <div
          className={`relative transition-all duration-300 shadow-2xl rounded-lg overflow-hidden border ${
            styleId === 'cyberpunk' ? 'border-[#06b6d4]/20' : 'border-zinc-800'
          } ${
            ratio === '16_9' ? 'w-full max-w-4xl aspect-[16/9]' : 'h-full max-h-[500px] aspect-[9/16]'
          }`}
          style={{
            backgroundColor: styleId === 'cyberpunk' ? '#09090b' : styleId === 'minimalist' ? '#f4f4f5' : '#0f172a',
          }}
        >
          {/* Background Grid Elements for Cyberpunk */}
          {styleId === 'cyberpunk' && (
            <div className="absolute inset-0 cyber-grid-overlay scanline pointer-events-none" />
          )}

          {/* Guidelines Toggles */}
          {showGuidelines && (
            <div className="absolute inset-[8%] border border-dashed border-red-500/25 rounded z-40 pointer-events-none flex flex-col justify-between p-1.5 font-mono text-[9px] text-red-500/40">
              <div className="flex justify-between select-none">
                <span>[10% SAFE BOUNDS]</span>
                <span>TITLE BOUNDS</span>
              </div>
              <div className="flex justify-between select-none">
                <span>9:16 SAFETY GRID</span>
                <span>[1080p FULL RECT]</span>
              </div>
            </div>
          )}

          {showCenterLines && (
            <div className="absolute inset-0 z-40 pointer-events-none">
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 w-full h-[0.5px] border-t border-sky-500/30" />
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 h-full w-[0.5px] border-l border-sky-500/30" />
              {/* Target circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-sky-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500/40" />
              </div>
            </div>
          )}

          {/* -------------------- STYLE 1: CYBERPUNK -------------------- */}
          {styleId === 'cyberpunk' && (
            <AnimatePresence mode="wait">
              <motion.div
                key={ticker}
                className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 font-jetbrains-mono text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Top Corner Details */}
                <div className="flex justify-between items-start text-[10px] text-zinc-500 font-mono tracking-widest border-b border-zinc-800/60 pb-3">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {customTexts.metaText}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    LAT-41°N // LOG_STREAM
                  </motion.div>
                </div>

                {/* Primary Content Core */}
                <div className="my-auto flex flex-col gap-6 text-left relative">
                  {/* Floating Tech Corners around text */}
                  <div className="absolute -left-4 -top-3 w-3 h-3 border-t-2 border-l-2 border-[#06b6d4]" />
                  <div className="absolute -right-4 -bottom-3 w-3 h-3 border-b-2 border-r-2 border-[#a855f7]" />

                  <div className="flex flex-col gap-2">
                    <motion.div
                      className="inline-block max-w-fit px-2.5 py-0.5 text-xs font-bold text-black rounded bg-gradient-to-r from-[#06b6d4] to-[#a855f7]"
                      initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.9 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {customTexts.descFirst}
                    </motion.div>

                    <motion.h1
                      className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] filter contrast-125"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
                    >
                      {customTexts.title}
                    </motion.h1>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-[#a855f7] animate-pulse" />
                      <span className="text-xs text-[#06b6d4] uppercase font-bold tracking-wider">
                        核心参数 / CORE FOCUS:
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <motion.span
                        className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-teal-400 py-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                      >
                        {customTexts.keyword}
                      </motion.span>
                      <motion.div
                        className="px-2 py-0.5 text-[10px] bg-cyan-950/40 border border-[#06b6d4]/40 text-[#06b6d4] font-semibold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: 'spring' }}
                      >
                        EST. QUANTUM-99
                      </motion.div>
                    </div>

                    <motion.p
                      className="text-zinc-400 text-xs sm:text-sm max-w-xl leading-relaxed mt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      {customTexts.descSecond}
                    </motion.p>
                  </div>
                </div>

                {/* Bottom Status Details */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/40 pt-3 mt-auto">
                  <div className="flex items-center gap-4">
                    <span>GRID STATE: SECURE</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">BUFFER: 100%</span>
                  </div>
                  <div className="font-mono text-zinc-400">
                    S/N: 2026_HTML_VIDEO_CORE
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* -------------------- STYLE 2: MINIMALIST MODERN -------------------- */}
          {styleId === 'minimalist' && (
            <AnimatePresence mode="wait">
              <motion.div
                key={ticker}
                className="absolute inset-0 flex flex-col justify-between p-8 sm:p-14 font-serif-sc text-zinc-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Thin Elegant Top Border Line with numerical progress */}
                <div className="flex flex-col gap-2 w-full pt-1">
                  <div className="flex justify-between items-baseline text-xs text-zinc-500 font-sans tracking-widest font-semibold uppercase">
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {customTexts.metaText}
                    </motion.span>
                    <motion.span
                      className="text-zinc-400"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      DOCUMENT COLLECTION
                    </motion.span>
                  </div>
                  {/* Drawing thin line from left to right */}
                  <motion.div
                    className="w-full h-[1px] bg-zinc-300"
                    initial={{ scaleX: 0, transformOrigin: 'left' }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                {/* Main Centered Content */}
                <div className="my-auto flex flex-col text-left max-w-2xl gap-5 pt-4">
                  <div className="flex items-baseline gap-4">
                    {/* Animated huge serial number */}
                    <motion.div
                      className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-space-grotesk tracking-widest border-b-2 border-blue-600 pb-1"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                    >
                      01
                    </motion.div>
                    
                    <motion.span
                      className="text-[11px] font-sans font-bold text-zinc-500 tracking-wider flex items-center gap-2 uppercase"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {customTexts.descFirst}
                    </motion.span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <motion.h1
                      className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 leading-tight tracking-tight pt-1"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    >
                      {customTexts.title}
                    </motion.h1>

                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-12 h-[1px] bg-blue-600"
                        initial={{ scaleX: 0, transformOrigin: 'left' }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      />
                      <motion.span
                        className="text-base sm:text-lg text-blue-600 font-bold tracking-tight bg-blue-50 px-2 py-0.5 rounded"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        {customTexts.keyword}
                      </motion.span>
                    </div>
                  </div>

                  <motion.p
                    className="text-zinc-600 text-sm sm:text-base leading-relaxed border-l-2 border-zinc-300 pl-4 mt-2"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    {customTexts.descSecond}
                  </motion.p>
                </div>

                {/* Subdued Footer Information */}
                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-sans font-medium border-t border-zinc-200 pt-3">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    VOL II. SECTION VI
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    © KNOWLEDGE BROADCAST SYSTEM
                  </motion.span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* -------------------- STYLE 3: POP BOLD KINETIC -------------------- */}
          {styleId === 'pop' && (
            <AnimatePresence mode="wait">
              <motion.div
                key={ticker}
                className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 font-sans text-white text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Horizontal Top Status Line */}
                <div className="flex items-center justify-between text-[11px] font-space-grotesk tracking-widest text-amber-400 font-bold uppercase select-none">
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    ★ {customTexts.metaText}
                  </motion.span>
                  <motion.span
                    className="bg-red-600 text-white px-2 py-0.5 rounded font-black flex items-center gap-1 text-[9px]"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE STATS
                  </motion.span>
                </div>

                {/* Kinetic Content Core */}
                <div className="my-auto flex flex-col items-center justify-center gap-1">
                  {/* Floating Small Prompt Tagline */}
                  <motion.div
                    className="text-xs sm:text-sm font-semibold text-zinc-300 font-mono"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {customTexts.descFirst}
                  </motion.div>

                  {/* Gigantic Primary Heading */}
                  <div className="mt-2 text-center w-full max-w-lg">
                    <motion.h1
                      className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-montserrat-heavy uppercase select-none text-white drop-shadow-[0_4px_10px_rgba(250,204,21,0.15)] leading-tight"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                    >
                      {customTexts.title}
                    </motion.h1>
                  </div>

                  {/* Tilted Highlight Banner Badge for extreme social viewport impact */}
                  <motion.div
                    className="mt-4 rotate-[-1.5deg] shadow-lg inline-block self-center bg-amber-400 text-black px-4 py-2 font-black text-lg sm:text-2xl rounded-sm hover:scale-105 transition"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: [0, 1.15, 1], rotate: -1.5 }}
                    transition={{ type: 'spring', delay: 0.35, stiffness: 120 }}
                  >
                    🔥 {customTexts.keyword}
                  </motion.div>

                  {/* Rhythmic subtitle block supporting fast text popups */}
                  <div className="mt-6 px-4 max-w-xl">
                    <p className="text-zinc-200 font-semibold text-center text-sm sm:text-base leading-relaxed">
                      {/* Let's stagger words for pop kinetic readability */}
                      {popWords.map((word, index) => (
                        <motion.span
                          key={index}
                          className="inline-block mr-1.5 text-center mt-1"
                          initial={{ opacity: 0, scale: 0.7, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            damping: 10,
                            stiffness: 150,
                            delay: 0.5 + index * 0.12,
                          }}
                        >
                          {word === customTexts.keyword ? (
                            <span className="text-amber-300 underline underline-offset-4 decoration-2 font-bold select-all">
                              {word}
                            </span>
                          ) : (
                            word
                          )}
                        </motion.span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* Bottom Graphic Soundwave Equalizer to emulate spoken tracks */}
                <div className="flex flex-col items-center gap-1.5 mt-auto">
                  <div className="flex items-end gap-[3px] h-7 pointer-events-none select-none">
                    {[
                      6, 18, 12, 24, 15, 28, 8, 22, 14, 26, 9, 19, 11, 23, 7, 16, 21, 12, 27, 13,
                      19, 8, 24, 15, 5,
                    ].map((height, i) => (
                      <motion.div
                        key={i}
                        className={`w-[3px] rounded-t-sm ${
                          i % 2 === 0 ? 'bg-amber-400' : 'bg-green-500'
                        }`}
                        animate={{
                          height: animationState.isPlaying
                            ? [height * 0.4, height, height * 0.4]
                            : height * 0.4,
                        }}
                        transition={{
                          repeat: Infinity,
                          repeatType: 'reverse',
                          duration: 0.6 + (i % 3) * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] text-zinc-500 uppercase font-semibold">
                    Voiceover Waveform Sync Active
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Viewport Playback Controller Toolbelt */}
      <div className="px-5 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Playback Controls Group */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onTogglePlay}
            id="play_pause_button"
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition shadow cursor-pointer ${
              animationState.isPlaying
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {animationState.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{animationState.isPlaying ? '暂停演示' : '开始演示'}</span>
          </button>

          <button
            onClick={onResetAnimation}
            id="reset_button"
            className="flex items-center justify-center p-2 text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            title="重新播放动画"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Progress Timeline Bar */}
        <div className="hidden md:flex flex-1 items-center gap-3 px-4">
          <span className="font-mono text-[10px] text-zinc-500 select-none">
            {Math.floor(simulatedProgress / 10).toFixed(1)}s
          </span>
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-75 ${
                styleId === 'cyberpunk'
                  ? 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                  : styleId === 'minimalist'
                  ? 'bg-blue-600'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${simulatedProgress}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-zinc-500 select-none">10.0s</span>
        </div>

        {/* Tip Badge */}
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>支持实时更改右侧脚本文学词</span>
        </div>
      </div>
    </div>
  );
}
