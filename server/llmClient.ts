import OpenAI from 'openai';

export function getOpenAIClient(): OpenAI {
  if (openAIClient) {
    return openAIClient;
  }

  openAIClient = new OpenAI({
    apiKey: getLlmApiKey(),
    baseURL: getLlmBaseUrl(),
    timeout: getLlmTimeoutMs(),
  });

  return openAIClient;
}

export function getOpenAITtsClient(): OpenAI {
  if (openAITtsClient) {
    return openAITtsClient;
  }

  openAITtsClient = new OpenAI({
    apiKey: process.env.OPENAI_TTS_API_KEY?.trim() || getLlmApiKey(),
    baseURL: (process.env.OPENAI_TTS_BASE_URL?.trim() || getLlmBaseUrl()).replace(/\/+$/, ''),
    timeout: getTtsTimeoutMs(),
  });

  return openAITtsClient;
}

export function getLlmModel(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gemini-3-flash-preview';
}

export function normalizeLlmError(error: unknown, label: string): Error {
  if (error instanceof OpenAI.APIError) {
    const status = error.status ? `${error.status} ` : '';
    return new Error(`${label} failed: ${status}${error.message}`.trim());
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(`${label} failed: unknown error.`);
}

function getLlmApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing LLM API key. Set OPENAI_API_KEY in .env.');
  }

  return apiKey;
}

function getLlmBaseUrl(): string {
  const baseUrl = process.env.OPENAI_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta/openai';
  return baseUrl.replace(/\/+$/, '');
}

function getLlmTimeoutMs(): number {
  const timeout = Number(process.env.OPENAI_TIMEOUT_MS || '30000');
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 30000;
}

function getTtsTimeoutMs(): number {
  const timeout = Number(process.env.OPENAI_TTS_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || '60000');
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 60000;
}

let openAIClient: OpenAI | null = null;
let openAITtsClient: OpenAI | null = null;
