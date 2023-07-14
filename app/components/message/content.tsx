import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import { Typography, Link, Stack } from "@mui/material";
import { IElements } from "../../store/element";
import { memo } from "react";
import InlinedElements from "./inlined";
import styles from "./chat.module.scss";
import { Avatar } from "../emoji";
import { useAppConfig } from "../../store";
import Locale from "../../locales";
import {
  copyToClipboard,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen,
} from "../../utils";
import CopyIcon from "../../icons/copy.svg";
import { ChatAction } from "./chat";

interface Props {
  content?: string;
  date: string;
  elements: IElements;
  authorIsUser?: boolean;
}

export default memo(function MessageContent({
  content,
  date,
  elements,
  authorIsUser,
}: Props) {
  const config = useAppConfig();

  return (
    <div className={styles["chat-message-container"]}>
      <div className={styles["chat-message-header"]}>
        <div className={styles["chat-message-avatar"]}>
          {authorIsUser ? (
            <Avatar avatar={config.avatar} />
          ) : (
            <Avatar avatar={config.avatar} />
          )}
        </div>
        <div className={styles["chat-message-actions"]}>
          <div className={styles["chat-input-actions"]}>
            <ChatAction
              text={Locale.Chat.Actions.Copy}
              icon={<CopyIcon />}
              onClick={() => copyToClipboard(content ?? "")}
            />
          </div>
        </div>
      </div>
      <div className={styles["chat-message-item"]}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-body">
          {content ?? ""}
        </ReactMarkdown>
        <InlinedElements elements={elements} />
      </div>
      <div className={styles["chat-message-action-date"]}>{date}</div>
    </div>
  );
});
