import { Alert, AlertTitle, Stack } from "@mui/material";
import TextElement from "./text";
import { ITextElement } from "../../store/element";

interface Props {
  items: ITextElement[];
}

export default function InlinedTextList({ items }: Props) {
  return (
    <Stack spacing={1}>
      {items.map((el, i) => {
        return (
          <Alert color="success" key={i} icon={false}>
            <AlertTitle>{el.name}</AlertTitle>
            <TextElement element={el} />
          </Alert>
        );
      })}
    </Stack>
  );
}
