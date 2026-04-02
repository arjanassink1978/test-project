"use client";

import Link from "next/link";
import { button, typography, card } from "@/lib/theme";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";
import type { ForumThreadResponse } from "@/lib/api";

interface ThreadListProps {
  threads: ForumThreadResponse[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
}

export default function ThreadList({
  threads,
  hasMore,
  onLoadMore,
  loading,
}: ThreadListProps) {
  return (
    <div data-testid="thread-list">
      {threads.length === 0 && !loading && (
        <p className={typography.bodyText}>No threads found.</p>
      )}

      {threads.map((thread) => {
        // CONSTRAINT: threads with score < -5 render with gray/collapsed styling
        const isHidden = thread.score < FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD;

        return (
          <div
            key={thread.id}
            className={`${card.padded} mb-3 ${isHidden ? "opacity-50 grayscale" : ""}`}
            data-testid={`thread-item-${thread.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${thread.score >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-600"}`}
                  data-testid={`thread-score-${thread.id}`}
                >
                  {thread.score}
                </span>
              </div>
              <div className="flex-1">
                <Link
                  href={`/forum/threads/${thread.id}`}
                  className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                  data-testid={`thread-title-${thread.id}`}
                >
                  {isHidden ? "[Hidden due to low score]" : thread.title}
                </Link>
                <div className="mt-1 flex gap-3 text-xs text-gray-500">
                  <span>by {thread.authorUsername}</span>
                  {thread.categoryName && <span>{thread.categoryName}</span>}
                  <span>{thread.replyCount} replies</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <button
          type="button"
          className={button.secondary}
          onClick={onLoadMore}
          disabled={loading}
          data-testid="load-more-button"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
