import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import ProfileLink from "@/components/ProfileLink";
import { nav, typography } from "@/lib/theme";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <Link
            href="/forum"
            className="inline-flex w-32 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 transition-colors"
            data-testid="forum-link"
          >
            Forum
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center px-4 py-24">
        <h1 className={typography.dashboardHeading} data-testid="welcome-heading">
          Welkom op deze site
        </h1>
      </main>
    </div>
  );
}
