"use client";

import { useState, useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function HomePage() {
  const [bootPhase, setBootPhase] = useState<
    "bios" | "dos" | "loading" | "login"
  >("bios");
  const [bootText, setBootText] = useState<string[]>([]);
  const bootLines = useRef<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const ci = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(ci);
  }, []);

  // BIOS boot
  useEffect(() => {
    if (bootPhase !== "bios") return;

    const lines = [
      "Award Modular BIOS v4.51PG, An Energy Star Ally",
      "Copyright (C) 1984-98, Award Software, Inc.",
      "",
      "DLG-BOOKCLUB BIOS Revision 1.0",
      "CPU: Intel Pentium II @ 233MHz",
      "Memory Test:     16384K OK",
      "Memory Test:     65536K OK",
      "",
      "Primary Master:  QUANTUM FIREBALL EX6.4A  06H A0.5600",
      "Primary Slave:   NONE",
      "Secondary Master: NONE",
      "Secondary Slave:  NONE",
      "",
      "Plug and Play BIOS Support 1.00A",
      "PnP Init Completed",
      "",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        bootLines.current = [...bootLines.current, lines[i]];
        setBootText([...bootLines.current]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootPhase("dos"), 600);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [bootPhase]);

  // Transition loading → login after 4s
  useEffect(() => {
    if (bootPhase !== "loading") return;
    const timer = setTimeout(() => setBootPhase("login"), 4000);
    return () => clearTimeout(timer);
  }, [bootPhase]);

  // DOS boot
  useEffect(() => {
    if (bootPhase !== "dos") return;

    const lines = [
      "Starting MS-DOS...",
      "",
      "HIMEM.SYS is testing extended memory...done.",
      "EMM386.EXE installed.",
      "",
      "Windows 95 is starting up...",
      "",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < lines.length) {
        bootLines.current = [...bootLines.current, lines[i]];
        setBootText([...bootLines.current]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootPhase("loading"), 800);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [bootPhase]);

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#008080] font-mono select-none">
      {/* === BIOS / DOS black screen === */}
      {(bootPhase === "bios" || bootPhase === "dos") && (
        <div className="fixed inset-0 z-50 bg-black p-6 overflow-auto">
          <div className="max-w-[640px] mx-auto">
            <pre className="text-[#00FF00] text-sm leading-relaxed whitespace-pre-wrap">
              {bootText.join("\n")}
              {bootPhase === "dos" && showCursor && "_"}
            </pre>
          </div>
        </div>
      )}

      {/* === Windows 95 Loading Screen === */}
      {bootPhase === "loading" && (
        <div className="fixed inset-0 z-50 bg-[#008080] flex flex-col items-center justify-center">
          <Windows95Splash />
        </div>
      )}

      {/* === Windows 95 Desktop + Login Dialog === */}
      {bootPhase === "login" && (
        <div className="fixed inset-0 bg-[#008080] overflow-hidden">
          {/* Desktop icons */}
          <div className="absolute top-3 left-3 flex flex-col gap-5 z-10">
            <DesktopIcon icon="📁" label="My Books" />
            <DesktopIcon icon="📋" label="Polls" />
            <DesktopIcon icon="🗑️" label="Recycle Bin" />
          </div>

          {/* Login dialog centered */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="animate-fadeIn">
              <Windows95LoginDialog />
            </div>
          </div>

          {/* Start bar */}
          <Windows95Taskbar />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ─── Windows 95 Splash / Loading ─── */

function Windows95Splash() {
  return (
    <div className="flex flex-col items-center">
      {/* Windows 95 logo */}
      <div className="text-center mb-4">
        <div
          className="text-white text-5xl font-bold tracking-[0.15em]"
          style={{
            fontFamily: "'Times New Roman', serif",
            textShadow: "3px 3px 0 #000",
          }}
        >
          <span className="text-[#FF0000]">M</span>
          <span className="text-[#00FF00]">i</span>
          <span className="text-[#FFFF00]">c</span>
          <span className="text-[#0000FF]">r</span>
          <span className="text-[#FF00FF]">o</span>
          <span className="text-[#00FFFF]">s</span>
          <span className="text-[#FF0000]">o</span>
          <span className="text-[#00FF00]">f</span>
          <span className="text-[#FFFF00]">t</span>
        </div>
        <div
          className="text-white text-xl tracking-[0.3em] mt-1"
          style={{ fontFamily: "'Times New Roman', serif" }}
        >
          WINDOWS 95
        </div>
      </div>

      {/* Animated loading dots */}
      <div className="flex items-center gap-1 mb-2">
        <div
          className="w-2 h-2 bg-white"
          style={{
            animation: "win95Pulse 0.8s infinite",
            animationDelay: "0s",
          }}
        />
        <div
          className="w-2 h-2 bg-white"
          style={{
            animation: "win95Pulse 0.8s infinite",
            animationDelay: "0.2s",
          }}
        />
        <div
          className="w-2 h-2 bg-white"
          style={{
            animation: "win95Pulse 0.8s infinite",
            animationDelay: "0.4s",
          }}
        />
        <div
          className="w-2 h-2 bg-white"
          style={{
            animation: "win95Pulse 0.8s infinite",
            animationDelay: "0.6s",
          }}
        />
        <span className="text-white/70 text-xs ml-2">
          Please wait while Windows starts up...
        </span>
      </div>

      {/* Loading bar */}
      <div className="w-[280px] h-[18px] bg-white border-2 border-black">
        <div
          className="h-full bg-[#000080]"
          style={{
            animation: "loadBar 3.5s ease-in-out forwards",
          }}
        />
      </div>

      <div className="mt-3 text-white/50 text-[10px] tracking-wide">
        DLG Bookclub Edition
      </div>

      <style jsx>{`
        @keyframes loadBar {
          0% { width: 0%; }
          15% { width: 15%; }
          30% { width: 28%; }
          50% { width: 45%; }
          70% { width: 67%; }
          85% { width: 82%; }
          92% { width: 91%; }
          100% { width: 100%; }
        }
        @keyframes win95Pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Windows 95 Login Dialog ─── */

function Windows95LoginDialog() {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Lazy load supabase client
    if (!supabaseRef.current) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        supabaseRef.current = createClient();
      } catch {
        setError("System component not loaded. Try again.");
        setLoading(false);
        return;
      }
    }

    const { error: authError } = await supabaseRef.current.auth.signInWithOtp({
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
    <div
      className="w-[420px] max-w-[90vw] shadow-[4px_4px_0px_#00000040]"
      style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}
    >
      {/* Title Bar */}
      <div className="bg-[#000080] flex items-center justify-between px-[3px] py-[3px]">
        <div className="flex items-center gap-1">
          <div className="w-[14px] h-[14px] bg-[#c0c0c0] flex items-center justify-center border border-white border-r-black border-b-black text-[10px] leading-none text-black font-bold">
            📚
          </div>
          <span className="text-white text-xs font-bold tracking-wide">
            Welcome to DLG Bookclub
          </span>
        </div>
        <div className="flex gap-[2px]">
          <button className="w-[16px] h-[14px] bg-[#c0c0c0] border border-white border-r-black border-b-black flex items-center justify-center text-[9px] text-black font-bold leading-none active:border-black active:border-t-gray-400 active:border-l-gray-400">
            ?
          </button>
          <button className="w-[16px] h-[14px] bg-[#c0c0c0] border border-white border-r-black border-b-black flex items-center justify-center text-[9px] text-black font-bold leading-none active:border-black active:border-t-gray-400 active:border-l-gray-400">
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-[#c0c0c0] px-4 py-4 border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black">
        <div className="flex items-start gap-4 mb-4">
          {/* Classic icon */}
          <div className="flex-shrink-0 w-[64px] h-[64px] bg-[#808080] border-2 border-white border-r-black border-b-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl leading-none">📚</div>
              <div className="text-[8px] mt-[1px] text-white font-bold bg-[#000080] px-[3px]">
                DLG
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {!sent ? (
              <>
                <p className="text-sm font-bold text-black mb-1">
                  DLG Bookclub — Sign In
                </p>
                <p className="text-[11px] text-gray-700 mb-3">
                  Type your email address below to receive a magic link.
                </p>
                <form onSubmit={handleSubmit}>
                  <label className="text-[11px] text-black block mb-[2px] font-bold">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-white px-2 py-1 text-sm text-black outline-none focus:border-[#000080]"
                  />
                  {error && (
                    <p className="text-[10px] text-red-700 mt-1">{error}</p>
                  )}
                  <div className="flex justify-end mt-4 gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-black font-bold active:border-black active:border-t-gray-400 active:border-l-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                    >
                      {loading ? "Sending..." : "OK"}
                    </button>
                    <button
                      type="button"
                      disabled
                      className="px-5 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-gray-500 font-bold cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-black mb-1">
                  📬 Magic Link Sent
                </p>
                <p className="text-[11px] text-gray-700 mb-1 leading-tight">
                  Check your email inbox (and spam folder) for the sign-in link.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-[11px] text-[#000080] underline hover:text-[#0000FF]"
                >
                  Send again
                </button>
              </>
            )}
          </div>
        </div>

        {/* Not a member info */}
        <div className="border-t border-gray-400 pt-2 mt-1">
          <p className="text-[10px] text-gray-600 text-center leading-tight">
            Not a member yet? This is a private bookclub. Reach out to Asif at
          </p>
          <p className="text-[10px] text-[#000080] font-bold text-center">
            deskofasifnadeem@agentmail.to
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-[#c0c0c0] border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black px-[3px] py-[2px] flex items-center justify-between -mt-[2px]">
        <div className="flex items-center gap-[3px]">
          <div className="w-[12px] h-[12px] bg-[#008080] flex items-center justify-center text-white text-[6px] font-bold border border-white border-r-black border-b-black">
            B
          </div>
          <span className="text-[10px] text-black">Ready</span>
        </div>
        <span className="text-[10px] text-black">DLG | 📚</span>
      </div>
    </div>
  );
}

/* ─── Desktop Icon ─── */

function DesktopIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-[2px] w-[68px]">
      <div className="text-3xl leading-none">{icon}</div>
      <div className="bg-[#000080] text-white text-[10px] px-[6px] py-[1px] text-center leading-tight font-bold whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

/* ─── Windows 95 Taskbar ─── */

function Windows95Taskbar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#c0c0c0] border-t-2 border-white flex items-center h-[34px] px-[2px] gap-1 z-30">
      <button className="flex items-center gap-1 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black px-[3px] py-[2px] font-bold text-sm text-black active:border-black active:border-t-gray-400 active:border-l-gray-400 hover:brightness-110">
        <span className="text-sm leading-none">🪟</span>
        <span className="text-xs tracking-wide">Start</span>
      </button>
      <div className="border-l border-gray-400 h-[22px] mx-1" />
      <button className="flex items-center gap-1 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black px-2 py-[2px] text-black text-xs active:border-black active:border-t-gray-400 active:border-l-gray-400 shadow-[inset_1px_1px_1px_#00000020]">
        <span className="text-[10px]">📚</span>
        <span>DLG Bookclub</span>
      </button>
      <div className="flex-1" />
      <div className="border-l border-gray-400 h-[22px]" />
      <div className="text-[10px] text-black px-2 font-bold">
        {new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
    </div>
  );
}
