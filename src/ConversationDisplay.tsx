import { useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { ConversationStatus } from "./ConversationStatus";
import type { ConversationDisplayProps } from "./types";

export function ConversationDisplay({
  messages, status = "idle", value, onValueChange, onSubmit,
  disabled = false, placeholder = "Type a message",
  emptyState = "Start a conversation.", composerAction, className = "",
  submitLabel = "Send", inputRef, logRef, maxLength = 500,
  multiline = false, inputLabel = "Message", logLabel = "Conversation messages",
  title = "Conversation", statusLabels,
}: ConversationDisplayProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const helpId = `${id}-help`;
  const internalLogRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  useImperativeHandle(inputRef, () => internalInputRef.current!);
  useImperativeHandle(logRef, () => internalLogRef.current!, []);
  const composing = useRef(false);
  const followsLatest = useRef(true);
  const jumpingToLatest = useRef(false);
  const [readingHistory, setReadingHistory] = useState(false);

  function scrollToLatest(animate = false) {
    const log = internalLogRef.current;
    if (!log) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    jumpingToLatest.current = animate && !reduceMotion;
    // Incoming responses follow immediately, even when several arrive during
    // one animation. Only an explicit jump animates toward the latest message.
    log.scrollTo({ top: log.scrollHeight, behavior: jumpingToLatest.current ? "smooth" : "instant" });
  }

  useEffect(() => {
    if (followsLatest.current) scrollToLatest();
  }, [messages]);

  const canSubmit = !disabled && value.trim().length > 0 && value.length <= maxLength;
  const submit = () => {
    if (canSubmit && !composing.current) onSubmit(value.trim());
  };
  const assignInputRef = (element: HTMLInputElement | HTMLTextAreaElement | null) => {
    internalInputRef.current = element;
  };
  const inputProps = {
    "aria-describedby": helpId,
    autoComplete: "off",
    disabled,
    id: inputId,
    maxLength,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onValueChange(event.target.value),
    onCompositionStart: () => { composing.current = true; },
    onCompositionEnd: () => { composing.current = false; },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key !== "Enter") return;
      if (event.nativeEvent.isComposing || composing.current || event.keyCode === 229) {
        event.preventDefault();
        return;
      }
      if (multiline && event.shiftKey) return;
      event.preventDefault();
      submit();
    },
    placeholder,
    value,
  };

  return (
    <div className={`cdk-conversation ${className}`.trim()}>
      <header className="cdk-conversation__header">
        <span className="cdk-conversation__eyebrow">{title}</span>
        <ConversationStatus labels={statusLabels} value={status} />
      </header>
      <div className="cdk-conversation__history">
        <div
          aria-label={logLabel}
          className="cdk-conversation__messages"
          onKeyDown={(event) => {
            if (["ArrowUp", "PageUp", "Home"].includes(event.key)) {
              jumpingToLatest.current = false;
              followsLatest.current = false;
            }
          }}
          onPointerDown={() => { jumpingToLatest.current = false; }}
          onTouchStart={() => { jumpingToLatest.current = false; }}
          onWheel={(event) => {
            if (event.deltaY < 0) {
              jumpingToLatest.current = false;
              followsLatest.current = false;
            }
          }}
          onScroll={() => {
            const log = internalLogRef.current;
            if (!log) return;
            const gap = log.scrollHeight - log.scrollTop - log.clientHeight;
            if (jumpingToLatest.current && gap > 1) return;
            jumpingToLatest.current = false;
            const nearBottom = messages.length === 0 || gap <= 48;
            followsLatest.current = nearBottom;
            setReadingHistory(!nearBottom);
          }}
          ref={internalLogRef}
          role="log"
          tabIndex={0}
        >
          {messages.length === 0 ? (
            <div className="cdk-conversation__empty">{emptyState}</div>
          ) : messages.map((message) => (
            <article aria-label={`${message.role} message`} className={`cdk-message cdk-message--${message.role}`} key={message.id}>
              <span className="cdk-message__role">{message.role === "assistant" ? "Assistant" : "You"}</span>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
        {readingHistory && <button className="cdk-jump" onClick={() => {
          followsLatest.current = true;
          setReadingHistory(false);
          scrollToLatest(true);
          internalLogRef.current?.focus({ preventScroll: true });
        }} type="button">Jump to latest</button>}
      </div>
      <form className="cdk-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <label className="cdk-sr-only" htmlFor={inputId}>{inputLabel}</label>
        {multiline ? <textarea {...inputProps} ref={assignInputRef} rows={3} /> : <input {...inputProps} ref={assignInputRef} type="text" />}
        {composerAction}
        <button className="cdk-composer__submit" disabled={!canSubmit} type="submit">{submitLabel}</button>
        <span className="cdk-sr-only" id={helpId}>
          {multiline ? "Press Enter to send. Press Shift and Enter for a new line." : "Press Enter to send."}
        </span>
      </form>
    </div>
  );
}
