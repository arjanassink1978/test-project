"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VoteButtons from "@/components/VoteButtons";
import ReplyItem from "@/components/ReplyItem";
import ReplyForm from "@/components/ReplyForm";
import { nav, typography, card, alert } from "@/lib/theme";
import {
  getForumThread,
  createForumReply,
  voteOnPost,
  type ForumThreadDetailResponse,
  type ForumReplyResponse,
} from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const threadId = Number(id);

  const [thread, setThread] = useState<ForumThreadDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  useEffect(() => {
    if (!threadId) return;
    setLoading(true);
    getForumThread(threadId)
      .then(setThread)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [threadId]);

  async function handleVoteThread(value: number) {
    if (!thread || !username) return;
    const password = localStorage.getItem("password") ?? "";
    try {
      const result = await voteOnPost(thread.id, "thread", value, {
        username,
        password,
      });
      setThread((prev) => (prev ? { ...prev, score: result.newScore } : prev));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleVoteReply(replyId: number, value: number) {
    if (!username) return;
    const password = localStorage.getItem("password") ?? "";
    try {
      await voteOnPost(replyId, "reply", value, { username, password });
      // Reload thread to reflect updated reply score
      const updated = await getForumThread(threadId);
      setThread(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDirectReply(content: string) {
    if (!username || !thread) return;
    const password = localStorage.getItem("password") ?? "";
    setReplyLoading(true);
    try {
      await createForumReply(
        thread.id,
        { content },
        { username, password }
      );
      const updated = await getForumThread(threadId);
      setThread(updated);
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
    const password = localStorage.getItem("password") ?? "";
    await createForumReply(
      threadId,
      { content, parentReplyId },
      { username, password }
    );
    const updated = await getForumThread(threadId);
    setThread(updated);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className={typography.bodyText}>Loading thread…</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className={alert.error}>{error ?? "Thread not found."}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="thread-detail-page">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <LogoutButton />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Thread header */}
        <div className={card.paddedLg}>
          <div className="flex gap-4">
            <VoteButtons
              score={thread.score}
              postId={thread.id}
              postType="thread"
              onVote={handleVoteThread}
              disabled={!username}
            />
            <div className="flex-1">
              <h1
                className={typography.pageHeading}
                data-testid="thread-detail-title"
              >
                {thread.title}
              </h1>
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
          </div>
        </div>

        {/* Replies section */}
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
              threadId={thread.id}
              isLoggedIn={Boolean(username)}
            />
          ))}

          {username && (
            <div className="mt-6">
              <h3 className={typography.sectionHeading}>Add a Reply</h3>
              <div className="mt-2">
                <ReplyForm
                  onSubmit={handleDirectReply}
                  loading={replyLoading}
                  depth={0}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
