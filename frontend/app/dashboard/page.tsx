import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import ProfileLink from "@/components/ProfileLink";
import ForumLink from "@/components/ForumLink";
import { nav, typography, button } from "@/lib/theme";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <ForumLink />
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
