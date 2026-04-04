"use client";

import Link from "next/link";
import { button, typography, card, scoreBadge, layout } from "@/lib/theme";
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
        <div className={layout.emptyState}>
          <p className={typography.bodyText}>
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
            className={`${card.interactive} flex items-start gap-3 p-4 ${isHidden ? "opacity-50 grayscale" : ""}`}
            data-testid={`thread-item-${thread.id}`}
          >
            <div className="flex-shrink-0">
              <div
                className={`${scoreBadge.base} ${
                  thread.score >= 0 ? scoreBadge.positive : scoreBadge.negative
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
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
