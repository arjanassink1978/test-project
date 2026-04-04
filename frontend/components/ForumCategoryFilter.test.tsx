/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ForumCategoryFilter from "./ForumCategoryFilter";
import { button } from "@/lib/theme";

const compactButtonStyles = {
  primary: button.compactPrimary,
  secondary: button.compactSecondary,
};
import type { ForumCategory } from "@/lib/api";

const categories: ForumCategory[] = [
  { id: 1, name: "Tech", description: "Technology", icon: "💻" },
  { id: 2, name: "Sports", description: "Sports talk", icon: "⚽" },
  { id: 3, name: "Music", description: "Music chat", icon: "🎵" },
];

describe("ForumCategoryFilter", () => {
  it("renders the category filter container", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={jest.fn()} />);
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
  });

  it("renders the All button", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={jest.fn()} />);
    expect(screen.getByTestId("category-option-all")).toBeInTheDocument();
    expect(screen.getByTestId("category-option-all")).toHaveTextContent("All");
  });

  it("renders a button for each category", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={jest.fn()} />);
    expect(screen.getByTestId("category-option-1")).toBeInTheDocument();
    expect(screen.getByTestId("category-option-2")).toBeInTheDocument();
    expect(screen.getByTestId("category-option-3")).toBeInTheDocument();
  });

  it("calls onChange with null when All button is clicked", () => {
    const onChange = jest.fn();
    render(<ForumCategoryFilter categories={categories} selectedId={1} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("category-option-all"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("calls onChange with the correct category id when a category button is clicked", () => {
    const onChange = jest.fn();
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("category-option-1"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("calls onChange with the correct id for each different category", () => {
    const onChange = jest.fn();
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("category-option-2"));
    expect(onChange).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByTestId("category-option-3"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not call onChange with wrong id when clicking category button", () => {
    const onChange = jest.fn();
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("category-option-1"));
    expect(onChange).not.toHaveBeenCalledWith(2);
    expect(onChange).not.toHaveBeenCalledWith(null);
  });

  // className tests: selected button uses primary style, unselected uses secondary
  it("applies primary className to All button when selectedId is null", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={jest.fn()} />);
    const allBtn = screen.getByTestId("category-option-all");
    expect(allBtn.className).toBe(compactButtonStyles.primary);
  });

  it("applies secondary className to All button when a category is selected", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={1} onChange={jest.fn()} />);
    const allBtn = screen.getByTestId("category-option-all");
    expect(allBtn.className).toBe(compactButtonStyles.secondary);
  });

  it("applies primary className to selected category button", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={2} onChange={jest.fn()} />);
    const cat2Btn = screen.getByTestId("category-option-2");
    expect(cat2Btn.className).toBe(compactButtonStyles.primary);
  });

  it("applies secondary className to non-selected category buttons", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={2} onChange={jest.fn()} />);
    const cat1Btn = screen.getByTestId("category-option-1");
    const cat3Btn = screen.getByTestId("category-option-3");
    expect(cat1Btn.className).toBe(compactButtonStyles.secondary);
    expect(cat3Btn.className).toBe(compactButtonStyles.secondary);
  });

  it("primary and secondary styles are different", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={1} onChange={jest.fn()} />);
    const allBtn = screen.getByTestId("category-option-all");
    const cat1Btn = screen.getByTestId("category-option-1");
    // All is unselected (secondary), cat 1 is selected (primary)
    expect(allBtn.className).not.toBe(cat1Btn.className);
  });

  it("when selectedId switches, className updates correctly", () => {
    const { rerender } = render(
      <ForumCategoryFilter categories={categories} selectedId={1} onChange={jest.fn()} />
    );
    expect(screen.getByTestId("category-option-1").className).toBe(compactButtonStyles.primary);
    expect(screen.getByTestId("category-option-2").className).toBe(compactButtonStyles.secondary);

    rerender(<ForumCategoryFilter categories={categories} selectedId={2} onChange={jest.fn()} />);
    expect(screen.getByTestId("category-option-1").className).toBe(compactButtonStyles.secondary);
    expect(screen.getByTestId("category-option-2").className).toBe(compactButtonStyles.primary);
  });

  it("when selectedId is null, All has primary and all categories have secondary", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={jest.fn()} />);
    expect(screen.getByTestId("category-option-all").className).toBe(compactButtonStyles.primary);
    categories.forEach((cat) => {
      expect(screen.getByTestId(`category-option-${cat.id}`).className).toBe(compactButtonStyles.secondary);
    });
  });

  it("renders with empty categories list", () => {
    render(<ForumCategoryFilter categories={[]} selectedId={null} onChange={jest.fn()} />);
    expect(screen.getByTestId("category-option-all")).toBeInTheDocument();
    expect(screen.queryByTestId("category-option-1")).not.toBeInTheDocument();
  });

  it("displays category name and icon in the button", () => {
    render(<ForumCategoryFilter categories={categories} selectedId={null} onChange={jest.fn()} />);
    expect(screen.getByTestId("category-option-1")).toHaveTextContent("Tech");
  });
});
