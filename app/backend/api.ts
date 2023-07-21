import { getClientConfig } from "../config/client";
import { ChatMessage, useAccessStore } from "../store";
import { ChatStoryApi } from "./platforms/chatstory";
import { CentralServerApi } from "./platforms/centralserver";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export interface RequestMessage {
  role: MessageRole;
  topic: string;
  content: string;
}

export interface ChatOptions {
  message: RequestMessage;
  onFinish: (message: ChatMessage) => void;
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

export abstract class ContentApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract confrim(ele_name: string, ele_content: string): Promise<boolean>;
  abstract usage(): Promise<LLMUsage>;
}

export interface LoginOptions {
  userMail: string;
  displayName: string;
  onFinish: (authUid: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export abstract class CentralApi {
  abstract login(options: LoginOptions): Promise<void>;
}

export class BackendApi {
  public content: ContentApi;
  public central: CentralApi;
  constructor() {
    this.content = new ChatStoryApi();
    this.central = new CentralServerApi();
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
