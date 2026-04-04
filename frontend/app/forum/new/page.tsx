"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThreadForm from "@/components/ThreadForm";
import { nav, typography, layout } from "@/lib/theme";
import { getForumCategories, createForumThread, type ForumCategory } from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";

export default function NewThreadPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) {
      router.push("/login");
      return;
    }
    setUsername(u);
    getForumCategories().then(setCategories).catch(console.error);
  }, [router]);

  async function handleSubmit(data: {
    title: string;
    description: string;
    categoryId: number | null;
  }) {
    if (!username) return;
    const password = localStorage.getItem("password") ?? "";
    setLoading(true);
    try {
      const thread = await createForumThread(
        {
          title: data.title,
          description: data.description || undefined,
          categoryId: data.categoryId ?? undefined,
        },
        { username, password }
      );
      router.push(`/forum/threads/${thread.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={layout.page} data-testid="new-thread-page">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <LogoutButton />
        </div>
      </nav>

      <main className={layout.container}>
        <h1 className={typography.pageHeading} data-testid="new-thread-heading">
          Create New Thread
        </h1>
        <div className="mt-6">
          <ThreadForm
            categories={categories}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
