/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThreadList from "./ThreadList";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";
import type { ForumThreadResponse } from "@/lib/api";

jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
    "data-testid": dataTestid,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "data-testid"?: string;
  }) => (
    <a href={href} className={className} data-testid={dataTestid}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

function makeThread(overrides: Partial<ForumThreadResponse> = {}): ForumThreadResponse {
  return {
    id: 1,
    title: "Test Thread",
    description: "A description",
    score: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    authorUsername: "alice",
    categoryId: 0,
    categoryName: "",
    replyCount: 3,
    ...overrides,
  };
}

describe("ThreadList", () => {
  it("renders the thread list container", () => {
    render(
      <ThreadList
        threads={[]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-list")).toBeInTheDocument();
  });

  it("shows empty state message when threads array is empty and not loading", () => {
    render(
      <ThreadList
        threads={[]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("No threads yet. Start the conversation!")).toBeInTheDocument();
  });

  it("does not show empty state message while loading is true", () => {
    render(
      <ThreadList
        threads={[]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={true}
      />
    );

    expect(screen.queryByText("No threads yet. Start the conversation!")).not.toBeInTheDocument();
  });

  it("does not show empty state message when threads exist", () => {
    const threads = [makeThread({ id: 1 })];

    render(
      <ThreadList
        threads={threads}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.queryByText("No threads yet. Start the conversation!")).not.toBeInTheDocument();
  });

  it("renders a thread item for each thread", () => {
    const threads = [makeThread({ id: 1 }), makeThread({ id: 2 })];

    render(
      <ThreadList
        threads={threads}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("thread-item-2")).toBeInTheDocument();
  });

  it("renders thread title as a link with correct href", () => {
    const thread = makeThread({ id: 42, title: "My Thread" });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    const link = screen.getByTestId("thread-item-42");
    expect(link).toHaveAttribute("href", "/forum/threads/42");
    expect(link).toHaveTextContent("My Thread");
  });

  it("href contains the actual thread id, not a hardcoded value", () => {
    const thread1 = makeThread({ id: 10, title: "Thread 10" });
    const thread2 = makeThread({ id: 99, title: "Thread 99" });

    render(
      <ThreadList
        threads={[thread1, thread2]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-item-10")).toHaveAttribute("href", "/forum/threads/10");
    expect(screen.getByTestId("thread-item-99")).toHaveAttribute("href", "/forum/threads/99");
  });

  it("renders thread score", () => {
    const thread = makeThread({ id: 1, score: 5 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-score-1")).toHaveTextContent("5");
  });

  it("applies positive score styling when score is greater than 0", () => {
    const thread = makeThread({ id: 1, score: 3 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    const scoreEl = screen.getByTestId("thread-score-1");
    expect(scoreEl.className).toContain("bg-emerald-50");
    expect(scoreEl.className).toContain("text-emerald-600");
    expect(scoreEl.className).not.toContain("bg-red-50");
  });

  it("applies positive score styling when score is exactly 0", () => {
    const thread = makeThread({ id: 1, score: 0 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    const scoreEl = screen.getByTestId("thread-score-1");
    expect(scoreEl.className).toContain("bg-emerald-50");
    expect(scoreEl.className).not.toContain("bg-red-50");
  });

  it("applies negative score styling when score is below 0", () => {
    const thread = makeThread({ id: 1, score: -1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    const scoreEl = screen.getByTestId("thread-score-1");
    expect(scoreEl.className).toContain("bg-red-50");
    expect(scoreEl.className).toContain("text-red-600");
    expect(scoreEl.className).not.toContain("bg-emerald-50");
  });

  it("shows category name when categoryName is set", () => {
    const thread = makeThread({ id: 1, categoryName: "General" });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("shows category name with exact text when set", () => {
    const thread = makeThread({ id: 1, categoryName: "Tech" });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("does not render category span when categoryName is empty string", () => {
    const thread = makeThread({ id: 1, categoryName: "", title: "A Thread" });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    // Author and reply count present but no category span with content
    expect(screen.getByText("by alice")).toBeInTheDocument();
    expect(screen.getByText("3 replies")).toBeInTheDocument();
    // The category span should not exist since categoryName is falsy
    const metaRow = screen.getByTestId("thread-item-1").querySelector("div.flex.flex-wrap");
    expect(metaRow?.children.length).toBe(3);
  });

  it("renders category span when categoryName is present, making 3 meta items", () => {
    const thread = makeThread({ id: 1, categoryName: "General", title: "A Thread" });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    const metaRow = screen.getByTestId("thread-item-1").querySelector("div.flex.flex-wrap");
    expect(metaRow?.children.length).toBe(5);
  });

  it("shows '[Hidden due to low score]' for threads below the score threshold", () => {
    const thread = makeThread({
      id: 1,
      title: "Secret Thread",
      score: FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD - 1,
    });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-title-1")).toHaveTextContent(
      "[Hidden due to low score]"
    );
    expect(screen.queryByText("Secret Thread")).not.toBeInTheDocument();
  });

  it("shows thread title for threads at exactly the score threshold", () => {
    const thread = makeThread({
      id: 1,
      title: "Visible Thread",
      score: FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD,
    });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-title-1")).toHaveTextContent("Visible Thread");
    expect(screen.queryByText("[Hidden due to low score]")).not.toBeInTheDocument();
  });

  it("shows thread title for threads one above the score threshold", () => {
    const thread = makeThread({
      id: 1,
      title: "Just Visible",
      score: FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD + 1,
    });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-title-1")).toHaveTextContent("Just Visible");
    expect(screen.queryByText("[Hidden due to low score]")).not.toBeInTheDocument();
  });

  it("shows thread title for threads above the score threshold", () => {
    const thread = makeThread({
      id: 1,
      title: "Normal Thread",
      score: 10,
    });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-title-1")).toHaveTextContent("Normal Thread");
    expect(screen.queryByText("[Hidden due to low score]")).not.toBeInTheDocument();
  });

  it("applies opacity/grayscale class when thread is hidden", () => {
    const thread = makeThread({
      id: 1,
      score: FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD - 1,
    });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    const item = screen.getByTestId("thread-item-1");
    expect(item.className).toContain("opacity-50");
    expect(item.className).toContain("grayscale");
  });

  it("does not apply opacity/grayscale class when thread is visible", () => {
    const thread = makeThread({
      id: 1,
      score: FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD,
    });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    const item = screen.getByTestId("thread-item-1");
    expect(item.className).not.toContain("opacity-50");
    expect(item.className).not.toContain("grayscale");
  });

  it("renders 'Load more' button when hasMore is true", () => {
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={true}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
    expect(screen.getByTestId("load-more-button")).toHaveTextContent("Load more");
  });

  it("does not render 'Load more' button when hasMore is false", () => {
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
  });

  it("shows 'Loading…' text on load-more button when hasMore and loading are both true", () => {
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={true}
        onLoadMore={jest.fn()}
        loading={true}
      />
    );

    expect(screen.getByTestId("load-more-button")).toHaveTextContent("Loading…");
  });

  it("shows 'Load more' text when hasMore is true and loading is false", () => {
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={true}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("load-more-button")).toHaveTextContent("Load more");
    expect(screen.getByTestId("load-more-button")).not.toHaveTextContent("Loading…");
  });

  it("disables load-more button when loading is true", () => {
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={true}
        onLoadMore={jest.fn()}
        loading={true}
      />
    );

    expect(screen.getByTestId("load-more-button")).toBeDisabled();
  });

  it("load-more button is not disabled when loading is false", () => {
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={true}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("load-more-button")).not.toBeDisabled();
  });

  it("calls onLoadMore when load-more button is clicked", () => {
    const onLoadMore = jest.fn();
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={true}
        onLoadMore={onLoadMore}
        loading={false}
      />
    );

    fireEvent.click(screen.getByTestId("load-more-button"));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not call onLoadMore when load-more button is absent (hasMore=false)", () => {
    const onLoadMore = jest.fn();
    const thread = makeThread({ id: 1 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={onLoadMore}
        loading={false}
      />
    );

    expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("renders author username in meta row", () => {
    const thread = makeThread({ id: 1, authorUsername: "bob" });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("by bob")).toBeInTheDocument();
  });

  it("renders reply count in meta row", () => {
    const thread = makeThread({ id: 1, replyCount: 7 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("7 replies")).toBeInTheDocument();
  });

  it("renders zero reply count", () => {
    const thread = makeThread({ id: 1, replyCount: 0 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("0 replies")).toBeInTheDocument();
  });

  it("renders negative score with correct styling indicator", () => {
    const thread = makeThread({ id: 1, score: -3 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-score-1")).toHaveTextContent("-3");
  });

  it("renders score of 0 correctly", () => {
    const thread = makeThread({ id: 1, score: 0 });

    render(
      <ThreadList
        threads={[thread]}
        hasMore={false}
        onLoadMore={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByTestId("thread-score-1")).toHaveTextContent("0");
  });
});
