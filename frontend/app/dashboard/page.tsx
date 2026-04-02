import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="w-full bg-white shadow-sm ring-1 ring-gray-900/5">
        <div className="mx-auto flex max-w-5xl items-center justify-start gap-3 px-6 py-3">
          <ProfileLink />
          <LogoutButton />
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center px-4 py-24">
        <h1 className="text-2xl font-semibold text-gray-900" data-testid="welcome-heading">
          Welkom op deze site
        </h1>
      </main>
    </div>
  );
}
