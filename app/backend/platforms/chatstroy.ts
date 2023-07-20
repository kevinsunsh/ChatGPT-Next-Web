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
import { IElements, ITextElement } from "../../store/element";
import { v4 as uuidv4 } from "uuid";

export interface BackendResponse {
  chat_result: string;
  element_name: string;
  element_content: string[];
  element_reason: string[];
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
    let eles: IElements = [];
    res.element_content.forEach((value, index) =>
      eles.push({
        id: uuidv4(),
        name: res.element_name,
        type: "text",
        content: value,
        reason:
          res.element_reason.length > index ? res.element_reason[index] : null,
      } as ITextElement),
    );
    return {
      content: res.chat_result,
      elements: eles,
    } as ChatMessage;
  }

  async chat(options: ChatOptions) {
    const requestPayload = {
      content: options.message.content,
    };

    console.log("[Request] payload: ", requestPayload);

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      let chatPath = this.path(BackendPath.ContentPath + options.message.topic);
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
      console.log("[Request] resJson: ", resJson.element_content.length);
      let ele_content: string[] = [];
      let ele_reason: string[] = [];
      if (typeof resJson.element_content !== "string") {
        for (const key in resJson.element_content) {
          console.log("[Request] key: ", resJson.element_content[key]);
          if (typeof resJson.element_content[key] !== "string") {
            for (const key2 in resJson.element_content[key]) {
              if (key2 === "推荐理由")
                ele_reason.push(resJson.element_content[key][key2]);
              else ele_content.push(resJson.element_content[key][key2]);
            }
          } else {
            ele_content.push(resJson.element_content[key]);
          }
        }
      } else {
        ele_content.push(resJson.element_content);
      }

      let response = {
        chat_result: resJson.chat_result,
        element_name: resJson.element_name,
        element_content: ele_content,
        element_reason: ele_reason,
      } as BackendResponse;
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
