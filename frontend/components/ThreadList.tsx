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
    <div className="space-y-2" data-testid="thread-list">
      {threads.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className={`${typography.bodyText} text-gray-500`}>
            No threads yet. Start the conversation!
          </p>
        </div>
      )}

      {threads.map((thread) => {
        // CONSTRAINT: threads with score < -5 render with gray/collapsed styling
        const isHidden = thread.score < FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD;

        return (
          <Link
            key={thread.id}
            href={`/forum/threads/${thread.id}`}
            className={`${card.interactive} flex items-start gap-3 p-4`}
            data-testid={`thread-item-${thread.id}`}
          >
            <div className="flex-shrink-0">
              <div
                className={`inline-flex items-center justify-center w-10 h-10 text-xs font-bold rounded ${
                  thread.score >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
                data-testid={`thread-score-${thread.id}`}
              >
                {thread.score > 0 ? "+" : ""}{thread.score}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors"
                data-testid={`thread-title-${thread.id}`}
              >
                {isHidden ? "[Hidden due to low score]" : thread.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>by {thread.authorUsername}</span>
                {thread.categoryName && (
                  <span className="text-gray-400">•</span>
                )}
                {thread.categoryName && (
                  <span>{thread.categoryName}</span>
                )}
                <span className="text-gray-400">•</span>
                <span>{thread.replyCount} replies</span>
              </div>
            </div>
          </Link>
        );
      })}

      {hasMore && (
        <button
          type="button"
          className={button.secondary}
          onClick={onLoadMore}
          disabled={loading}
          data-testid="load-more-button"
          style={{ width: "100%" }}
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
