"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { alert, input, button, typography, link } from "@/lib/theme";

interface ValidationErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateForm(): boolean {
    const newErrors: ValidationErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "E-mail is verplicht";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Voer een geldig e-mailadres in";
    }

    // Username validation
    if (!username) {
      newErrors.username = "Gebruikersnaam is verplicht";
    } else if (username.length < 3) {
      newErrors.username = "Gebruikersnaam moet minstens 3 tekens lang zijn";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Wachtwoord is verplicht";
    } else if (password.length < 8) {
      newErrors.password = "Wachtwoord moet minstens 8 tekens lang zijn";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Wachtwoordbevestiging is verplicht";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Wachtwoorden komen niet overeen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      if (response.ok) {
        router.push("/login");
      } else if (response.status === 409) {
        setError("Deze gebruikersnaam of e-mail is al in gebruik");
      } else if (response.status === 400) {
        const data = await response.json();
        setError(data.message || "Registratie mislukt. Controleer uw gegevens.");
      } else {
        setError("Er is een onverwachte fout opgetreden. Probeer het later opnieuw.");
      }
    } catch {
      setError("Kan geen verbinding maken met de server. Controleer uw internetverbinding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate data-testid="register-form">
      {error && (
        <div
          role="alert"
          data-testid="register-error"
          className={alert.error}
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className={typography.label}>
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          data-testid="email-input"
          className={errors.email ? input.error : input.base}
          placeholder="Voer uw e-mailadres in"
        />
        {errors.email && (
          <p className={typography.errorText}>{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="username" className={typography.label}>
          Gebruikersnaam
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          data-testid="username-input"
          className={errors.username ? input.error : input.base}
          placeholder="Voer uw gebruikersnaam in"
        />
        {errors.username && (
          <p className={typography.errorText}>{errors.username}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className={typography.label}>
          Wachtwoord
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          data-testid="password-input"
          className={errors.password ? input.error : input.base}
          placeholder="Voer uw wachtwoord in"
        />
        {errors.password && (
          <p className={typography.errorText}>{errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className={typography.label}>
          Wachtwoord bevestigen
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          data-testid="confirm-password-input"
          className={errors.confirmPassword ? input.error : input.base}
          placeholder="Bevestig uw wachtwoord"
        />
        {errors.confirmPassword && (
          <p className={typography.errorText}>{errors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        data-testid="register-button"
        className={button.primary}
      >
        {loading ? (
          <>
            <svg
              className={button.spinner}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Bezig met registreren…
          </>
        ) : (
          "Registreren"
        )}
      </button>

      <p className={`text-center ${typography.bodyText}`}>
        Heeft u al een account?{" "}
        <Link href="/login" className={link.primary} data-testid="login-link">
          Inloggen
        </Link>
      </p>
    </form>
  );
}
