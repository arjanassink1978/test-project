"use client";

import { useState, useEffect, useCallback } from "react";
import { searchUsers, updateUserRole, type UserSummary } from "@/lib/api";
import { button, input, alert, typography, card } from "@/lib/theme";

interface UserManagementTabProps {
  token: string;
  currentUserId: number;
}

export default function UserManagementTab({ token, currentUserId }: UserManagementTabProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingUserId, setConfirmingUserId] = useState<number | null>(null);
  const [confirmingRole, setConfirmingRole] = useState<string | null>(null);

  const loadUsers = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchUsers(query, token);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers(searchQuery);
  }, [searchQuery, loadUsers]);

  async function handleRoleChange(userId: number, newRole: string) {
    setConfirmingUserId(userId);
    setConfirmingRole(newRole);
  }

  async function confirmRoleChange() {
    if (confirmingUserId === null || confirmingRole === null) return;

    setError(null);
    try {
      const updated = await updateUserRole(confirmingUserId, confirmingRole, token);
      setUsers(users.map(u => u.id === confirmingUserId ? updated : u));
      setConfirmingUserId(null);
      setConfirmingRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  function cancelConfirm() {
    setConfirmingUserId(null);
    setConfirmingRole(null);
  }

  const isConfirming = confirmingUserId !== null;

  return (
    <div data-testid="user-management-tab">
      {error && (
        <div className={`mb-4 ${alert.error}`} data-testid="user-management-error">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="user-search" className={typography.label}>
          Search Users
        </label>
        <input
          id="user-search"
          type="text"
          className={input.base}
          placeholder="Search by username or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="user-search-input"
        />
      </div>

      {loading ? (
        <div data-testid="user-management-loading" className="py-8 text-center text-gray-500">
          Loading users…
        </div>
      ) : users.length === 0 ? (
        <div data-testid="no-users-message" className="py-8 text-center text-gray-500">
          No users found.
        </div>
      ) : (
        <>
          {isConfirming && (
            <div className={`mb-4 ${card.padded} border-l-4 border-yellow-500`} data-testid="role-confirm-dialog">
              <p className="mb-4">
                Change role to <strong>{confirmingRole}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  className={button.primaryAuto}
                  onClick={confirmRoleChange}
                  data-testid="confirm-role-button"
                >
                  Confirm
                </button>
                <button
                  className={button.secondaryInline}
                  onClick={cancelConfirm}
                  data-testid="cancel-confirm-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <ul className="space-y-2" data-testid="user-list">
            {users.map((user) => (
              <li
                key={user.id}
                className={`flex items-center justify-between ${card.padded}`}
                data-testid={`user-row-${user.id}`}
              >
                <div>
                  <p className={typography.bodyValue} data-testid={`user-username-${user.id}`}>
                    {user.username}
                  </p>
                  <p className={typography.helperText} data-testid={`user-email-${user.id}`}>
                    {user.email}
                  </p>
                  <p className={`${typography.helperText} mt-1`} data-testid={`user-role-${user.id}`}>
                    Role: <strong>{user.role}</strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className={button.secondaryInline}
                    onClick={() => void handleRoleChange(user.id, "USER")}
                    disabled={user.id === currentUserId}
                    data-testid={`change-role-user-${user.id}`}
                  >
                    USER
                  </button>
                  <button
                    className={button.secondaryInline}
                    onClick={() => void handleRoleChange(user.id, "MODERATOR")}
                    disabled={user.id === currentUserId}
                    data-testid={`change-role-moderator-${user.id}`}
                  >
                    MOD
                  </button>
                  <button
                    className={button.secondaryInline}
                    onClick={() => void handleRoleChange(user.id, "ADMIN")}
                    disabled={user.id === currentUserId}
                    data-testid={`change-role-admin-${user.id}`}
                  >
                    ADMIN
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
