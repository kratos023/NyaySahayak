"use client";
// frontend/src/app/admin/page.tsx
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Users, MessageSquare, BarChart2, Trash2, Shield,
  ChevronDown, ChevronRight, LogOut, Scale, ArrowLeft,
  Search, RefreshCw, TrendingUp, Calendar, Globe
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Account {
  id: number; email: string; name: string; role: string;
  user_id: string; created_at: string; last_login: string | null;
  session_count: number; total_messages: number;
}

interface DailyStat {
  date: string; message_count: number; session_count: number;
}

interface LangStat {
  language: string; session_count: number; message_count: number;
}

interface Stats {
  system: { total_users: number; total_sessions: number; total_messages: number; active_sessions: number };
  daily: DailyStat[];
  total_accounts: number;
  language_stats: LangStat[];
}

interface Session {
  id: number; session_name: string; message_count: number;
  intent_label: string; updated_display: string; is_active: boolean;
}

interface Msg { role: string; content: string; timestamp: string; }

type Tab = "users" | "stats" | "activity";

export default function AdminPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [tab, setTab]                     = useState<Tab>("users");
  const [accounts, setAccounts]           = useState<Account[]>([]);
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [search, setSearch]               = useState("");
  const [expanded, setExpanded]           = useState<string | null>(null);
  const [sessions, setSessions]           = useState<Record<string, Session[]>>({});
  const [messages, setMessages]           = useState<Record<number, Msg[]>>({});
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [sortBy, setSortBy]               = useState<"name" | "messages" | "joined">("joined");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/"); return; }
    loadData();
  }, [user]);

  async function apiFetch(path: string) {
    const res = await fetch(`${API}/api${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function loadData(quiet = false) {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const [u, s] = await Promise.all([apiFetch("/admin/users"), apiFetch("/admin/stats")]);
      setAccounts(u.users);
      setStats(s);
    } catch (e) { console.error(e); }
    setLoading(false); setRefreshing(false);
  }

  async function loadSessions(userId: string) {
    if (sessions[userId]) return;
    const data = await apiFetch(`/admin/users/${userId}/chats`).catch(() => null);
    if (data) setSessions(prev => ({ ...prev, [userId]: data.sessions }));
  }

  async function loadMessages(sessionId: number, userId: string) {
    if (messages[sessionId]) return;
    const data = await apiFetch(`/admin/users/${userId}/chats/${sessionId}/messages`).catch(() => null);
    if (data) setMessages(prev => ({ ...prev, [sessionId]: data.messages }));
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete "${name}" and all their data? This cannot be undone.`)) return;
    await fetch(`${API}/api/admin/users/${userId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setAccounts(prev => prev.filter(a => a.user_id !== userId));
  }

  async function deleteChat(sessionId: number) {
    if (!confirm("Delete this chat session?")) return;
    await fetch(`${API}/api/admin/chats/${sessionId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setSessions(prev => {
      const u = { ...prev };
      for (const uid in u) u[uid] = u[uid].filter(s => s.id !== sessionId);
      return u;
    });
  }

  function toggleUser(userId: string) {
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    loadSessions(userId);
  }

  // Filtered + sorted accounts
  const filteredAccounts = useMemo(() => {
    let list = accounts.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "messages") list = [...list].sort((a, b) => b.total_messages - a.total_messages);
    else if (sortBy === "name")    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [accounts, search, sortBy]);

  // Max messages for bar chart
  const maxMsgs = stats ? Math.max(...stats.daily.map(d => d.message_count), 1) : 1;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-[var(--text-muted)] animate-pulse text-sm">Loading admin panel…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-gray-200 flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-white/5 px-6 py-3.5
        flex items-center justify-between bg-[var(--bg-2)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-900
            flex items-center justify-center">
            <Scale size={14} className="text-yellow-100" />
          </div>
          <div>
            <span className="font-display text-base text-[var(--gold-light)]">Nyay-Sahayak</span>
            <span className="ml-2 text-[0.65rem] px-1.5 py-0.5 rounded bg-yellow-900/40
              border border-yellow-700/30 text-yellow-400">ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300
              transition-colors disabled:opacity-50">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors">
            <ArrowLeft size={14} /> App
          </button>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6 space-y-6">

        {/* ── KPI cards ── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Registered Users",   value: stats.total_accounts,         icon: Users,          color: "text-blue-400" },
              { label: "Total Sessions",      value: stats.system.total_sessions,  icon: MessageSquare,  color: "text-purple-400" },
              { label: "Total Messages",      value: stats.system.total_messages,  icon: TrendingUp,     color: "text-green-400" },
              { label: "Active Sessions",     value: stats.system.active_sessions, icon: BarChart2,      color: "text-[var(--gold)]" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-[var(--bg-2)] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={color} />
                  <p className="text-[0.68rem] text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
                </div>
                <p className="text-2xl font-semibold">{value?.toLocaleString() ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-white/5">
          {([
            { id: "users",    label: "Users",          icon: Users },
            { id: "activity", label: "Daily Activity", icon: Calendar },
            { id: "stats",    label: "Language Stats", icon: Globe },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors
                ${tab === id
                  ? "text-[var(--gold-light)] border-b-2 border-[var(--gold)]"
                  : "text-[var(--text-muted)] hover:text-gray-300"}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ══ USERS TAB ══ */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full bg-[var(--bg-2)] border border-white/10 rounded-xl
                    pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600
                    focus:outline-none focus:border-[var(--gold)]/50"
                />
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[var(--bg-2)] border border-white/10 rounded-xl px-3 py-2
                  text-sm text-gray-300 focus:outline-none">
                <option value="joined">Sort: Newest</option>
                <option value="messages">Sort: Most Active</option>
                <option value="name">Sort: Name A–Z</option>
              </select>
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                {filteredAccounts.length} user{filteredAccounts.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* User list */}
            <div className="space-y-2">
              {filteredAccounts.map(acc => (
                <div key={acc.user_id}
                  className="bg-[var(--bg-2)] border border-white/5 rounded-2xl overflow-hidden">

                  {/* Row */}
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer
                    hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleUser(acc.user_id)}>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                      text-sm font-bold flex-shrink-0
                      ${acc.role === "admin"
                        ? "bg-gradient-to-br from-yellow-600 to-yellow-900 text-yellow-100"
                        : "bg-gradient-to-br from-blue-700 to-blue-900 text-blue-100"}`}>
                      {acc.name[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-200">{acc.name}</p>
                        {acc.role === "admin" && (
                          <span className="text-[0.6rem] px-1.5 py-0.5 rounded
                            bg-yellow-900/50 border border-yellow-700/40 text-yellow-400 font-medium">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{acc.email}</p>
                      <p className="text-[0.65rem] text-gray-700 mt-0.5">
                        Joined {new Date(acc.created_at).toLocaleDateString()} ·{" "}
                        {acc.last_login
                          ? `Last seen ${new Date(acc.last_login).toLocaleDateString()}`
                          : "Never logged in"}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5 text-right flex-shrink-0">
                      <div>
                        <p className="text-sm font-semibold">{acc.session_count}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">chats</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{acc.total_messages}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">messages</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {acc.role !== "admin" && (
                          <button
                            onClick={e => { e.stopPropagation(); deleteUser(acc.user_id, acc.name); }}
                            className="p-1.5 rounded-lg text-gray-700 hover:text-red-400
                              hover:bg-red-950/40 transition-all" title="Delete user">
                            <Trash2 size={13} />
                          </button>
                        )}
                        {expanded === acc.user_id
                          ? <ChevronDown size={14} className="text-gray-500" />
                          : <ChevronRight size={14} className="text-gray-500" />}
                      </div>
                    </div>
                  </div>

                  {/* ── Chat sessions dropdown ── */}
                  {expanded === acc.user_id && (
                    <div className="border-t border-white/5 bg-[var(--bg-3)] px-5 py-4 space-y-2">
                      <p className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-widest mb-3">
                        Chat History
                      </p>

                      {!sessions[acc.user_id] && (
                        <p className="text-xs text-[var(--text-muted)] animate-pulse">Loading sessions…</p>
                      )}
                      {sessions[acc.user_id]?.length === 0 && (
                        <p className="text-xs text-[var(--text-muted)]">No chat sessions yet</p>
                      )}

                      {sessions[acc.user_id]?.map(sess => (
                        <div key={sess.id}
                          className="rounded-xl border border-white/5 overflow-hidden">

                          {/* Session row */}
                          <div
                            className="flex items-center justify-between px-4 py-2.5
                              cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => {
                              const next = expandedSession === sess.id ? null : sess.id;
                              setExpandedSession(next);
                              if (next) loadMessages(sess.id, acc.user_id);
                            }}>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                                ${sess.is_active ? "bg-green-500" : "bg-gray-600"}`} />
                              <p className="text-xs text-gray-300 truncate">{sess.session_name}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 text-[var(--text-muted)]">
                              <span className="text-[0.65rem]">{sess.message_count} msgs</span>
                              <span className="text-[0.65rem]">{sess.updated_display}</span>
                              <button
                                onClick={e => { e.stopPropagation(); deleteChat(sess.id); }}
                                className="p-1 rounded hover:text-red-400 transition-colors">
                                <Trash2 size={11} />
                              </button>
                              {expandedSession === sess.id
                                ? <ChevronDown size={11} />
                                : <ChevronRight size={11} />}
                            </div>
                          </div>

                          {/* Messages */}
                          {expandedSession === sess.id && (
                            <div className="border-t border-white/5 px-4 py-3 space-y-2.5
                              max-h-72 overflow-y-auto bg-[var(--bg)]">
                              {!messages[sess.id] && (
                                <p className="text-xs text-[var(--text-muted)] animate-pulse">Loading…</p>
                              )}
                              {messages[sess.id]?.map((msg, i) => (
                                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                  <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full
                                    flex-shrink-0 h-fit font-medium
                                    ${msg.role === "user"
                                      ? "bg-blue-900/50 text-blue-300"
                                      : "bg-yellow-900/40 text-yellow-400"}`}>
                                    {msg.role === "user" ? "User" : "AI"}
                                  </span>
                                  <p className="text-[0.75rem] text-gray-400 leading-relaxed line-clamp-3 flex-1">
                                    {msg.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {filteredAccounts.length === 0 && (
                <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                  No users match your search
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ACTIVITY TAB ══ */}
        {tab === "activity" && stats && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-2)] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">Daily Messages — Last 30 Days</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Total: {stats.daily.reduce((n, d) => n + d.message_count, 0).toLocaleString()} messages
                </p>
              </div>

              {/* Bar chart */}
              <div className="px-5 py-5">
                {stats.daily.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-8">No activity yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.daily.slice(0, 14).map(d => (
                      <div key={d.date} className="flex items-center gap-3">
                        <span className="text-[0.68rem] text-[var(--text-muted)] w-20 flex-shrink-0 text-right">
                          {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        <div className="flex-1 h-5 bg-[var(--bg-3)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-700 to-yellow-500 transition-all"
                            style={{ width: `${Math.max((d.message_count / maxMsgs) * 100, 2)}%` }}
                          />
                        </div>
                        <span className="text-[0.68rem] font-mono text-gray-400 w-8 text-right">
                          {d.message_count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-[var(--bg-2)] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--bg-3)]">
                  <tr className="text-[0.68rem] text-[var(--text-muted)] uppercase tracking-widest">
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Messages</th>
                    <th className="px-5 py-3 text-right">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.daily.map(d => (
                    <tr key={d.date} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-300">{d.date}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono">{d.message_count}</td>
                      <td className="px-5 py-3 text-sm text-right font-mono">{d.session_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ LANGUAGE STATS TAB ══ */}
        {tab === "stats" && stats && (
          <div className="bg-[var(--bg-2)] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-sm font-medium text-gray-200">Language / Topic Usage</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Based on session categories</p>
            </div>
            {stats.language_stats.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--text-muted)] text-center">No data yet</p>
            ) : (
              <div className="px-5 py-4 space-y-3">
                {(() => {
                  const maxM = Math.max(...stats.language_stats.map(l => l.message_count), 1);
                  return stats.language_stats.map(l => (
                    <div key={l.language} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">{l.language || "General Query"}</span>
                        <span className="text-[var(--text-muted)] font-mono">{l.message_count} msgs</span>
                      </div>
                      <div className="h-2 bg-[var(--bg-3)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500"
                          style={{ width: `${(l.message_count / maxM) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
