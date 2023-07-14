import { atom } from "recoil";

export type ElementType = "image" | "text";

export type AllElements = IImageElement | ITextElement;

export interface IElement {
  id?: number;
  conversationId?: number;
  url?: string;
  type: ElementType;
  name: string;
}

export interface IImageElement extends IElement {
  type: "image";
  content?: ArrayBuffer;
  size?: "small" | "medium" | "large";
}

export interface ITextElement extends IElement {
  type: "text";
  content?: string;
  language?: string;
}

export type IElements = IElement[];

export const elementState = atom<IElements>({
  key: "Elements",
  default: [],
});
