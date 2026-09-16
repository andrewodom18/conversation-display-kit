import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PromptChips } from "./PromptChips";

describe("PromptChips", () => {
  it("calls onSelect for the chosen suggestion", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <PromptChips suggestions={["Plan dinner"]} onSelect={onSelect} />,
    );

    await user.click(screen.getByRole("button", { name: "Plan dinner" }));
    expect(onSelect).toHaveBeenCalledWith("Plan dinner");
  });

  it("disables suggestions", () => {
    render(
      <PromptChips
        disabled
        suggestions={["Plan dinner"]}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Plan dinner" })).toBeDisabled();
  });
});
