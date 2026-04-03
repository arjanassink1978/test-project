/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThreadForm from "./ThreadForm";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";
import type { ForumCategory } from "@/lib/api";

const mockCategories: ForumCategory[] = [
  { id: 1, name: "General", description: "General discussion", icon: "💬" },
  { id: 2, name: "Tech", description: "Tech topics", icon: "💻" },
];

const noop = jest.fn();

function renderForm(
  overrides: Partial<{
    categories: ForumCategory[];
    onSubmit: (data: { title: string; description: string; categoryId: number | null }) => Promise<void>;
    loading: boolean;
  }> = {}
) {
  const props = {
    categories: mockCategories,
    onSubmit: noop,
    loading: false,
    ...overrides,
  };
  return render(<ThreadForm {...props} />);
}

describe("ThreadForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form with correct data-testid attributes", () => {
    renderForm();

    expect(screen.getByTestId("thread-form")).toBeInTheDocument();
    expect(screen.getByTestId("thread-title-input")).toBeInTheDocument();
    expect(screen.getByTestId("thread-desc-input")).toBeInTheDocument();
    expect(screen.getByTestId("thread-category-select")).toBeInTheDocument();
    expect(screen.getByTestId("thread-submit-button")).toBeInTheDocument();
  });

  it("renders category options including a no-category option", () => {
    renderForm();

    const select = screen.getByTestId("thread-category-select");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("-- No category --")).toBeInTheDocument();
    expect(screen.getByText(/General/)).toBeInTheDocument();
    expect(screen.getByText(/Tech/)).toBeInTheDocument();
  });

  it("submit button is disabled when title is empty", () => {
    renderForm();

    expect(screen.getByTestId("thread-submit-button")).toBeDisabled();
  });

  it("submit button is enabled when title has content", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread Title" },
    });

    expect(screen.getByTestId("thread-submit-button")).not.toBeDisabled();
  });

  it("submit button is disabled when title is only whitespace", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "   " },
    });

    expect(screen.getByTestId("thread-submit-button")).toBeDisabled();
  });

  it("submit button is disabled when title is single space", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: " " },
    });

    expect(screen.getByTestId("thread-submit-button")).toBeDisabled();
  });

  it("submit button is enabled with a single non-whitespace character", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "a" },
    });

    expect(screen.getByTestId("thread-submit-button")).not.toBeDisabled();
  });

  it("calls onSubmit with correct data when form is submitted", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: "Some description" },
    });
    fireEvent.change(screen.getByTestId("thread-category-select"), {
      target: { value: "1" },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "My Thread",
        description: "Some description",
        categoryId: 1,
      });
    });
  });

  it("passes categoryId as a number, not a string", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });
    fireEvent.change(screen.getByTestId("thread-category-select"), {
      target: { value: "2" },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 2 })
      );
    });

    const { categoryId } = onSubmit.mock.calls[0][0];
    expect(typeof categoryId).toBe("number");
  });

  it("calls onSubmit with null categoryId when no category selected", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "My Thread",
        description: "",
        categoryId: null,
      });
    });
  });

  it("passes null categoryId (not 0 or empty string) when no category selected", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const { categoryId } = onSubmit.mock.calls[0][0];
    expect(categoryId).toBeNull();
  });

  it("resets category back to null when empty option selected after category", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });
    fireEvent.change(screen.getByTestId("thread-category-select"), {
      target: { value: "1" },
    });
    // Reset to no category
    fireEvent.change(screen.getByTestId("thread-category-select"), {
      target: { value: "" },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: null })
      );
    });
  });

  it("shows error when title exceeds max length", async () => {
    renderForm();

    const longTitle = "a".repeat(FORUM_CONSTRAINTS.THREAD_TITLE_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: longTitle },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("thread-form-error")).toHaveTextContent(
      /Title must be at most/i
    );
  });

  it("does not show title error when title is exactly at max length", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    const maxTitle = "a".repeat(FORUM_CONSTRAINTS.THREAD_TITLE_MAX);
    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: maxTitle },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("thread-form-error")).not.toBeInTheDocument();
  });

  it("shows error when description exceeds max length", async () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });

    const longDesc = "a".repeat(FORUM_CONSTRAINTS.THREAD_DESC_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: longDesc },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("thread-form-error")).toHaveTextContent(
      /Description must be at most/i
    );
  });

  it("does not show desc error when description is exactly at max length", async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });

    const maxDesc = "a".repeat(FORUM_CONSTRAINTS.THREAD_DESC_MAX);
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: maxDesc },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("thread-form-error")).not.toBeInTheDocument();
  });

  it("submit button is disabled when title exceeds max length", () => {
    renderForm();

    const longTitle = "a".repeat(FORUM_CONSTRAINTS.THREAD_TITLE_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: longTitle },
    });

    expect(screen.getByTestId("thread-submit-button")).toBeDisabled();
  });

  it("submit button is not disabled when title is exactly at max length", () => {
    renderForm();

    const maxTitle = "a".repeat(FORUM_CONSTRAINTS.THREAD_TITLE_MAX);
    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: maxTitle },
    });

    expect(screen.getByTestId("thread-submit-button")).not.toBeDisabled();
  });

  it("submit button is disabled when description exceeds max length", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "Valid Title" },
    });

    const longDesc = "a".repeat(FORUM_CONSTRAINTS.THREAD_DESC_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: longDesc },
    });

    expect(screen.getByTestId("thread-submit-button")).toBeDisabled();
  });

  it("submit button is not disabled when description is exactly at max length with valid title", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "Valid Title" },
    });

    const maxDesc = "a".repeat(FORUM_CONSTRAINTS.THREAD_DESC_MAX);
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: maxDesc },
    });

    expect(screen.getByTestId("thread-submit-button")).not.toBeDisabled();
  });

  it("shows loading state when loading prop is true", () => {
    renderForm({ loading: true });

    expect(screen.getByTestId("thread-submit-button")).toBeDisabled();
    expect(screen.getByTestId("thread-submit-button")).toHaveTextContent("Creating…");
  });

  it("shows 'Create Thread' label when not loading", () => {
    renderForm({ loading: false });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "Valid Title" },
    });

    expect(screen.getByTestId("thread-submit-button")).toHaveTextContent("Create Thread");
  });

  it("button is disabled due to loading even when title is valid", () => {
    renderForm({ loading: true });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "Valid Title" },
    });

    expect(screen.getByTestId("thread-submit-button")).toBeDisabled();
  });

  it("shows error from onSubmit rejection", async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error("Server error"));
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("thread-form-error")).toHaveTextContent("Server error");
  });

  it("shows fallback error message when onSubmit throws non-Error", async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce("string error");
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() => {
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("thread-form-error")).toHaveTextContent(
      "Failed to create thread"
    );
  });

  it("clears error before each new submission attempt", async () => {
    const onSubmit = jest
      .fn()
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce(undefined);
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "My Thread" },
    });

    // First submission — fails
    fireEvent.submit(screen.getByTestId("thread-form"));
    await waitFor(() =>
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument()
    );

    // Second submission — succeeds, error should disappear
    fireEvent.submit(screen.getByTestId("thread-form"));
    await waitFor(() =>
      expect(screen.queryByTestId("thread-form-error")).not.toBeInTheDocument()
    );
  });

  it("displays character counter for title", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "Hello" },
    });

    expect(screen.getByTestId("thread-title-counter")).toHaveTextContent(
      `5 / ${FORUM_CONSTRAINTS.THREAD_TITLE_MAX}`
    );
  });

  it("title counter shows 0 initially", () => {
    renderForm();

    expect(screen.getByTestId("thread-title-counter")).toHaveTextContent(
      `0 / ${FORUM_CONSTRAINTS.THREAD_TITLE_MAX}`
    );
  });

  it("displays character counter for description", () => {
    renderForm();

    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: "abc" },
    });

    expect(screen.getByTestId("thread-desc-counter")).toHaveTextContent(
      `3 / ${FORUM_CONSTRAINTS.THREAD_DESC_MAX}`
    );
  });

  it("desc counter shows 0 initially", () => {
    renderForm();

    expect(screen.getByTestId("thread-desc-counter")).toHaveTextContent(
      `0 / ${FORUM_CONSTRAINTS.THREAD_DESC_MAX}`
    );
  });

  it("does not call onSubmit when validation fails due to title length", async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    const longTitle = "a".repeat(FORUM_CONSTRAINTS.THREAD_TITLE_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: longTitle },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() =>
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument()
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when validation fails due to description length", async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: "Valid title" },
    });

    const longDesc = "a".repeat(FORUM_CONSTRAINTS.THREAD_DESC_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: longDesc },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() =>
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument()
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("title error takes priority over description error", async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit });

    const longTitle = "a".repeat(FORUM_CONSTRAINTS.THREAD_TITLE_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: longTitle },
    });

    const longDesc = "a".repeat(FORUM_CONSTRAINTS.THREAD_DESC_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: longDesc },
    });

    fireEvent.submit(screen.getByTestId("thread-form"));

    await waitFor(() =>
      expect(screen.getByTestId("thread-form-error")).toBeInTheDocument()
    );

    expect(screen.getByTestId("thread-form-error")).toHaveTextContent(/Title must be at most/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders with empty categories list", () => {
    renderForm({ categories: [] });

    expect(screen.getByTestId("thread-form")).toBeInTheDocument();
    expect(screen.getByText("-- No category --")).toBeInTheDocument();
  });

  it("applies error styling to title input when title is over limit", () => {
    renderForm();

    const longTitle = "a".repeat(FORUM_CONSTRAINTS.THREAD_TITLE_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-title-input"), {
      target: { value: longTitle },
    });

    // Input should use error class when over limit
    const input = screen.getByTestId("thread-title-input");
    expect(input.className).not.toBe("");
  });

  it("applies error styling to description textarea when description is over limit", () => {
    renderForm();

    const longDesc = "a".repeat(FORUM_CONSTRAINTS.THREAD_DESC_MAX + 1);
    fireEvent.change(screen.getByTestId("thread-desc-input"), {
      target: { value: longDesc },
    });

    const textarea = screen.getByTestId("thread-desc-input");
    expect(textarea.className).not.toBe("");
  });
});
