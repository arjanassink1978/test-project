"use client";

import { vote } from "@/lib/theme";

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
    <div className={vote.container} data-testid="vote-buttons">
      <button
        type="button"
        onClick={() => onVote(1)}
        disabled={disabled}
        aria-label="Upvote"
        className={vote.upvote}
        data-testid="upvote-button"
      >
        ▲
      </button>
      <span
        className={score >= 0 ? vote.scorePositive : vote.scoreNegative}
        data-testid="vote-score"
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => onVote(-1)}
        disabled={disabled}
        aria-label="Downvote"
        className={vote.downvote}
        data-testid="downvote-button"
      >
        ▼
      </button>
    </div>
  );
}
