import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";
import BotIcon from "../icons/bot.svg";
import { getHeaders } from "../backend/api";
import { REQUEST_TIMEOUT_MS } from "@/app/constant";
import { api } from "../backend/api";

export function AuthPage() {
  const navigate = useNavigate();
  const access = useAccessStore();

  const goHome = () => navigate(Path.Home);

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      <input
        className={styles["auth-input"]}
        type="account"
        placeholder={"账号"}
        value={access.accessAccount}
        onChange={(e) => {
          access.updateCode(e.currentTarget.value);
        }}
      />

      <input
        className={styles["auth-input"]}
        type="account"
        placeholder={"密码"}
        value={access.accessCode}
        onChange={(e) => {
          access.updateCode(e.currentTarget.value);
        }}
      />

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={() => {
            api.central.login({
              userMail: "kevinsun@unity3d.com",
              displayName: "kevinsun",
              onFinish(authUid) {
                access.updateAccount("kevinsun@unity3d.com");
                access.updateCode(authUid);
                access.updateAuthorized(true);
                goHome();
              },
              onError(error) {
                access.updateAccount("");
                access.updateAuthorized(true);
                console.error("[Chat] failed ", error);
              },
              onController(controller) {
                // collect controller for stop/retry
              },
            });
          }}
        />
      </div>
    </div>
  );
}
