/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import VoteButtons from "./VoteButtons";

describe("VoteButtons", () => {
  const defaultProps = {
    score: 5,
    postId: 1,
    postType: "thread" as const,
    onVote: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with correct data-testid attributes", () => {
    render(<VoteButtons {...defaultProps} />);

    expect(screen.getByTestId("vote-buttons")).toBeInTheDocument();
    expect(screen.getByTestId("upvote-button")).toBeInTheDocument();
    expect(screen.getByTestId("downvote-button")).toBeInTheDocument();
    expect(screen.getByTestId("vote-score")).toBeInTheDocument();
  });

  it("displays the score", () => {
    render(<VoteButtons {...defaultProps} score={42} />);

    expect(screen.getByTestId("vote-score")).toHaveTextContent("42");
  });

  it("shows positive score in indigo color", () => {
    render(<VoteButtons {...defaultProps} score={5} />);

    expect(screen.getByTestId("vote-score")).toHaveClass("text-indigo-600");
  });

  it("shows negative score in red color", () => {
    render(<VoteButtons {...defaultProps} score={-3} />);

    expect(screen.getByTestId("vote-score")).toHaveClass("text-red-600");
  });

  it("calls onVote(1) when upvote button clicked", () => {
    const onVote = jest.fn();
    render(<VoteButtons {...defaultProps} onVote={onVote} />);

    fireEvent.click(screen.getByTestId("upvote-button"));

    expect(onVote).toHaveBeenCalledWith(1);
  });

  it("calls onVote(-1) when downvote button clicked", () => {
    const onVote = jest.fn();
    render(<VoteButtons {...defaultProps} onVote={onVote} />);

    fireEvent.click(screen.getByTestId("downvote-button"));

    expect(onVote).toHaveBeenCalledWith(-1);
  });

  it("disables both buttons when disabled prop is true", () => {
    render(<VoteButtons {...defaultProps} disabled={true} />);

    expect(screen.getByTestId("upvote-button")).toBeDisabled();
    expect(screen.getByTestId("downvote-button")).toBeDisabled();
  });

  it("enables both buttons when disabled prop is false", () => {
    render(<VoteButtons {...defaultProps} disabled={false} />);

    expect(screen.getByTestId("upvote-button")).not.toBeDisabled();
    expect(screen.getByTestId("downvote-button")).not.toBeDisabled();
  });

  it("renders as compact badge (not vertical column)", () => {
    render(<VoteButtons {...defaultProps} />);

    // Should be a horizontal inline-flex, not a vertical flex-col
    const container = screen.getByTestId("vote-buttons");
    expect(container).toHaveClass("inline-flex");
    expect(container).not.toHaveClass("flex-col");
  });
});
