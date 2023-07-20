import { atom } from "recoil";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";

export type ElementType = "image" | "text";

export type AllElements = IImageElement | ITextElement;

export interface IElement {
  id: string;
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
  reason?: string;
  language?: string;
}

export type IElements = IElement[];

export const elementState = atom<IElements>({
  key: "Elements",
  default: [],
});

interface ElementStore {
  topic: string[];
  element: string[];
  id: string[];
}

export const useElementStore = create<ElementStore>()(
  persist(
    (set, get) => ({
      topic: ["topic", "audience", "style", "outline", "script"],
      element: ["", "", "", "", ""],
      id: ["", "", "", "", ""],
    }),
    {
      name: StoreKey.Element,
      version: 1,
    },
  ),
);
