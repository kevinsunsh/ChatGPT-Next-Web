import { create } from "zustand";
import { persist } from "zustand/middleware";

import { trimTopic } from "../utils";

import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import { useAppConfig } from "./config";
import { DEFAULT_SYSTEM_TEMPLATE, StoreKey } from "../constant";
import { api, RequestMessage } from "../backend/api";
import { ChatControllerPool } from "../backend/controller";
import { prettyObject } from "../utils/format";
import { estimateTokenLength } from "../utils/token";
import { nanoid } from "nanoid";
import { getHeaders, ServerSessions } from "../backend/api";
import { IElements } from "./element";

export type ChatMessage = RequestMessage & {
  elements: IElements;
  date: string;
  isError?: boolean;
  id: string;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    elements: [],
    topic: "",
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
  };
}

function createDefaultSessions(): ChatSession[] {
  /*
  let sessions: ChatSession[] = [];
  fetch(DEFAULT_BACKEND_HOST + "/sessions", {
    method: "post",
    body: null,
    headers: {
      ...getHeaders(),
    },
  })
    .then((res) => res.json())
    .then((res: ServerSessions) => {
      console.log("[Config] got config from server", res);
      res.topics.split(',').forEach((topic) => {
        let session = createEmptySession();
        session.topic = topic;
        sessions.push(session);
      })
    })
    .catch(() => {
      console.error("[Config] failed to fetch config");
    })
  */
  let sessions: ChatSession[] = [];
  "topic,audience,style,outline,script".split(",").forEach((topic) => {
    let session = createEmptySession();
    session.topic = topic;
    sessions.push(session);
  });
  console.log("[Config] createDefaultSessions", sessions);
  return sessions;
}

let defaultSessions: ChatSession[] = createDefaultSessions();

export function getDefaultSessions(): ChatSession[] {
  if (defaultSessions.length > 0) {
    return defaultSessions;
  }
  defaultSessions = createDefaultSessions();
  return defaultSessions;
}

interface ChatStore {
  sessions: ChatSession[];
  currentSessionIndex: number;
  clearSessions: () => void;
  moveSession: (from: number, to: number) => void;
  selectSession: (index: number) => void;
  newSession: () => void;
  deleteSession: (index: number) => void;
  currentSession: () => ChatSession;
  nextSession: (delta: number) => void;
  onNewMessage: (message: ChatMessage) => void;
  onUserInput: (content: string) => Promise<void>;
  updateStat: (message: ChatMessage) => void;
  updateCurrentSession: (updater: (session: ChatSession) => void) => void;
  updateMessage: (
    sessionIndex: number,
    messageIndex: number,
    updater: (message?: ChatMessage) => void,
  ) => void;
  resetSession: () => void;
  getMessagesWithMemory: () => ChatMessage[];

  clearAllData: () => void;
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce((pre, cur) => pre + estimateTokenLength(cur.content), 0);
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: getDefaultSessions(),
      currentSessionIndex: 0,

      clearSessions() {
        set(() => {
          return {
            sessions: getDefaultSessions(),
            currentSessionIndex: 0,
          };
        });
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession() {
        const session = createEmptySession();

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [session].concat(state.sessions),
        }));
      },

      nextSession(delta) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      deleteSession(index) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const sessions = get().sessions.slice();
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          nextIndex = 0;
          sessions.push(createEmptySession());
        }

        // for undo delete action
        const restoreState = {
          currentSessionIndex: get().currentSessionIndex,
          sessions: get().sessions.slice(),
        };

        set(() => ({
          currentSessionIndex: nextIndex,
          sessions,
        }));

        showToast(
          Locale.Home.DeleteToast,
          {
            text: Locale.Home.Revert,
            onClick() {
              set(() => restoreState);
            },
          },
          5000,
        );
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message) {
        get().updateCurrentSession((session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });
        get().updateStat(message);
      },

      async onUserInput(content) {
        const session = get().currentSession();

        const userMessage: ChatMessage = createMessage({
          role: "user",
          content: content,
          topic: session.topic,
        });

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
        });

        const messageIndex = get().currentSession().messages.length + 1;

        // save user's and bot's message
        get().updateCurrentSession((session) => {
          const savedUserMessage = {
            ...userMessage,
            content,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });

        // make request
        api.content.chat({
          message: userMessage,
          onFinish(message) {
            if (message) {
              botMessage.content = message.content;
              botMessage.elements = message.elements;
              get().onNewMessage(botMessage);
            }
            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onError(error) {
            const isAborted = error.message.includes("aborted");
            botMessage.content =
              "\n\n" +
              prettyObject({
                error: true,
                message: error.message,
              });
            userMessage.isError = !isAborted;
            botMessage.isError = !isAborted;
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
            ChatControllerPool.remove(
              session.id,
              botMessage.id ?? messageIndex,
            );

            console.error("[Chat] failed ", error);
          },
          onController(controller) {
            // collect controller for stop/retry
            ChatControllerPool.addController(
              session.id,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },

      getMessagesWithMemory() {
        const session = get().currentSession();
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1;
          i >= totalMessageCount - 5;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
          reversedRecentMessages.push(msg);
        }

        const recentMessages = [...reversedRecentMessages.reverse()];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession() {
        get().updateCurrentSession((session) => {
          session.messages = [];
        });
      },

      updateStat(message) {
        get().updateCurrentSession((session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },

      updateCurrentSession(updater) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        set(() => ({ sessions }));
      },

      clearAllData() {
        api.content.clean({
          onFinish() {},
          onError(error) {},
          onController(controller) {},
        });
        localStorage.clear();
        location.reload();
      },
    }),
    {
      name: StoreKey.Chat,
      version: 3,
      migrate(persistedState, version) {
        const state = persistedState as any;
        const newState = JSON.parse(JSON.stringify(state)) as ChatStore;

        if (version < 2) {
          newState.sessions = [];

          const oldSessions = state.sessions;
          for (const oldSession of oldSessions) {
            const newSession = createEmptySession();
            newSession.topic = oldSession.topic;
            newSession.messages = [...oldSession.messages];
            newState.sessions.push(newSession);
          }
        }

        if (version < 3) {
          // migrate id to nanoid
          newState.sessions.forEach((s) => {
            s.id = nanoid();
            s.messages.forEach((m) => (m.id = nanoid()));
          });
        }

        return newState;
      },
    },
  ),
);
