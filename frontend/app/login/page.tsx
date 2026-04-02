import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" data-testid="login-heading">
            Inloggen
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Voer uw gegevens in om door te gaan
          </p>
        </div>

        <div className="rounded-xl bg-white px-8 py-8 shadow-md ring-1 ring-gray-900/5">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
