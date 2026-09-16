import type { PromptChipsProps } from "./types";

export function PromptChips({
  suggestions,
  onSelect,
  disabled = false,
  label = "Try a prompt",
}: PromptChipsProps) {
  return (
    <section aria-label={label} className="cdk-prompts">
      {suggestions.map((suggestion) => (
        <button
          className="cdk-prompt"
          disabled={disabled}
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          type="button"
        >
          {suggestion}
        </button>
      ))}
    </section>
  );
}

