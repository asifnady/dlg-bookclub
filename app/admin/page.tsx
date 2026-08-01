"use client";

import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#008080] font-mono select-none overflow-auto"
      style={{ fontFamily: "'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, sans-serif" }}>
      <div className="max-w-4xl mx-auto p-4 py-6">
        <div className="shadow-[4px_4px_0px_#00000040] flex flex-col">
          <AdminPanel backHref="/" />
        </div>
      </div>
    </div>
  );
}
