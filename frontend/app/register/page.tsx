import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" data-testid="register-heading">
            Registreren
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Maak een nieuw account aan
          </p>
        </div>

        <div className="rounded-xl bg-white px-8 py-8 shadow-md ring-1 ring-gray-900/5">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
