import type { ReactNode } from "react";

export type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type ConversationStatusValue =
  | "idle"
  | "listening"
  | "thinking"
  | "error";

export type ConversationDisplayProps = {
  messages: DisplayMessage[];
  status?: ConversationStatusValue;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyState?: ReactNode;
  composerAction?: ReactNode;
  className?: string;
  submitLabel?: string;
};

export type PromptChipsProps = {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
  label?: string;
};

export type ConversationStatusProps = {
  value: ConversationStatusValue;
  labels?: Partial<Record<ConversationStatusValue, string>>;
};

