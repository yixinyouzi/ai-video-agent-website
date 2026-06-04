export type HtmlVideoStyleId = 'cyberpunk' | 'minimalist' | 'pop';

export interface HtmlVideoStyle {
  id: HtmlVideoStyleId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  colors: [string, string, string];
  prompt: string;
  demoHtml: string;
}
