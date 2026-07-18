"use client";

import { useState, useEffect, useCallback } from "react";

type Tab = "pending" | "members";

interface PendingReg {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  city: string;
  status: string;
  created_at: string;
}

interface Member {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  city: string;
  verified: boolean;
  is_admin: boolean;
  avatar: string;
  created_at: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<PendingReg[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, membersRes] = await Promise.all([
        fetch("/api/admin/pending"),
        fetch("/api/admin/members"),
      ]);

      if (!pendingRes.ok || !membersRes.ok) {
        // Check if unauthorized (not admin)
        if (pendingRes.status === 401 || membersRes.status === 401) {
          setError("Unauthorized. Admin access required.");
          setLoading(false);
          return;
        }
        setError("Failed to load data.");
        setLoading(false);
        return;
      }

      const pendingData = await pendingRes.json();
      const membersData = await membersRes.json();
      setPending(pendingData.registrations || []);
      setMembers(membersData.members || []);
    } catch {
      setError("Connection error.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/pending/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.status === "approved" || data.status === "rejected") {
        setActionMsg(`${action === "approve" ? "Approved" : "Rejected"} successfully.`);
        loadData();
      } else {
        setActionMsg(data.error || "Action failed.");
      }
    } catch {
      setActionMsg("Connection error.");
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the bookclub?`)) return;
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.status === "removed") {
        setActionMsg(`Removed ${name}.`);
        loadData();
      } else {
        setActionMsg(data.error || "Failed to remove.");
      }
    } catch {
      setActionMsg("Connection error.");
    }
  };

  const pendingCount = pending.filter((p) => p.status === "pending").length;

  const btnClass = "px-4 py-[3px] text-sm bg-[#c0c0c0] border-2 border-white border-r-black border-b-black text-black font-bold active:border-black active:border-t-gray-400 active:border-l-gray-400 hover:brightness-110 disabled:opacity-50";

  return (
    <div className="min-h-screen bg-[#008080] font-mono select-none overflow-auto"
      style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}>
      <div className="max-w-4xl mx-auto p-4 py-6">
        {/* Title bar */}
        <div className="bg-[#000080] flex items-center justify-between px-[3px] py-[3px]">
          <div className="flex items-center gap-1">
            <span className="text-white text-xs font-bold tracking-wide">📚 DLG Bookclub — Admin Panel</span>
          </div>
          <a href="/" className="text-white text-[10px] underline hover:text-blue-200">Back to App</a>
        </div>

        {/* Window body */}
        <div className="bg-[#c0c0c0] border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black">
          {/* Tab bar */}
          <div className="flex border-b border-gray-400">
            <button
              onClick={() => setTab("pending")}
              className={`px-4 py-2 text-xs font-bold border-r border-gray-400 ${tab === "pending" ? "bg-[#c0c0c0] -mb-[1px] border-b-2 border-b-[#c0c0c0]" : "bg-gray-300 hover:bg-gray-200"}`}
            >
              Pending Approvals {pendingCount > 0 && <span className="ml-1 bg-[#000080] text-white px-1.5 py-[1px] text-[9px] rounded">{pendingCount}</span>}
            </button>
            <button
              onClick={() => setTab("members")}
              className={`px-4 py-2 text-xs font-bold border-r border-gray-400 ${tab === "members" ? "bg-[#c0c0c0] -mb-[1px] border-b-2 border-b-[#c0c0c0]" : "bg-gray-300 hover:bg-gray-200"}`}
            >
              Members ({members.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-4 min-h-[300px]">
            {loading && (
              <div className="flex flex-col items-center py-12">
                <div className="text-4xl mb-3 animate-pulse">⏳</div>
                <p className="text-sm text-black">Loading...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center py-12">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-sm text-red-700 font-bold mb-2">{error}</p>
                <button onClick={loadData} className={btnClass}>Retry</button>
              </div>
            )}

            {actionMsg && (
              <div className="mb-3 px-3 py-2 bg-[#FFFFCC] border border-gray-400 text-xs text-black">{actionMsg}</div>
            )}

            {!loading && !error && tab === "pending" && (
              <PendingTab pending={pending} onAction={handleAction} btnClass={btnClass} />
            )}

            {!loading && !error && tab === "members" && (
              <MembersTab members={members} onRemove={handleRemove} btnClass={btnClass} />
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-[#c0c0c0] border-l-[2px] border-t-[2px] border-white border-r-[2px] border-b-[2px] border-black px-[3px] py-[2px] flex items-center -mt-[2px]">
          <div className="w-[12px] h-[12px] bg-[#008080] flex items-center justify-center text-white text-[6px] font-bold border border-white border-r-black border-b-black mr-1">A</div>
          <span className="text-[10px] text-black">Admin Mode</span>
          <span className="text-[10px] text-gray-500 ml-3">DLG Bookclub v1</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Pending Tab ─── */

function PendingTab({ pending, onAction, btnClass }: {
  pending: PendingReg[];
  onAction: (id: string, action: "approve" | "reject") => void;
  btnClass: string;
}) {
  const active = pending.filter((p) => p.status === "pending");

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="text-5xl mb-3">✅</div>
        <p className="text-sm font-bold text-black">All caught up!</p>
        <p className="text-[11px] text-gray-700 mt-1">No pending registration requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-700 mb-3">{active.length} registration{active.length > 1 ? "s" : ""} pending approval</p>
      {active.map((reg) => (
        <div key={reg.id} className="border-2 border-gray-400 border-t-white border-l-white bg-white p-3">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-black">{reg.first_name} {reg.last_name}</p>
              <p className="text-[11px] text-gray-600">{reg.email}</p>
              <p className="text-[11px] text-gray-600">📍 {reg.city}</p>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(reg.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => onAction(reg.id, "approve")} className={`${btnClass} !border-green-700 !border-r-green-900 !border-b-green-900 text-green-800`}>
                ✅ Approve
              </button>
              <button onClick={() => onAction(reg.id, "reject")} className={`${btnClass} !border-red-500 !border-r-red-700 !border-b-red-700 text-red-700`}>
                ✕ Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Members Tab ─── */

function MembersTab({ members, onRemove, btnClass }: {
  members: Member[];
  onRemove: (id: string, name: string) => void;
  btnClass: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${m.first_name || ""} ${m.last_name || ""} ${m.name || ""} ${m.email}`.toLowerCase();
    return name.includes(q);
  });

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="text-5xl mb-3">👥</div>
        <p className="text-sm font-bold text-black">No members yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full border-2 border-black border-t-gray-400 border-l-gray-400 bg-white px-2 py-1 text-sm text-black outline-none focus:border-[#000080]"
        />
      </div>
      <div className="space-y-1">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-500 py-4 text-center">No members match your search.</p>
        )}
        {filtered.map((m) => {
          const name = m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown";
          return (
            <div key={m.id} className="border border-gray-400 border-t-white border-l-white bg-white px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-black truncate">{name}</span>
                  {m.is_admin && <span className="text-[9px] bg-[#000080] text-white px-1.5 py-[1px] font-bold">ADMIN</span>}
                  {!m.verified && <span className="text-[9px] bg-yellow-200 text-yellow-800 px-1.5 py-[1px] font-bold">UNVERIFIED</span>}
                </div>
                <p className="text-[10px] text-gray-600">{m.email}{m.city ? ` · 📍 ${m.city}` : ""}</p>
              </div>
              {!m.is_admin && (
                <button
                  onClick={() => onRemove(m.id, name)}
                  className="text-[10px] text-red-600 hover:text-red-800 font-bold flex-shrink-0"
                >
                  ✕ Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
