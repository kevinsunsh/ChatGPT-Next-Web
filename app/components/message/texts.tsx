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
import { ChatStroyApi } from "../../backend/platforms/chatstroy";
import {
  ChatMessage,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "@/app/store";
import {
  DEFAULT_BACKEND_HOST,
  BackendPath,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { getHeaders } from "../../backend/api";
import { useElementStore } from "../../store/element";

interface Props {
  items: ITextElement[];
}

export default function InlinedTextList({ items }: Props) {
  const [textArrayState, setTextArrayState] = useState([false, false, false]);
  const elementStore = useElementStore();

  useEffect(() => {
    items.map((el, i) => {
      const index = elementStore.topic.findIndex(
        (element) => (element = el.name),
      );
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
    let chatPath =
      useAccessStore.getState().backendUrl +
      "/" +
      BackendPath.ContentPath +
      el.name +
      "/confrim";
    const confrimContent = {
      content: textArrayState[index] ? "" : el.content,
    };
    const controller = new AbortController();

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

    fetch(chatPath, chooseRequest)
      .then((res) => res.json())
      .then((_text) => {
        if (textArrayState[index] === false) {
          const index = elementStore.topic.findIndex(
            (element) => (element = el.name),
          );
          elementStore.id[index] = el.id ?? "";
          elementStore.element[index] = el.content ?? "";
        }
      })
      .catch(() => {
        console.log("error");
      });
    clearTimeout(requestTimeoutId);
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
