"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Record {
  id: number;
  data: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [records, setRecords] = useState<Record[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Load records and verify credentials on mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/data", {
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 401) {
        // Token expired or not logged in
        router.push("/");
        return;
      }
      if (!response.ok) throw new Error("Failed to load records");
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: inputText }),
      });

      if (!response.ok) throw new Error("Failed to add record");
      const newRecord = await response.json();
      
      // Dynamic translucent addition to dashboard list instantly
      setRecords((prev) => [newRecord, ...prev]);
      setInputText("");
    } catch (err) {
      alert("Error adding record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const response = await fetch(`/api/data/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Error deleting record");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-neon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Dashboard Header Card */}
      <div className="p-8 rounded-2xl glassmorphism neon-border-cyan flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Hello, <span className="text-cyan-neon neon-glow-cyan">Gamer</span> 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Tap physics coins, complete tasks, and earn real rewards.
          </p>
        </div>
        <div className="bg-slate-900/60 px-6 py-4 rounded-xl border border-white/5 flex items-center space-x-4">
          <div>
            <p className="text-xs uppercase font-black tracking-widest text-pink-neon neon-glow-pink">Current Points</p>
            <p className="text-2xl font-black text-white mt-1">1,250 P</p>
          </div>
        </div>
      </div>

      {/* Physics Canvas simulation placeholder (Interactive floating elements concept) */}
      <div className="relative h-[250px] w-full rounded-2xl border border-cyan-neon/30 bg-slate-950/60 overflow-hidden flex flex-col items-center justify-center text-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.08),transparent_70%)]"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex p-3 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-2xl animate-bounce">🪙</div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Gravity Canvas</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Floating coins fall under physics simulation. Click them to burst, watch ads to recharge, and earn rewards!
          </p>
          <button className="px-5 py-2.5 bg-cyan-950/40 border border-cyan-500/40 text-cyan-neon font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-cyan-neon hover:text-slate-950 transition-all">
            Play Game (Coming Soon)
          </button>
        </div>
      </div>

      {/* Main Grid: Form and Translucent Record Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Create record form */}
        <div className="md:col-span-1 p-6 rounded-2xl glassmorphism border border-white/5 h-fit">
          <h3 className="text-lg font-extrabold text-white mb-4 uppercase tracking-wider">Add Record</h3>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What are you thinking today?"
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white text-sm placeholder-slate-500 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-cyan-neon hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Record"}
            </button>
          </form>
        </div>

        {/* Right Side: Dashboard List of Translucent Cards */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Dashboard Records</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-white/5 font-normal text-slate-400">
              {records.length} total
            </span>
          </h3>

          {records.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No records found. Write your first thoughts on the left form!
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-xl glassmorphism border border-white/10 flex justify-between items-start hover:border-cyan-neon/30 transition-all group"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{rec.data}</p>
                    <span className="inline-block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-2 text-slate-500 hover:text-pink-neon transition-colors"
                    aria-label="Delete record"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
