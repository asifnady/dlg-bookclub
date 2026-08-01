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
  const [isAdmin, setIsAdmin] = useState(false);

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
          setIsAdmin(data.user.is_admin || false);
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
    return <MemberDashboard userName={userName} isAdmin={isAdmin} onLogout={() => { setLoggedIn(false); setPageState("login"); }} />;
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
                onLoggedIn={(name, admin) => {
                  setUserName(name);
                  setIsAdmin(admin || false);
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

function Windows95LoginFlow({ onLoggedIn }: { onLoggedIn: (name: string, isAdmin?: boolean) => void }) {
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
          onLoggedIn(sessionData.member.name, sessionData.member.is_admin);
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
        <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
          <rect x="6" y="3" width="5" height="5" fill="#FF0000" />
          <rect x="11" y="3" width="5" height="5" fill="#00AA00" />
          <rect x="6" y="8" width="5" height="5" fill="#0000FF" />
          <rect x="11" y="8" width="5" height="5" fill="#FFFF00" />
          <rect x="4" y="4" width="2" height="2" fill="#FF0000" opacity="0.7" />
          <rect x="4" y="7" width="2" height="2" fill="#0000FF" opacity="0.7" />
          <rect x="3" y="5" width="1" height="2" fill="#FF0000" opacity="0.5" />
          <rect x="3" y="7" width="1" height="2" fill="#0000FF" opacity="0.5" />
        </svg>
        <span className="text-xs tracking-wide font-bold">Start</span>
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

/* ─── Types ─── */

interface Book {
  id: string;
  title: string;
  author: string;
  amazon_link: string | null;
  is_past_read: boolean;
  month_read: string | null;
  suggested_by: string;
  created_at: string;
  members: {
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
  };
}

type DashboardTab = "books";
type BookView = "wishlist" | "past";

/* ─── Member Dashboard ─── */

function MemberDashboard({ userName, isAdmin, onLogout }: { userName: string; isAdmin?: boolean; onLogout: () => void }) {
  const [tab, setTab] = useState<DashboardTab>("books");
  const [bookView, setBookView] = useState<BookView>("wishlist");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestAuthor, setSuggestAuthor] = useState("");
  const [suggestLink, setSuggestLink] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Past read modal state (admin only)
  const [showAddPast, setShowAddPast] = useState(false);
  const [pastTitle, setPastTitle] = useState("");
  const [pastAuthor, setPastAuthor] = useState("");
  const [pastMonth, setPastMonth] = useState("");
  const [pastLink, setPastLink] = useState("");
  const [addingPast, setAddingPast] = useState(false);
  const [pastMsg, setPastMsg] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const isPast = bookView === "past";
      const res = await fetch(`/api/books?past=${isPast}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch {
      setStatusMsg("Failed to load books.");
    }
    setLoading(false);
  }, [bookView]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const handleSuggest = async () => {
    if (!suggestTitle.trim() || !suggestAuthor.trim()) return;
    setSuggesting(true);
    setSuggestMsg(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestTitle.trim(),
          author: suggestAuthor.trim(),
          amazon_link: suggestLink.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setShowSuggest(false);
        setSuggestTitle("");
        setSuggestAuthor("");
        setSuggestLink("");
        setStatusMsg(`"${data.book.title}" suggested!`);
        loadBooks();
      } else {
        setSuggestMsg(data.error || "Failed to suggest book.");
      }
    } catch {
      setSuggestMsg("Connection error.");
    }
    setSuggesting(false);
  };

  const handleAddPast = async () => {
    if (!pastTitle.trim() || !pastAuthor.trim() || !pastMonth.trim()) return;
    setAddingPast(true);
    setPastMsg(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pastTitle.trim(),
          author: pastAuthor.trim(),
          amazon_link: pastLink.trim() || null,
          is_past_read: true,
          month_read: pastMonth.trim() + "-01",
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setShowAddPast(false);
        setPastTitle("");
        setPastAuthor("");
        setPastLink("");
        setPastMonth("");
        setStatusMsg(`"${data.book.title}" added as past read!`);
        loadBooks();
      } else {
        setPastMsg(data.error || "Failed to add past read.");
      }
    } catch {
      setPastMsg("Connection error.");
    }
    setAddingPast(false);
  };

  const btnClass = "px-4 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-black font-bold active:border-black active:border-t-gray-400 active:border-l-gray-400 hover:brightness-110 disabled:opacity-50";
  const inputClass = "w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-white px-2 py-1 text-sm text-black outline-none focus:border-[#000080]";

  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    update();
    const ci = setInterval(update, 30000);
    return () => clearInterval(ci);
  }, []);

  const desktopIcons = [
    { src: "/icons/my_computer.png", label: "My Computer" },
    { src: "/icons/netscape.png", label: "Netscape" },
    { src: "/icons/dial_up.png", label: "Dial-Up Internet" },
    { src: "/icons/network_neighborhood.png", label: "Network" },
    { src: "/icons/winamp.png", label: "Winamp" },
  ];

  return (
    <div className="min-h-screen bg-[#008080] font-mono select-none overflow-hidden flex flex-col"
      style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}>

      {/* Desktop area */}
      <div className="flex-1 relative overflow-auto pt-2 pl-2">
        {/* Desktop icons */}
        <div className="absolute top-2 left-2 flex flex-col gap-5 z-10">
          {desktopIcons.map((di: { src: string; label: string }) => (
            <div key={di.label} className="flex flex-col items-center gap-[2px] w-[72px]">
              <img src={di.src} alt={di.label} className="w-10 h-10 image-rendering-pixelated" draggable={false} />
              <div className="bg-[#000080] text-white text-[10px] px-[6px] py-[1px] text-center leading-tight font-bold break-words max-w-[68px]">
                {di.label}
              </div>
            </div>
          ))}
          {isAdmin && (
            <a href="/admin" className="flex flex-col items-center gap-[2px] w-[72px] no-underline">
              <img src="/icons/control_panel.png" alt="Admin Panel" className="w-10 h-10 image-rendering-pixelated" draggable={false} />
              <div className="bg-[#000080] text-white text-[10px] px-[6px] py-[1px] text-center leading-tight font-bold break-words max-w-[68px]">
                Admin Panel
              </div>
            </a>
          )}
        </div>

        {/* App window - centered floating window */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[calc(100vw-100px)] min-h-[200px] max-h-[calc(100vh-70px)] flex flex-col shadow-[4px_4px_0px_#00000040] z-20">
          {/* Title bar */}
          <div className="bg-[#000080] flex items-center justify-between px-[3px] py-[3px]">
            <div className="flex items-center gap-1">
              <span className="text-white text-xs font-bold tracking-wide">📚 DLG Bookclub</span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && <span className="text-[9px] bg-yellow-300 text-black px-1.5 py-[1px] font-bold">ADMIN</span>}
              <button
                onClick={async () => {
                  await fetch("/api/logout", { method: "POST" });
                  onLogout();
                }}
                className="text-white text-[10px] underline hover:text-blue-200"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Window body */}
          <div className="bg-[#c0c0c0] border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black flex-1 flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-400">
              <button
                onClick={() => setTab("books")}
                className={`px-4 py-2 text-xs font-bold border-r border-gray-400 ${tab === "books" ? "bg-[#c0c0c0] -mb-[1px] border-b-2 border-b-[#c0c0c0]" : "bg-gray-300 hover:bg-gray-200"}`}
              >
                📚 Books
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-auto">
              {/* Status message */}
              {statusMsg && (
                <div className="mb-3 px-3 py-2 bg-[#FFFFCC] border border-gray-400 text-xs text-black flex justify-between items-center">
                  <span>{statusMsg}</span>
                  <button onClick={() => setStatusMsg(null)} className="text-gray-500 ml-2">✕</button>
                </div>
              )}

              {tab === "books" && (
                <>
                  {/* Segmented toggle */}
                  <div className="flex mb-4">
                    <button
                      onClick={() => setBookView("wishlist")}
                      className={`px-4 py-1.5 text-xs font-bold border-2 border-white border-r-black border-b-black ${bookView === "wishlist" ? "bg-[#000080] text-white" : "bg-[#c0c0c0] text-black hover:brightness-110"}`}
                    >
                      Wishlist
                    </button>
                    <button
                      onClick={() => setBookView("past")}
                      className={`px-4 py-1.5 text-xs font-bold border-2 border-white border-r-black border-b-black -ml-[2px] ${bookView === "past" ? "bg-[#000080] text-white" : "bg-[#c0c0c0] text-black hover:brightness-110"}`}
                    >
                      Past Reads
                    </button>
                  </div>

                  {/* Wishlist: Suggest a Book button */}
                  {bookView === "wishlist" && (
                    <button
                      onClick={() => { setShowSuggest(true); setSuggestMsg(null); }}
                      className={`${btnClass} mb-4 !text-xs flex items-center gap-1`}
                    >
                      ✚ Suggest a Book
                    </button>
                  )}

                  {/* Past Reads: Admin-only Add Past Read button */}
                  {bookView === "past" && isAdmin && (
                    <button
                      onClick={() => { setShowAddPast(true); setPastMsg(null); }}
                      className={`${btnClass} mb-4 !text-xs flex items-center gap-1 !border-green-700 !border-r-green-900 !border-b-green-900 text-green-800`}
                    >
                      ✚ Add Past Read
                    </button>
                  )}

                  {/* Book list */}
                  {loading ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="text-4xl mb-3 animate-pulse">⏳</div>
                      <p className="text-sm text-black">Loading...</p>
                    </div>
                  ) : books.length === 0 ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="text-5xl mb-3">{bookView === "wishlist" ? "📭" : "📖"}</div>
                      <p className="text-sm font-bold text-black">
                        {bookView === "wishlist" ? "No books suggested yet!" : "No past reads yet."}
                      </p>
                      <p className="text-[11px] text-gray-700 mt-1">
                        {bookView === "wishlist" ? "Be the first to suggest a book. 📝" : "Past reads will appear here once the first book is read."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {books.map((book) => {
                        const suggester = book.members?.name || `${book.members?.first_name || ""} ${book.members?.last_name || ""}`.trim() || "Unknown";
                        return (
                          <div key={book.id} className="border-2 border-gray-400 border-t-white border-l-white bg-white p-3">
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-black">{book.title}</p>
                                <p className="text-[11px] text-gray-600">by {book.author}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-gray-500">Suggested by {suggester}</span>
                                  <span className="text-[10px] text-gray-400">·</span>
                                  <span className="text-[10px] text-gray-400">{new Date(book.created_at).toLocaleDateString()}</span>
                                </div>
                                {book.month_read && (
                                  <span className="text-[10px] text-green-700 mt-1 inline-block">✓ Read {new Date(book.month_read).toLocaleDateString("en-US", { year: "numeric", month: "long" })}</span>
                                )}
                              </div>
                              {book.amazon_link && (
                                <a
                                  href={book.amazon_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#000080] underline hover:text-[#0000FF] flex-shrink-0 mt-1"
                                >
                                  Amazon ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Windows 95 Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#c0c0c0] border-t-2 border-white flex items-center h-[34px] px-[2px] gap-1 z-30">
        <button className="flex items-center gap-1 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black px-[3px] py-[2px] font-bold text-sm text-black active:border-black active:border-t-gray-400 active:border-l-gray-400 hover:brightness-110">
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
            <rect x="6" y="3" width="5" height="5" fill="#FF0000" />
            <rect x="11" y="3" width="5" height="5" fill="#00AA00" />
            <rect x="6" y="8" width="5" height="5" fill="#0000FF" />
            <rect x="11" y="8" width="5" height="5" fill="#FFFF00" />
            <rect x="4" y="4" width="2" height="2" fill="#FF0000" opacity="0.7" />
            <rect x="4" y="7" width="2" height="2" fill="#0000FF" opacity="0.7" />
            <rect x="3" y="5" width="1" height="2" fill="#FF0000" opacity="0.5" />
            <rect x="3" y="7" width="1" height="2" fill="#0000FF" opacity="0.5" />
          </svg>
          <span className="text-xs tracking-wide font-bold">Start</span>
        </button>
        <div className="border-l border-gray-400 h-[22px] mx-1" />
        <button className="flex items-center gap-1 bg-[#c0c0c0] border-2 border-white border-r-black border-b-black px-2 py-[2px] text-black text-xs active:border-black active:border-t-gray-400 active:border-l-gray-400 shadow-[inset_1px_1px_1px_#00000020]">
          <span className="text-[10px]">📚</span>
          <span>DLG Bookclub</span>
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1 px-2 h-[22px] border-l border-gray-400">
          <img src="/icons/speaker.png" alt="" className="w-[14px] h-[14px] image-rendering-pixelated" />
          <span className="text-[10px] text-black font-bold">{time}</span>
        </div>
      </div>

      {/* Suggest a Book modal */}
      {showSuggest && (
        <SuggestBookModal
          title={suggestTitle}
          setTitle={setSuggestTitle}
          author={suggestAuthor}
          setAuthor={setSuggestAuthor}
          link={suggestLink}
          setLink={setSuggestLink}
          onSubmit={handleSuggest}
          onClose={() => { setShowSuggest(false); setSuggestMsg(null); }}
          suggesting={suggesting}
          error={suggestMsg}
          btnClass={btnClass}
          inputClass={inputClass}
        />
      )}

      {/* Add Past Read modal */}
      {showAddPast && (
        <AddPastModal
          title={pastTitle}
          setTitle={setPastTitle}
          author={pastAuthor}
          setAuthor={setPastAuthor}
          month={pastMonth}
          setMonth={setPastMonth}
          link={pastLink}
          setLink={setPastLink}
          onSubmit={handleAddPast}
          onClose={() => { setShowAddPast(false); setPastMsg(null); }}
          adding={addingPast}
          error={pastMsg}
          btnClass={btnClass}
          inputClass={inputClass}
        />
      )}
    </div>
  );
}

/* ─── Suggest Book Modal ─── */

/* ─── Add Past Read Modal ─── */

function AddPastModal({
  title, setTitle,
  author, setAuthor,
  month, setMonth,
  link, setLink,
  onSubmit, onClose,
  adding, error,
  btnClass, inputClass,
}: {
  title: string; setTitle: (v: string) => void;
  author: string; setAuthor: (v: string) => void;
  month: string; setMonth: (v: string) => void;
  link: string; setLink: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  adding: boolean;
  error: string | null;
  btnClass: string;
  inputClass: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div
        className="w-[420px] max-w-[90vw] shadow-[4px_4px_0px_#00000040]"
        style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}
      >
        {/* Title bar */}
        <div className="bg-[#000080] flex items-center justify-between px-[3px] py-[3px]">
          <div className="flex items-center gap-1">
            <div className="w-[14px] h-[14px] bg-[#c0c0c0] flex items-center justify-center border border-white border-r-black border-b-black text-[10px] leading-none text-black font-bold">📖</div>
            <span className="text-white text-xs font-bold tracking-wide">Add Past Read</span>
          </div>
          <button
            onClick={onClose}
            className="w-[16px] h-[14px] bg-[#c0c0c0] border border-white border-r-black border-b-black flex items-center justify-center text-[9px] text-black font-bold leading-none active:border-black active:border-t-gray-400 active:border-l-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="bg-[#c0c0c0] px-4 py-4 border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black">
          <p className="text-[11px] text-gray-700 mb-3">Add a book the club has already read.</p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-black block mb-[2px] font-bold">Title *</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dune"
                required
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] text-black block mb-[2px] font-bold">Author *</label>
              <input
                type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Frank Herbert"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] text-black block mb-[2px] font-bold">Month Read *</label>
              <input
                type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] text-black block mb-[2px] font-bold">Amazon Link (optional)</label>
              <input
                type="url" value={link} onChange={(e) => setLink(e.target.value)}
                placeholder="https://amazon.de/dp/..."
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-[10px] text-red-700 mt-2">{error}</p>}

          <div className="flex justify-end mt-4 gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={adding}
              className={btnClass}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={adding || !title.trim() || !author.trim() || !month.trim()}
              className={btnClass}
            >
              {adding ? "⏳" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Suggest Book Modal ─── */

function SuggestBookModal({
  title, setTitle,
  author, setAuthor,
  link, setLink,
  onSubmit, onClose,
  suggesting, error,
  btnClass, inputClass,
}: {
  title: string; setTitle: (v: string) => void;
  author: string; setAuthor: (v: string) => void;
  link: string; setLink: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  suggesting: boolean;
  error: string | null;
  btnClass: string;
  inputClass: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div
        className="w-[420px] max-w-[90vw] shadow-[4px_4px_0px_#00000040]"
        style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}
      >
        {/* Title bar */}
        <div className="bg-[#000080] flex items-center justify-between px-[3px] py-[3px]">
          <div className="flex items-center gap-1">
            <div className="w-[14px] h-[14px] bg-[#c0c0c0] flex items-center justify-center border border-white border-r-black border-b-black text-[10px] leading-none text-black font-bold">📝</div>
            <span className="text-white text-xs font-bold tracking-wide">Suggest a Book</span>
          </div>
          <button
            onClick={onClose}
            className="w-[16px] h-[14px] bg-[#c0c0c0] border border-white border-r-black border-b-black flex items-center justify-center text-[9px] text-black font-bold leading-none active:border-black active:border-t-gray-400 active:border-l-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="bg-[#c0c0c0] px-4 py-4 border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black">
          <p className="text-[11px] text-gray-700 mb-3">Recommend a book for the club to read.</p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-black block mb-[2px] font-bold">Title *</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dune"
                required
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] text-black block mb-[2px] font-bold">Author *</label>
              <input
                type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Frank Herbert"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] text-black block mb-[2px] font-bold">Amazon Link (optional)</label>
              <input
                type="url" value={link} onChange={(e) => setLink(e.target.value)}
                placeholder="https://amazon.de/dp/..."
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-[10px] text-red-700 mt-2">{error}</p>}

          <div className="flex justify-end mt-4 gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={suggesting}
              className={btnClass}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={suggesting || !title.trim() || !author.trim()}
              className={btnClass}
            >
              {suggesting ? "⏳" : "Suggest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
