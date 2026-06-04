import { HtmlVideoStyle } from './types';

export const cyberpunkStyle: HtmlVideoStyle = {
  id: 'cyberpunk',
  name: '赛博朋克',
  badge: '科技博主 / 前沿资讯',
  tagline: '霓虹炫目 · 代码流动 · 高频科技感',
  description: '深邃墨黑背景、电子青与霓虹紫双主色，结合扫描线、数据坐标和锐利科技边框。',
  colors: ['#09090b', '#06b6d4', '#a855f7'],
  prompt: `视觉风格采用“科技赛博朋克与霓虹网格”。使用深空黑背景（#09090b / #030712），电子青（#06b6d4）作为主强调色，霓虹紫（#a855f7）作为结构辅助色。画面保持 16:9 视频安全区，主体位于内侧 85%，加入细线科技边框、扫描线、缓慢漂移的网格、微弱粒子与角落数据标签。标题使用粗体等宽或宽体无衬线字体，字号醒目，允许少量括号式科技标签。主要元素以 0.6 秒内的故障淡入、逐行显现或锐利滑入登场，缓动使用 cubic-bezier(0.19,1,0.22,1)。动画需精密、克制，不要堆满小字，不要使用外部资源。`,
  demoHtml: `<!doctype html><html><head><style>
*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#09090b;color:#fff;font-family:Consolas,monospace}
.grid{position:absolute;inset:0;background-image:linear-gradient(#06b6d416 1px,transparent 1px),linear-gradient(90deg,#06b6d416 1px,transparent 1px);background-size:34px 34px;animation:drift 5s linear infinite}
.scan{position:absolute;inset:-20% 0;background:linear-gradient(transparent,#06b6d422,transparent);height:35%;animation:scan 3s linear infinite}
.frame{position:absolute;inset:10%;border:1px solid #06b6d477;padding:7%;box-shadow:0 0 35px #06b6d422}
.meta{font-size:10px;letter-spacing:.18em;color:#06b6d4}.title{margin-top:12%;font-size:clamp(28px,7vw,80px);font-weight:900;line-height:.95;text-shadow:0 0 24px #06b6d488;animation:glitch 2.4s infinite}
.tag{display:inline-block;margin-top:6%;padding:5px 10px;background:#a855f7;color:#fff;font-size:11px}.line{margin-top:5%;width:62%;height:2px;background:#06b6d4;box-shadow:0 0 12px #06b6d4;animation:grow 2s ease infinite}
@keyframes drift{to{background-position:34px 34px}}@keyframes scan{to{transform:translateY(420%)}}@keyframes grow{50%{width:90%}}@keyframes glitch{48%,52%{transform:translate(0)}49%{transform:translate(3px,-1px)}51%{transform:translate(-2px,1px)}}
</style></head><body><div class="grid"></div><div class="scan"></div><main class="frame"><div class="meta">SYSTEM: ACTIVE // HTML MOTION CORE</div><div class="title">QUANTUM<br>INTERFACE</div><div class="tag">[ NEON GRID ONLINE ]</div><div class="line"></div></main></body></html>`,
};
