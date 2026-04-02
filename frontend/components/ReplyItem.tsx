"use client";

import { useState } from "react";
import VoteButtons from "@/components/VoteButtons";
import ReplyForm from "@/components/ReplyForm";
import { typography, card } from "@/lib/theme";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";
import type { ForumReplyResponse } from "@/lib/api";

interface ReplyItemProps {
  reply: ForumReplyResponse;
  depth: number;
  onVote: (replyId: number, value: number) => void;
  onReply: (threadId: number, content: string, parentReplyId: number) => Promise<void>;
  threadId: number;
  isLoggedIn: boolean;
}

export default function ReplyItem({
  reply,
  depth,
  onVote,
  onReply,
  threadId,
  isLoggedIn,
}: ReplyItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // CONSTRAINT: score < -5 renders collapsed/gray style
  const isHidden = reply.score < FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD;
  const canReply = depth < FORUM_CONSTRAINTS.MAX_REPLY_DEPTH - 1;

  async function handleReplySubmit(content: string) {
    setReplyLoading(true);
    try {
      await onReply(threadId, content, reply.id);
      setShowReplyForm(false);
    } finally {
      setReplyLoading(false);
    }
  }

  return (
    <div
      className={`ml-${Math.min(depth * 4, 16)} mt-3`}
      data-testid={`reply-item-${reply.id}`}
    >
      <div
        className={`${card.padded} ${isHidden ? "opacity-50 grayscale" : ""}`}
      >
        <div className="flex gap-3">
          <VoteButtons
            score={reply.score}
            postId={reply.id}
            postType="reply"
            onVote={(value) => onVote(reply.id, value)}
            disabled={!isLoggedIn}
          />
          <div className="flex-1">
            <p
              className={typography.bodyText}
              data-testid={`reply-content-${reply.id}`}
            >
              {isHidden ? "[Hidden due to low score]" : reply.content}
            </p>
            <p className={typography.helperText} data-testid={`reply-author-${reply.id}`}>
              by {reply.authorUsername} · depth {reply.depth}
            </p>

            {isLoggedIn && canReply && (
              <button
                type="button"
                className="mt-1 text-xs text-indigo-600 hover:text-indigo-500"
                onClick={() => setShowReplyForm((v) => !v)}
                data-testid={`reply-toggle-${reply.id}`}
              >
                {showReplyForm ? "Cancel" : "Reply"}
              </button>
            )}

            {showReplyForm && (
              <div className="mt-2">
                <ReplyForm
                  onSubmit={handleReplySubmit}
                  loading={replyLoading}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {reply.replies && reply.replies.length > 0 && (
        <div>
          {reply.replies.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              depth={depth + 1}
              onVote={onVote}
              onReply={onReply}
              threadId={threadId}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
