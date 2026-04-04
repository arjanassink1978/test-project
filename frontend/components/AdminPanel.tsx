"use client";

import { useState } from "react";
import UserManagementTab from "@/components/UserManagementTab";
import CategoryManagementTab from "@/components/CategoryManagementTab";
import { typography } from "@/lib/theme";

interface AdminPanelProps {
  token: string;
  currentUserId: number;
}

type ActiveTab = "users" | "categories";

export default function AdminPanel({ token, currentUserId }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");

  return (
    <div data-testid="admin-panel">
      <h1 className={typography.pageHeading} data-testid="admin-heading">
        Admin Panel
      </h1>

      <div className="mt-4 flex gap-2 border-b border-gray-200 pb-0" data-testid="admin-tabs">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("users")}
          data-testid="tab-users"
        >
          User Management
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "categories"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("categories")}
          data-testid="tab-categories"
        >
          Category Management
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "users" ? (
          <UserManagementTab token={token} currentUserId={currentUserId} />
        ) : (
          <CategoryManagementTab token={token} />
        )}
      </div>
    </div>
  );
}
