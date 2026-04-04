"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VoteButtons from "@/components/VoteButtons";
import ReplyItem from "@/components/ReplyItem";
import ReplyForm from "@/components/ReplyForm";
import { nav, typography, card, alert, layout } from "@/lib/theme";
import {
  getForumThread,
  createForumReply,
  voteOnPost,
  closeThread,
  deleteReply,
  type ForumThreadDetailResponse,
  type ForumReplyResponse,
} from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";
import ForumLink from "@/components/ForumLink";
import { button } from "@/lib/theme";

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const threadId = Number(id);

  const [thread, setThread] = useState<ForumThreadDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [userVote, setUserVote] = useState(0);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
    setRole(localStorage.getItem("role"));
  }, []);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    getForumThread(threadId)
      .then(setThread)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [threadId]);

  const isModerator = role === "MODERATOR" || role === "ADMIN";

  async function handleVoteThread(value: number) {
    if (!thread || !username) return;
    const token = localStorage.getItem("authToken") ?? "";
    try {
      const result = await voteOnPost(thread.id, "thread", value, token);
      setThread((prev) => (prev ? { ...prev, score: result.newScore } : prev));
      setUserVote(result.userVote);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleVoteReply(replyId: number, value: number) {
    if (!username) return;
    const token = localStorage.getItem("authToken") ?? "";
    try {
      await voteOnPost(replyId, "reply", value, token);
      const updated = await getForumThread(threadId);
      setThread(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDirectReply(content: string) {
    if (!username || !thread) return;
    const token = localStorage.getItem("authToken") ?? "";
    setReplyLoading(true);
    setReplyError(null);
    try {
      await createForumReply(thread.id, { content }, token);
      const updated = await getForumThread(threadId);
      setThread(updated);
    } catch (err) {
      setReplyError((err as Error).message ?? "Failed to post reply");
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleNestedReply(
    _threadId: number,
    content: string,
    parentReplyId: number
  ) {
    if (!username) return;
    const token = localStorage.getItem("authToken") ?? "";
    await createForumReply(threadId, { content, parentReplyId }, token);
    const updated = await getForumThread(threadId);
    setThread(updated);
  }

  async function handleDeleteReply(replyId: number) {
    if (!username) return;
    const token = localStorage.getItem("authToken") ?? "";
    try {
      await deleteReply(replyId, token);
      const updated = await getForumThread(threadId);
      setThread(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCloseThread(closed: boolean) {
    if (!username || !thread) return;
    const token = localStorage.getItem("authToken") ?? "";
    setCloseLoading(true);
    try {
      const updated = await closeThread(thread.id, closed, token);
      setThread((prev) => (prev ? { ...prev, closed: updated.closed } : prev));
    } catch (err) {
      console.error(err);
    } finally {
      setCloseLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={layout.loadingCenter}>
        <p className={typography.bodyText}>Loading thread…</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className={layout.page}>
        <main className={layout.container}>
          <div className={alert.error}>{error ?? "Thread not found."}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={layout.page} data-testid="thread-detail-page">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <ForumLink />
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className={layout.main}>
        <div className={card.paddedLg}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={typography.pageHeading}
                  data-testid="thread-detail-title"
                >
                  {thread.title}
                </h1>
                {thread.closed && (
                  <span
                    className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700"
                    data-testid="thread-closed-badge"
                  >
                    CLOSED
                  </span>
                )}
              </div>
              <p
                className={`${typography.helperText} mt-1`}
                data-testid="thread-detail-author"
              >
                by {thread.authorUsername}{" "}
                {thread.categoryName && `· ${thread.categoryName}`}
              </p>
              {thread.description && (
                <p
                  className={`${typography.bodyText} mt-3 whitespace-pre-wrap`}
                  data-testid="thread-detail-desc"
                >
                  {thread.description}
                </p>
              )}
              <p
                className={`${typography.helperText} mt-2`}
                data-testid="thread-detail-score"
              >
                Score: {thread.score}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <VoteButtons
                score={thread.score}
                postId={thread.id}
                postType="thread"
                onVote={handleVoteThread}
                disabled={!username}
                userVote={userVote}
              />
              {isModerator && (
                <button
                  onClick={() => handleCloseThread(!thread.closed)}
                  disabled={closeLoading}
                  className={button.danger}
                  data-testid="close-thread-button"
                >
                  {thread.closed ? "Reopen Thread" : "Close Thread"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8" data-testid="replies-section">
          <h2 className={typography.sectionHeading}>
            {thread.replies?.length ?? 0} Replies
          </h2>

          {thread.replies?.map((reply: ForumReplyResponse) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              depth={0}
              onVote={handleVoteReply}
              onReply={handleNestedReply}
              onDelete={isModerator ? handleDeleteReply : undefined}
              threadId={thread.id}
              isLoggedIn={Boolean(username)}
            />
          ))}

          {username && !thread.closed && (
            <div className="mt-6">
              <h3 className={typography.sectionHeading}>Add a Reply</h3>
              {replyError && (
                <div className={`${alert.error} mt-2`} data-testid="reply-thread-error">
                  {replyError}
                </div>
              )}
              <div className="mt-2">
                <ReplyForm
                  onSubmit={handleDirectReply}
                  loading={replyLoading}
                  depth={0}
                />
              </div>
            </div>
          )}

          {username && thread.closed && (
            <div className={`${alert.error} mt-6`} data-testid="thread-closed-message">
              This thread is closed. No new replies can be posted.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
