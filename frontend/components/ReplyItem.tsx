"use client";

import { useState } from "react";
import VoteButtons from "@/components/VoteButtons";
import ReplyForm from "@/components/ReplyForm";
import { typography, card, button, avatar, borders } from "@/lib/theme";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";
import type { ForumReplyResponse } from "@/lib/api";

interface ReplyItemProps {
  reply: ForumReplyResponse;
  depth: number;
  onVote: (replyId: number, value: number) => void;
  onReply: (threadId: number, content: string, parentReplyId: number) => Promise<void>;
  onDelete?: (replyId: number) => Promise<void>;
  threadId: number;
  isLoggedIn: boolean;
}

export default function ReplyItem({
  reply,
  depth,
  onVote,
  onReply,
  onDelete,
  threadId,
  isLoggedIn,
}: ReplyItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  async function handleDelete() {
    if (!onDelete) return;
    setDeleteLoading(true);
    try {
      await onDelete(reply.id);
    } finally {
      setDeleteLoading(false);
    }
  }

  const initials = reply.authorUsername
    ? reply.authorUsername.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      className="mt-3"
      data-testid={`reply-item-${reply.id}`}
    >
      <div className={`flex gap-2 ${depth > 0 ? `pl-4 ${borders.nestedReply}` : ""}`}>
        {depth > 0 && hasChildren && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand replies" : "Collapse replies"}
            className={button.collapseToggle}
          >
            {collapsed ? "+" : "–"}
          </button>
        )}

        <div className={`flex-1 ${card.padded} ${isHidden ? "opacity-50 grayscale" : ""}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2" data-testid={`reply-author-${reply.id}`}>
              <div className={avatar.replyAvatar}>
                {initials}
              </div>
              <span className={`${typography.bodyText} font-medium text-gray-900`}>
                {reply.authorUsername}
              </span>
              <span className={typography.helperText}>·</span>
              <span className={typography.helperText}>depth {reply.depth}</span>
            </div>

            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className={button.inlineDanger}
                  data-testid={`delete-reply-${reply.id}`}
                >
                  {deleteLoading ? "Deleting…" : "Delete"}
                </button>
              )}
              <VoteButtons
                score={reply.score}
                postId={reply.id}
                postType="reply"
                onVote={(value) => onVote(reply.id, value)}
                disabled={!isLoggedIn}
              />
            </div>
          </div>

          <p
            className={typography.bodyText}
            data-testid={`reply-content-${reply.id}`}
          >
            {isHidden ? "[Hidden due to low score]" : reply.content}
          </p>

          {isLoggedIn && canReply && (
            <button
              type="button"
              className={button.inlineGreen}
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

      {!collapsed && hasChildren && (
        <div className="ml-4">
          {reply.replies!.map((child) => (
            <ReplyItem
              key={child.id}
              reply={child}
              depth={depth + 1}
              onVote={onVote}
              onReply={onReply}
              onDelete={onDelete}
              threadId={threadId}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
