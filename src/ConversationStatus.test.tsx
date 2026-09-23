import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConversationStatus } from "./ConversationStatus";

describe("ConversationStatus", () => {
  it.each([
    ["idle", "Ready"], ["listening", "Listening"], ["thinking", "Thinking"], ["error", "Needs attention"],
  ] as const)("announces %s with a textual label", (value, label) => {
    render(<ConversationStatus value={value} />);
    expect(screen.getByRole("status")).toHaveTextContent(label);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
  it("supports custom text while retaining defaults for other states", () => {
    const { rerender } = render(<ConversationStatus value="thinking" labels={{ thinking: "Planning" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Planning");
    rerender(<ConversationStatus value="error" labels={{ thinking: "Planning" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Needs attention");
  });
});
