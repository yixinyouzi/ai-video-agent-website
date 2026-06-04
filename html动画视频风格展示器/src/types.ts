export type ThemeStyleId = 'cyberpunk' | 'minimalist' | 'pop';

export type VideoRatio = '16_9' | '9_16';

export interface StyleDefinition {
  id: ThemeStyleId;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  prompt: string;
  demoText: {
    title: string;
    keyword: string;
    descFirst: string;
    descSecond: string;
    metaText: string;
  };
}

export interface AnimationState {
  isPlaying: boolean;
  progress: number; // 0 to 100
  speed: number;    // 0.5, 1, 1.5, 2
  loop: boolean;
  key: number;      // Used code-wise to trigger resets of Motion animations
}
