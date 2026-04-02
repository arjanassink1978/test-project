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
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs"
      data-testid="vote-buttons"
    >
      <button
        type="button"
        onClick={() => onVote(1)}
        disabled={disabled}
        aria-label="Upvote"
        className="rounded p-0.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        data-testid="upvote-button"
      >
        ▲
      </button>
      <span
        className={`${typography.bodyText} min-w-[1.25rem] text-center font-semibold ${score >= 0 ? "text-indigo-600" : "text-red-600"}`}
        data-testid="vote-score"
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        disabled={disabled}
        aria-label="Downvote"
        className="rounded p-0.5 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        data-testid="downvote-button"
      >
        ▼
      </button>
    </div>
  );
}
