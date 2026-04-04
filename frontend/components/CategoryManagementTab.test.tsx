/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryManagementTab from "./CategoryManagementTab";

const mockCategories = [
  { id: 1, name: "Technology", description: "Tech stuff", icon: "💻" },
  { id: 2, name: "Sports", description: "Sports talk", icon: "⚽" },
];

jest.mock("@/lib/api", () => ({
  getForumCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

import * as api from "@/lib/api";

describe("CategoryManagementTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getForumCategories as jest.Mock).mockResolvedValue(mockCategories);
  });

  it("shows loading state initially", async () => {
    let resolve: (v: typeof mockCategories) => void;
    (api.getForumCategories as jest.Mock).mockReturnValue(new Promise((res) => { resolve = res; }));
    render(<CategoryManagementTab token="test-token" />);
    expect(screen.getByTestId("category-management-loading")).toBeInTheDocument();
    await act(async () => { resolve!(mockCategories); });
  });

  it("renders category list after loading", async () => {
    render(<CategoryManagementTab token="test-token" />);
    expect(await screen.findByTestId("category-list")).toBeInTheDocument();
    expect(screen.getByTestId("category-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("category-item-2")).toBeInTheDocument();
  });

  it("has correct data-testid attributes", async () => {
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("category-management-tab");
    expect(screen.getByTestId("add-category-button")).toBeInTheDocument();
    expect(screen.getByTestId("category-name-1")).toHaveTextContent("Technology");
    expect(screen.getByTestId("edit-category-1")).toBeInTheDocument();
    expect(screen.getByTestId("delete-category-1")).toBeInTheDocument();
  });

  it("shows no-categories message when list is empty", async () => {
    (api.getForumCategories as jest.Mock).mockResolvedValue([]);
    render(<CategoryManagementTab token="test-token" />);
    expect(await screen.findByTestId("no-categories-message")).toBeInTheDocument();
  });

  it("shows error when loading fails", async () => {
    (api.getForumCategories as jest.Mock).mockRejectedValue(new Error("Network error"));
    render(<CategoryManagementTab token="test-token" />);
    expect(await screen.findByTestId("category-management-error")).toHaveTextContent("Network error");
  });

  it("shows category form when New Category is clicked", async () => {
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("add-category-button");
    fireEvent.click(screen.getByTestId("add-category-button"));
    expect(screen.getByTestId("category-form-container")).toBeInTheDocument();
    expect(screen.getByTestId("category-form")).toBeInTheDocument();
  });

  it("shows category form pre-filled when Edit is clicked", async () => {
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("edit-category-1");
    fireEvent.click(screen.getByTestId("edit-category-1"));
    expect(screen.getByTestId("category-form-container")).toBeInTheDocument();
    expect(screen.getByTestId("category-name-input")).toHaveValue("Technology");
  });

  it("hides form when Cancel is clicked", async () => {
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("add-category-button");
    fireEvent.click(screen.getByTestId("add-category-button"));
    expect(screen.getByTestId("category-form-container")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("category-form-cancel"));
    expect(screen.queryByTestId("category-form-container")).not.toBeInTheDocument();
  });

  it("calls createCategory and reloads on save (new category)", async () => {
    (api.createCategory as jest.Mock).mockResolvedValue({ id: 3, name: "New", description: "", icon: "" });
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("add-category-button");
    fireEvent.click(screen.getByTestId("add-category-button"));
    fireEvent.change(screen.getByTestId("category-name-input"), { target: { value: "New Cat" } });
    await act(async () => {
      fireEvent.click(screen.getByTestId("category-form-submit"));
    });
    expect(api.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New Cat" }),
      "test-token"
    );
    await waitFor(() => expect(api.getForumCategories).toHaveBeenCalledTimes(2));
  });

  it("calls updateCategory and reloads on save (edit)", async () => {
    (api.updateCategory as jest.Mock).mockResolvedValue(mockCategories[0]);
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("edit-category-1");
    fireEvent.click(screen.getByTestId("edit-category-1"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("category-form-submit"));
    });
    expect(api.updateCategory).toHaveBeenCalledWith(1, expect.any(Object), "test-token");
    await waitFor(() => expect(api.getForumCategories).toHaveBeenCalledTimes(2));
  });

  it("calls deleteCategory and reloads on delete", async () => {
    (api.deleteCategory as jest.Mock).mockResolvedValue(undefined);
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("delete-category-1");
    await act(async () => {
      fireEvent.click(screen.getByTestId("delete-category-1"));
    });
    expect(api.deleteCategory).toHaveBeenCalledWith(1, "test-token");
    await waitFor(() => expect(api.getForumCategories).toHaveBeenCalledTimes(2));
  });

  it("shows error when deleteCategory fails", async () => {
    (api.deleteCategory as jest.Mock).mockRejectedValue(new Error("Delete failed"));
    render(<CategoryManagementTab token="test-token" />);
    await screen.findByTestId("delete-category-1");
    await act(async () => {
      fireEvent.click(screen.getByTestId("delete-category-1"));
    });
    expect(await screen.findByTestId("category-management-error")).toHaveTextContent("Delete failed");
  });
});
