import { useEffect, useState } from "react";
import { ITextElement } from "../../store/element";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./chat.module.scss";

interface Props {
  element: ITextElement;
}

export default function TextElement({ element }: Props) {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (fetching || !element.url) return;
    setFetching(true);
    fetch(element.url)
      .then((res) => res.text())
      .then((_text) => {
        setText(_text);
        setFetching(false);
        setError(false);
      })
      .catch(() => {
        setText("");
        setError(true);
        setFetching(false);
      });
  }, [element]);

  let content = fetching
    ? "Loading..."
    : error
    ? "Error"
    : text
    ? text
    : (element.content as string);

  if (!fetching && !error && element.language) {
    content = `\`\`\`${element.language}\n${content}\n\`\`\``;
  }

  if (element.reason) {
    content = `\`\`\`\n${content}\n理由: ${element.reason}\n\`\`\``;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={styles["chat-element-item"]}
    >
      {content}
    </ReactMarkdown>
  );
}
