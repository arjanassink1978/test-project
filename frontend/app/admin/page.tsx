"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserManagementTab from "@/components/UserManagementTab";
import CategoryManagementTab from "@/components/CategoryManagementTab";
import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";
import ForumLink from "@/components/ForumLink";
import { layout, nav, typography } from "@/lib/theme";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "categories">("users");
  const [token, setToken] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");

    // Decode JWT to check authorization and get userId
    let userRole: string | null = null;
    let userId = 0;

    if (authToken) {
      try {
        const parts = authToken.split(".");
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1])) as { userId?: number; role?: string };
          userId = decoded.userId || 0;
          userRole = decoded.role || null;
          console.log('[AdminPage] Decoded JWT:', { userId, userRole, fullDecoded: decoded });
        }
      } catch (e) {
        console.log('[AdminPage] Token parsing failed:', e);
      }
    }

    console.log('[AdminPage] Authorization check - authToken exists:', !!authToken, 'userRole:', userRole, 'userRole === "ADMIN":', userRole === "ADMIN");

    // Check authorization: must have token and ADMIN role
    if (!authToken || userRole !== "ADMIN") {
      console.log('[AdminPage] Authorization FAILED - redirecting to dashboard');
      router.push("/dashboard");
      return;
    }

    console.log('[AdminPage] Authorization PASSED - rendering admin page');
    setCurrentUserId(userId);
    setToken(authToken);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className={layout.loadingCenter} data-testid="admin-loading">
        <p className="text-center text-gray-500">Loading admin panel…</p>
      </div>
    );
  }

  return (
    <div className={layout.page}>
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
        <h1 className={typography.pageHeading} data-testid="admin-heading">
          Admin Panel
        </h1>

        <div className="mt-4 mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              data-testid="user-management-tab"
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "categories"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              data-testid="category-management-tab"
            >
              Category Management
            </button>
          </div>
        </div>

        <div data-testid="admin-panel">
          {activeTab === "users" && (
            <UserManagementTab token={token} currentUserId={currentUserId} />
          )}
          {activeTab === "categories" && <CategoryManagementTab token={token} />}
        </div>
      </main>
    </div>
  );
}
