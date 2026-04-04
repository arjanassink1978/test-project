"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ForumCategoryFilter from "@/components/ForumCategoryFilter";
import ThreadList from "@/components/ThreadList";
import { nav, button, input, typography, layout } from "@/lib/theme";
import {
  getForumCategories,
  getForumThreads,
  type ForumCategory,
  type ForumThreadResponse,
} from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";
import ForumLink from "@/components/ForumLink";

export default function ForumPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThreadResponse[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("username")));
    getForumCategories().then(setCategories).catch(console.error);
  }, []);

  const loadThreads = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      const nextPage = reset ? 0 : page;
      try {
        const result = await getForumThreads({
          category: selectedCategory ?? undefined,
          sort,
          page: nextPage,
          search: search || undefined,
        });
        setThreads((prev) =>
          reset ? result.threads : [...prev, ...result.threads]
        );
        setHasMore(result.hasMore);
        setPage(nextPage + 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, sort, search, page]
  );

  useEffect(() => {
    setPage(0);
    loadThreads(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sort, search]);

  return (
    <div className={layout.page} data-testid="forum-page">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <ForumLink />
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className={layout.container}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={typography.pageHeading} data-testid="forum-heading">
            Forum
          </h1>
          {isLoggedIn && (
            <button
              type="button"
              className={button.primaryAuto}
              onClick={() => router.push("/forum/new")}
              data-testid="new-thread-button"
            >
              New Thread
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <ForumCategoryFilter
            categories={categories}
            selectedId={selectedCategory}
            onChange={(id) => {
              setSelectedCategory(id);
            }}
          />

          <div className="flex gap-3">
            <select
              className={input.select}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              data-testid="sort-select"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>

            <input
              type="search"
              className={input.base}
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="search-input"
            />
          </div>
        </div>

        <ThreadList
          threads={threads}
          hasMore={hasMore}
          onLoadMore={() => loadThreads(false)}
          loading={loading}
        />
      </main>
    </div>
  );
}
