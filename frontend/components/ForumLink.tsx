"use client";

import Link from "next/link";
import { profileLink } from "@/lib/theme";

export default function ForumLink() {
  return (
    <Link
      href="/forum"
      className={profileLink.base}
      data-testid="forum-link"
    >
      <svg
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Forum
    </Link>
  );
}
