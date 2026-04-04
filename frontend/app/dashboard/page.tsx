import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import ProfileLink from "@/components/ProfileLink";
import ForumLink from "@/components/ForumLink";
import { nav, typography, button, layout } from "@/lib/theme";

export default function DashboardPage() {
  return (
    <div className={layout.page}>
      <nav className={nav.bar}>
        <div className={nav.inner}>
          <ProfileLink />
          <ForumLink />
          <LogoutButton />
        </div>
      </nav>

      <main className={layout.container}>
        <div className="text-center">
          <h1 className={typography.largeHeading} data-testid="welcome-heading">
            Welkom
          </h1>
          <p className={`mt-3 ${typography.bodyText}`}>
            Ontdek interessante discussies en deel je mening in onze community forum.
          </p>
          <Link
            href="/forum"
            className={`${button.primaryAuto} mt-6`}
          >
            Ga naar het Forum →
          </Link>
        </div>
      </main>
    </div>
  );
}
