/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryForm from "./CategoryForm";
import { CATEGORY_NAME_MAX, CATEGORY_DESCRIPTION_MAX } from "@/lib/adminConstants";

const mockCategory = {
  id: 1,
  name: "Technology",
  description: "Tech discussions",
  icon: "💻",
};

describe("CategoryForm", () => {
  it("renders form for new category when no category prop provided", () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("category-form")).toBeInTheDocument();
    expect(screen.getByTestId("category-form-heading")).toHaveTextContent("New Category");
  });

  it("renders form for edit when category prop provided", () => {
    render(<CategoryForm category={mockCategory} onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("category-form-heading")).toHaveTextContent("Edit Category");
  });

  it("prefills fields when editing", () => {
    render(<CategoryForm category={mockCategory} onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("category-name-input")).toHaveValue("Technology");
    expect(screen.getByTestId("category-description-input")).toHaveValue("Tech discussions");
    expect(screen.getByTestId("category-icon-input")).toHaveValue("💻");
  });

  it("renders empty fields for new category", () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("category-name-input")).toHaveValue("");
    expect(screen.getByTestId("category-description-input")).toHaveValue("");
    expect(screen.getByTestId("category-icon-input")).toHaveValue("");
  });

  it("has all required data-testid attributes", () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("category-form")).toBeInTheDocument();
    expect(screen.getByTestId("category-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("category-description-input")).toBeInTheDocument();
    expect(screen.getByTestId("category-icon-input")).toBeInTheDocument();
    expect(screen.getByTestId("category-form-submit")).toBeInTheDocument();
    expect(screen.getByTestId("category-form-cancel")).toBeInTheDocument();
    expect(screen.getByTestId("category-name-counter")).toBeInTheDocument();
    expect(screen.getByTestId("category-description-counter")).toBeInTheDocument();
  });

  it("enforces maxLength on name input", () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("category-name-input")).toHaveAttribute("maxLength", String(CATEGORY_NAME_MAX));
  });

  it("enforces maxLength on description textarea", () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByTestId("category-description-input")).toHaveAttribute("maxLength", String(CATEGORY_DESCRIPTION_MAX));
  });

  it("shows character counter for name", () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("category-name-input"), { target: { value: "Tech" } });
    expect(screen.getByTestId("category-name-counter")).toHaveTextContent(`4/${CATEGORY_NAME_MAX}`);
  });

  it("shows character counter for description", () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("category-description-input"), { target: { value: "Hello" } });
    expect(screen.getByTestId("category-description-counter")).toHaveTextContent(`5/${CATEGORY_DESCRIPTION_MAX}`);
  });

  it("shows error when name is empty on submit", async () => {
    render(<CategoryForm onSave={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.click(screen.getByTestId("category-form-submit"));
    expect(await screen.findByTestId("category-form-error")).toBeInTheDocument();
    expect(screen.getByTestId("category-form-error")).toHaveTextContent(/required/i);
  });

  it("calls onSave with correct data when valid", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<CategoryForm onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("category-name-input"), { target: { value: "Science" } });
    fireEvent.change(screen.getByTestId("category-description-input"), { target: { value: "Science topics" } });
    fireEvent.change(screen.getByTestId("category-icon-input"), { target: { value: "🔬" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("category-form-submit"));
    });
    expect(onSave).toHaveBeenCalledWith({ name: "Science", description: "Science topics", icon: "🔬" });
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = jest.fn();
    render(<CategoryForm onSave={jest.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId("category-form-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows error when onSave throws", async () => {
    const onSave = jest.fn().mockRejectedValue(new Error("Server error"));
    render(<CategoryForm onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("category-name-input"), { target: { value: "Test" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("category-form-submit"));
    });
    expect(await screen.findByTestId("category-form-error")).toHaveTextContent("Server error");
  });

  it("shows saving state while submitting", async () => {
    let resolve: () => void;
    const onSave = jest.fn(() => new Promise<void>((res) => { resolve = res; }));
    render(<CategoryForm onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("category-name-input"), { target: { value: "Test" } });
    fireEvent.click(screen.getByTestId("category-form-submit"));
    expect(screen.getByTestId("category-form-submit")).toHaveTextContent(/saving/i);
    await act(async () => { resolve!(); });
  });

  it("trims whitespace from name on save", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<CategoryForm onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("category-name-input"), { target: { value: "  Tech  " } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("category-form-submit"));
    });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Tech" }));
  });
});
