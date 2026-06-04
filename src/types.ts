import { StoryboardOutline } from '../shared/storyboardOutline';
import { HtmlVideoStyleId } from '../shared/htmlVideoStyles';

export type ProjectMode = 'slideshow' | 'html';
export type ChatSender = 'assistant' | 'user';
export type VideoIntentAction =
  | 'generate_video_outline'
  | 'regenerate_video_outline'
  | 'regenerate_video_outline_confirmation'
  | 'add_scene'
  | 'delete_scene'
  | 'regenerate_scene'
  | 'unsupported';

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  narration: string;
  visualPrompt: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  html?: string | null;
  audioUrl?: string | null;
  audioPath?: string | null;
  duration: number; // in seconds
  startTime: number;
  endTime: number;
}

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: string;
  action?: VideoIntentAction | null;
  reason?: string | null;
  outline?: StoryboardOutline | null;
  progressList?: {
    id: string;
    label: string;
    status: 'success' | 'loading' | 'pending';
    percentage?: number;
  }[];
}

export interface Project {
  id: string;
  title: string;
  mode: ProjectMode;
  status: 'idle' | 'generating' | 'completed';
  progress: number;
  currentStep: string;
  scenes: Scene[];
  bgMusic: string;
  createdAt: string;
  prompt: string;
  storyboardOutline: string;
  outline: StoryboardOutline | null;
  videoSource: string;
  htmlStyleId: HtmlVideoStyleId;
  isActive: boolean;
  messages: ChatMessage[];
}

export interface ApiProjectRecord {
  uuid: string;
  title: string;
  createdAt: string;
  type: ProjectMode;
  storyboardOutline: string;
  videoSource: string;
}

export interface ApiChatMessageRecord {
  uuid: string;
  projectUuid: string;
  sender: ChatSender;
  content: string;
  action: VideoIntentAction | null;
  reason: string | null;
  createdAt: string;
}

export interface ApiIntentAnalysisResult {
  action: VideoIntentAction;
  reason: string;
}

export interface ApiSendMessageResult {
  assistantMessage: ApiChatMessageRecord;
  analysis: ApiIntentAnalysisResult;
  project: ApiProjectRecord;
  outline: StoryboardOutline | null;
}

export interface StoryboardImageSource {
  path: string;
  url: string;
  prompt: string;
  generatedAt: string;
  audio?: StoryboardAudioSource;
}

export interface StoryboardAudioSource {
  path: string;
  url: string;
  narration: string;
  voice: string;
  generatedAt: string;
}

export interface StoryboardHtmlSource {
  html: string;
  prompt: string;
  generatedAt: string;
}

export interface StoryboardSceneSource {
  path?: string;
  url?: string;
  prompt?: string;
  generatedAt?: string;
  html?: string;
  audio?: StoryboardAudioSource;
}

export interface ProjectVideoSource {
  version: 1;
  type: 'storyboard_assets';
  htmlStyleId?: HtmlVideoStyleId;
  scenes: Record<string, StoryboardSceneSource>;
}

export interface ApiGenerateStoryboardImageResult {
  project: ApiProjectRecord;
  sceneNumber: number;
  image: StoryboardImageSource;
  skipped: boolean;
}

export interface ApiGenerateStoryboardAudioResult {
  project: ApiProjectRecord;
  sceneNumber: number;
  audio: StoryboardAudioSource;
  skipped: boolean;
}

export interface ApiGenerateStoryboardHtmlResult {
  project: ApiProjectRecord;
  sceneNumber: number;
  animation: StoryboardHtmlSource;
  skipped: boolean;
}
