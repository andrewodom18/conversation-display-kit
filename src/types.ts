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

/** A provider-neutral, human-readable description of one proposed change. */
export type ReviewChange = {
  id: string;
  label: string;
  before?: string;
  after?: string;
};

export type ChangeReviewCardProps = {
  title: string;
  summary?: string;
  changes: readonly ReviewChange[];
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
  className?: string;
  acceptLabel?: string;
  rejectLabel?: string;
};
