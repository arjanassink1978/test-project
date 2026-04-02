"use client";

import { useState } from "react";
import { alert, button, card, input, typography } from "@/lib/theme";
import { FORUM_CONSTRAINTS } from "@/lib/forumConstants";
import type { ForumCategory } from "@/lib/api";

interface ThreadFormData {
  title: string;
  description: string;
  categoryId: number | null;
}

interface ThreadFormProps {
  categories: ForumCategory[];
  onSubmit: (data: ThreadFormData) => Promise<void>;
  loading: boolean;
}

export default function ThreadForm({
  categories,
  onSubmit,
  loading,
}: ThreadFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // CONSTRAINT: title max 200 chars (FORUM_CONSTRAINTS.THREAD_TITLE_MAX) — must match backend @Size(max=200)
    if (title.length > FORUM_CONSTRAINTS.THREAD_TITLE_MAX) {
      setError(`Title must be at most ${FORUM_CONSTRAINTS.THREAD_TITLE_MAX} characters.`);
      return;
    }
    // CONSTRAINT: description max 5000 chars (FORUM_CONSTRAINTS.THREAD_DESC_MAX) — must match backend @Size(max=5000)
    if (description.length > FORUM_CONSTRAINTS.THREAD_DESC_MAX) {
      setError(`Description must be at most ${FORUM_CONSTRAINTS.THREAD_DESC_MAX} characters.`);
      return;
    }

    try {
      await onSubmit({ title, description, categoryId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
    }
  }

  const titleOver = title.length > FORUM_CONSTRAINTS.THREAD_TITLE_MAX;
  const descOver = description.length > FORUM_CONSTRAINTS.THREAD_DESC_MAX;

  return (
    <form
      onSubmit={handleSubmit}
      className={card.padded}
      data-testid="thread-form"
    >
      {error && (
        <div className={alert.error} data-testid="thread-form-error">
          {error}
        </div>
      )}

      <div>
        <label className={typography.label} htmlFor="thread-title">
          Title
        </label>
        <input
          id="thread-title"
          type="text"
          className={titleOver ? input.error : input.base}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={FORUM_CONSTRAINTS.THREAD_TITLE_MAX + 1}
          required
          data-testid="thread-title-input"
        />
        <p className={typography.charCounter} data-testid="thread-title-counter">
          {title.length} / {FORUM_CONSTRAINTS.THREAD_TITLE_MAX}
        </p>
      </div>

      <div className="mt-4">
        <label className={typography.label} htmlFor="thread-desc">
          Description
        </label>
        <textarea
          id="thread-desc"
          className={descOver ? input.error : input.textarea}
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="thread-desc-input"
        />
        <p className={typography.charCounter} data-testid="thread-desc-counter">
          {description.length} / {FORUM_CONSTRAINTS.THREAD_DESC_MAX}
        </p>
      </div>

      <div className="mt-4">
        <label className={typography.label} htmlFor="thread-category">
          Category
        </label>
        <select
          id="thread-category"
          className={input.base}
          value={categoryId ?? ""}
          onChange={(e) =>
            setCategoryId(e.target.value ? Number(e.target.value) : null)
          }
          data-testid="thread-category-select"
        >
          <option value="">-- No category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className={button.primary}
          disabled={loading || titleOver || descOver || title.trim().length === 0}
          data-testid="thread-submit-button"
        >
          {loading ? "Creating…" : "Create Thread"}
        </button>
      </div>
    </form>
  );
}
