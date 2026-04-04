"use client";

import { useState, useEffect } from "react";
import { CATEGORY_NAME_MAX, CATEGORY_DESCRIPTION_MAX } from "@/lib/adminConstants";
import type { AdminCategoryResponse } from "@/lib/api";
import { alert, button, input, typography } from "@/lib/theme";

interface CategoryFormProps {
  category?: AdminCategoryResponse | null;
  onSave: (data: { name: string; description: string; icon: string }) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(category?.name ?? "");
    setDescription(category?.description ?? "");
    setIcon(category?.icon ?? "");
    setError(null);
  }, [category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    // CONSTRAINT: max 50 (CATEGORY_NAME_MAX) — must match backend
    if (name.length > CATEGORY_NAME_MAX) {
      setError(`Category name must be at most ${CATEGORY_NAME_MAX} characters`);
      return;
    }
    // CONSTRAINT: max 200 (CATEGORY_DESCRIPTION_MAX) — must match backend
    if (description.length > CATEGORY_DESCRIPTION_MAX) {
      setError(`Description must be at most ${CATEGORY_DESCRIPTION_MAX} characters`);
      return;
    }

    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), icon: icon.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="category-form">
      <h2 className={typography.sectionHeading} data-testid="category-form-heading">
        {category ? "Edit Category" : "New Category"}
      </h2>

      {error && (
        <div className={`mt-3 ${alert.error}`} data-testid="category-form-error">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="category-name" className={typography.label}>
            Name
          </label>
          <input
            id="category-name"
            type="text"
            className={input.base}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={CATEGORY_NAME_MAX}
            data-testid="category-name-input"
          />
          <div className={typography.charCounter} data-testid="category-name-counter">
            {name.length}/{CATEGORY_NAME_MAX}
          </div>
        </div>

        <div>
          <label htmlFor="category-description" className={typography.label}>
            Description
          </label>
          <textarea
            id="category-description"
            className={input.textarea}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={CATEGORY_DESCRIPTION_MAX}
            data-testid="category-description-input"
          />
          <div className={typography.charCounter} data-testid="category-description-counter">
            {description.length}/{CATEGORY_DESCRIPTION_MAX}
          </div>
        </div>

        <div>
          <label htmlFor="category-icon" className={typography.label}>
            Icon
          </label>
          <input
            id="category-icon"
            type="text"
            className={input.base}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="e.g. 💬"
            data-testid="category-icon-input"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          className={button.primaryAuto}
          disabled={saving}
          data-testid="category-form-submit"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={button.secondaryInline}
          onClick={onCancel}
          disabled={saving}
          data-testid="category-form-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
