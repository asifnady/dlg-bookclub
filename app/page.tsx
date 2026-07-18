"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type PageState = "bios" | "dos" | "loading" | "login" | "app";

export default function HomePage() {
  const [pageState, setPageState] = useState<PageState>("bios");
  const [bootText, setBootText] = useState<string[]>([]);
  const bootLines = useRef<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Blinking cursor
  useEffect(() => {
    const ci = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(ci);
  }, []);

  // Check existing session on mount
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setLoggedIn(true);
          setUserName(data.user.name);
          setPageState("app");
        }
      })
      .catch(() => {});
  }, []);

  // BIOS boot
  useEffect(() => {
    if (pageState !== "bios") return;

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
        setTimeout(() => setPageState("dos"), 600);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [pageState]);

  // DOS boot
  useEffect(() => {
    if (pageState !== "dos") return;

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
        setTimeout(() => setPageState("loading"), 800);
      }
    }, 180);
    return () => clearInterval(interval);
  }, [pageState]);

  useEffect(() => {
    if (pageState !== "loading") return;
    const timer = setTimeout(() => setPageState("login"), 4000);
    return () => clearTimeout(timer);
  }, [pageState]);

  // --- Logged-in app ---
  if (loggedIn && pageState === "app") {
    return <MemberDashboard userName={userName} onLogout={() => { setLoggedIn(false); setPageState("login"); }} />;
  }

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#008080] font-mono select-none">
      {/* === BIOS / DOS black screen === */}
      {(pageState === "bios" || pageState === "dos") && (
        <div className="fixed inset-0 z-50 bg-black p-6 overflow-auto">
          <div className="max-w-[640px] mx-auto">
            <pre className="text-[#00FF00] text-sm leading-relaxed whitespace-pre-wrap">
              {bootText.join("\n")}
              {pageState === "dos" && showCursor && "_"}
            </pre>
          </div>
        </div>
      )}

      {/* === Windows 95 Loading Screen === */}
      {pageState === "loading" && (
        <div className="fixed inset-0 z-50 bg-[#008080] flex flex-col items-center justify-center">
          <Windows95Splash />
        </div>
      )}

      {/* === Windows 95 Desktop + Login Dialog === */}
      {pageState === "login" && (
        <div className="fixed inset-0 bg-[#008080] overflow-hidden">
          <div className="absolute top-3 left-3 flex flex-col gap-5 z-10">
            <DesktopIcon icon="📁" label="My Books" />
            <DesktopIcon icon="📋" label="Polls" />
            <DesktopIcon icon="🗑️" label="Recycle Bin" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="animate-fadeIn">
              <Windows95LoginFlow
                onLoggedIn={(name) => {
                  setUserName(name);
                  setLoggedIn(true);
                  setPageState("app");
                }}
              />
            </div>
          </div>

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

/* ─── Login Flow Component ─── */

type LoginStep = "email" | "sending" | "sent" | "register" | "submitted" | "pending" | "error";

function Windows95LoginFlow({ onLoggedIn }: { onLoggedIn: (name: string) => void }) {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkEmail = useCallback(async () => {
    if (!email.trim()) return;
    setStep("sending");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.status === "verified") {
        // Auto-login: create session
        const sessionRes = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const sessionData = await sessionRes.json();
        if (sessionData.status === "ok") {
          onLoggedIn(sessionData.member.name);
          return;
        }
        setErrorMsg("Session error. Try again.");
        setStep("email");
      } else if (data.status === "unverified") {
        // Send magic link
        setStep("sent");
        const supabaseModule = await import("@/lib/supabase/client");
        const supabase = supabaseModule.createClient();
        await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
      } else if (data.status === "not_found") {
        // Show registration form
        setStep("register");
      } else {
        setErrorMsg("Unexpected response.");
        setStep("email");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error. Try again.");
      setStep("email");
    }
  }, [email, onLoggedIn]);

  const submitRegistration = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !city.trim()) return;
    setStep("sending");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          city: city.trim(),
        }),
      });
      const data = await res.json();

      if (data.status === "submitted") {
        setStep("submitted");
      } else if (data.status === "already_pending") {
        setStep("pending");
      } else {
        setErrorMsg("Registration error. Try again.");
        setStep("register");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error. Try again.");
      setStep("register");
    }
  }, [email, firstName, lastName, city]);

  return (
    <div
      className="w-[420px] max-w-[90vw] shadow-[4px_4px_0px_#00000040]"
      style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}
    >
      {/* Title Bar */}
      <div className="bg-[#000080] flex items-center justify-between px-[3px] py-[3px]">
        <div className="flex items-center gap-1">
          <div className="w-[14px] h-[14px] bg-[#c0c0c0] flex items-center justify-center border border-white border-r-black border-b-black text-[10px] leading-none text-black font-bold">📚</div>
          <span className="text-white text-xs font-bold tracking-wide">DLG Bookclub</span>
        </div>
        <div className="flex gap-[2px]">
          <button className="w-[16px] h-[14px] bg-[#c0c0c0] border border-white border-r-black border-b-black flex items-center justify-center text-[9px] text-black font-bold leading-none active:border-black active:border-t-gray-400 active:border-l-gray-400">?</button>
          <button className="w-[16px] h-[14px] bg-[#c0c0c0] border border-white border-r-black border-b-black flex items-center justify-center text-[9px] text-black font-bold leading-none active:border-black active:border-t-gray-400 active:border-l-gray-400">✕</button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-[#c0c0c0] px-4 py-4 border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black min-h-[200px]">
        {step === "email" && (
          <EmailStep
            email={email}
            setEmail={setEmail}
            onSubmit={checkEmail}
            errorMsg={errorMsg}
          />
        )}

        {step === "sending" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <p className="text-sm font-bold text-black">Processing...</p>
          </div>
        )}

        {step === "sent" && (
          <MagicLinkSentStep email={email} />
        )}

        {step === "register" && (
          <RegisterStep
            email={email}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            city={city}
            setCity={setCity}
            onSubmit={submitRegistration}
            onBack={() => setStep("email")}
            errorMsg={errorMsg}
          />
        )}

        {step === "submitted" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-sm font-bold text-black mb-2">Request Submitted!</p>
            <p className="text-[11px] text-gray-700 leading-tight">
              Your registration has been sent to the admin for approval.
              You'll be notified once it's approved.
            </p>
          </div>
        )}

        {step === "pending" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="text-5xl mb-3">⏳</div>
            <p className="text-sm font-bold text-black mb-2">Already Pending</p>
            <p className="text-[11px] text-gray-700 leading-tight">
              You already have a pending registration request.
              Please wait for the admin to approve it.
            </p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-[#c0c0c0] border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black px-[3px] py-[2px] flex items-center justify-between -mt-[2px]">
        <div className="flex items-center gap-[3px]">
          <div className="w-[12px] h-[12px] bg-[#008080] flex items-center justify-center text-white text-[6px] font-bold border border-white border-r-black border-b-black">B</div>
          <span className="text-[10px] text-black">Ready</span>
        </div>
        <span className="text-[10px] text-black">DLG | 📚</span>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function EmailStep({ email, setEmail, onSubmit, errorMsg }: {
  email: string; setEmail: (v: string) => void; onSubmit: () => void; errorMsg: string | null;
}) {
  return (
    <>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-[64px] h-[64px] bg-[#808080] border-2 border-white border-r-black border-b-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl leading-none">📚</div>
            <div className="text-[8px] mt-[1px] text-white font-bold bg-[#000080] px-[3px]">DLG</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-black mb-1">DLG Bookclub — Sign In</p>
          <p className="text-[11px] text-gray-700 mb-3">Type your email to sign in or register.</p>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <label className="text-[11px] text-black block mb-[2px] font-bold">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-white px-2 py-1 text-sm text-black outline-none focus:border-[#000080]"
            />
            {errorMsg && <p className="text-[10px] text-red-700 mt-1">{errorMsg}</p>}
            <div className="flex justify-end mt-4 gap-2">
              <button
                type="submit"
                className="px-5 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-black font-bold active:border-black active:border-t-gray-400 active:border-l-gray-400 hover:brightness-110"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="border-t border-gray-400 pt-2 mt-1">
        <p className="text-[10px] text-gray-600 text-center leading-tight">Private bookclub for the DLG reading circle.</p>
      </div>
    </>
  );
}

function MagicLinkSentStep({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="text-5xl mb-3">📬</div>
      <p className="text-sm font-bold text-black mb-2">Magic Link Sent!</p>
      <p className="text-[11px] text-gray-700 leading-tight mb-2">
        Check your email <span className="font-bold">{email}</span> for the sign-in link.
      </p>
      <p className="text-[10px] text-gray-500">(Also check your spam folder)</p>
      <p className="text-[10px] text-gray-500 mt-3">
        Once you've confirmed, you won't need this step again.
      </p>
    </div>
  );
}

function RegisterStep({ email, firstName, setFirstName, lastName, setLastName, city, setCity, onSubmit, onBack, errorMsg }: {
  email: string;
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  city: string; setCity: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  errorMsg: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-black mb-1">📝 New Member Registration</p>
      <p className="text-[11px] text-gray-700 mb-2">You're not a member yet. Fill this out to request access.</p>

      <div>
        <label className="text-[11px] text-black block mb-[2px] font-bold">Email:</label>
        <input type="text" value={email} disabled className="w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-gray-200 px-2 py-1 text-sm text-gray-600" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-black block mb-[2px] font-bold">First Name:</label>
          <input
            type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-white px-2 py-1 text-sm text-black outline-none focus:border-[#000080]"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-black block mb-[2px] font-bold">Last Name:</label>
          <input
            type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-white px-2 py-1 text-sm text-black outline-none focus:border-[#000080]"
          />
        </div>
      </div>
      <div>
        <label className="text-[11px] text-black block mb-[2px] font-bold">City:</label>
        <input
          type="text" value={city} onChange={(e) => setCity(e.target.value)}
          required
          className="w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-white px-2 py-1 text-sm text-black outline-none focus:border-[#000080]"
        />
      </div>

      {errorMsg && <p className="text-[10px] text-red-700">{errorMsg}</p>}

      <div className="flex justify-end mt-2 gap-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-black font-bold active:border-black active:border-t-gray-400 active:border-l-gray-400"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-5 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-black font-bold active:border-black active:border-t-gray-400 active:border-l-gray-400 hover:brightness-110"
        >
          Submit
        </button>
      </div>

      <div className="border-t border-gray-400 pt-2 mt-1">
        <p className="text-[10px] text-gray-600 text-center">
          Your request will be sent to the admin for approval.
        </p>
      </div>
    </div>
  );
}

/* ─── Windows 95 Splash ─── */

function Windows95Splash() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-4">
        <div className="text-white text-5xl font-bold tracking-[0.15em]" style={{ fontFamily: "'Times New Roman', serif", textShadow: "3px 3px 0 #000" }}>
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
        <div className="text-white text-xl tracking-[0.3em] mt-1" style={{ fontFamily: "'Times New Roman', serif" }}>WINDOWS 95</div>
      </div>

      <div className="flex items-center gap-1 mb-2">
        {[0, 0.2, 0.4, 0.6].map((d) => (
          <div key={d} className="w-2 h-2 bg-white" style={{ animation: `win95Pulse 0.8s infinite`, animationDelay: `${d}s` }} />
        ))}
        <span className="text-white/70 text-xs ml-2">Please wait while Windows starts up...</span>
      </div>

      <div className="w-[280px] h-[18px] bg-white border-2 border-black">
        <div className="h-full bg-[#000080]" style={{ animation: "loadBar 3.5s ease-in-out forwards" }} />
      </div>

      <div className="mt-3 text-white/50 text-[10px] tracking-wide">DLG Bookclub Edition</div>

      <style jsx>{`
        @keyframes loadBar { 0% { width: 0%; } 15% { width: 15%; } 30% { width: 28%; } 50% { width: 45%; } 70% { width: 67%; } 85% { width: 82%; } 92% { width: 91%; } 100% { width: 100%; } }
        @keyframes win95Pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

/* ─── Desktop Icon ─── */

function DesktopIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-[2px] w-[68px]">
      <div className="text-3xl leading-none">{icon}</div>
      <div className="bg-[#000080] text-white text-[10px] px-[6px] py-[1px] text-center leading-tight font-bold whitespace-nowrap">{label}</div>
    </div>
  );
}

/* ─── Taskbar ─── */

function Windows95Taskbar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    update();
    const ci = setInterval(update, 30000);
    return () => clearInterval(ci);
  }, []);

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
      <div className="text-[10px] text-black px-2 font-bold">{time}</div>
    </div>
  );
}

/* ─── Member Dashboard (placeholder) ─── */

function MemberDashboard({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-[#008080] font-mono flex flex-col items-center justify-center p-6">
      <div className="bg-[#c0c0c0] border-2 border-white border-r-black border-b-black p-8 max-w-md w-full shadow-[4px_4px_0px_#00000040]"
        style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}>
        <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold mb-4">📚 DLG Bookclub — Dashboard</div>
        <p className="text-lg font-bold text-black mb-2">Welcome, {userName}! 👋</p>
        <p className="text-[11px] text-gray-700 mb-6">The bookclub dashboard is coming soon. Stay tuned!</p>
        <button
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            onLogout();
          }}
          className="px-5 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-black font-bold active:border-black active:border-t-gray-400 active:border-l-gray-400"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
