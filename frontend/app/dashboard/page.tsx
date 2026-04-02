import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";
import { nav, typography } from "@/lib/theme";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
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
