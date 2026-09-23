import { useId } from "react";
import type { ChangeReviewCardProps } from "./types";

export function ChangeReviewCard({
  title,
  summary,
  changes,
  onAccept,
  onReject,
  disabled = false,
  className = "",
  acceptLabel = "Apply",
  rejectLabel = "Keep current",
  status = "pending",
  statusMessage,
}: ChangeReviewCardProps) {
  const locked = disabled || status === "applying" || status === "applied" || status === "rejected";
  const feedback = statusMessage ?? {
    pending: "", applying: "Applying changes…", applied: "Changes applied.",
    rejected: "Current plan kept.", error: "Changes could not be applied. Try again.",
  }[status];
  const titleId = useId();
  const summaryId = useId();

  return (
    <section
      aria-busy={status === "applying"}
      aria-describedby={summary ? summaryId : undefined}
      aria-labelledby={titleId}
      className={`cdk-review ${className}`.trim()}
    >
      <div className="cdk-review__intro">
        <h2 className="cdk-review__title" id={titleId}>
          {title}
        </h2>
        {summary && (
          <p className="cdk-review__summary" id={summaryId}>
            {summary}
          </p>
        )}
      </div>

      {changes.length > 0 && (
        <ul className="cdk-review__changes">
          {changes.map((change) => (
            <li className="cdk-review__change" key={change.id}>
              <span className="cdk-review__change-label">{change.label}</span>
              <div className="cdk-review__values">
                {change.before !== undefined && (
                  <span className="cdk-review__value cdk-review__value--before">
                    <span className="cdk-review__value-label">Before</span>
                    <span>{change.before}</span>
                  </span>
                )}
                {change.after !== undefined && (
                  <span className="cdk-review__value cdk-review__value--after">
                    <span className="cdk-review__value-label">After</span>
                    <span>{change.after}</span>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div aria-atomic="true" className="cdk-review__status" role="status">{feedback}</div>
      <div className="cdk-review__actions">
        <button
          className="cdk-review__button cdk-review__button--accept"
          disabled={locked}
          onClick={onAccept}
          type="button"
        >
          {acceptLabel}
        </button>
        <button
          className="cdk-review__button cdk-review__button--reject"
          disabled={locked}
          onClick={onReject}
          type="button"
        >
          {rejectLabel}
        </button>
      </div>
    </section>
  );
}
