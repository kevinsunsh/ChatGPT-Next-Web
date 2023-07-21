import { REQUEST_TIMEOUT_MS } from "@/app/constant";
import { useAccessStore } from "@/app/store";
import { getHeaders, CentralApi, LoginOptions } from "../api";

export class CentralServerApi implements CentralApi {
  async login(options: LoginOptions) {
    try {
      let loginPath = useAccessStore.getState().centralUrl + "/login/token";
      const loginInfo = {
        email: options.userMail,
        displayName: options.displayName,
        token: "test",
      };
      const controller = new AbortController();
      options.onController?.(controller);

      console.log(JSON.stringify(loginInfo));
      const loginRequest = {
        method: "POST",
        body: JSON.stringify(loginInfo),
        signal: controller.signal,
        headers: getHeaders(),
      };
      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );
      const res = await fetch(loginPath, loginRequest);
      clearTimeout(requestTimeoutId);

      const resJson = await res.json();
      console.log("auth", resJson);
      options.onFinish(resJson.authUid);
    } catch (e) {
      console.log("[Request] failed to make a chat reqeust", e);
      options.onError?.(e as Error);
    }
  }
}
