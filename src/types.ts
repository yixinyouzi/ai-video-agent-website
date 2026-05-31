import { StoryboardOutline } from '../shared/storyboardOutline';

export type ProjectMode = 'slideshow' | 'html';
export type ChatSender = 'assistant' | 'user';
export type VideoIntentAction =
  | 'generate_video_outline'
  | 'regenerate_video_outline'
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
