import {
  DEFAULT_BACKEND_HOST,
  BackendPath,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import {
  ChatMessage,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "@/app/store";

import { ChatOptions, getHeaders, LLMApi, LLMUsage } from "../api";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "@/app/utils/format";
import { ITextElement } from "../../store/element";

export interface BackendResponse {
  chat_result: string;
  elements_result: string;
  article_result: string;
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

  extractMessage(res: BackendResponse) {
    return {
      content: res.chat_result,
      elements: [
        {
          name: "elements",
          type: "text",
          content: prettyObject(res.elements_result),
        } as ITextElement,
        {
          name: "article",
          type: "text",
          content: res.article_result,
        } as ITextElement,
      ],
    } as ChatMessage;
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
      const response = resJson as BackendResponse;
      console.log("[Request] response: ", response);
      const message = this.extractMessage(response);
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
