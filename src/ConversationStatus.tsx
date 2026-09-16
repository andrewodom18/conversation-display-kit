import type { ConversationStatusProps } from "./types";

const defaultLabels = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  error: "Needs attention",
} as const;

export function ConversationStatus({
  value,
  labels,
}: ConversationStatusProps) {
  const label = labels?.[value] ?? defaultLabels[value];

  return (
    <div
      aria-live="polite"
      className={`cdk-status cdk-status--${value}`}
      data-status={value}
      role="status"
    >
      <span aria-hidden="true" className="cdk-status__dot" />
      <span>{label}</span>
    </div>
  );
}

