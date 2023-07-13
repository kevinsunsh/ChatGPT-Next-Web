import {
  DEFAULT_BACKEND_HOST,
  BackendPath,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";

import { ChatOptions, getHeaders, LLMApi, LLMUsage } from "../api";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "@/app/utils/format";

export interface BackendListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export class ChatStroyApi implements LLMApi {
  path(path: string): string {
    let backendUrl = useAccessStore.getState().backendUrl;
    console.log("[path] backendUrl: ", backendUrl);
    console.log(
      "[path] CHAT_AGENT_BASE_URL: ",
      process.env.CHAT_AGENT_BASE_URL,
    );
    if (backendUrl.length === 0) {
      backendUrl = process.env.CHAT_AGENT_BASE_URL ?? DEFAULT_BACKEND_HOST;
    }
    if (backendUrl.endsWith("/")) {
      backendUrl = backendUrl.slice(0, backendUrl.length - 1);
    }
    return [backendUrl, path].join("/");
  }

  extractMessage(res: any) {
    return prettyObject(res);
  }

  async chat(options: ChatOptions) {
    const requestPayload = {
      type: options.message.topic,
      content: options.message.content,
    };

    console.log("[Request] payload: ", requestPayload);

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(BackendPath.ChatPath);
      console.log("[Request] chatPath: ", chatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );
      console.log("[Request] chatPayload: ", chatPayload);
      const res = await fetch(chatPath, chatPayload);
      clearTimeout(requestTimeoutId);

      const resJson = await res.json();
      console.log("[Request] resJson: ", resJson);
      const message = this.extractMessage(resJson);
      options.onFinish(message);
    } catch (e) {
      console.log("[Request] failed to make a chat reqeust", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    return {
      used: 0,
      total: 0,
    } as LLMUsage;
  }
}
export { BackendPath };
