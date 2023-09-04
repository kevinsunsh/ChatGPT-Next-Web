import {
  DEFAULT_CHAT_HOST,
  BackendPath,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import {
  ChatMessage,
  useAccessStore,
  useAppConfig,
  useChatStore,
  createMessage,
} from "@/app/store";

import {
  ChatOptions,
  getHeaders,
  ContentApi,
  LLMUsage,
  CleanOptions,
  ConfrimOptions,
} from "../api";
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

export class ChatStoryApi implements ContentApi {
  path(path: string): string {
    let chatUrl = useAccessStore.getState().chatUrl;
    console.log("[path] chatUrl: ", chatUrl);
    console.log(
      "[path] CHAT_AGENT_BASE_URL: ",
      process.env.CHAT_AGENT_BASE_URL,
    );
    if (chatUrl.length === 0) {
      chatUrl = process.env.CHAT_AGENT_BASE_URL ?? DEFAULT_CHAT_HOST;
    }
    if (chatUrl.endsWith("/")) {
      chatUrl = chatUrl.slice(0, chatUrl.length - 1);
    }
    return [chatUrl, path].join("/");
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
      authUid: useAccessStore.getState().accessCode,
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
  async confrim(options: ConfrimOptions) {
    const confrimContent = {
      authUid: useAccessStore.getState().accessCode,
      content: options.eleContent,
    };

    console.log("[Request] payload: ", confrimContent);

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      let chatPath =
        useAccessStore.getState().chatUrl +
        "/" +
        BackendPath.ContentPath +
        options.eleName +
        "/confrim";

      const chooseRequest = {
        method: "POST",
        body: JSON.stringify(confrimContent),
        signal: controller.signal,
        headers: getHeaders(),
      };
      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      let res = await fetch(chatPath, chooseRequest);
      clearTimeout(requestTimeoutId);
      const resJson = await res.json();

      let confrim_respone: string[] = [];
      let confrim_desc: string[] = [];
      if (typeof resJson.confrim_respone !== "string") {
        for (const key in resJson.confrim_respone) {
          if (typeof resJson.confrim_respone[key] !== "string") {
            for (const key2 in resJson.confrim_respone[key]) {
              if (key2 === "action_desc")
                confrim_desc.push(resJson.confrim_respone[key][key2]);
              else confrim_respone.push(resJson.confrim_respone[key][key2]);
            }
          } else {
            confrim_respone.push(resJson.confrim_respone[key]);
          }
        }
      } else {
        confrim_respone.push(resJson.confrim_respone);
      }

      let response = {
        chat_result: "确认回复",
        element_name: resJson.confrim_action,
        element_content: confrim_respone,
        element_reason: confrim_desc,
      } as BackendResponse;
      console.log("[Request] response in confrim: ", response);

      const message = this.extractMessage(response);
      options.onFinish(message);
    } catch (e) {
      console.log("[Request] failed to make a chat reqeust", e);
      options.onError?.(e as Error);
    }
  }

  async clean(options: CleanOptions) {
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      let chatPath =
        useAccessStore.getState().chatUrl +
        "/" +
        BackendPath.ContentPath +
        "clean";
      console.log("[Request] chatPath: ", chatPath);
      const cleanPayload = {
        method: "DELETE",
        signal: controller.signal,
        headers: getHeaders(),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );
      console.log("[Request] cleanPayload: ", cleanPayload);
      const res = await fetch(chatPath, cleanPayload);
      clearTimeout(requestTimeoutId);
      const resJson = await res.json();
      console.log("[Request] resJson: ", resJson);
      options.onFinish();
    } catch (e) {
      console.log("[Request] failed to make a chat reqeust", e);
      options.onError?.(e as Error);
    }
  }
}
