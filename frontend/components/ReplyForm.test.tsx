/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReplyForm from "./ReplyForm";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";

const noop = jest.fn();

function renderForm(
  overrides: Partial<{
    onSubmit: (content: string) => Promise<void>;
    loading: boolean;
    disabled: boolean;
    depth: number;
  }> = {}
) {
  const props = {
    onSubmit: noop,
    loading: false,
    ...overrides,
  };
  return render(<ReplyForm {...props} />);
}

describe("ReplyForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form with correct data-testid attributes", () => {
    renderForm();

    expect(screen.getByTestId("reply-form")).toBeInTheDocument();
    expect(screen.getByTestId("reply-content-input")).toBeInTheDocument();
    expect(screen.getByTestId("reply-submit-button")).toBeInTheDocument();
  });

  it("submit button is disabled when content is empty", () => {
    renderForm();

    expect(screen.getByTestId("reply-submit-button")).toBeDisabled();
  });

  it("submit button is disabled when content is only whitespace", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "   " },
    });

    expect(screen.getByTestId("reply-submit-button")).toBeDisabled();
  });

  it("submit button is disabled when content is a single space", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: " " },
    });

    expect(screen.getByTestId("reply-submit-button")).toBeDisabled();
  });

  it("submit button is enabled when content has text", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "A valid reply" },
    });

    expect(screen.getByTestId("reply-submit-button")).not.toBeDisabled();
  });

  it("submit button is enabled with a single non-whitespace character", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "x" },
    });

    expect(screen.getByTestId("reply-submit-button")).not.toBeDisabled();
  });

  it("calls onSubmit with content when form is submitted", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "My reply content" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("My reply content");
    });
  });

  it("calls onSubmit with the exact content string entered", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "Specific reply text" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toBe("Specific reply text");
  });

  it("clears content after successful submission", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "My reply content" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() => {
      expect(
        (screen.getByTestId("reply-content-input") as HTMLTextAreaElement).value
      ).toBe("");
    });
  });

  it("does not clear content after failed submission", async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error("Network error"));
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "My reply" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() =>
      expect(screen.getByTestId("reply-form-error")).toBeInTheDocument()
    );

    expect(
      (screen.getByTestId("reply-content-input") as HTMLTextAreaElement).value
    ).toBe("My reply");
  });

  it("shows error when content exceeds max length", async () => {
    renderForm();

    const longContent = "a".repeat(FORUM_CONSTRAINTS.REPLY_CONTENT_MAX + 1);
    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: longContent },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() => {
      expect(screen.getByTestId("reply-form-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("reply-form-error")).toHaveTextContent(
      /Reply must be at most/i
    );
  });

  it("does not show error when content is exactly at max length", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    const maxContent = "a".repeat(FORUM_CONSTRAINTS.REPLY_CONTENT_MAX);
    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: maxContent },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("reply-form-error")).not.toBeInTheDocument();
  });

  it("does not call onSubmit when content exceeds max length", async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    const longContent = "a".repeat(FORUM_CONSTRAINTS.REPLY_CONTENT_MAX + 1);
    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: longContent },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() =>
      expect(screen.getByTestId("reply-form-error")).toBeInTheDocument()
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows loading state text when loading is true", () => {
    renderForm({ loading: true });

    expect(screen.getByTestId("reply-submit-button")).toHaveTextContent("Posting…");
  });

  it("shows 'Post Reply' when not loading", () => {
    renderForm({ loading: false });

    expect(screen.getByTestId("reply-submit-button")).toHaveTextContent("Post Reply");
  });

  it("does not show 'Posting…' when not loading", () => {
    renderForm({ loading: false });

    expect(screen.getByTestId("reply-submit-button")).not.toHaveTextContent("Posting…");
  });

  it("submit button is disabled when loading is true", () => {
    renderForm({ loading: true });

    expect(screen.getByTestId("reply-submit-button")).toBeDisabled();
  });

  it("submit button is disabled due to loading even when content is present", () => {
    renderForm({ loading: true });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "Valid content" },
    });

    expect(screen.getByTestId("reply-submit-button")).toBeDisabled();
  });

  it("textarea is disabled when disabled prop is true", () => {
    renderForm({ disabled: true });

    expect(screen.getByTestId("reply-content-input")).toBeDisabled();
  });

  it("submit button is disabled when disabled prop is true", () => {
    renderForm({ disabled: true });

    expect(screen.getByTestId("reply-submit-button")).toBeDisabled();
  });

  it("submit button is disabled due to disabled prop even with content present", () => {
    renderForm({ disabled: true });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "Valid content" },
    });

    expect(screen.getByTestId("reply-submit-button")).toBeDisabled();
  });

  it("textarea is not disabled when disabled prop is false (default)", () => {
    renderForm({ disabled: false });

    expect(screen.getByTestId("reply-content-input")).not.toBeDisabled();
  });

  it("returns null when depth equals MAX_REPLY_DEPTH", () => {
    renderForm({ depth: FORUM_CONSTRAINTS.MAX_REPLY_DEPTH });

    expect(screen.queryByTestId("reply-form")).not.toBeInTheDocument();
  });

  it("returns null when depth exceeds MAX_REPLY_DEPTH", () => {
    renderForm({ depth: FORUM_CONSTRAINTS.MAX_REPLY_DEPTH + 1 });

    expect(screen.queryByTestId("reply-form")).not.toBeInTheDocument();
  });

  it("renders form when depth is exactly one below MAX_REPLY_DEPTH", () => {
    renderForm({ depth: FORUM_CONSTRAINTS.MAX_REPLY_DEPTH - 1 });

    expect(screen.getByTestId("reply-form")).toBeInTheDocument();
  });

  it("renders form when depth is 0 (default)", () => {
    renderForm({ depth: 0 });

    expect(screen.getByTestId("reply-form")).toBeInTheDocument();
  });

  it("renders form when depth is 1", () => {
    renderForm({ depth: 1 });

    expect(screen.getByTestId("reply-form")).toBeInTheDocument();
  });

  it("renders form when depth is MAX_REPLY_DEPTH - 1 and not when depth is MAX_REPLY_DEPTH", () => {
    const { unmount } = renderForm({ depth: FORUM_CONSTRAINTS.MAX_REPLY_DEPTH - 1 });
    expect(screen.getByTestId("reply-form")).toBeInTheDocument();
    unmount();

    renderForm({ depth: FORUM_CONSTRAINTS.MAX_REPLY_DEPTH });
    expect(screen.queryByTestId("reply-form")).not.toBeInTheDocument();
  });

  it("shows error from onSubmit rejection", async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error("Network error"));
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "My reply" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() => {
      expect(screen.getByTestId("reply-form-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("reply-form-error")).toHaveTextContent("Network error");
  });

  it("shows fallback error when onSubmit throws non-Error", async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce("string error");
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "My reply" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));

    await waitFor(() => {
      expect(screen.getByTestId("reply-form-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("reply-form-error")).toHaveTextContent(
      "Failed to post reply"
    );
  });

  it("clears error before each new submission attempt", async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "Reply text" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));
    await waitFor(() =>
      expect(screen.getByTestId("reply-form-error")).toBeInTheDocument()
    );

    // Re-type content since form may have cleared on success
    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "Reply text again" },
    });

    fireEvent.submit(screen.getByTestId("reply-form"));
    await waitFor(() =>
      expect(screen.queryByTestId("reply-form-error")).not.toBeInTheDocument()
    );
  });

  it("displays character counter", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("reply-content-input"), {
      target: { value: "Hello" },
    });

    expect(screen.getByTestId("reply-content-counter")).toHaveTextContent(
      `5 / ${FORUM_CONSTRAINTS.REPLY_CONTENT_MAX}`
    );
  });

  it("character counter starts at 0", () => {
    renderForm();

    expect(screen.getByTestId("reply-content-counter")).toHaveTextContent(
      `0 / ${FORUM_CONSTRAINTS.REPLY_CONTENT_MAX}`
    );
  });

  it("renders with depth 0 by default", () => {
    renderForm();

    expect(screen.getByTestId("reply-form")).toBeInTheDocument();
  });
});
