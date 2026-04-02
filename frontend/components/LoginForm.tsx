"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { alert, input, button, typography, link } from "@/lib/theme";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the username from the response (server-confirmed)
        if (data.username) {
          localStorage.setItem("username", data.username);
        }
        // Store password for HTTP Basic auth in subsequent requests
        localStorage.setItem("password", password);
        router.push("/dashboard");
      } else if (response.status === 401) {
        setError("Ongeldige gebruikersnaam of wachtwoord");
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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate data-testid="login-form">
      {error && (
        <div
          role="alert"
          data-testid="login-error"
          className={alert.error}
        >
          {error}
        </div>
      )}

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
          className={input.base}
          placeholder="Voer uw gebruikersnaam in"
        />
      </div>

      <div>
        <label htmlFor="password" className={typography.label}>
          Wachtwoord
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          data-testid="password-input"
          className={input.base}
          placeholder="Voer uw wachtwoord in"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        data-testid="login-button"
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
            Bezig met inloggen…
          </>
        ) : (
          "Inloggen"
        )}
      </button>

      <p className={`text-center ${typography.bodyText}`}>
        Heeft u nog geen account?{" "}
        <Link href="/register" className={link.primary} data-testid="register-link">
          Registreren
        </Link>
      </p>
    </form>
  );
}
