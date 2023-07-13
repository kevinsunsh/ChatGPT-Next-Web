import { getClientConfig } from "../config/client";
import { ChatMessage, useAccessStore } from "../store";
import { ChatStroyApi } from "./platforms/chatstroy";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export interface RequestMessage {
  role: MessageRole;
  topic: string;
  content: string;
}

export interface ChatOptions {
  message: RequestMessage;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface ServerSessions {
  topics: string;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract usage(): Promise<LLMUsage>;
}

export class BackendApi {
  public llm: LLMApi;

  constructor() {
    this.llm = new ChatStroyApi();
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    return "";
  }
}

export const api = new BackendApi();

export function getHeaders() {
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-requested-with": "XMLHttpRequest",
    "Access-Control-Allow-Origin": "*",
  };

  return headers;
}
