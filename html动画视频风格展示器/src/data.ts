import { StyleDefinition } from './types';

export const THEME_STYLES: StyleDefinition[] = [
  {
    id: 'cyberpunk',
    name: '赛博极客风',
    badge: '科技博主 / 前沿资讯',
    tagline: '霓虹炫目·代码流动·高频科技感',
    description: '采用深渊重墨背景与电子荧光双色调，配以精密的代码坐标、跳动数据与科技边框。适合人工智能、硬核科普以及极客先锋的内容。文字通过像素跳变入场，充满未来科技力量感。',
    primaryColor: '#06b6d4', // Cyan
    bgColor: '#09090b',      // Zinc-950
    textColor: '#ffffff',
    accentColor: '#a855f7',   // Purple
    demoText: {
      title: '量子纠缠控制论',
      keyword: '超导比特芯片',
      descFirst: '[系统安全校验：通过]',
      descSecond: '单粒子相干时间创历史新高，错误率降至万分之三。',
      metaText: 'SYSTEM: ACTIVE | ACC: 99.87% | SCALE: Q-2026'
    },
    prompt: `Role: Professional Video Graphics Programmer & HTML Motion Director
Style ID: Tech Cyberpunk & Neon Grid (赛博极客风)

You are tasked with generating a high-impact dynamic HTML snippet to be rendered as video overlay. Follow these rigorous design specifications:

1. LAYOUT & RESPONSIVENESS:
   - Use a full viewport (100vh / 100vw) with absolute centering for primary visual containers.
   - Restrict all content to the inner 85% safety zone to prevent extreme television/mobile screen cropping (85vw max width, 85vh max height).
   - Utilize a clean two-column dashboard-like structure or single absolute focus.
   - Include floating tech metadata in corners (top-left for status trackers, bottom-right for system serials) rendered in ultra-tiny 12px font size.

2. COLOR SCHEME & THEME (Neon On Obsidian):
   - Background: Deep void space black (#09090b or #030712).
   - Primary accents: Electron Cyan (#06b6d4) with electric blur text-shadows, Neon Violet (#a855f7) for structural labels.
   - Text colors: High-praise White (#ffffff) for general titles, tech slate gray (#64748b) for background data.
   - Decorative borders: Slim 1px neon borders with subtle outer pulse shadows.

3. TYPOGRAPHY:
   - Headings (Title): Bold monospaced or modern wide display sans-serif. Recommended font-family: 'Fira Code', 'Monaco', 'JetBrains Mono', 'Segoe UI'. Font weight 700 to 800. Main title font-size must be massive, dynamic (8vw - 10vw on 16:9 widescreen) to ensure immediate readability in high-speed video feeds.
   - Subheadings: Monospaced code blocks. Font-size around 2vw to 2.5vw.
   - Accents: High-impact bold brackets like \`[ QUANTUM_CORE ]\` or \`// CONFIDENTIAL\`.

4. ANIMATION TIMINGS & BEHAVIOR:
   - Primary elements must emerge using glitch/fade-in or line-by-line typewriter effects.
   - Initial entry: 0s to 0.6s with swift cubic-bezier(0.19, 1, 0.22, 1) ease for sharp, robotic snappy action.
   - Background grid or scanning lines should have a perpetual loop animation of slow vertical drift (e.g., repeating liner infinite panning background image).
   - Maximum 1 highlight term wrapped in an inline neon green highlight badge with sharp 0px border-radius.`
  },
  {
    id: 'minimalist',
    name: '极简现代主义',
    badge: '知识社科 / 纪录片旁白',
    tagline: '大空留白·典雅排版·高级灰调',
    description: '采用高雅的温暖灰白纸张色调，配合极高对比度的深石炭灰。字体坚硬而洗练，配有黄金分割细线网格。适合历史演变、地缘政治、经济观察和艺术审美的科普剖析。动画运行缓慢流畅，展现沉稳的智性美。',
    primaryColor: '#18181b', // Zinc-900
    bgColor: '#f4f4f5',      // Zinc-100 (warm tone in real CSS)
    textColor: '#18181b',
    accentColor: '#2563eb',   // Cobalt Blue
    demoText: {
      title: '文明的非对称进化',
      keyword: '修昔底德陷阱',
      descFirst: '01 / 全球地缘结构重塑与博弈',
      descSecond: '当既有强国面对新兴大国的迅速崛起，冷战式博弈在逻辑上往往难以避免。',
      metaText: 'PARADIGM SHIFT // SER. 046'
    },
    prompt: `Role: Editorial Motion Designer & Kinetic Typographer
Style ID: Minimalist Modern (极简现代主义)

You are tasked with generating a crisp, high-aesthetic HTML animation to serve as documentary-style video content. Adhere strictly to the following parameters:

1. LAYOUT & RESPONSIVENESS:
   - Enforce an elegant cinematic 16:9 safe grid. Keep elements surrounded by generous, breathable negative space. High margin rules are mandatory (12% padding on all sides).
   - Use absolute grid layout with crisp lines dividing text columns. Lines must be thin, solid, with soft opacity (0.15 relative to text contrast).
   - Primary focus must be off-center or elegantly weighted towards the left to enable beautiful visual composition.

2. COLOR SCHEME & THEME (Editorial Slate):
   - Background: Warm linen cream (#fafaf9) or architectural concrete (#f4f4f5). Never use high-intensity pure white.
   - Primary: Deep charcoal slate (#18181b) for ultra-clear legibility.
   - Accent: A single solid high-contrast color (e.g. Cobalt Blue #2563eb or Terracotta #b91c1c), used exclusively for subtle highlights or progress-line states.

3. TYPOGRAPHY:
   - Title Headings: Clean geometric sans-serif (e.g. 'Inter', 'Outfit', 'DM Sans') or striking high-contrast modern serif for a literary vibe. Main title must be extremely large (6vw - 8vw), high weight (900/Black), with tightened tracking-tight (-0.05em) for polished editorial punch.
   - Supporting text/subtitles: Medium weight sans-serif (2vw), light letter-spacing (0.05em), line-height in 1.4-1.6 range for smooth reading.
   - Indicators: Crisp, tiny serial digits (e.g. '01.', '02.') positioned above titles as section labels.

4. ANIMATION TIMINGS & BEHAVIOR:
   - Transitions must simulate physical lens shifts or ink expansion.
   - Primary motion: Smooth vertical slide-up coupled with elegant gradual fade (TranslateY 100px -> 0px, opacity 0 -> 1).
   - Ease function: Standard cinematic ease: cubic-bezier(0.25, 1, 0.5, 1) over a 1.2s duration to convey weight, smoothness, and intellectual gravitas.
   - Zero jittering, zero flicker, zero aggressive scaling. All movements must feel luxurious and stable.`
  },
  {
    id: 'pop',
    name: '爆款高亮波普',
    badge: '短视频剪辑 / 快节奏科普',
    tagline: '极度吸睛·弹簧振幅·高亮卡词',
    description: '专为抖音、视频号、YouTube Shorts 等短视频平台算法打造。深色暗影背景承托超高饱和度柠檬黄，字幕逐字回弹显示，关键词外接倾斜的高亮警示盒。适合商业逻辑拆解、脱口秀科普和生活热点速评。',
    primaryColor: '#facc15', // Amber-400 (Yellow)
    bgColor: '#0f172a',      // Slate-900
    textColor: '#ffffff',
    accentColor: '#22c55e',   // Green-500
    demoText: {
      title: '你脑子里的多巴胺陷阱',
      keyword: '15秒短视频成瘾机制',
      descFirst: '# 深度解析 · 为什么你的自律会瞬间崩溃？',
      descSecond: '算法设计的目标不是满足你的需求，而是劫持你大脑中的奖赏通路。',
      metaText: 'TRENDING IN 24H • INSIGHT'
    },
    prompt: `Role: Hot Short-video Creator & Kinetic Typography Editor
Style ID: Pop Bold Kinetic (爆款高亮波普)

You are tasked with generating a fast-paced, high-attention HTML animation designed for short-form feed video content. Adhere strictly to these rule-based styling standards:

1. LAYOUT & RESPONSIVENESS:
   - Layout is strictly centered and optimized for quick scanning. Ideal for vertical formats (9:16) as well as horizontal wide templates.
   - Safe region: Enforce a rigid 10% outer safe block. Ensure no text enters the top and bottom quarters to leave room for app buttons, user profiles, or overlays.
   - Focus must be tightly centered, allowing the eye of the spectator to remain locked in the center.

2. COLOR SCHEME & THEME (High Contrast Pop):
   - Background: Deep slate graphite (#0f172a or #1e293b) to make bright neon colors punch out.
   - Text Colors: Stark white (#ffffff) paired with high-velocity highlight color hits like Safety Canary Yellow (#facc15) or Hot Lime (#22c55e).
   - Highlight: Important keywords must be physically enclosed in a high-visibility block (e.g., block background of solid yellow with contrast black text, rounded medium, tilted at 1-2 degrees).

3. TYPOGRAPHY:
   - Headings: Heavy, ultra-thick, block-styled sans-serif (e.g. 'Impact', 'Montserrat ExtraBold', 'Arial Black'). Font weight 900.
   - Font sizing: Extreme impact scale (8vw - 12vw depending on resolution) to dominate the feed.
   - Tracking: Ultra-tight tracking (-0.08em) with massive letters nearly touching, forcing maximum attention.

4. ANIMATION TIMINGS & BEHAVIOR:
   - Frame pacing: Extremely high tempo. Words or phrases must pop up in synchronicity with standard voiceovers.
   - Transition: Staggered bouncy scale-up (scale: 0.8 -> 1.15 -> 1.0) and rapid fade-in.
   - Velocity: cubic-bezier(0.175, 0.885, 0.32, 1.275) for a playful bouncy elastic feel.
   - Target animation duration: 0.3s to 0.4s per dynamic phrase step, ensuring quick, attention-grabbing visual updates.`
  }
];
