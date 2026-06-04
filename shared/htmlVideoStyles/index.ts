import { cyberpunkStyle } from './cyberpunk';
import { minimalistStyle } from './minimalist';
import { popStyle } from './pop';
import { HtmlVideoStyle, HtmlVideoStyleId } from './types';

export type { HtmlVideoStyle, HtmlVideoStyleId } from './types';

export const HTML_VIDEO_STYLES: HtmlVideoStyle[] = [cyberpunkStyle, minimalistStyle, popStyle];
export const DEFAULT_HTML_VIDEO_STYLE_ID: HtmlVideoStyleId = HTML_VIDEO_STYLES[0].id;

export function getHtmlVideoStyle(styleId?: string | null): HtmlVideoStyle {
  return HTML_VIDEO_STYLES.find((style) => style.id === styleId) ?? HTML_VIDEO_STYLES[0];
}

export function isHtmlVideoStyleId(value: unknown): value is HtmlVideoStyleId {
  return typeof value === 'string' && HTML_VIDEO_STYLES.some((style) => style.id === value);
}
