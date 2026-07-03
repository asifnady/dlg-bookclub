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
      setEmail("");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Full-screen background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg.jpg)" }}
      />

      {/* Very subtle gradient overlay at bottom for readability */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

      {/* Minimal floating badge — small, centered */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs mx-auto">
          {/* Small glass card */}
          <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/15 shadow-lg p-5">
            <div className="text-center space-y-4">
              {/* Title — just a thin wordmark */}
              <h1 className="text-xl font-semibold tracking-wide text-white/90">
                DLG Bookclub
              </h1>

              {sent ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-green-300">✨ Magic link sent</p>
                  <p className="text-xs text-white/60">Check your email (and spam) for the link.</p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-xs text-amber-300/80 underline hover:text-amber-200 transition-colors"
                  >
                    Send again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg px-3 py-2.5 text-center text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
                  />
                  {error && (
                    <p className="text-xs text-red-300/80">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-white/15 backdrop-blur-lg border border-white/20 px-3 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/25 active:bg-white/20 disabled:opacity-40"
                  >
                    {loading ? "Sending…" : "Send Magic Link →"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Tiny credit — barely there */}
          <p className="mt-4 text-center text-[10px] text-white/30 tracking-wider uppercase">
            DLG Bookclub &middot; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
