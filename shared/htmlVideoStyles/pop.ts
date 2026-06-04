import { HtmlVideoStyle } from './types';

export const popStyle: HtmlVideoStyle = {
  id: 'pop',
  name: '爆款高亮波普',
  badge: '短视频剪辑 / 快节奏科普',
  tagline: '极度吸睛 · 弹簧振幅 · 高亮卡词',
  description: '深色背景承托高饱和黄绿强调块，结合超粗标题和快节奏弹性动效。',
  colors: ['#0f172a', '#facc15', '#22c55e'],
  prompt: `视觉风格采用“爆款高亮波普与动感排版”。使用深石墨蓝背景（#0f172a / #1e293b），白色粗体文字搭配安全黄（#facc15）和亮青绿（#22c55e）高亮。主体紧密居中并保持 10% 外部安全区，使用超粗、超大、字距紧凑的块状无衬线标题；关键短语放入略微倾斜的高可见色块。词组以 0.3 到 0.4 秒的快速分段弹入、缩放回弹和淡入登场，缓动使用 cubic-bezier(0.175,0.885,0.32,1.275)。节奏高但画面必须清晰，每一时刻只突出少量重点，不要使用外部资源。`,
  demoHtml: `<!doctype html><html><head><style>
*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#0f172a;color:#fff;font-family:Arial Black,Arial,sans-serif}.dots{position:absolute;inset:0;background-image:radial-gradient(#ffffff22 1px,transparent 1px);background-size:22px 22px;animation:move 4s linear infinite}
.wrap{position:absolute;inset:10%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.small{font:700 11px Arial,sans-serif;letter-spacing:.18em;color:#22c55e}.title{font-size:clamp(32px,9vw,100px);line-height:.88;letter-spacing:-.08em;margin:16px 0;animation:pop 1.8s cubic-bezier(.175,.885,.32,1.275) infinite}.badge{padding:7px 15px;background:#facc15;color:#0f172a;transform:rotate(-2deg);font-size:clamp(13px,2.5vw,28px);animation:bounce 1.8s .15s cubic-bezier(.175,.885,.32,1.275) infinite}
@keyframes move{to{background-position:22px 22px}}@keyframes pop{0%{opacity:0;transform:scale(.65)}25%,78%{opacity:1;transform:scale(1)}88%{transform:scale(1.04)}100%{opacity:0;transform:scale(.9)}}@keyframes bounce{0%{opacity:0;transform:rotate(-2deg) scale(.5)}30%,80%{opacity:1;transform:rotate(-2deg) scale(1)}100%{opacity:0;transform:rotate(2deg) scale(.8)}}
</style></head><body><div class="dots"></div><main class="wrap"><div class="small">TRENDING // MOTION STORY</div><div class="title">MAKE IT<br>POP!</div><div class="badge">HIGH IMPACT VISUALS</div></main></body></html>`,
};
