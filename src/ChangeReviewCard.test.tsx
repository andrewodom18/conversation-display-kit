import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChangeReviewCard } from "./ChangeReviewCard";
import type { ReviewChange } from "./types";

const changes: ReviewChange[] = [
  {
    id: "pickup",
    label: "School pickup",
    before: "Alex at 3:00 PM",
    after: "Sam at 3:30 PM",
  },
  { id: "dinner", label: "Dinner", after: "6:00 PM" },
];

describe("ChangeReviewCard", () => {
  it("exposes a labelled region and a semantic list of changes", () => {
    render(
      <ChangeReviewCard
        changes={changes}
        onAccept={() => undefined}
        onReject={() => undefined}
        summary="Two activities change. The appointment stays fixed."
        title="Review this plan"
      />,
    );

    const region = screen.getByRole("region", { name: "Review this plan" });
    expect(region).toHaveAccessibleDescription(
      "Two activities change. The appointment stays fixed.",
    );
    expect(within(region).getAllByRole("listitem")).toHaveLength(2);
    expect(within(region).getByText("Alex at 3:00 PM")).toBeInTheDocument();
    expect(within(region).getByText("Sam at 3:30 PM")).toBeInTheDocument();
    expect(within(region).getByText("Dinner")).toBeInTheDocument();
  });

  it("supports keyboard acceptance and rejection with independent callbacks", async () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(
      <ChangeReviewCard
        changes={changes}
        onAccept={onAccept}
        onReject={onReject}
        title="Review this plan"
      />,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Apply" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onReject).not.toHaveBeenCalled();

    await user.tab();
    expect(screen.getByRole("button", { name: "Keep current" })).toHaveFocus();
    await user.keyboard(" ");
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("supports custom action labels and disables both actions", async () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const user = userEvent.setup();
    render(
      <ChangeReviewCard
        acceptLabel="Use proposal"
        changes={[]}
        disabled
        onAccept={onAccept}
        onReject={onReject}
        rejectLabel="Discard proposal"
        title="Review this plan"
      />,
    );

    const accept = screen.getByRole("button", { name: "Use proposal" });
    const reject = screen.getByRole("button", { name: "Discard proposal" });
    expect(accept).toBeDisabled();
    expect(reject).toBeDisabled();
    await user.click(accept);
    await user.click(reject);
    expect(onAccept).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("review lifecycle", () => {
  it.each(["applying", "applied", "rejected"] as const)("locks actions when %s", (status) => {
    render(<ChangeReviewCard title="Review" changes={changes} status={status} onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Keep current" })).toBeDisabled();
    expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
    expect(screen.getByRole("region")).toHaveAttribute("aria-busy", String(status === "applying"));
  });

  it("announces a retryable error and custom status text", async () => {
    const onAccept = vi.fn();
    render(<ChangeReviewCard title="Review" changes={changes} status="error" statusMessage="Connection lost. Retry to apply." onAccept={onAccept} onReject={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent("Connection lost. Retry to apply.");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onAccept).toHaveBeenCalledOnce();
  });
});
