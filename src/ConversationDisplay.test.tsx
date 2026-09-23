import { fireEvent, render, screen } from "@testing-library/react";
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


describe("composer and history safeguards", () => {
  const defaults = { messages: [], value: "hello", onSubmit: vi.fn(), onValueChange: vi.fn() };

  it("gives multiple composers independent labels, help, and refs", () => {
    const first = { current: null as HTMLInputElement | HTMLTextAreaElement | null };
    const log = { current: null as HTMLDivElement | null };
    render(<><ConversationDisplay {...defaults} inputLabel="First message" inputRef={first} logRef={log} />
      <ConversationDisplay {...defaults} inputLabel="Second message" /></>);
    const one = screen.getByLabelText("First message");
    const two = screen.getByLabelText("Second message");
    expect(one.id).not.toBe(two.id);
    expect(one.getAttribute("aria-describedby")).not.toBe(two.getAttribute("aria-describedby"));
    expect(first.current).toBe(one);
    expect(log.current).toBe(screen.getAllByRole("log")[0]);
    expect(log.current).toHaveAttribute("tabindex", "0");
  });

  it.each(["", "   "])("does not submit blank value %j", async (value) => {
    const onSubmit = vi.fn();
    render(<ConversationDisplay {...defaults} onSubmit={onSubmit} value={value} />);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks disabled and oversized controlled values", async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<ConversationDisplay {...defaults} onSubmit={onSubmit} disabled />);
    expect(screen.getByLabelText("Message")).toBeDisabled();
    rerender(<ConversationDisplay {...defaults} onSubmit={onSubmit} maxLength={3} />);
    expect(screen.getByLabelText("Message")).toHaveAttribute("maxlength", "3");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts a configurable longer message", async () => {
    const onSubmit = vi.fn();
    const message = "a".repeat(600);
    render(<ConversationDisplay {...defaults} onSubmit={onSubmit} maxLength={1000} value={message} />);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledWith(message);
  });

  it("supports multiline editing and deliberate keyboard submission", async () => {
    const onSubmit = vi.fn();
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<ConversationDisplay {...defaults} multiline onSubmit={onSubmit} onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Message");
    expect(input.tagName).toBe("TEXTAREA");
    await user.click(input);
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onValueChange).toHaveBeenCalledWith("hello\n");
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("hello");
  });

  it("does not send while choosing IME characters", () => {
    const onSubmit = vi.fn();
    render(<ConversationDisplay {...defaults} onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Message");
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.submit(input.closest("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("preserves the reader's position and offers a jump control", () => {
    const scroll = vi.spyOn(Element.prototype, "scrollTo");
    const { rerender } = render(<ConversationDisplay {...defaults} messages={[{ id: "old", role: "assistant", text: "Older response" }]} />);
    const log = screen.getByRole("log");
    Object.defineProperties(log, { scrollHeight: { configurable: true, value: 1000 }, clientHeight: { configurable: true, value: 300 } });
    fireEvent.scroll(log, { target: { scrollTop: 0 } });
    scroll.mockClear();
    rerender(<ConversationDisplay {...defaults} messages={[{ id: "new", role: "assistant", text: "New response" }]} />);
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Jump to latest" }));
    expect(scroll).toHaveBeenCalled();
    expect(log).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Jump to latest" })).not.toBeInTheDocument();
    scroll.mockRestore();
  });

  it("respects reduced motion and does not scroll on status-only changes", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const scroll = vi.spyOn(Element.prototype, "scrollTo");
    const { rerender } = render(<ConversationDisplay {...defaults} />);
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }));
    scroll.mockClear();
    rerender(<ConversationDisplay {...defaults} status="thinking" />);
    expect(scroll).not.toHaveBeenCalled();
    scroll.mockRestore();
    vi.unstubAllGlobals();
  });
});
