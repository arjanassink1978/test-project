import RegisterForm from "@/components/RegisterForm";
import { card, typography } from "@/lib/theme";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className={typography.pageHeading} data-testid="register-heading">
            Registreren
          </h1>
          <p className={`mt-2 ${typography.bodyText}`}>
            Maak een nieuw account aan
          </p>
        </div>

        <div className={card.paddedLg}>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
