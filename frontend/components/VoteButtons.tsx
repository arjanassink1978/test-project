"use client";

import { vote } from "@/lib/theme";

interface VoteButtonsProps {
  score: number;
  postId: number;
  postType: "thread" | "reply";
  onVote: (value: number) => void;
  disabled?: boolean;
  userVote?: number;
}

export default function VoteButtons({
  score,
  onVote,
  disabled = false,
  userVote = 0,
}: VoteButtonsProps) {
  function handleVote(clickedValue: number) {
    if (userVote === 0) {
      onVote(clickedValue);
    } else {
      onVote(0);
    }
  }

  return (
    <div className={vote.container} data-testid="vote-buttons">
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={disabled}
        aria-label="Upvote"
        className={userVote === 1 ? vote.upvoteActive : vote.upvote}
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
        onClick={() => handleVote(-1)}
        disabled={disabled}
        aria-label="Downvote"
        className={userVote === -1 ? vote.downvoteActive : vote.downvote}
        data-testid="downvote-button"
      >
        ▼
      </button>
    </div>
  );
}
