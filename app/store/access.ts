import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BACKEND_HOST, StoreKey } from "../constant";
import { getHeaders } from "../backend/api";
import { getClientConfig } from "../config/client";

export interface AccessControlStore {
  accessCode: string;
  needCode: boolean;
  backendUrl: string;
  defaultSessions: string;

  updateCode: (_: string) => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      accessCode: "",
      needCode: true,
      backendUrl: process.env.CHAT_AGENT_BASE_URL ?? DEFAULT_BACKEND_HOST,
      defaultSessions: "",

      enabledAccessControl() {
        get().fetch();

        return get().needCode;
      },
      updateCode(code: string) {
        set(() => ({ accessCode: code }));
      },
      isAuthorized() {
        get().fetch();

        // has token or has code or disabled access control
        return true;
      },
      fetch() {
        if (fetchState > 0) return;
        fetchState = 1;
      },
    }),
    {
      name: StoreKey.Access,
      version: 1,
    },
  ),
);
