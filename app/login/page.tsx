"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-800">
          DLG Bookclub 📚
        </h1>
        <p className="text-stone-600">
          No password? <span className="font-semibold text-amber-700">No problem.</span>
        </p>

        {sent ? (
          <div className="rounded-xl bg-white p-6 shadow-md">
            <p className="text-lg font-medium text-green-700">✨ Magic link sent!</p>
            <p className="mt-2 text-sm text-stone-500">
              Check your inbox (and spam) for the login link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-center text-lg shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-600 px-4 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
