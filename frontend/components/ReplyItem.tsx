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
  const [collapsed, setCollapsed] = useState(false);

  // CONSTRAINT: score < -5 renders collapsed/gray style
  const isHidden = reply.score < FORUM_CONSTRAINTS.HIDDEN_SCORE_THRESHOLD;
  const canReply = depth < FORUM_CONSTRAINTS.MAX_REPLY_DEPTH - 1;
  const hasChildren = reply.replies && reply.replies.length > 0;

  async function handleReplySubmit(content: string) {
    setReplyLoading(true);
    try {
      await onReply(threadId, content, reply.id);
      setShowReplyForm(false);
    } finally {
      setReplyLoading(false);
    }
  }

  // Get initials for avatar placeholder from author username
  const initials = reply.authorUsername
    ? reply.authorUsername.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      className="mt-3"
      data-testid={`reply-item-${reply.id}`}
    >
      <div className={`flex gap-2 ${depth > 0 ? "pl-4 border-l-2 border-gray-200" : ""}`}>
        {/* Collapse toggle in left gutter for nested replies */}
        {depth > 0 && hasChildren && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand replies" : "Collapse replies"}
            className="self-start mt-1 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {collapsed ? "+" : "–"}
          </button>
        )}

        <div className={`flex-1 ${card.padded} ${isHidden ? "opacity-50 grayscale" : ""}`}>
          {/* Reply header: avatar + username + date + vote badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2" data-testid={`reply-author-${reply.id}`}>
              {/* Avatar placeholder circle */}
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {initials}
              </div>
              <span className={`${typography.bodyText} font-medium text-gray-900`}>
                {reply.authorUsername}
              </span>
              <span className={typography.helperText}>·</span>
              <span className={typography.helperText}>depth {reply.depth}</span>
            </div>

            {/* Vote badge top-right */}
            <VoteButtons
              score={reply.score}
              postId={reply.id}
              postType="reply"
              onVote={(value) => onVote(reply.id, value)}
              disabled={!isLoggedIn}
            />
          </div>

          {/* Reply body */}
          <p
            className={typography.bodyText}
            data-testid={`reply-content-${reply.id}`}
          >
            {isHidden ? "[Hidden due to low score]" : reply.content}
          </p>

          {isLoggedIn && canReply && (
            <button
              type="button"
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-500"
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

      {/* Nested children */}
      {!collapsed && hasChildren && (
        <div className="ml-4">
          {reply.replies!.map((child) => (
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
