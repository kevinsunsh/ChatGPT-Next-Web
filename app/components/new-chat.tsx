import { useEffect, useRef, useState } from "react";
import { Path, SlotID } from "../constant";
import { IconButton } from "./button";
import { EmojiAvatar } from "./emoji";
import styles from "./new-chat.module.scss";

import LeftIcon from "../icons/left.svg";
import LightningIcon from "../icons/lightning.svg";
import EyeIcon from "../icons/eye.svg";

import { useLocation, useNavigate } from "react-router-dom";
import Locale from "../locales";
import { useAppConfig, useChatStore } from "../store";
import { useCommand } from "../command";
import { showConfirm } from "./ui-lib";

function getIntersectionArea(aRect: DOMRect, bRect: DOMRect) {
  const xmin = Math.max(aRect.x, bRect.x);
  const xmax = Math.min(aRect.x + aRect.width, bRect.x + bRect.width);
  const ymin = Math.max(aRect.y, bRect.y);
  const ymax = Math.min(aRect.y + aRect.height, bRect.y + bRect.height);
  const width = xmax - xmin;
  const height = ymax - ymin;
  const intersectionArea = width < 0 || height < 0 ? 0 : width * height;
  return intersectionArea;
}

export function NewChat() {
  const chatStore = useChatStore();

  const navigate = useNavigate();
  const config = useAppConfig();

  const maskRef = useRef<HTMLDivElement>(null);

  const { state } = useLocation();

  const startChat = () => {
    setTimeout(() => {
      chatStore.newSession();
      navigate(Path.Chat);
    }, 10);
  };

  return (
    <div className={styles["new-chat"]}>
      <div className={styles["mask-header"]}>
        <IconButton
          icon={<LeftIcon />}
          text={Locale.NewChat.Return}
          onClick={() => navigate(Path.Home)}
        ></IconButton>
        {!state?.fromHome && (
          <IconButton
            text={Locale.NewChat.NotShow}
            onClick={async () => {
              if (await showConfirm(Locale.NewChat.ConfirmNoShow)) {
                startChat();
                config.update((config) => {});
              }
            }}
          ></IconButton>
        )}
      </div>
      <div className={styles["title"]}>{Locale.NewChat.Title}</div>
      <div className={styles["sub-title"]}>{Locale.NewChat.SubTitle}</div>

      <div className={styles["actions"]}>
        <IconButton
          text={Locale.NewChat.More}
          onClick={() => navigate(Path.Masks)}
          icon={<EyeIcon />}
          bordered
          shadow
        />

        <IconButton
          text={Locale.NewChat.Skip}
          onClick={() => startChat()}
          icon={<LightningIcon />}
          type="primary"
          shadow
          className={styles["skip"]}
        />
      </div>
    </div>
  );
}
