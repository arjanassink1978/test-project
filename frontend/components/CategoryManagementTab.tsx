"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getForumCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type AdminCategoryResponse,
} from "@/lib/api";
import CategoryForm from "@/components/CategoryForm";
import { alert, button, card, typography } from "@/lib/theme";

interface CategoryManagementTabProps {
  token: string;
}

export default function CategoryManagementTab({ token }: CategoryManagementTabProps) {
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryResponse | null | undefined>(undefined);
  // undefined = form hidden, null = new category, object = editing existing

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getForumCategories();
      setCategories(data as AdminCategoryResponse[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleSave(data: { name: string; description: string; icon: string }) {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data, token);
    } else {
      await createCategory(data, token);
    }
    setEditingCategory(undefined);
    await loadCategories();
  }

  async function handleDelete(categoryId: number) {
    setError(null);
    try {
      await deleteCategory(categoryId, token);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  if (loading) {
    return (
      <div data-testid="category-management-loading" className="py-8 text-center text-gray-500">
        Loading categories…
      </div>
    );
  }

  return (
    <div data-testid="category-management-tab">
      {error && (
        <div className={`mb-4 ${alert.error}`} data-testid="category-management-error">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className={typography.sectionHeading}>Categories</h2>
        <button
          className={button.primaryAuto}
          onClick={() => setEditingCategory(null)}
          data-testid="add-category-button"
        >
          New Category
        </button>
      </div>

      {editingCategory !== undefined && (
        <div className={`mb-6 ${card.padded}`} data-testid="category-form-container">
          <CategoryForm
            category={editingCategory}
            onSave={handleSave}
            onCancel={() => setEditingCategory(undefined)}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <div className="py-8 text-center text-gray-500" data-testid="no-categories-message">
          No categories found.
        </div>
      ) : (
        <ul className="space-y-2" data-testid="category-list">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`flex items-center justify-between ${card.padded}`}
              data-testid={`category-item-${cat.id}`}
            >
              <div>
                <span className="mr-2" aria-hidden="true">{cat.icon}</span>
                <span className={typography.bodyValue} data-testid={`category-name-${cat.id}`}>
                  {cat.name}
                </span>
                {cat.description && (
                  <p className={`mt-0.5 ${typography.helperText}`} data-testid={`category-desc-${cat.id}`}>
                    {cat.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className={button.secondaryInline}
                  onClick={() => setEditingCategory(cat)}
                  data-testid={`edit-category-${cat.id}`}
                >
                  Edit
                </button>
                <button
                  className={button.danger}
                  onClick={() => void handleDelete(cat.id)}
                  data-testid={`delete-category-${cat.id}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
