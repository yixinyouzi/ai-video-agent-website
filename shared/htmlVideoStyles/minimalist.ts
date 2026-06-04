import { HtmlVideoStyle } from './types';

export const minimalistStyle: HtmlVideoStyle = {
  id: 'minimalist',
  name: '极简现代主义',
  badge: '知识社科 / 纪录片旁白',
  tagline: '大空留白 · 典雅排版 · 高级灰调',
  description: '温暖灰白纸张色调、深炭灰文字和单一钴蓝强调色，呈现稳定克制的编辑设计。',
  colors: ['#f4f4f5', '#18181b', '#2563eb'],
  prompt: `视觉风格采用“极简现代主义编辑设计”。使用温暖亚麻白或建筑混凝土灰背景（#fafaf9 / #f4f4f5），深炭灰（#18181b）作为主要文字色，仅使用一种钴蓝（#2563eb）或陶土红作为强调色。严格保持 16:9 视频安全网格与约 12% 留白，主体优雅地偏左布局，使用细而低透明度的分割线和少量序号。标题采用超大、紧凑、粗重的几何无衬线或现代衬线字体。元素以 1.2 秒左右的稳定上移淡入、线条展开和墨迹扩张感登场，缓动使用 cubic-bezier(0.25,1,0.5,1)。禁止抖动、闪烁、激进缩放和网页组件感，不要使用外部资源。`,
  demoHtml: `<!doctype html><html><head><style>
*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#f4f4f5;color:#18181b;font-family:Arial,sans-serif}
.wrap{position:absolute;inset:12%;display:flex;flex-direction:column;justify-content:space-between}.top,.bottom{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.18em;color:#71717a}.rule{height:1px;background:#18181b33;transform-origin:left;animation:rule 2.6s ease-in-out infinite}
.content{width:78%;animation:rise 2.6s cubic-bezier(.25,1,.5,1) infinite}.num{font-size:16px;color:#2563eb;font-weight:800}.title{font-size:clamp(28px,7vw,82px);font-weight:900;line-height:.98;letter-spacing:-.07em;margin:12px 0}.accent{width:52px;height:4px;background:#2563eb}.sub{margin-top:18px;color:#52525b;font-size:clamp(11px,1.7vw,20px);line-height:1.5}
@keyframes rise{0%{opacity:0;transform:translateY(55px)}25%,80%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-12px)}}@keyframes rule{0%{transform:scaleX(0)}30%,85%{transform:scaleX(1)}100%{transform:scaleX(0);transform-origin:right}}
</style></head><body><main class="wrap"><div><div class="top"><span>EDITORIAL MOTION</span><span>01 / 03</span></div><div class="rule"></div></div><section class="content"><div class="num">01.</div><div class="title">IDEAS<br>IN MOTION</div><div class="accent"></div><div class="sub">Clarity, rhythm and generous negative space.</div></section><div><div class="rule"></div><div class="bottom"><span>DOCUMENT COLLECTION</span><span>VISIONCRAFT</span></div></div></main></body></html>`,
};
