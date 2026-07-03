"use client";

import { useState, useEffect, useRef } from "react";
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
      setEmail(""); // Clear email from state so it's not visible anywhere
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen w-full overflow-hidden bg-black">
        {/* Photorealistic Tatooine desert background */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/tatooine-bg.jpg)" }}
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 z-[1] bg-black/30" />

        {/* Twin suns glow in the sky */}
        <div className="absolute top-12 right-[15%] z-[2] opacity-70">
          <div className="w-20 h-20 rounded-full bg-amber-300/60 shadow-[0_0_80px_40px_rgba(251,191,36,0.3)]" />
        </div>
        <div className="absolute top-20 right-[23%] z-[2] opacity-60">
          <div className="w-14 h-14 rounded-full bg-orange-300/50 shadow-[0_0_60px_30px_rgba(251,146,60,0.25)]" />
        </div>

        {/* Animated sand particles blowing in the wind */}
        <SandParticles />

        {/* Login card floating above the desert */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm">
            {/* Card with Apple liquid glass look */}
            <div className="relative rounded-2xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-8">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 text-center space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                  DLG Bookclub 📚
                </h1>
                <p className="text-white/80">
                  No password? <span className="font-semibold text-amber-300">No problem.</span>
                </p>

                {sent ? (
                  <div className="rounded-xl bg-white/10 backdrop-blur-xl p-6 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                    <p className="text-lg font-medium text-green-300">✨ Magic link sent!</p>
                    <p className="mt-2 text-sm text-white/70">
                      Check your inbox (and spam) for the login link.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-4 text-sm text-amber-300 underline hover:text-amber-200 transition-colors"
                    >
                      Send again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="w-full rounded-xl border border-white/30 bg-white/10 backdrop-blur-xl px-4 py-3 text-center text-lg text-white placeholder:text-white/60 outline-none shadow-[0_2px_15px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-300 bg-red-900/40 backdrop-blur-sm rounded-lg px-3 py-2">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm px-4 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:from-amber-400 hover:to-orange-400 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 border border-white/20"
                    >
                      {loading ? "Sending…" : "Send Magic Link"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Tatooine flavor text */}
            <p className="mt-6 text-center text-xs text-white/40">
              A long time ago in a library far, far away...
            </p>
          </div>
        </div>

        {/* Wind-blown sand streaks overlay */}
        <WindLines />
      </div>
    </>
  );
}

function SandParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      drift: number;
    }[] = [];

    // Create sand particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        drift: Math.random() * 0.5 - 0.25,
      });
    }

    let animId: number;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        ctx.fillStyle = `rgba(194, 143, 89, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Move particles left-to-right (wind blowing) with slight vertical drift
        p.x += p.speed;
        p.y += p.drift;

        // Reset when off screen
        if (p.x > canvas.width + 10) {
          p.x = -10;
          p.y = Math.random() * canvas.height;
          p.speed = Math.random() * 2 + 0.5;
          p.drift = Math.random() * 0.5 - 0.25;
        }
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[5] pointer-events-none" />;
}

function WindLines() {
  return (
    <div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden">
      <style jsx>{`
        @keyframes windSweep {
          0% {
            transform: translateX(-100%) translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 0.15;
          }
          90% {
            opacity: 0.1;
          }
          100% {
            transform: translateX(calc(100vw + 100%)) translateY(-20px);
            opacity: 0;
          }
        }
        .wind-line {
          position: absolute;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 200, 100, 0.25), transparent);
          animation: windSweep 6s ease-in-out infinite;
        }
      `}</style>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="wind-line"
          style={{
            top: `${15 + i * 14}%`,
            width: `${100 + Math.random() * 200}px`,
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${5 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
