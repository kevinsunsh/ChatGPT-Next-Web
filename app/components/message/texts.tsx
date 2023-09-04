import { Alert, AlertTitle, Stack } from "@mui/material";
import TextElement from "./text";
import { ITextElement } from "../../store/element";
import { ChatAction } from "./chat";
import CopyIcon from "../../icons/copy.svg";
import styles from "./chat.module.scss";
import IconButton from "@mui/material/IconButton";
import GppGoodIcon from "@mui/icons-material/GppGood";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { useEffect, useState } from "react";
import { ChatStoryApi } from "../../backend/platforms/chatstory";
import {
  ChatMessage,
  useAccessStore,
  useAppConfig,
  useChatStore,
  createMessage,
} from "@/app/store";
import { BackendPath, REQUEST_TIMEOUT_MS } from "@/app/constant";
import { getHeaders, api } from "../../backend/api";
import { useElementStore } from "../../store/element";
import { prettyObject } from "../../utils/format";
import { ChatControllerPool } from "../../backend/controller";

interface Props {
  items: ITextElement[];
}

export default function InlinedTextList({ items }: Props) {
  const [textArrayState, setTextArrayState] = useState([false, false, false]);
  const elementStore = useElementStore();
  const chatStore = useChatStore();
  useEffect(() => {
    items.map((el, i) => {
      const index = elementStore.name.findIndex((name) => name === el.name);
      if (elementStore.id[index] !== "") {
        setTextArrayState((prevState) =>
          prevState.map((item, idx) =>
            idx === i
              ? el.id === elementStore.id[index]
                ? true
                : false
              : item,
          ),
        );
      }
    });
  }, [items, elementStore]);

  const updateState = (el: ITextElement, index: number) => {
    setTextArrayState((prevState) =>
      prevState.map((item, idx) => (idx === index ? !item : false)),
    );

    if (el.name === "next_action") {
      if (textArrayState[index] === false) {
        chatStore.onUserInput(el.content ?? "").then(() => {
          if (el.content === "cleanworkspace") {
            chatStore.clearAllData();
          }
        });
      }
    } else {
      let ele_content = textArrayState[index] ? "" : el.content;
      ele_content = ele_content ?? "";

      const session = chatStore.currentSession();
      const botMessage: ChatMessage = createMessage({
        role: "assistant",
      });
      const messageIndex = chatStore.currentSession().messages.length + 1;
      api.content.confrim({
        topic: session.topic,
        eleName: el.name,
        eleContent: ele_content,
        onFinish(message) {
          if (textArrayState[index] === false) {
            const index = elementStore.name.findIndex(
              (name) => name === el.name,
            );
            elementStore.id[index] = el.id ?? "";
            elementStore.content[index] = el.content ?? "";

            // save user's and bot's message
            chatStore.updateCurrentSession((session) => {
              session.messages = session.messages.concat([botMessage]);
            });
            botMessage.content = message.content;
            botMessage.elements = message.elements;
            console.log("[Request] botMessage: ", botMessage);
            chatStore.onNewMessage(botMessage);
            ChatControllerPool.remove(session.id, botMessage.id);
          }
        },
        onError(error) {
          const isAborted = error.message.includes("aborted");
          botMessage.content =
            "\n\n" +
            prettyObject({
              error: true,
              message: error.message,
            });
          botMessage.isError = !isAborted;
          chatStore.updateCurrentSession((session) => {
            session.messages = session.messages.concat();
          });
          ChatControllerPool.remove(session.id, botMessage.id ?? messageIndex);

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
    }
  };

  return (
    <Stack spacing={1}>
      {items.map((el, i) => {
        return (
          <Alert
            color="success"
            key={i}
            icon={false}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  updateState(el, i);
                }}
              >
                {textArrayState[i] ? <GppGoodIcon /> : <QuestionMarkIcon />}
              </IconButton>
            }
          >
            <AlertTitle>{el.name + "_" + i}</AlertTitle>
            <TextElement element={el} />
          </Alert>
        );
      })}
    </Stack>
  );
}
