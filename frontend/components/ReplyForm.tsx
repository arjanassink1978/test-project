"use client";

import { useState } from "react";
import { alert, button, input, typography } from "@/lib/theme";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
  depth?: number;
}

export default function ReplyForm({
  onSubmit,
  loading,
  disabled = false,
  depth = 0,
}: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // CONSTRAINT: max depth 3 — disable form when depth >= MAX_REPLY_DEPTH
  const isAtMaxDepth = depth >= FORUM_CONSTRAINTS.MAX_REPLY_DEPTH;
  const isDisabled = disabled || isAtMaxDepth;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // CONSTRAINT: content max 2000 chars — must match backend @Size(max=2000)
    if (content.length > FORUM_CONSTRAINTS.REPLY_CONTENT_MAX) {
      setError(
        `Reply must be at most ${FORUM_CONSTRAINTS.REPLY_CONTENT_MAX} characters.`
      );
      return;
    }

    try {
      await onSubmit(content);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    }
  }

  if (isAtMaxDepth) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} data-testid="reply-form">
      {error && (
        <div className={alert.error} data-testid="reply-form-error">
          {error}
        </div>
      )}
      <textarea
        className={input.textarea}
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isDisabled}
        placeholder="Write a reply…"
        data-testid="reply-content-input"
      />
      <p className={typography.charCounter} data-testid="reply-content-counter">
        {content.length} / {FORUM_CONSTRAINTS.REPLY_CONTENT_MAX}
      </p>
      <button
        type="submit"
        className={`mt-2 ${button.primaryAuto}`}
        disabled={isDisabled || loading || content.trim().length === 0}
        data-testid="reply-submit-button"
      >
        {loading ? "Posting…" : "Post Reply"}
      </button>
    </form>
  );
}
