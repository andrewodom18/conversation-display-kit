import { useEffect, useRef } from "react";
import { ConversationStatus } from "./ConversationStatus";
import type { ConversationDisplayProps } from "./types";

export function ConversationDisplay({
  messages,
  status = "idle",
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  placeholder = "Type a message",
  emptyState = "Start a conversation.",
  composerAction,
  className = "",
  submitLabel = "Send",
}: ConversationDisplayProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, status]);

  const canSubmit = !disabled && value.trim().length > 0;

  return (
    <div className={`cdk-conversation ${className}`.trim()}>
      <header className="cdk-conversation__header">
        <span className="cdk-conversation__eyebrow">Conversation</span>
        <ConversationStatus value={status} />
      </header>

      <div
        aria-label="Conversation messages"
        className="cdk-conversation__messages"
        role="log"
      >
        {messages.length === 0 ? (
          <div className="cdk-conversation__empty">{emptyState}</div>
        ) : (
          messages.map((message) => (
            <article
              aria-label={`${message.role} message`}
              className={`cdk-message cdk-message--${message.role}`}
              key={message.id}
            >
              <span className="cdk-message__role">
                {message.role === "assistant" ? "Assistant" : "You"}
              </span>
              <p>{message.text}</p>
            </article>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        className="cdk-composer"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(value.trim());
        }}
      >
        <label className="cdk-sr-only" htmlFor="cdk-message-input">
          Message
        </label>
        <input
          aria-describedby="cdk-message-help"
          autoComplete="off"
          disabled={disabled}
          id="cdk-message-input"
          maxLength={500}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {composerAction}
        <button
          className="cdk-composer__submit"
          disabled={!canSubmit}
          type="submit"
        >
          {submitLabel}
        </button>
        <span className="cdk-sr-only" id="cdk-message-help">
          Press Enter to send.
        </span>
      </form>
    </div>
  );
}

