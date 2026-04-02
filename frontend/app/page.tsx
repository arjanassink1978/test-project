import Link from "next/link";
import { button, typography } from "@/lib/theme";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className={`${typography.largeHeading} mb-4`}>
            Welkom
          </h1>
          <p className={typography.bodyTextLg}>
            Beheer uw account
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className={button.primaryLg}
          >
            Inloggen
          </Link>
          <Link
            href="/register"
            className={button.outlineLg}
          >
            Registreren
          </Link>
        </div>
      </div>
    </main>
  );
}
