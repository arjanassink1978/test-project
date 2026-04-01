"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      const response = await fetch("http://localhost:8080/api/auth/signup", {
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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
          className={`block w-full rounded-lg border ${
            errors.email ? "border-red-300" : "border-gray-300"
          } bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm`}
          placeholder="Voer uw e-mailadres in"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
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
          className={`block w-full rounded-lg border ${
            errors.username ? "border-red-300" : "border-gray-300"
          } bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm`}
          placeholder="Voer uw gebruikersnaam in"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
          className={`block w-full rounded-lg border ${
            errors.password ? "border-red-300" : "border-gray-300"
          } bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm`}
          placeholder="Voer uw wachtwoord in"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
          className={`block w-full rounded-lg border ${
            errors.confirmPassword ? "border-red-300" : "border-gray-300"
          } bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm`}
          placeholder="Bevestig uw wachtwoord"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
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

      <p className="text-center text-sm text-gray-600">
        Heeft u al een account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Inloggen
        </Link>
      </p>
    </form>
  );
}
