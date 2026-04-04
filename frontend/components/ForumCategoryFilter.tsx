"use client";

import { button } from "@/lib/theme";
import type { ForumCategory } from "@/lib/api";

interface ForumCategoryFilterProps {
  categories: ForumCategory[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
}

export default function ForumCategoryFilter({
  categories,
  selectedId,
  onChange,
}: ForumCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="category-filter">
      <button
        type="button"
        className={selectedId === null ? button.compactPrimary : button.compactSecondary}
        onClick={() => onChange(null)}
        data-testid="category-option-all"
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={selectedId === cat.id ? button.compactPrimary : button.compactSecondary}
          onClick={() => onChange(cat.id)}
          data-testid={`category-option-${cat.id}`}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  );
}
