import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import ProfileLink from "@/components/ProfileLink";
import { nav, typography, button } from "@/lib/theme";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <Link
            href="/forum"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors"
            data-testid="forum-link"
          >
            Forum
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <div className="text-center">
          <h1 className={typography.largeHeading} data-testid="welcome-heading">
            Welkom
          </h1>
          <p className="mt-3 text-gray-700">
            Ontdek interessante discussies en deel je mening in onze community forum.
          </p>
          <Link
            href="/forum"
            className={`${button.primaryLg} mt-6 inline-block w-auto px-8`}
          >
            Ga naar het Forum →
          </Link>
        </div>
      </main>
    </div>
  );
}
