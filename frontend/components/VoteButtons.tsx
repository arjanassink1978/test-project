"use client";

import { typography } from "@/lib/theme";

interface VoteButtonsProps {
  score: number;
  postId: number;
  postType: "thread" | "reply";
  onVote: (value: number) => void;
  disabled?: boolean;
}

export default function VoteButtons({
  score,
  onVote,
  disabled = false,
}: VoteButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-1" data-testid="vote-buttons">
      <button
        type="button"
        onClick={() => onVote(1)}
        disabled={disabled}
        aria-label="Upvote"
        className="rounded p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        data-testid="upvote-button"
      >
        ▲
      </button>
      <span className={typography.bodyText} data-testid="vote-score">
        {score}
      </span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        disabled={disabled}
        aria-label="Downvote"
        className="rounded p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        data-testid="downvote-button"
      >
        ▼
      </button>
    </div>
  );
}
