import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Welkom
          </h1>
          <p className="text-lg text-gray-600">
            Beheer uw account
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            Inloggen
          </Link>
          <Link
            href="/register"
            className="flex w-full items-center justify-center rounded-lg bg-white border-2 border-indigo-600 px-4 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            Registreren
          </Link>
        </div>
      </div>
    </main>
  );
}
