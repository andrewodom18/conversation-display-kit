import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConversationDisplay } from "./ConversationDisplay";

describe("ConversationDisplay", () => {
  it("renders messages with accessible roles", () => {
    render(
      <ConversationDisplay
        messages={[{ id: "1", role: "assistant", text: "How can I help?" }]}
        onSubmit={() => undefined}
        onValueChange={() => undefined}
        value=""
      />,
    );

    expect(screen.getByRole("log")).toHaveTextContent("How can I help?");
    expect(screen.getByLabelText("assistant message")).toBeInTheDocument();
  });

  it("submits a trimmed message from the keyboard", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    function ControlledDisplay() {
      return (
        <ConversationDisplay
          messages={[]}
          onSubmit={onSubmit}
          onValueChange={() => undefined}
          value="  Plan our evening  "
        />
      );
    }

    render(<ControlledDisplay />);
    await user.click(screen.getByLabelText("Message"));
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("Plan our evening");
  });

  it("announces status changes", () => {
    render(
      <ConversationDisplay
        messages={[]}
        onSubmit={() => undefined}
        onValueChange={() => undefined}
        status="thinking"
        value=""
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Thinking");
  });
});

