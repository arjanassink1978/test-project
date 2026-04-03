/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReplyItem from "./ReplyItem";
import type { ForumReplyResponse } from "@/lib/api";

// Mock child components to keep tests focused
jest.mock("@/components/VoteButtons", () => {
  const MockVoteButtons = ({
    score,
    onVote,
    disabled,
  }: {
    score: number;
    onVote: (v: number) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="vote-buttons">
      <button data-testid="upvote-button" onClick={() => onVote(1)} disabled={disabled}>▲</button>
      <span data-testid="vote-score">{score}</span>
      <button data-testid="downvote-button" onClick={() => onVote(-1)} disabled={disabled}>▼</button>
    </div>
  );
  MockVoteButtons.displayName = "MockVoteButtons";
  return MockVoteButtons;
});

jest.mock("@/components/ReplyForm", () => {
  const MockReplyForm = ({
    onSubmit,
    loading,
  }: {
    onSubmit: (c: string) => void;
    loading?: boolean;
    depth?: number;
  }) => (
    <div data-testid="reply-form">
      <button
        data-testid="reply-submit-button"
        disabled={loading}
        onClick={() => onSubmit("test reply content")}
      >
        Submit
      </button>
    </div>
  );
  MockReplyForm.displayName = "MockReplyForm";
  return MockReplyForm;
});

const makeReply = (overrides: Partial<ForumReplyResponse> = {}): ForumReplyResponse => ({
  id: 1,
  content: "Test reply content",
  score: 3,
  createdAt: "2026-01-01T10:00:00",
  authorUsername: "testuser",
  depth: 0,
  parentReplyId: null,
  replies: [],
  ...overrides,
});

const defaultProps = {
  reply: makeReply(),
  depth: 0,
  onVote: jest.fn(),
  onReply: jest.fn().mockResolvedValue(undefined),
  threadId: 10,
  isLoggedIn: true,
};

describe("ReplyItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with correct data-testid attributes", () => {
    render(<ReplyItem {...defaultProps} />);

    expect(screen.getByTestId("reply-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("reply-content-1")).toBeInTheDocument();
    expect(screen.getByTestId("reply-author-1")).toBeInTheDocument();
  });

  it("displays reply content", () => {
    render(<ReplyItem {...defaultProps} />);

    expect(screen.getByTestId("reply-content-1")).toHaveTextContent("Test reply content");
  });

  it("displays author username in header", () => {
    render(<ReplyItem {...defaultProps} />);

    expect(screen.getByTestId("reply-author-1")).toHaveTextContent("testuser");
  });

  it("shows avatar initials from author username", () => {
    render(<ReplyItem {...defaultProps} />);

    expect(screen.getByText("TE")).toBeInTheDocument();
  });

  it("renders VoteButtons as badge", () => {
    render(<ReplyItem {...defaultProps} />);

    expect(screen.getByTestId("vote-buttons")).toBeInTheDocument();
  });

  it("shows Reply toggle button when logged in and within max depth", () => {
    render(<ReplyItem {...defaultProps} depth={0} isLoggedIn={true} />);

    expect(screen.getByTestId("reply-toggle-1")).toBeInTheDocument();
    expect(screen.getByTestId("reply-toggle-1")).toHaveTextContent("Reply");
  });

  it("hides Reply toggle button when not logged in", () => {
    render(<ReplyItem {...defaultProps} isLoggedIn={false} />);

    expect(screen.queryByTestId("reply-toggle-1")).not.toBeInTheDocument();
  });

  it("hides Reply toggle when at max depth (depth 2 = last allowed nesting)", () => {
    // MAX_REPLY_DEPTH is 3, canReply is depth < 2, so depth=2 hides the button
    render(<ReplyItem {...defaultProps} depth={2} isLoggedIn={true} />);

    expect(screen.queryByTestId("reply-toggle-1")).not.toBeInTheDocument();
  });

  it("toggles reply form when Reply button is clicked", () => {
    render(<ReplyItem {...defaultProps} />);

    expect(screen.queryByTestId("reply-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("reply-toggle-1"));
    expect(screen.getByTestId("reply-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("reply-toggle-1"));
    expect(screen.queryByTestId("reply-form")).not.toBeInTheDocument();
  });

  it("calls onReply when reply form is submitted", async () => {
    const onReply = jest.fn().mockResolvedValue(undefined);
    render(<ReplyItem {...defaultProps} onReply={onReply} />);

    fireEvent.click(screen.getByTestId("reply-toggle-1"));
    fireEvent.click(screen.getByTestId("reply-submit-button"));

    await waitFor(() => {
      expect(onReply).toHaveBeenCalledWith(10, "test reply content", 1);
    });
  });

  it("renders hidden content when score is below threshold", () => {
    const hiddenReply = makeReply({ score: -6 });
    render(<ReplyItem {...defaultProps} reply={hiddenReply} />);

    expect(screen.getByTestId("reply-content-1")).toHaveTextContent("[Hidden due to low score]");
  });

  it("applies grayscale styling when hidden", () => {
    const hiddenReply = makeReply({ score: -10 });
    render(<ReplyItem {...defaultProps} reply={hiddenReply} />);

    // The card div should have opacity-50 and grayscale
    const cardEl = screen.getByTestId("reply-content-1").closest(".opacity-50");
    expect(cardEl).toBeInTheDocument();
  });

  it("renders left border line for nested replies (depth > 0)", () => {
    render(<ReplyItem {...defaultProps} depth={1} />);

    const container = screen.getByTestId("reply-item-1").querySelector(".border-l-2");
    expect(container).toBeInTheDocument();
  });

  it("does not render left border line for root replies (depth 0)", () => {
    render(<ReplyItem {...defaultProps} depth={0} />);

    const container = screen.getByTestId("reply-item-1").querySelector(".border-l-2");
    expect(container).not.toBeInTheDocument();
  });

  it("renders collapse toggle button for nested replies with children", () => {
    const replyWithChildren = makeReply({
      replies: [makeReply({ id: 2, depth: 1 })],
    });
    render(<ReplyItem {...defaultProps} reply={replyWithChildren} depth={1} />);

    const collapseBtn = screen.getByLabelText("Collapse replies");
    expect(collapseBtn).toBeInTheDocument();
  });

  it("collapses children when collapse button is clicked", () => {
    const child = makeReply({ id: 2, depth: 1 });
    const replyWithChildren = makeReply({ replies: [child] });
    render(<ReplyItem {...defaultProps} reply={replyWithChildren} depth={1} />);

    expect(screen.getByTestId("reply-item-2")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Collapse replies"));
    expect(screen.queryByTestId("reply-item-2")).not.toBeInTheDocument();
  });

  it("expands children again when + button is clicked after collapsing", () => {
    const child = makeReply({ id: 2, depth: 1 });
    const replyWithChildren = makeReply({ replies: [child] });
    render(<ReplyItem {...defaultProps} reply={replyWithChildren} depth={1} />);

    fireEvent.click(screen.getByLabelText("Collapse replies"));
    expect(screen.queryByTestId("reply-item-2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Expand replies"));
    expect(screen.getByTestId("reply-item-2")).toBeInTheDocument();
  });

  it("does not show collapse toggle for root replies (depth 0)", () => {
    const replyWithChildren = makeReply({
      replies: [makeReply({ id: 2, depth: 1 })],
    });
    render(<ReplyItem {...defaultProps} reply={replyWithChildren} depth={0} />);

    expect(screen.queryByLabelText("Collapse replies")).not.toBeInTheDocument();
  });

  it("calls onVote with correct arguments", () => {
    const onVote = jest.fn();
    render(<ReplyItem {...defaultProps} onVote={onVote} />);

    fireEvent.click(screen.getByTestId("upvote-button"));
    expect(onVote).toHaveBeenCalledWith(1, 1);

    fireEvent.click(screen.getByTestId("downvote-button"));
    expect(onVote).toHaveBeenCalledWith(1, -1);
  });

  it("does not show delete button when onDelete is not provided", () => {
    render(<ReplyItem {...defaultProps} />);
    expect(screen.queryByTestId("delete-reply-1")).not.toBeInTheDocument();
  });

  it("shows delete button when onDelete is provided", () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(<ReplyItem {...defaultProps} onDelete={onDelete} />);
    expect(screen.getByTestId("delete-reply-1")).toBeInTheDocument();
  });

  it("calls onDelete with reply id when delete button clicked", async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(<ReplyItem {...defaultProps} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId("delete-reply-1"));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1));
  });
});
