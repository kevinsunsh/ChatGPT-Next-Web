import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CHAT_HOST, DEFAULT_CENTRAL_HOST, StoreKey } from "../constant";
import { getHeaders } from "../backend/api";
import { getClientConfig } from "../config/client";

export interface AccessControlStore {
  accessAccount: string;
  accessCode: string;
  authorized: boolean;
  chatUrl: string;
  centralUrl: string;
  defaultSessions: string;

  updateAccount: (_: string) => void;
  updateCode: (_: string) => void;
  updateAuthorized: (_: boolean) => void;
  isAuthorized: () => boolean;
}

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      accessAccount: "",
      accessCode: "",
      authorized: false,
      chatUrl: process.env.CHAT_AGENT_BASE_URL ?? DEFAULT_CHAT_HOST,
      centralUrl: DEFAULT_CENTRAL_HOST,
      defaultSessions: "",

      updateAccount(account: string) {
        set(() => ({ accessAccount: account }));
      },
      updateCode(code: string) {
        set(() => ({ accessCode: code }));
      },
      updateAuthorized(auth: boolean) {
        set(() => ({ authorized: auth }));
      },
      isAuthorized() {
        return get().authorized;
      },
    }),
    {
      name: StoreKey.Access,
      version: 1,
    },
  ),
);
