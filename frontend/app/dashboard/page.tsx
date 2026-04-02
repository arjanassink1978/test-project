import LogoutButton from "@/components/LogoutButton";
import ProfileLink from "@/components/ProfileLink";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-white px-8 py-10 shadow-md ring-1 ring-gray-900/5 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-7 w-7 text-green-600"
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
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Welkom! U bent ingelogd.
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            U heeft succesvol ingelogd op de applicatie.
          </p>
        </div>

        <div className="space-y-3 w-full">
          <ProfileLink />
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
