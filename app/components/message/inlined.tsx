import { ElementType, IElements, AllElements } from "../../store/element";
import InlinedImageList from "./images";
import InlinedTextList from "./texts";
import { Stack } from "@mui/material";

interface Props {
  elements: IElements;
}

export default function InlinedElements({ elements }: Props) {
  if (elements === undefined) return null;

  if (!elements.length) {
    return null;
  }

  /**
   * Categorize the elements by element type
   * The TypeScript dance is needed to make sure we can do elementsByType.image
   * and get an array of IImageElement.
   */
  const elementsByType = elements.reduce(
    (acc, el: AllElements) => {
      if (!acc[el.type]) {
        acc[el.type] = [];
      }
      const array = acc[el.type] as Extract<
        AllElements,
        { type: typeof el.type }
      >[];
      array.push(el);
      return acc;
    },
    {} as {
      [K in ElementType]: Extract<AllElements, { type: K }>[];
    },
  );

  return (
    <Stack gap={1} mt={1}>
      {elementsByType.image?.length ? (
        <InlinedImageList items={elementsByType.image} />
      ) : null}
      {elementsByType.text?.length ? (
        <InlinedTextList items={elementsByType.text} />
      ) : null}
    </Stack>
  );
}
