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
      {/* Full-screen photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg.jpg)" }}
      />

      {/* Content — pushed to top */}
      <div className="relative z-10 flex min-h-screen flex-col items-center pt-12 px-6">
        <div className="w-full max-w-[280px] mx-auto">
          {/* Ultra-thin glass badge at top */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-[2px] border border-white/10 p-4">
            <div className="text-center space-y-3">
              <h1 className="text-base font-medium tracking-wide text-white/80">
                DLG Bookclub
              </h1>

              {sent ? (
                <div className="space-y-2">
                  <p className="text-xs text-green-300/80">✨ Magic link sent</p>
                  <p className="text-xs text-white/50">Check your email (and spam).</p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-xs text-white/40 underline hover:text-white/60 transition-colors"
                  >
                    Send again
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-[2px] px-3 py-2 text-center text-sm text-white/80 placeholder:text-white/30 outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
                  />
                  {error && (
                    <p className="text-xs text-red-300/60">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-white/10 backdrop-blur-[2px] border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/15 active:bg-white/5 disabled:opacity-40"
                  >
                    {loading ? "Sending…" : "Send Magic Link →"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sign in label - barely there */}
          <p className="mt-3 text-center text-[10px] text-white/20 tracking-wider uppercase">
            Sign in with email
          </p>
        </div>
      </div>
    </div>
  );
}
