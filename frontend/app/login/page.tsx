import LoginForm from "@/components/LoginForm";
import { card, typography, layout } from "@/lib/theme";

export default function LoginPage() {
  return (
    <main className={layout.centeredPage}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className={typography.pageHeading} data-testid="login-heading">
            Inloggen
          </h1>
          <p className={`mt-2 ${typography.bodyText}`}>
            Voer uw gegevens in om door te gaan
          </p>
        </div>

        <div className={card.paddedLg}>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
