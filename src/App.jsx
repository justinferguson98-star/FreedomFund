import { useState, useMemo } from "react";

// ── Supabase client (fetch-based, no SDK needed) ──────────────────────────────
const SUPABASE_URL = "https://gqmoprupnykrfmdiameo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbW9wcnVwbnlrcmZtZGlhbWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzQ1NzAsImV4cCI6MjA5ODI1MDU3MH0.nLh3uzdhe7efGnerhLlaJ9ePKoHATeuirUt8mwTsJgg";

// In-memory session (works in artifact sandbox where localStorage is blocked)
let _session = null;

const sb = {
  _token: () => _session?.access_token || null,

  _headers: (token) => ({
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${token || SUPABASE_KEY}`,
    "Prefer": "return=representation",
  }),

  getUser: () => _session?.user || null,

  signUp: async (email, password, name) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email, password, data: { name } }),
    });
    const data = await r.json();
    if (data.access_token) _session = data;
    return data;
  },

  signIn: async (email, password) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (data.access_token) _session = data;
    return data;
  },

  signOut: async () => {
    if (_session?.access_token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${_session.access_token}` },
      }).catch(() => {});
    }
    _session = null;
  },

  resetPassword: async (email) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({ email }),
    });
    return r.json();
  },
};

// ── Auth Screens ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState("login"); // login | signup | forgot
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const fonts = <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />;



  const handle = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "signup") {
        const data = await sb.signUp(email, password, name);
        if (data.error) throw new Error(data.error.message || data.msg || "Signup failed");
        if (data.access_token) {
          onAuth(data.user);
        } else {
          setSuccess("Check your email to confirm your account, then log in.");
          setMode("login");
        }
      } else if (mode === "login") {
        const data = await sb.signIn(email, password);
        if (data.error || data.error_description) throw new Error(data.error_description || data.error || "Login failed");
        if (data.user) onAuth(data.user);
        else throw new Error("Invalid email or password");
      } else if (mode === "forgot") {
        await sb.resetPassword(email);
        setSuccess("Password reset email sent. Check your inbox.");
        setMode("login");
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter',sans-serif", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px" }}>
      {fonts}
      {/* Logo */}
      <div style={{ width: 64, height: 64, borderRadius: 18, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 24px rgba(124,92,252,0.5)" }}>
        <Icon name="shield" size={30} color="#fff" strokeWidth={1.8} />
      </div>
      <h1 style={{ color: T.text, fontSize: 26, fontWeight: 900, margin: "0 0 4px", letterSpacing: -0.5 }}>FreedomFund</h1>
      <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 32px" }}>
        {mode === "login" ? "Sign in to your account" : mode === "signup" ? "Create your free account" : "Reset your password"}
      </p>

      {error   && <div style={{ background: "rgba(255,90,110,0.1)", border: "1px solid rgba(255,90,110,0.3)", borderRadius: 10, padding: "11px 14px", marginBottom: 14, width: "100%", boxSizing: "border-box" }}><p style={{ color: T.red, fontSize: 13, margin: 0 }}>{error}</p></div>}
      {success && <div style={{ background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.3)", borderRadius: 10, padding: "11px 14px", marginBottom: 14, width: "100%", boxSizing: "border-box" }}><p style={{ color: T.green, fontSize: 13, margin: 0 }}>{success}</p></div>}

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "signup" && (
          <div>
            <label style={{ ...S.label }}>First name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your first name" style={S.input} />
          </div>
        )}
        <div>
          <label style={S.label}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@email.com" style={S.input} />
        </div>
        {mode !== "forgot" && (
          <div>
            <label style={S.label}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} style={S.input} />
          </div>
        )}

        <button onClick={handle} disabled={loading} style={{ ...S.primaryBtn(), marginTop: 6, opacity: loading ? 0.6 : 1, padding: "15px 0", fontSize: 15 }}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Email"}
        </button>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {mode === "login" && <>
          <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: T.purple, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            No account? Sign up free
          </button>
          <button onClick={() => { setMode("forgot"); setError(""); }} style={{ background: "none", border: "none", color: T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            Forgot password?
          </button>
        </>}
        {mode === "signup" && (
          <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: T.textSub, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            Already have an account? Sign in
          </button>
        )}
        {mode === "forgot" && (
          <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: T.textSub, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.6 }) => {
  const p = {
    home:        <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></>,
    target:      <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/></>,
    users:       <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    trendUp:     <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    user:        <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    shield:      <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    lock:        <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    unlock:      <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>,
    plus:        <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
    chevronUp:   <><polyline points="18 15 12 9 6 15"/></>,
    chevronLeft: <><polyline points="15 18 9 12 15 6"/></>,
    info:        <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    check:       <><polyline points="20 6 9 17 4 12"/></>,
    x:           <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    star:        <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    crown:       <><path d="M2 20h20M4 20l2-8 6 4 6-4 2 8"/><circle cx="12" cy="8" r="2"/></>,
    bell:        <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    dollarSign:  <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    barChart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    pieChart:    <><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z"/></>,
    arrowUp:     <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown:   <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    clock:       <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    calendar:    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    globe:       <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    book:        <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    package:     <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    award:       <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    fire:        <><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>,
    zap:         <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    building:    <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/></>,
    bitcoin:     <><path d="M11.767 19.089c4.924.868 9.196-2.62 8.33-7.567-.866-4.947-5.891-7.754-10.815-6.886L11.767 19.09zm-1.234-7.04l.64 3.658-1.36.238-.64-3.658 1.36-.238zm5.263-1.109c.517 2.953-1.927 4.32-4.12 4.7l-.64-3.657c2.193-.382 4.243-1.996 3.726-4.95-.518-2.952-2.84-3.542-5.034-3.16l-.64-3.657C10.345 3.77 14.279 7.987 15.796 10.94z"/></>,
    repeat:      <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
    wallet:      <><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="16" cy="14" r="1" fill="currentColor"/></>,
    eye:         <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    send:        <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    edit:        <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {p[name] || null}
    </svg>
  );
};

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#0F0E2A",
  surface:  "#13123A",
  card:     "#1A1940",
  border:   "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  accent:   "#7C5CFC",  accentLo: "rgba(124,92,252,0.15)",
  green:    "#00D2A0",  greenLo:  "rgba(0,210,160,0.13)",
  red:      "#FF5A6E",  redLo:    "rgba(255,90,110,0.12)",
  gold:     "#F5A623",  goldLo:   "rgba(245,166,35,0.13)",
  purple:   "#9B6BFF",  purpleLo: "rgba(155,107,255,0.15)",
  blue:     "#4FACFE",  blueLo:   "rgba(79,172,254,0.13)",
  orange:   "#FF6B35",  orangeLo: "rgba(255,107,53,0.13)",
  teal:     "#00E5CC",  tealLo:   "rgba(0,229,204,0.12)",
  pink:     "#FF4FA1",  pinkLo:   "rgba(255,79,161,0.12)",
  text:     "#FFFFFF",
  textSub:  "#4A4878",
  textMid:  "#8884B0",
};

// ── Gradient presets ──────────────────────────────────────────────────────────
const GRAD = {
  purple: "linear-gradient(135deg, #7C5CFC 0%, #B06BFF 100%)",
  orange: "linear-gradient(135deg, #FF6B35 0%, #FF4FA1 100%)",
  green:  "linear-gradient(135deg, #00D2A0 0%, #00E5CC 100%)",
  blue:   "linear-gradient(135deg, #4FACFE 0%, #7C5CFC 100%)",
  teal:   "linear-gradient(135deg, #00E5CC 0%, #4FACFE 100%)",
  gold:   "linear-gradient(135deg, #F5A623 0%, #FF6B35 100%)",
  card:   "linear-gradient(145deg, #1E1C4A 0%, #141330 100%)",
  dark:   "linear-gradient(145deg, #13123A 0%, #0F0E2A 100%)",
};

// ── Chart colors matching the reference vivid palette ─────────────────────────
const CHART_COLORS = ["#FF6B35", "#9B6BFF", "#00D2A0", "#4FACFE", "#FF4FA1", "#F5A623"];

const S = {
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10,
    color: T.text, padding: "11px 14px", fontSize: 14,
    fontFamily: "'Inter',sans-serif", boxSizing: "border-box", outline: "none",
  },
  label: {
    color: T.textSub, fontSize: 11, marginBottom: 6, display: "block",
    letterSpacing: 1, textTransform: "uppercase", fontWeight: 600,
  },
  primaryBtn: (color = T.accent) => ({
    width: "100%", color: "#fff", border: "none",
    borderRadius: 8, padding: "13px 0", fontFamily: "'Inter',sans-serif",
    fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.3,
    background: color === T.accent ? GRAD.purple : `linear-gradient(135deg, ${color}, ${color}cc)`,
    boxShadow: `0 4px 18px ${color}44`,
  }),
  ghostBtn: {
    width: "100%",
    background: "rgba(124,92,252,0.1)",
    color: T.textMid,
    border: "1px solid rgba(124,92,252,0.22)",
    borderRadius: 8, padding: "12px 0",
    fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 14, cursor: "pointer",
  },
  card: {
    background: GRAD.card,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    padding: 16,
  },
  tag: (color) => ({
    fontSize: 11, background: `${color}22`, color,
    border: `1px solid ${color}44`, padding: "3px 9px",
    borderRadius: 6, fontWeight: 700, letterSpacing: 0.3,
    fontFamily: "'Inter',sans-serif",
  }),
  pill: (color) => ({
    fontSize: 11, background: color, color: "#fff",
    border: "none", padding: "4px 12px", borderRadius: 99,
    fontWeight: 700, fontFamily: "'Inter',sans-serif", cursor: "pointer",
  }),
};

// ── Shared Components ─────────────────────────────────────────────────────────
function ProgressBar({ pct, color, height = 6 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 99,
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        boxShadow: `0 0 8px ${color}77`,
        transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// Slider-style progress bar matching the reference Parameters section
function SliderBar({ pct, color, label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: T.textMid, fontSize: 12 }}>{label}</span>
        <span style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 10px ${color}88` }} />
      </div>
    </div>
  );
}

// Donut ring chart matching the reference Analysis section
function DonutRing({ pct, color, size = 64, strokeWidth = 7, label }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: T.text, fontSize: size > 70 ? 14 : 11, fontWeight: 800 }}>{pct}%</span>
        </div>
      </div>
      {label && <span style={{ color: T.textMid, fontSize: 12, lineHeight: 1.4 }}>{label}</span>}
    </div>
  );
}

// Gauge meter matching the Total Income card in the reference
function GaugeMeter({ pct, color = T.orange }) {
  const W = 120, H = 70;
  const cx = W / 2, cy = H - 5;
  const r = 54;
  const startAngle = Math.PI;
  const endAngle = 0;
  const arcPct = pct / 100;
  const angle = startAngle - arcPct * Math.PI;
  const needleX = cx + r * 0.75 * Math.cos(angle);
  const needleY = cy + r * 0.75 * Math.sin(angle);
  const arcPath = (start, end, col) => {
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={arcPath(Math.PI, Math.PI * 0.6, T.red)} fill="none" stroke={T.red} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${T.red})` }} />
        <path d={arcPath(Math.PI * 0.6, Math.PI * 0.3, T.gold)} fill="none" stroke={T.gold} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${T.gold})` }} />
        <path d={arcPath(Math.PI * 0.3, 0, T.green)} fill="none" stroke={T.green} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${T.green})` }} />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#fff" />
        <text x={4} y={H - 2} fill={T.textSub} fontSize={9}>0%</text>
        <text x={W - 22} y={H - 2} fill={T.textSub} fontSize={9}>100%</text>
      </svg>
      <span style={{ color, fontWeight: 800, fontSize: 18, marginTop: -4 }}>{pct}%</span>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 42, height: 22, borderRadius: 99, border: "none",
      background: value ? GRAD.purple : "rgba(255,255,255,0.08)",
      cursor: "pointer", position: "relative", transition: "all 0.3s", flexShrink: 0,
      boxShadow: value ? "0 0 12px rgba(124,92,252,0.6)" : "none",
    }}>
      <div style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.25s" }} />
    </button>
  );
}

function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "0 0 24px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 22 : 6, height: 6, borderRadius: 99,
          background: i === current ? GRAD.purple : i < current ? "rgba(124,92,252,0.45)" : "rgba(255,255,255,0.08)",
          boxShadow: i === current ? "0 0 10px rgba(124,92,252,0.8)" : "none",
          transition: "all 0.35s",
        }} />
      ))}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ color: T.textMid, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 14px", fontWeight: 700 }}>{children}</p>
  );
}

function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} style={{
        background: "none", border: `1px solid ${T.border}`, borderRadius: "50%",
        width: 15, height: 15, display: "inline-flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", padding: 0,
      }}>
        <Icon name="info" size={10} color={T.textSub} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
            transform: "translateX(-50%)", background: T.card,
            border: `1px solid ${T.borderHi}`, borderRadius: 12, padding: 12,
            zIndex: 300, width: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{text}</p>
          </div>
        </>
      )}
    </span>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    title: "The Rat Race is Designed to Keep You Broke",
    body: "Every ad, every social media post, every car commercial is engineered to make you spend money you do not have to impress people you do not like. Most people will retire broke because they spent 40 years trying to look rich instead of becoming wealthy.",
    accent: "#EF4444",
    icon: "zap",
    stat: "The average retiree has less than $87,000 saved. That lasts 3 years.",
    statColor: "#EF4444",
  },
  {
    title: "A Budget is Not a Restriction. It is Permission.",
    body: "A budget does not tell you what you cannot do — it tells you exactly what you can do without guilt. When every dollar has a job, you stop wondering where your money went. You already decided.",
    accent: "#3B82F6",
    icon: "target",
    stat: "People on a written budget save 18% more on average than those without one.",
    statColor: "#3B82F6",
  },
  {
    title: "Sacrifice Now. Live Free Later.",
    body: "Financial freedom is not about making more money. It is about deciding that your future matters more than tonight's dinner out. The people who retire early and live without financial stress are not lucky. They just chose differently — consistently.",
    accent: "#10B981",
    icon: "shield",
    stat: "\"Live like no one else, so that later you can live like no one else.\" — Dave Ramsey",
    statColor: "#10B981",
  },
  {
    title: "Your Bank Account Tells the Truth",
    body: "You can tell us your values all day long. But your bank statement shows us your real priorities. FreedomFund connects to your accounts to show you the truth — not to judge you, but to give you a real plan based on real numbers.",
    accent: "#F59E0B",
    icon: "eye",
    stat: "Users who connect their bank account save 3x more in their first 90 days.",
    statColor: "#F59E0B",
  },
];

const SMART_PURPOSES = {
  "Emergency Fund": "I want 3 to 6 months of expenses saved so I am never caught off guard by life.",
  "House Down Payment": "I am saving to own my home — no more renting someone else's dream.",
  "Retirement": "I am building the fund that will one day mean I never have to work again.",
  "Pay Off Debt": "I want to own my life free and clear — no payments, no interest, no chains.",
  "Become Debt Free": "I am cutting every financial obligation until I owe nothing to nobody.",
  "Education Fund": "I am investing in knowledge — the one asset nobody can take from you.",
  "Travel Fund": "I want to see the world on my own terms, paid in full with no regrets.",
  "Big Purchase": "I am saving first so I can buy it outright — no financing, no interest.",
  "Custom Goal": "",
};

// ── US States ─────────────────────────────────────────────────────────────────
const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

// ── Onboarding Helper Components ─────────────────────────────────────────────
function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? T.accentLo : "rgba(255,255,255,0.03)", border: active ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: active ? T.accent : T.textSub, fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: "'Inter',sans-serif" }}>{label}</button>
  );
}

function StepHeader({ icon, title, subtitle, current, total }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <StepDots total={total} current={current} />
      <div style={{ width: 44, height: 44, borderRadius: 11, background: T.accentLo, border: `1px solid ${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon name={icon} size={20} color={T.accent} />
      </div>
      <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: "0 0 6px", letterSpacing: -0.5 }}>{title}</h2>
      <p style={{ color: T.textSub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

function DollarInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={S.label}>{label}</label>}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
        <input value={value} onChange={e => onChange(e.target.value)} type="number" placeholder={placeholder || "0"} style={{ ...S.input, paddingLeft: 28 }} />
      </div>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div style={{ background: T.accentLo, border: `1px solid ${T.accent}20`, borderRadius: 8, padding: 10, marginBottom: 18 }}>
      <p style={{ color: T.accent, fontSize: 11, margin: 0 }}>Your data is private, encrypted, and never sold. We use it only to personalize your budget and goals.</p>
    </div>
  );
}

// ── Onboarding ─────────────────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [bankConnected, setBankConnected] = useState(false);
  const [bankConnecting, setBankConnecting] = useState(false);
  const [bankData, setBankData] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankStep, setBankStep] = useState("select");
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [income, setIncome] = useState("");
  const [payFreq, setPayFreq] = useState("monthly");
  const [extraIncome, setExtraIncome] = useState([{ type: "", amount: "" }]);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [housingType, setHousingType] = useState("");
  const [housingCost, setHousingCost] = useState("");
  const [livingWith, setLivingWith] = useState([]);
  const [hasDependents, setHasDependents] = useState("");
  const [numKids, setNumKids] = useState("");
  const [caregiving, setCaregiving] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [carPayment, setCarPayment] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [usesTransit, setUsesTransit] = useState(false);
  const [transitCost, setTransitCost] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [carInsurance, setCarInsurance] = useState("");
  const [phoneBill, setPhoneBill] = useState("");
  const [utilities, setUtilities] = useState("");
  const [subscriptions, setSubscriptions] = useState("");
  const [subscriptionsList, setSubscriptionsList] = useState([]);
  const [groceries, setGroceries] = useState("");
  const [diningOut, setDiningOut] = useState("");
  const [clothingFreq, setClothingFreq] = useState("");
  const [clothingSpend, setClothingSpend] = useState("");
  const [miscFreq, setMiscFreq] = useState("");
  const [miscSpend, setMiscSpend] = useState("");
  const [entertainment, setEntertainment] = useState("");
  const [lunchHabit, setLunchHabit] = useState("");
  const [lunchSpend, setLunchSpend] = useState("");
  const [vacationFreq, setVacationFreq] = useState("");
  const [vacationBudget, setVacationBudget] = useState("");
  const [vacationCreditCard, setVacationCreditCard] = useState("");
  const [creditCardBalance, setCreditCardBalance] = useState("");

  const slide = SLIDES[slideIdx];
  const goSlide = (dir) => { setAnimKey(k => k + 1); setSlideIdx(i => i + dir); };
  const goStep = (s) => { setAnimKey(k => k + 1); setStep(s); };

  const monthlyIncome = () => {
    const v = parseFloat(income) || 0;
    if (payFreq === "weekly") return Math.round(v * 52 / 12);
    if (payFreq === "biweekly") return Math.round(v * 26 / 12);
    if (payFreq === "yearly") return Math.round(v / 12);
    return Math.round(v);
  };

  const toggleArr = (arr, setArr, val) => setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  // Step 0: Welcome
  if (step === 0) return (
    <div style={{ minHeight: "100vh", background: T.bg, maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Subtle top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.purple})` }} />
      {/* Background glow */}
      <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 32px 0" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="shield" size={22} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <p style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>FreedomFund</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>Financial Independence</p>
          </div>
        </div>

        {/* Hero statement */}
        <h1 style={{ color: T.text, fontSize: 36, fontWeight: 900, margin: "0 0 6px", letterSpacing: -1.5, lineHeight: 1.1 }}>
          Stop living<br />
          <span style={{ color: T.accent }}>for the Joneses.</span>
        </h1>
        <p style={{ color: T.textMid, fontSize: 16, fontWeight: 400, margin: "16px 0 0", lineHeight: 1.8, maxWidth: 340 }}>
          The Joneses are broke. They finance their cars, rent their lifestyle, and call it success. Real freedom looks different — and it starts with a budget.
        </p>

        {/* Reality check stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "32px 0 0" }}>
          {[
            { stat: "78%", label: "of Americans live paycheck to paycheck" },
            { stat: "$6,500", label: "average credit card debt per person" },
            { stat: "21%", label: "average credit card interest rate" },
            { stat: "$0", label: "saved for emergencies by 1 in 4 adults" },
          ].map(s => (
            <div key={s.stat} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ color: T.accent, fontWeight: 800, fontSize: 20, margin: "0 0 4px", letterSpacing: -0.5 }}>{s.stat}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ margin: "28px 0 0", padding: "14px 16px", background: `linear-gradient(135deg, ${T.accent}12, transparent)`, border: `1px solid ${T.accent}25`, borderRadius: 10, borderLeft: `3px solid ${T.accent}` }}>
          <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.7, fontStyle: "italic" }}>
            "Sacrifice like no one else today — so you can live like no one else tomorrow."
          </p>
        </div>
      </div>

      <div style={{ padding: "32px 32px 52px" }}>
        <button onClick={() => goStep(1)} style={{ ...S.primaryBtn(), fontSize: 16, padding: "15px 0", boxShadow: `0 4px 28px ${T.accent}35`, marginBottom: 12 }}>
          I am ready to change my life
        </button>
        <p style={{ color: "#1A2D45", fontSize: 12, textAlign: "center", margin: 0 }}>Free forever. No credit card. No ads. No nonsense.</p>
      </div>
    </div>
  );

  // Step 1: Name + Age
  if (step === 1) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="user" title="Tell us about yourself" subtitle="We will use this to personalize your financial plan and set realistic benchmarks for your age group." current={0} total={11} />
      <PrivacyNote />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={S.label}>First name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jordan" style={{ ...S.input, fontSize: 16, fontWeight: 600 }} autoFocus />
        </div>
        <div>
          <label style={S.label}>Age range</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map(a => (
              <Chip key={a} label={a} active={ageRange === a} onClick={() => setAgeRange(a)} />
            ))}
          </div>
        </div>
        {name.trim() && ageRange && (
          <div style={{ background: T.accentLo, border: `1px solid ${T.accent}30`, borderRadius: 8, padding: 11 }}>
            <p style={{ color: T.accent, fontSize: 13, margin: 0 }}>Welcome, <strong>{name}</strong>. Let us build your path to financial freedom.</p>
          </div>
        )}
      </div>
      <button onClick={() => name.trim() && ageRange && goStep(2)} style={{ ...S.primaryBtn(), opacity: name.trim() && ageRange ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 2: Philosophy slides
  if (step === 2) return (
    <div key={animKey} style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 28px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {SLIDES.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= slideIdx ? slide.accent : "rgba(255,255,255,0.08)" }} />)}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: `${slide.accent}20`, border: `1px solid ${slide.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          <Icon name={slide.icon} size={34} color={slide.accent} strokeWidth={1.4} />
        </div>
        <h2 style={{ color: T.text, fontSize: 24, fontWeight: 800, margin: "0 0 14px", letterSpacing: -0.5, lineHeight: 1.2 }}>{slide.title}</h2>
        <p style={{ color: T.textMid, fontSize: 15, lineHeight: 1.75, margin: "0 0 24px" }}>{slide.body}</p>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", borderLeft: `3px solid ${slide.statColor}` }}>
          <p style={{ color: slide.statColor, fontSize: 13, fontWeight: 600, margin: 0 }}>{slide.stat}</p>
        </div>
      </div>
      <div>
        {slideIdx < SLIDES.length - 1 ? (
          <div style={{ display: "flex", gap: 10 }}>
            {slideIdx > 0 && <button onClick={() => goSlide(-1)} style={{ ...S.ghostBtn, flex: 1, padding: "13px 0" }}>Back</button>}
            <button onClick={() => goSlide(1)} style={{ flex: 3, background: slide.accent, color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Next</button>
          </div>
        ) : (
          <button onClick={() => goStep(3)} style={{ background: slide.accent, color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%" }}>I am ready — let us build</button>
        )}
        <p style={{ color: "rgba(255,255,255,0.12)", fontSize: 11, textAlign: "center", marginTop: 14 }}>{name} — Understanding the mission</p>
      </div>
    </div>
  );

  // Step 3: Income
  if (step === 3) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="dollarSign" title="Your income" subtitle="After-tax take-home only. This is the foundation of your entire budget plan." current={2} total={11} />
      <PrivacyNote />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <DollarInput label="Take-home pay (after tax)" value={income} onChange={setIncome} placeholder="0.00" />
        <div>
          <label style={S.label}>Pay frequency</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {["Weekly", "Biweekly", "Monthly", "Yearly"].map(f => (
              <Chip key={f} label={f} active={payFreq === f.toLowerCase()} onClick={() => setPayFreq(f.toLowerCase())} />
            ))}
          </div>
        </div>
        <div>
          <label style={S.label}>Additional income sources</label>
          <p style={{ color: T.textSub, fontSize: 11, margin: "-4px 0 10px" }}>Add any extra income streams beyond your main job.</p>
          {extraIncome.map((src, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <select
                value={src.type}
                onChange={e => setExtraIncome(prev => prev.map((s, i) => i === idx ? { ...s, type: e.target.value } : s))}
                style={{ ...S.input, flex: 2, padding: "10px 12px" }}
              >
                <option value="">Select type...</option>
                {["Side hustle", "Freelance", "Rental income", "Dividends / Investments", "Child support received", "Alimony received", "Government assistance", "Social Security", "Pension", "Other"].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 13 }}>$</span>
                <input
                  value={src.amount}
                  onChange={e => setExtraIncome(prev => prev.map((s, i) => i === idx ? { ...s, amount: e.target.value } : s))}
                  type="number"
                  placeholder="0/mo"
                  style={{ ...S.input, paddingLeft: 22, padding: "10px 10px 10px 22px" }}
                />
              </div>
              <button
                onClick={() => setExtraIncome(prev => prev.filter((_, i) => i !== idx))}
                style={{ background: T.redLo, border: `1px solid ${T.red}30`, borderRadius: 7, width: 34, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Icon name="x" size={14} color={T.red} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setExtraIncome(prev => [...prev, { type: "", amount: "" }])}
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 14px", cursor: "pointer", color: T.accent, fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 6, width: "100%" }}
          >
            <Icon name="plus" size={14} color={T.accent} />
            Add income source
          </button>
          {extraIncome.length > 0 && extraIncome.some(s => parseFloat(s.amount) > 0) && (
            <div style={{ background: T.greenLo, border: `1px solid ${T.green}25`, borderRadius: 8, padding: 10, marginTop: 10 }}>
              <p style={{ color: T.green, fontSize: 12, margin: 0 }}>
                Additional monthly income: <strong>${extraIncome.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0).toLocaleString()}/mo</strong>
              </p>
            </div>
          )}
        </div>
        {income && (
          <div style={{ background: T.greenLo, border: `1px solid ${T.green}30`, borderRadius: 8, padding: 11 }}>
            <p style={{ color: T.green, fontSize: 13, margin: 0 }}>Monthly equivalent: <strong>${monthlyIncome().toLocaleString()}/mo</strong> — we suggest saving 20% toward goals first.</p>
          </div>
        )}
      </div>
      <button onClick={() => income && goStep(4)} style={{ ...S.primaryBtn(), opacity: income ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 3.5: Bank Connection
  if (step === 4) {
    const MOCK_BANKS = [
      { id: "chase",    name: "Chase",            logo: "C",  color: "#0A6EBD", accounts: 2 },
      { id: "bofa",     name: "Bank of America",  logo: "B",  color: "#E31837", accounts: 3 },
      { id: "wells",    name: "Wells Fargo",      logo: "W",  color: "#CC0000", accounts: 2 },
      { id: "citi",     name: "Citibank",         logo: "C",  color: "#003B70", accounts: 1 },
      { id: "capital",  name: "Capital One",      logo: "C",  color: "#004977", accounts: 2 },
      { id: "usbank",   name: "US Bank",          logo: "U",  color: "#003087", accounts: 2 },
      { id: "td",       name: "TD Bank",          logo: "T",  color: "#00B140", accounts: 1 },
      { id: "ally",     name: "Ally Bank",        logo: "A",  color: "#7B2D8B", accounts: 1 },
      { id: "other",    name: "Search for my bank", logo: "+", color: T.textSub, accounts: 0 },
    ];

    const MOCK_ANALYSIS = {
      monthlyIncoming: 4840,
      monthlyOutgoing: 3920,
      topCategories: [
        { name: "Housing / Rent",   amount: 1450, pct: 37, color: T.red    },
        { name: "Groceries",        amount: 480,  pct: 12, color: T.green  },
        { name: "Dining Out",       amount: 380,  pct: 10, color: T.gold   },
        { name: "Subscriptions",    amount: 210,  pct: 5,  color: T.purple },
        { name: "Gas / Transport",  amount: 190,  pct: 5,  color: T.accent },
        { name: "Shopping",         amount: 340,  pct: 9,  color: T.textMid},
        { name: "Other",            amount: 870,  pct: 22, color: "#475569" },
      ],
      recentTransactions: [
        { date: "Today",    desc: "Whole Foods",         amount: -68.42,  cat: "Groceries"  },
        { date: "Yesterday",desc: "Netflix",             amount: -15.99,  cat: "Subscriptions" },
        { date: "Yesterday",desc: "Shell Gas Station",   amount: -54.10,  cat: "Transport"  },
        { date: "Mon",      desc: "Direct Deposit",      amount: +2420.00, cat: "Income"    },
        { date: "Mon",      desc: "Chipotle",            amount: -14.87,  cat: "Dining"     },
        { date: "Sun",      desc: "Amazon",              amount: -89.99,  cat: "Shopping"   },
        { date: "Sat",      desc: "Target",              amount: -142.33, cat: "Shopping"   },
        { date: "Fri",      desc: "Uber Eats",           amount: -38.50,  cat: "Dining"     },
      ],
      insights: [
        { icon: "fire",    color: T.red,    title: "Dining out is high", body: "You spent $380 dining out last month — that is 10% of your take-home. The national average is 5%. Cutting this in half saves $190/mo or $2,280/yr." },
        { icon: "zap",     color: T.gold,   title: "Subscription creep", body: "You have $210/mo in subscriptions across multiple services. Many people forget what they are paying for. Review and cancel what you do not actively use." },
        { icon: "trendUp", color: T.green,  title: "Good news: you spend less than you earn", body: "You have $920/mo left over after expenses. The goal is to make every one of those dollars work for you instead of drifting into random spending." },
      ],
    };

    const simulateConnect = () => {
      setBankStep("connecting");
      setTimeout(() => { setBankData(MOCK_ANALYSIS); setBankStep("analysis"); setBankConnected(true); }, 2800);
    };

    return (
      <div style={{ minHeight: "100vh", background: T.bg, maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.purple})`, maxWidth: 420 }} />

        {bankStep === "select" && (
          <div style={{ padding: "52px 20px 40px", display: "flex", flexDirection: "column", flex: 1 }}>
            <StepHeader icon="wallet" title="Connect your bank" subtitle="See exactly where your money is going — automatically. No more guessing. This is where the truth lives." current={3} total={11} />

            <div style={{ background: T.accentLo, border: `1px solid ${T.accent}25`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Icon name="lock" size={16} color={T.accent} />
                <div>
                  <p style={{ color: T.accent, fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>Bank-level 256-bit encryption</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.5 }}>Read-only access. We can see your transactions but can never move your money. Powered by Plaid — used by Venmo, Robinhood, and 8,000+ apps.</p>
                </div>
              </div>
            </div>

            <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>Select your bank</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
              {MOCK_BANKS.map(bank => (
                <button key={bank.id} onClick={() => setSelectedBank(bank)} style={{ background: selectedBank?.id === bank.id ? T.accentLo : T.card, border: selectedBank?.id === bank.id ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 10, padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${bank.color}22`, border: `1px solid ${bank.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: bank.color }}>{bank.logo}</div>
                  <span style={{ color: selectedBank?.id === bank.id ? T.accent : T.textSub, fontSize: 10, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{bank.name}</span>
                </button>
              ))}
            </div>

            <button onClick={() => selectedBank && setBankStep("credentials")} style={{ ...S.primaryBtn(), opacity: selectedBank ? 1 : 0.35, marginBottom: 10 }}>
              Connect {selectedBank ? selectedBank.name : "Bank"}
            </button>
            <button onClick={() => goStep(5)} style={{ ...S.ghostBtn }}>Skip — I will do this later</button>
          </div>
        )}

        {bankStep === "credentials" && (
          <div style={{ padding: "52px 20px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
            <button onClick={() => setBankStep("select")} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 4, padding: 0, fontSize: 13 }}>
              <Icon name="chevronLeft" size={16} color={T.textSub} />Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: `${selectedBank.color}22`, border: `1px solid ${selectedBank.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: selectedBank.color }}>{selectedBank.logo}</div>
              <div>
                <h3 style={{ color: T.text, fontSize: 17, fontWeight: 700, margin: 0 }}>Sign in to {selectedBank.name}</h3>
                <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Encrypted connection via Plaid</p>
              </div>
            </div>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="lock" size={14} color={T.green} />
                <span style={{ color: T.green, fontSize: 12, fontWeight: 600 }}>Secure read-only access</span>
              </div>
              <label style={S.label}>Username / User ID</label>
              <input placeholder="Enter your bank username" style={{ ...S.input, marginBottom: 12 }} />
              <label style={S.label}>Password</label>
              <input type="password" placeholder="Enter your password" style={{ ...S.input, marginBottom: 0 }} />
            </div>
            <div style={{ background: `${T.green}0a`, border: `1px solid ${T.green}25`, borderRadius: 9, padding: 12, marginBottom: 20 }}>
              <p style={{ color: T.green, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Your credentials go directly to {selectedBank.name} via Plaid. FreedomFund never sees or stores your username or password.</p>
            </div>
            <button onClick={simulateConnect} style={S.primaryBtn()}>Connect Account Securely</button>
          </div>
        )}

        {bankStep === "connecting" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: T.accentLo, border: `1px solid ${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "pulse 1.5s infinite" }}>
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
              <Icon name="repeat" size={32} color={T.accent} />
            </div>
            <h3 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>Analyzing your finances</h3>
            <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>Securely fetching your last 90 days of transactions...</p>
            {["Connecting to bank", "Fetching transactions", "Categorizing spending", "Building your profile"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, opacity: 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.accentLo, border: `1px solid ${T.accent}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={10} color={T.accent} />
                </div>
                <span style={{ color: T.textMid, fontSize: 13 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {bankStep === "analysis" && bankData && (
          <div style={{ padding: "52px 20px 40px", overflowY: "auto", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.greenLo, border: `1px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={15} color={T.green} />
              </div>
              <div>
                <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedBank.name} connected</h3>
                <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Last 90 days analyzed</p>
              </div>
            </div>

            <p style={{ color: T.red, fontSize: 14, fontWeight: 700, margin: "20px 0 6px", lineHeight: 1.5 }}>Here is the truth about your spending, {name}. No sugar-coating.</p>

            {/* In vs Out */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <SectionLabel>Monthly Cash Flow</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ background: `${T.green}0a`, border: `1px solid ${T.green}25`, borderRadius: 9, padding: "12px 14px" }}>
                  <p style={{ color: T.textSub, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Coming In</p>
                  <p style={{ color: T.green, fontWeight: 800, fontSize: 22, margin: 0 }}>${bankData.monthlyIncoming.toLocaleString()}</p>
                </div>
                <div style={{ background: `${T.red}0a`, border: `1px solid ${T.red}25`, borderRadius: 9, padding: "12px 14px" }}>
                  <p style={{ color: T.textSub, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Going Out</p>
                  <p style={{ color: T.red, fontWeight: 800, fontSize: 22, margin: 0 }}>${bankData.monthlyOutgoing.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${T.border}` }}>
                <span style={{ color: T.textMid, fontSize: 13, fontWeight: 600 }}>Left over</span>
                <span style={{ color: T.green, fontSize: 16, fontWeight: 800 }}>+${(bankData.monthlyIncoming - bankData.monthlyOutgoing).toLocaleString()}</span>
              </div>
            </div>

            {/* Spending breakdown */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <SectionLabel>Where Your Money Goes</SectionLabel>
              {bankData.topCategories.map(cat => (
                <div key={cat.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: T.textMid, fontSize: 12 }}>{cat.name}</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ color: cat.color, fontSize: 12, fontWeight: 700 }}>${cat.amount}</span>
                      <span style={{ color: T.textSub, fontSize: 11, width: 28, textAlign: "right" }}>{cat.pct}%</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 5 }}>
                    <div style={{ width: `${cat.pct}%`, height: "100%", background: cat.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <SectionLabel>Reality Check</SectionLabel>
              {bankData.insights.map(ins => (
                <div key={ins.title} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ins.color}15`, border: `1px solid ${ins.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Icon name={ins.icon} size={15} color={ins.color} />
                  </div>
                  <div>
                    <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>{ins.title}</p>
                    <p style={{ color: T.textSub, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{ins.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent transactions */}
            <div style={{ ...S.card, marginBottom: 20 }}>
              <SectionLabel>Recent Transactions</SectionLabel>
              {bankData.recentTransactions.map((tx, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < bankData.recentTransactions.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: tx.amount > 0 ? T.green : T.textSub, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: T.textMid, fontSize: 13, fontWeight: 500, margin: 0 }}>{tx.desc}</p>
                      <p style={{ color: T.textSub, fontSize: 10, margin: "1px 0 0" }}>{tx.date} &middot; {tx.cat}</p>
                    </div>
                  </div>
                  <span style={{ color: tx.amount > 0 ? T.green : T.text, fontSize: 13, fontWeight: 700 }}>
                    {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={() => goStep(5)} style={{ ...S.primaryBtn(), marginBottom: 10 }}>
              Build My Budget Plan
            </button>
          </div>
        )}
      </div>
    );
  }

  // Step 5: Location
  if (step === 4) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="globe" title="Where do you live?" subtitle="Cost of living varies dramatically by state and city. We use this for accurate local benchmarks on gas, groceries, rent, and more." current={4} total={11} />
      <PrivacyNote />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={S.label}>State</label>
          <select value={state} onChange={e => setState(e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
            <option value="">Select your state...</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>City or county</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Austin, Travis County" style={S.input} />
        </div>
        {state && city && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
            <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.6 }}>In {city}, {state} we will benchmark your spending against local averages — gas prices, grocery costs, average rent, and regional taxes all factor into your plan.</p>
          </div>
        )}
      </div>
      <button onClick={() => state && city.trim() && goStep(6)} style={{ ...S.primaryBtn(), opacity: state && city.trim() ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 6: Housing
  if (step === 5) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="building" title="Your housing situation" subtitle="Housing is most people's biggest expense. Understanding yours helps us set accurate budget targets." current={5} total={11} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={S.label}>Housing type</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { val: "renting", label: "Renting", sub: "Apartment, house, or room" },
              { val: "mortgage", label: "Paying a mortgage", sub: "Own with a home loan" },
              { val: "owned", label: "Own outright", sub: "No mortgage payment" },
              { val: "living-with-family", label: "Living with family", sub: "Parents, relatives, etc." },
              { val: "other", label: "Other arrangement", sub: "Shared housing, transitional, etc." },
            ].map(o => (
              <button key={o.val} onClick={() => setHousingType(o.val)} style={{ background: housingType === o.val ? T.accentLo : T.card, border: housingType === o.val ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: housingType === o.val ? T.accent : T.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{o.label}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{o.sub}</p>
                </div>
                {housingType === o.val && <Icon name="check" size={16} color={T.accent} />}
              </button>
            ))}
          </div>
        </div>
        {(housingType === "renting" || housingType === "mortgage") && (
          <DollarInput label={housingType === "renting" ? "Monthly rent" : "Monthly mortgage payment"} value={housingCost} onChange={setHousingCost} placeholder="0" />
        )}
        <div>
          <label style={S.label}>Who do you live with?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Alone", "Partner / Spouse", "Roommate(s)", "Kids", "Parents", "Other family"].map(o => (
              <Chip key={o} label={o} active={livingWith.includes(o)} onClick={() => toggleArr(livingWith, setLivingWith, o)} />
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => housingType && goStep(7)} style={{ ...S.primaryBtn(), opacity: housingType ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 7: Dependents
  if (step === 6) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="users" title="Dependents and caregiving" subtitle="Having kids or caring for others changes your budget and the size of your emergency fund." current={6} total={11} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={S.label}>Do you have children?</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Yes", "No"].map(o => <Chip key={o} label={o} active={hasDependents === o} onClick={() => setHasDependents(o)} />)}
          </div>
        </div>
        {hasDependents === "Yes" && (
          <div>
            <label style={S.label}>How many children?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
              {["1", "2", "3", "4", "5+"].map(n => <Chip key={n} label={n} active={numKids === n} onClick={() => setNumKids(n)} />)}
            </div>
          </div>
        )}
        <div>
          <label style={S.label}>Are you financially responsible for anyone else?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Elderly parent(s)", "Disabled family member", "Extended family", "No one else"].map(o => (
              <Chip key={o} label={o} active={caregiving.includes(o)} onClick={() => toggleArr(caregiving, setCaregiving, o)} />
            ))}
          </div>
        </div>
        {(hasDependents === "Yes" || caregiving.some(c => c !== "No one else")) && (
          <div style={{ background: `${T.gold}0a`, border: `1px solid ${T.gold}25`, borderRadius: 10, padding: 12 }}>
            <p style={{ color: T.gold, fontSize: 12, margin: 0, lineHeight: 1.6 }}>Based on your dependents, we will recommend a larger emergency fund — typically 6 months of expenses rather than 3.</p>
          </div>
        )}
      </div>
      <button onClick={() => hasDependents && goStep(8)} style={{ ...S.primaryBtn(), opacity: hasDependents ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 8: Transportation
  if (step === 7) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="send" title="Transportation" subtitle="Gas, EV charging, and car payments vary widely by location and vehicle. This keeps your budget accurate." current={7} total={11} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={S.label}>Do you own a vehicle?</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { val: "gas", label: "Yes — gas vehicle", sub: "Traditional combustion engine" },
              { val: "electric", label: "Yes — electric vehicle (EV)", sub: "Fully electric" },
              { val: "hybrid", label: "Yes — hybrid", sub: "Gas and electric combined" },
              { val: "none", label: "No vehicle", sub: "I use transit, ride-share, or walk" },
            ].map(o => (
              <button key={o.val} onClick={() => setVehicleType(o.val)} style={{ background: vehicleType === o.val ? T.accentLo : T.card, border: vehicleType === o.val ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: vehicleType === o.val ? T.accent : T.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{o.label}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{o.sub}</p>
                </div>
                {vehicleType === o.val && <Icon name="check" size={16} color={T.accent} />}
              </button>
            ))}
          </div>
        </div>
        {(vehicleType === "gas" || vehicleType === "hybrid") && <DollarInput label="Monthly gas spending" value={fuelCost} onChange={setFuelCost} placeholder="0" />}
        {vehicleType === "electric" && <DollarInput label="Monthly EV charging cost" value={fuelCost} onChange={setFuelCost} placeholder="0" />}
        {(vehicleType === "gas" || vehicleType === "electric" || vehicleType === "hybrid") && <DollarInput label="Car payment (enter 0 if paid off)" value={carPayment} onChange={setCarPayment} placeholder="0" />}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px" }}>
          <div>
            <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>I also use public transit</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Bus, subway, train, etc.</p>
          </div>
          <Toggle value={usesTransit} onChange={setUsesTransit} />
        </div>
        {usesTransit && <DollarInput label="Monthly transit cost" value={transitCost} onChange={setTransitCost} placeholder="0" />}
      </div>
      <button onClick={() => vehicleType && goStep(9)} style={{ ...S.primaryBtn(), opacity: vehicleType ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 9: Fixed expenses
  if (step === 8) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="calendar" title="Fixed monthly expenses" subtitle="Bills that stay roughly the same every month. Enter 0 for anything that does not apply." current={8} total={11} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <DollarInput label="Health insurance (monthly)" value={healthInsurance} onChange={setHealthInsurance} placeholder="0" />
        <DollarInput label="Car insurance (monthly)" value={carInsurance} onChange={setCarInsurance} placeholder="0" />
        <DollarInput label="Phone bill (monthly)" value={phoneBill} onChange={setPhoneBill} placeholder="0" />
        <DollarInput label="Utilities — electric, gas, water (monthly)" value={utilities} onChange={setUtilities} placeholder="0" />
        <DollarInput label="Subscriptions — streaming, gym, apps (monthly total)" value={subscriptions} onChange={setSubscriptions} placeholder="0" />
        {[healthInsurance, carInsurance, phoneBill, utilities, subscriptions].some(v => parseFloat(v) > 0) && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginTop: 4 }}>
            <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 4px" }}>Total fixed expenses (incl. housing and car)</p>
            <p style={{ color: T.red, fontWeight: 700, fontSize: 18, margin: 0 }}>
              ${Math.round([healthInsurance, carInsurance, phoneBill, utilities, subscriptions].reduce((a, v) => a + (parseFloat(v) || 0), 0) + (parseFloat(housingCost) || 0) + (parseFloat(carPayment) || 0)).toLocaleString()}/mo
            </p>
          </div>
        )}
      </div>
      <button onClick={() => goStep(10)} style={{ ...S.primaryBtn(), marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 10: Variable spending
  if (step === 9) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="barChart" title="Your spending habits" subtitle="Be honest — there is no judgment here. The more accurate this is, the better your plan will be." current={11} total={11} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <DollarInput label="Groceries (weekly average)" value={groceries} onChange={setGroceries} placeholder="0" />
        <DollarInput label="Dining out and takeout (weekly average)" value={diningOut} onChange={setDiningOut} placeholder="0" />

        {/* Work lunch */}
        <div>
          <label style={S.label}>On work days, what do you usually do for lunch?</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { val: "bring", label: "Bring lunch from home", sub: "Meal prep, leftovers, packed lunch" },
              { val: "buy-cheap", label: "Buy something inexpensive", sub: "Fast food, cafeteria, under $10" },
              { val: "buy-mid", label: "Buy a sit-down or delivery lunch", sub: "Restaurant, delivery app, $10-20" },
              { val: "skip", label: "Skip lunch most days", sub: "Work through it or snack" },
              { val: "varies", label: "It varies a lot", sub: "Mix of all of the above" },
            ].map(o => (
              <button key={o.val} onClick={() => setLunchHabit(o.val)} style={{ background: lunchHabit === o.val ? T.accentLo : "rgba(255,255,255,0.03)", border: lunchHabit === o.val ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 9, padding: "10px 13px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: lunchHabit === o.val ? T.accent : T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{o.label}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{o.sub}</p>
                </div>
                {lunchHabit === o.val && <Icon name="check" size={15} color={T.accent} />}
              </button>
            ))}
          </div>
          {lunchHabit && lunchHabit !== "bring" && lunchHabit !== "skip" && (
            <div style={{ marginTop: 10 }}>
              <DollarInput label="Average lunch spend per work day ($)" value={lunchSpend} onChange={setLunchSpend} placeholder="0" />
              {lunchSpend && (
                <div style={{ background: `${T.gold}0a`, border: `1px solid ${T.gold}25`, borderRadius: 8, padding: 10 }}>
                  <p style={{ color: T.gold, fontSize: 12, margin: 0 }}>
                    That is approximately <strong>${Math.round(parseFloat(lunchSpend) * 22)}/mo</strong> on work lunches. Packing lunch could save most of that.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label style={S.label}>How often do you shop for clothes?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {["Rarely", "Monthly", "Every 2-3 months", "Weekly"].map(o => <Chip key={o} label={o} active={clothingFreq === o} onClick={() => setClothingFreq(o)} />)}
          </div>
          {clothingFreq && clothingFreq !== "Rarely" && <DollarInput label="Avg spend per clothing trip ($)" value={clothingSpend} onChange={setClothingSpend} placeholder="0" />}
        </div>
        <div>
          <label style={S.label}>How often do you buy miscellaneous items?</label>
          <p style={{ color: T.textSub, fontSize: 11, margin: "-4px 0 8px" }}>Amazon, household, impulse buys, etc.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {["Rarely", "Monthly", "Weekly", "Multiple times/week"].map(o => <Chip key={o} label={o} active={miscFreq === o} onClick={() => setMiscFreq(o)} />)}
          </div>
          {miscFreq && miscFreq !== "Rarely" && <DollarInput label="Avg monthly misc spending ($)" value={miscSpend} onChange={setMiscSpend} placeholder="0" />}
        </div>
        <DollarInput label="Entertainment — events, hobbies, sports (monthly)" value={entertainment} onChange={setEntertainment} placeholder="0" />
      </div>
      <button onClick={() => groceries && goStep(11)} style={{ ...S.primaryBtn(), opacity: groceries ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 11: Vacation + credit card habits
  if (step === 10) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StepHeader icon="send" title="Travel and credit cards" subtitle="Understanding how you vacation and use credit helps us spot hidden spending and debt risk." current={10} total={11} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Vacation frequency */}
        <div>
          <label style={S.label}>How often do you take vacations or trips?</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { val: "never", label: "Rarely or never", sub: "Not a regular habit" },
              { val: "yearly", label: "Once a year", sub: "Annual trip or getaway" },
              { val: "twice", label: "2 to 3 times a year", sub: "Long weekends plus a main trip" },
              { val: "quarterly", label: "Every few months", sub: "Frequent traveler" },
              { val: "monthly", label: "Monthly", sub: "Travel is a big part of my life" },
            ].map(o => (
              <button key={o.val} onClick={() => setVacationFreq(o.val)} style={{ background: vacationFreq === o.val ? T.accentLo : "rgba(255,255,255,0.03)", border: vacationFreq === o.val ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 9, padding: "10px 13px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: vacationFreq === o.val ? T.accent : T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{o.label}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{o.sub}</p>
                </div>
                {vacationFreq === o.val && <Icon name="check" size={15} color={T.accent} />}
              </button>
            ))}
          </div>
        </div>

        {vacationFreq && vacationFreq !== "never" && (
          <DollarInput label="Average budget per trip (flights, hotel, food, etc.)" value={vacationBudget} onChange={setVacationBudget} placeholder="0" />
        )}

        {/* Credit card on vacation */}
        {vacationFreq && vacationFreq !== "never" && (
          <div>
            <label style={S.label}>When you travel, how do you typically pay?</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { val: "saved", label: "Cash I saved ahead of time", sub: "Fully planned and pre-funded" },
                { val: "debit", label: "Debit card / checking account", sub: "Spend what I have" },
                { val: "credit-payoff", label: "Credit card — paid off immediately", sub: "Use for points, pay in full each month" },
                { val: "credit-carry", label: "Credit card — carry a balance", sub: "Pay it off over time afterward" },
                { val: "mix", label: "Mix of saved money and credit", sub: "Part planned, part financed" },
              ].map(o => (
                <button key={o.val} onClick={() => setVacationCreditCard(o.val)} style={{ background: vacationCreditCard === o.val ? T.accentLo : "rgba(255,255,255,0.03)", border: vacationCreditCard === o.val ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 9, padding: "10px 13px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ color: vacationCreditCard === o.val ? T.accent : T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{o.label}</p>
                    <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{o.sub}</p>
                  </div>
                  {vacationCreditCard === o.val && <Icon name="check" size={15} color={T.accent} />}
                </button>
              ))}
            </div>
            {vacationCreditCard === "credit-carry" && (
              <div style={{ marginTop: 10, background: `${T.red}0a`, border: `1px solid ${T.red}25`, borderRadius: 9, padding: 12 }}>
                <p style={{ color: T.red, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Vacation debt is one of the biggest budget traps</p>
                <p style={{ color: T.textSub, fontSize: 12, margin: 0, lineHeight: 1.5 }}>We will help you build a dedicated Travel Fund goal so your next trip is fully paid for before you go.</p>
              </div>
            )}
            {(vacationCreditCard === "credit-payoff" || vacationCreditCard === "mix") && (
              <div style={{ marginTop: 10, background: `${T.green}0a`, border: `1px solid ${T.green}25`, borderRadius: 9, padding: 12 }}>
                <p style={{ color: T.green, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Using credit responsibly for points is smart — as long as it gets paid in full. We will track this to make sure it stays that way.</p>
              </div>
            )}
          </div>
        )}

        {/* Current credit card balance */}
        <div>
          <label style={S.label}>Do you currently carry a credit card balance?</label>
          <p style={{ color: T.textSub, fontSize: 11, margin: "-4px 0 10px", lineHeight: 1.5 }}>This helps us factor interest costs into your budget and prioritize debt payoff if needed.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {["No balance", "Yes — small (under $1k)", "Yes — moderate ($1k-$5k)", "Yes — significant ($5k+)"].map(o => (
              <Chip key={o} label={o} active={creditCardBalance === o} onClick={() => setCreditCardBalance(o)} />
            ))}
          </div>
          {creditCardBalance && creditCardBalance !== "No balance" && (
            <div style={{ background: `${T.gold}0a`, border: `1px solid ${T.gold}25`, borderRadius: 9, padding: 12 }}>
              <p style={{ color: T.gold, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Average credit card APR is 21%. Paying off a balance before saving anything else is almost always the right financial move. We will build this into your plan.</p>
            </div>
          )}
        </div>
      </div>
      <button onClick={() => vacationFreq && goStep(11)} style={{ ...S.primaryBtn(), opacity: vacationFreq ? 1 : 0.35, marginTop: 24 }}>Continue</button>
    </div>
  );

  // Step 11: Subscriptions
  if (step === 11) {
    const PRESET_SUBS = [
      { name: "Netflix",         icon: "▶", color: "#E50914", defaultAmt: 15.99 },
      { name: "Spotify",         icon: "♪", color: "#1DB954", defaultAmt: 9.99  },
      { name: "Hulu",            icon: "▶", color: "#1CE783", defaultAmt: 7.99  },
      { name: "Disney+",         icon: "★", color: "#113CCF", defaultAmt: 10.99 },
      { name: "Apple TV+",       icon: "◆", color: "#999999", defaultAmt: 9.99  },
      { name: "HBO Max",         icon: "▶", color: "#5822B4", defaultAmt: 15.99 },
      { name: "YouTube Premium", icon: "▶", color: "#FF0000", defaultAmt: 13.99 },
      { name: "Amazon Prime",    icon: "◉", color: "#00A8E0", defaultAmt: 14.99 },
      { name: "Gym / Fitness",   icon: "◈", color: "#F5A623", defaultAmt: 40.00 },
      { name: "Apple iCloud",    icon: "☁", color: "#999999", defaultAmt: 2.99  },
      { name: "Google One",      icon: "◉", color: "#4285F4", defaultAmt: 2.99  },
      { name: "Microsoft 365",   icon: "◆", color: "#D83B01", defaultAmt: 9.99  },
      { name: "Audible",         icon: "♪", color: "#FF9900", defaultAmt: 14.95 },
      { name: "Duolingo Plus",   icon: "◈", color: "#58CC02", defaultAmt: 6.99  },
      { name: "PlayStation Plus",icon: "◈", color: "#003087", defaultAmt: 14.99 },
      { name: "Xbox Game Pass",  icon: "◈", color: "#107C10", defaultAmt: 14.99 },
    ];

    const addPreset = (preset) => {
      if (subscriptionsList.find(s => s.name === preset.name)) return;
      setSubscriptionsList(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: preset.name, amount: preset.defaultAmt, dueDay: 1,
        color: T.purple, icon: "repeat", category: "subscriptions",
        autopay: true, notes: "", reminderDays: 3,
      }]);
    };

    const addCustom = () => {
      setSubscriptionsList(prev => [...prev, {
        id: Date.now(), name: "", amount: "", dueDay: 1,
        color: T.purple, icon: "repeat", category: "subscriptions",
        autopay: true, notes: "", reminderDays: 3, isCustom: true,
      }]);
    };

    const updateSub = (id, field, val) => {
      setSubscriptionsList(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const removeSub = (id) => setSubscriptionsList(prev => prev.filter(s => s.id !== id));

    const totalSubs = subscriptionsList.reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);

    return (
      <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <StepHeader icon="repeat" title="Your subscriptions" subtitle="Most people underestimate how much they spend on subscriptions. Let us find out exactly what is draining your account every month." current={9} total={11} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Quick-add presets */}
          <div>
            <label style={S.label}>Tap to add yours</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {PRESET_SUBS.map(p => {
                const added = subscriptionsList.find(s => s.name === p.name);
                return (
                  <button key={p.name} onClick={() => added ? removeSub(added.id) : addPreset(p)} style={{ background: added ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.04)", border: added ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 99, padding: "6px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
                    <span style={{ fontSize: 13 }}>{p.icon}</span>
                    <span style={{ color: added ? T.purple : T.textMid, fontSize: 12, fontWeight: added ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{p.name}</span>
                    {added && <Icon name="check" size={11} color={T.purple} strokeWidth={2.5} />}
                  </button>
                );
              })}
              <button onClick={addCustom} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, padding: "6px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="plus" size={13} color={T.accent} />
                <span style={{ color: T.accent, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Custom</span>
              </button>
            </div>
          </div>

          {/* Added subscriptions with amount + due day */}
          {subscriptionsList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={S.label}>Your subscriptions — set amount and due date</label>
              {subscriptionsList.map(sub => (
                <div key={sub.id} style={{ background: "rgba(123,110,246,0.07)", border: "1px solid rgba(123,110,246,0.2)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="repeat" size={13} color="#fff" />
                    </div>
                    {sub.isCustom ? (
                      <input value={sub.name} onChange={e => updateSub(sub.id, "name", e.target.value)} placeholder="Subscription name" style={{ ...S.input, flex: 1, padding: "7px 11px", fontSize: 13 }} />
                    ) : (
                      <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0, flex: 1 }}>{sub.name}</p>
                    )}
                    <button onClick={() => removeSub(sub.id)} style={{ background: "rgba(255,90,110,0.1)", border: "1px solid rgba(255,90,110,0.2)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="x" size={13} color={T.red} />
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ ...S.label, fontSize: 10 }}>Monthly cost</label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 13 }}>$</span>
                        <input value={sub.amount} onChange={e => updateSub(sub.id, "amount", e.target.value)} type="number" placeholder="0.00" style={{ ...S.input, paddingLeft: 24, padding: "9px 10px 9px 24px", fontSize: 14, fontWeight: 700 }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 10 }}>Billed on the</label>
                      <select value={sub.dueDay} onChange={e => updateSub(sub.id, "dueDay", parseInt(e.target.value))} style={{ ...S.input, padding: "9px 10px", cursor: "pointer" }}>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}{d===1?"st":d===2?"nd":d===3?"rd":"th"} of month</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Running total */}
              <div style={{ background: "rgba(123,110,246,0.1)", border: "1px solid rgba(123,110,246,0.25)", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: T.textMid, fontSize: 12, margin: 0 }}>Total subscriptions per month</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>${(totalSubs * 12).toFixed(0)}/yr — money you could be investing</p>
                </div>
                <p style={{ color: T.purple, fontWeight: 900, fontSize: 22, margin: 0 }}>${totalSubs.toFixed(2)}</p>
              </div>

              {totalSubs > 100 && (
                <div style={{ background: `${T.red}0a`, border: `1px solid ${T.red}25`, borderRadius: 9, padding: 11 }}>
                  <p style={{ color: T.red, fontSize: 12, fontWeight: 600, margin: "0 0 3px" }}>Subscription creep alert</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.5 }}>Over $100/mo in subscriptions adds up to ${(totalSubs * 12).toFixed(0)}/yr. Review each one — cancel anything you have not used in the last 30 days.</p>
                </div>
              )}
            </div>
          )}

          {subscriptionsList.length === 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>Tap the services above to add them, or use Custom to add something not listed.</p>
            </div>
          )}
        </div>

        <button onClick={() => goStep(12)} style={{ ...S.primaryBtn(), marginTop: 20 }}>
          {subscriptionsList.length > 0 ? `Continue — ${subscriptionsList.length} subscription${subscriptionsList.length > 1 ? "s" : ""} added` : "Skip — no subscriptions"}
        </button>
      </div>
    );
  }
  const lunchMonthly = lunchHabit && lunchHabit !== "bring" && lunchHabit !== "skip" ? (parseFloat(lunchSpend) || 0) * 22 : 0;
  const vacationMonthly = vacationFreq && vacationFreq !== "never" ? (() => {
    const perTrip = parseFloat(vacationBudget) || 0;
    if (vacationFreq === "yearly") return Math.round(perTrip / 12);
    if (vacationFreq === "twice") return Math.round((perTrip * 2.5) / 12);
    if (vacationFreq === "quarterly") return Math.round((perTrip * 4) / 12);
    if (vacationFreq === "monthly") return perTrip;
    return 0;
  })() : 0;
  const totalFixed = (parseFloat(housingCost) || 0) + (parseFloat(carPayment) || 0) + (parseFloat(fuelCost) || 0) + (parseFloat(transitCost) || 0) + (parseFloat(healthInsurance) || 0) + (parseFloat(carInsurance) || 0) + (parseFloat(phoneBill) || 0) + (parseFloat(utilities) || 0) + (parseFloat(subscriptions) || 0);
  const totalVariable = ((parseFloat(groceries) || 0) * 4.33) + ((parseFloat(diningOut) || 0) * 4.33) + (parseFloat(entertainment) || 0) + (parseFloat(miscSpend) || 0) + (parseFloat(clothingSpend) || 0) + lunchMonthly + vacationMonthly;
  const totalExpenses = totalFixed + totalVariable;
  const mo = monthlyIncome();
  const leftover = mo - totalExpenses;
  const suggestedGoals = Math.round(mo * 0.2);
  const afterGoals = leftover - suggestedGoals;

  const profileData = {
    name, ageRange, income: parseFloat(income), payFreq, extraIncome,
    state, city, housingType, housingCost: parseFloat(housingCost) || 0,
    livingWith, hasDependents, numKids, caregiving,
    vehicleType, carPayment: parseFloat(carPayment) || 0, fuelCost: parseFloat(fuelCost) || 0,
    usesTransit, transitCost: parseFloat(transitCost) || 0,
    healthInsurance: parseFloat(healthInsurance) || 0, carInsurance: parseFloat(carInsurance) || 0,
    phoneBill: parseFloat(phoneBill) || 0, utilities: parseFloat(utilities) || 0,
    subscriptions: parseFloat(subscriptions) || 0,
    groceries: parseFloat(groceries) || 0, diningOut: parseFloat(diningOut) || 0,
    lunchHabit, lunchSpend: parseFloat(lunchSpend) || 0, lunchMonthly,
    clothingFreq, clothingSpend: parseFloat(clothingSpend) || 0,
    miscFreq, miscSpend: parseFloat(miscSpend) || 0,
    entertainment: parseFloat(entertainment) || 0,
    vacationFreq, vacationBudget: parseFloat(vacationBudget) || 0,
    vacationCreditCard, creditCardBalance, vacationMonthly,
    subscriptionsList,
    totalFixed: Math.round(totalFixed), totalVariable: Math.round(totalVariable),
    monthlyIncome: mo,
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 24px 48px", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.15))", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Icon name="check" size={32} color={T.green} strokeWidth={2} />
      </div>
      <h2 style={{ color: T.text, fontSize: 26, fontWeight: 800, textAlign: "center", margin: "0 0 6px", letterSpacing: -0.5 }}>Your Financial Picture</h2>
      <p style={{ color: T.textSub, fontSize: 14, textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>Here is what we calculated for you, {name}.</p>

      <div style={{ ...S.card, marginBottom: 14 }}>
        <SectionLabel>Profile Summary</SectionLabel>
        {[
          { label: "Name", value: `${name}, ${ageRange}` },
          { label: "Location", value: `${city}, ${state}` },
          { label: "Housing", value: housingType === "renting" ? `Renting${housingCost ? ` — $${parseFloat(housingCost).toLocaleString()}/mo` : ""}` : housingType === "mortgage" ? `Mortgage${housingCost ? ` — $${parseFloat(housingCost).toLocaleString()}/mo` : ""}` : housingType.replace("-", " ") },
          { label: "Lives with", value: livingWith.length ? livingWith.join(", ") : "Alone" },
          { label: "Dependents", value: hasDependents === "Yes" ? `${numKids} child${numKids === "1" ? "" : "ren"}${caregiving.filter(c => c !== "No one else").length ? ` + others` : ""}` : "None" },
          { label: "Vehicle", value: vehicleType === "none" ? "No vehicle" : vehicleType === "gas" ? "Gas vehicle" : vehicleType === "electric" ? "Electric (EV)" : "Hybrid" },
          { label: "Subscriptions", value: subscriptionsList.length > 0 ? `${subscriptionsList.length} services — $${subscriptionsList.reduce((a,s) => a+(parseFloat(s.amount)||0), 0).toFixed(2)}/mo` : "None added" },
          { label: "Work lunch", value: lunchHabit === "bring" ? "Brings from home" : lunchHabit === "skip" ? "Skips lunch" : lunchHabit === "buy-cheap" ? "Buys inexpensive" : lunchHabit === "buy-mid" ? "Buys sit-down / delivery" : "Varies" },
          { label: "Travel", value: vacationFreq === "never" ? "Rarely travels" : vacationFreq === "yearly" ? "Once a year" : vacationFreq === "twice" ? "2-3 times a year" : vacationFreq === "quarterly" ? "Every few months" : "Monthly" },
          ...(creditCardBalance && creditCardBalance !== "No balance" ? [{ label: "Credit card debt", value: creditCardBalance }] : []),
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.textSub, fontSize: 12 }}>{r.label}</span>
            <span style={{ color: T.text, fontSize: 12, fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{r.value}</span>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom: 14 }}>
        <SectionLabel>Monthly Budget Breakdown</SectionLabel>
        {[
          { label: "Monthly Income", value: `$${mo.toLocaleString()}`, color: T.green },
          { label: "Fixed Expenses", value: `-$${Math.round(totalFixed).toLocaleString()}`, color: T.red },
          { label: "Variable Spending", value: `-$${Math.round(totalVariable).toLocaleString()}`, color: T.gold },
          ...(lunchMonthly > 0 ? [{ label: `  inc. work lunches`, value: `-$${Math.round(lunchMonthly).toLocaleString()}`, color: T.textSub }] : []),
          ...(vacationMonthly > 0 ? [{ label: `  inc. travel (monthly avg)`, value: `-$${Math.round(vacationMonthly).toLocaleString()}`, color: T.textSub }] : []),
          { label: "Suggested Goal Savings (20%)", value: `-$${suggestedGoals.toLocaleString()}`, color: T.accent },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.textSub, fontSize: r.label.startsWith("  ") ? 11 : 13 }}>{r.label}</span>
            <span style={{ color: r.color, fontSize: r.label.startsWith("  ") ? 11 : 13, fontWeight: 700 }}>{r.value}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
          <span style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>Remaining</span>
          <span style={{ color: afterGoals > 0 ? T.green : T.red, fontSize: 16, fontWeight: 800 }}>${Math.round(afterGoals).toLocaleString()}</span>
        </div>
      </div>

      {afterGoals < 0 && (
        <div style={{ background: `${T.red}0a`, border: `1px solid ${T.red}25`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <p style={{ color: T.red, fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Your expenses exceed your income</p>
          <p style={{ color: T.textSub, fontSize: 12, margin: 0, lineHeight: 1.5 }}>We will help you identify where to cut back and set achievable goals that fit your real situation.</p>
        </div>
      )}

      {lunchHabit && lunchHabit !== "bring" && lunchMonthly > 0 && (
        <div style={{ background: `${T.gold}0a`, border: `1px solid ${T.gold}25`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <p style={{ color: T.gold, fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>Work lunch insight</p>
          <p style={{ color: T.textSub, fontSize: 12, margin: 0, lineHeight: 1.5 }}>You spend <strong style={{ color: T.text }}>${Math.round(lunchMonthly).toLocaleString()}/mo</strong> on work lunches. Packing lunch even 3 days a week could save <strong style={{ color: T.green }}>${Math.round(lunchMonthly * 0.6).toLocaleString()}/mo</strong> — that is ${Math.round(lunchMonthly * 0.6 * 12).toLocaleString()}/yr.</p>
        </div>
      )}

      <button onClick={() => onComplete({ ...profileData, skipGoalCreation: false })} style={{ ...S.primaryBtn(), fontSize: 15, padding: "14px 0", marginBottom: 12 }}>Set My First Goal</button>
      <button onClick={() => onComplete({ ...profileData, skipGoalCreation: true })} style={{ ...S.ghostBtn, fontSize: 14, padding: "13px 0" }}>Skip for now — explore the app first</button>
    </div>
  );
}



// ── Goal Creation ─────────────────────────────────────────────────────────────
const PRESET_CATS = [
  { icon: "shield", name: "Emergency Fund", color: T.green, hint: "3 to 6 months of expenses" },
  { icon: "building", name: "House Down Payment", color: T.accent, hint: "10 to 20% of home price" },
  { icon: "award", name: "Retirement", color: T.purple, hint: "Your future freedom fund" },
  { icon: "wallet", name: "Pay Off Debt", color: T.green, hint: "Own it outright" },
  { icon: "barChart", name: "Become Debt Free", color: T.red, hint: "Cut every liability" },
  { icon: "book", name: "Education Fund", color: T.accent, hint: "Invest in knowledge" },
  { icon: "send", name: "Travel Fund", color: T.gold, hint: "Travel paid in full" },
  { icon: "dollarSign", name: "Big Purchase", color: T.textMid, hint: "Save first, buy once" },
  { icon: "zap", name: "Custom Goal", color: T.text, hint: "Name it yourself" },
];

function GoalCreationFlow({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState(null);
  const [form, setForm] = useState({ name: "", purpose: "", target: "", date: "", useLock: false, lockType: "date", cooldown: "24" });
  const [depositAmt, setDepositAmt] = useState("");
  const [privacy, setPrivacy] = useState({ isPublic: true, showAmount: true, showPercent: true });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const newGoal = cat ? {
    id: Date.now(), name: form.name || cat.name, purpose: form.purpose,
    icon: cat.icon, color: cat.color, saved: parseFloat(depositAmt) || 0,
    target: parseFloat(form.target) || 1000, locked: form.useLock && form.lockType === "date",
    unlockDate: form.lockType === "date" ? form.date : null,
    cooldown: form.lockType === "cooldown" ? parseInt(form.cooldown) : null,
    isPublic: privacy.isPublic, showAmount: privacy.showAmount, showPercent: privacy.showPercent,
  } : null;

  if (step === 0) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 20px 100px", maxWidth: 420, margin: "0 auto" }}>
      <button onClick={onCancel} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
        <Icon name="chevronLeft" size={16} color={T.textSub} />
        <span style={{ fontSize: 13 }}>Back</span>
      </button>
      <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>New Goal</h2>
      <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 20px" }}>Select a category to get started</p>
      <StepDots total={5} current={0} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {PRESET_CATS.map(c => (
          <button key={c.name} onClick={() => {
            setCat(c);
            setForm(f => ({ ...f, name: c.name === "Custom Goal" ? "" : c.name, purpose: SMART_PURPOSES[c.name] || "" }));
            setStep(1);
          }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}18`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={c.icon} size={17} color={c.color} />
            </div>
            <span style={{ color: T.textMid, fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 20px 100px", maxWidth: 420, margin: "0 auto" }}>
      <button onClick={() => setStep(0)} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
        <Icon name="chevronLeft" size={16} color={T.textSub} />
        <span style={{ fontSize: 13 }}>Category</span>
      </button>
      <StepDots total={5} current={1} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={S.label}>Goal name</label>
          <input value={form.name} onChange={e => upd("name", e.target.value)} placeholder={cat?.name} style={S.input} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <label style={S.label}>Your reason — what is this for?</label>
            {form.purpose && SMART_PURPOSES[cat?.name] === form.purpose && (
              <span style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>Auto-filled</span>
            )}
          </div>
          <input value={form.purpose} onChange={e => upd("purpose", e.target.value)} placeholder="e.g. First home for my family" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Target amount ($)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
            <input value={form.target} onChange={e => upd("target", e.target.value)} type="number" placeholder="5000" style={{ ...S.input, paddingLeft: 28 }} />
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: form.useLock ? 14 : 0 }}>
            <div>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>Withdrawal Lock</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Protect against impulse spending</p>
            </div>
            <Toggle value={form.useLock} onChange={v => upd("useLock", v)} />
          </div>
          {form.useLock && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[{ val: "date", label: "Lock until date" }, { val: "cooldown", label: "Cooldown timer" }].map(o => (
                  <button key={o.val} onClick={() => upd("lockType", o.val)} style={{ background: form.lockType === o.val ? T.accentLo : "rgba(255,255,255,0.03)", border: form.lockType === o.val ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 7, padding: "9px 0", cursor: "pointer", color: form.lockType === o.val ? T.accent : T.textSub, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>{o.label}</button>
                ))}
              </div>
              {form.lockType === "date"
                ? <input type="date" value={form.date} onChange={e => upd("date", e.target.value)} style={{ ...S.input, colorScheme: "dark" }} />
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                    {["12h", "24h", "48h", "72h"].map(h => (
                      <button key={h} onClick={() => upd("cooldown", h.replace("h", ""))} style={{ background: form.cooldown === h.replace("h", "") ? T.accentLo : "rgba(255,255,255,0.03)", border: form.cooldown === h.replace("h", "") ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 7, padding: "8px 0", cursor: "pointer", color: form.cooldown === h.replace("h", "") ? T.accent : T.textSub, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',monospace" }}>{h}</button>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>
        <button onClick={() => form.target && setStep(2)} style={{ ...S.primaryBtn(cat?.color), opacity: form.target ? 1 : 0.4, marginTop: 4 }}>Continue</button>
      </div>
    </div>
  );

  if (step === 2) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 20px 40px", maxWidth: 420, margin: "0 auto" }}>
      <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
        <Icon name="chevronLeft" size={16} color={T.textSub} />
        <span style={{ fontSize: 13 }}>Details</span>
      </button>
      <StepDots total={5} current={2} />
      <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Initial Deposit</h2>
      <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 18px" }}>Optional — even $1 makes it real.</p>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${cat?.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={cat?.icon} size={18} color={cat?.color} />
          </div>
          <div>
            <p style={{ color: T.text, fontWeight: 600, fontSize: 14, margin: 0 }}>{form.name || cat?.name}</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Target: ${parseFloat(form.target || 0).toLocaleString()}</p>
          </div>
        </div>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
          <input value={depositAmt} onChange={e => setDepositAmt(e.target.value)} type="number" placeholder="0.00" style={{ ...S.input, paddingLeft: 28, fontSize: 18 }} />
        </div>
        {depositAmt && parseFloat(depositAmt) > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: T.textSub, fontSize: 12 }}>Starting progress</span>
              <span style={{ color: cat?.color, fontSize: 12, fontWeight: 600 }}>{Math.round((parseFloat(depositAmt) / parseFloat(form.target)) * 100)}%</span>
            </div>
            <ProgressBar pct={(parseFloat(depositAmt) / parseFloat(form.target)) * 100} color={cat?.color} height={6} />
          </div>
        )}
      </div>
      <button onClick={() => setStep(3)} style={S.primaryBtn(cat?.color)}>
        {depositAmt && parseFloat(depositAmt) > 0 ? `Deposit $${parseFloat(depositAmt).toLocaleString()} and Continue` : "Skip for Now"}
      </button>
    </div>
  );

  if (step === 3) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 20px 40px", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <StepDots total={5} current={3} />
      <div style={{ width: 56, height: 56, borderRadius: 14, background: T.greenLo, border: `1px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Icon name="check" size={26} color={T.green} />
      </div>
      <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, textAlign: "center", margin: "0 0 8px" }}>Goal Created</h2>
      <p style={{ color: T.textSub, fontSize: 14, textAlign: "center", lineHeight: 1.7, margin: "0 0 22px" }}>Every financial journey starts with a single intentional step.</p>
      <div style={{ ...S.card, width: "100%", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${cat?.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={cat?.icon} size={18} color={cat?.color} />
          </div>
          <div>
            <p style={{ color: T.text, fontWeight: 600, fontSize: 14, margin: 0 }}>{form.name || cat?.name}</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0", fontStyle: "italic" }}>{form.purpose}</p>
          </div>
        </div>
        <ProgressBar pct={depositAmt ? (parseFloat(depositAmt) / parseFloat(form.target)) * 100 : 0} color={cat?.color} height={6} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ color: cat?.color, fontSize: 13, fontWeight: 700 }}>${parseFloat(depositAmt || 0).toLocaleString()}</span>
          <span style={{ color: T.textSub, fontSize: 12 }}>of ${parseFloat(form.target).toLocaleString()}</span>
        </div>
      </div>
      <button onClick={() => setStep(4)} style={{ ...S.primaryBtn(), width: "100%" }}>Configure Sharing</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 20px 40px", maxWidth: 420, margin: "0 auto" }}>
      <StepDots total={5} current={4} />
      <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Sharing Preferences</h2>
      <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 18px", lineHeight: 1.6 }}>Your progress can inspire others — but you are always in control.</p>
      <div style={{ ...S.card, marginBottom: 16 }}>
        {[
          { key: "isPublic", label: "Share on Community Feed", desc: "Others can see your progress", dis: false },
          { key: "showAmount", label: "Show dollar amounts", desc: "Display your actual savings total", dis: !privacy.isPublic },
          { key: "showPercent", label: "Show percentage", desc: "Show progress toward your goal", dis: !privacy.isPublic },
        ].map((row, i, arr) => (
          <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", opacity: row.dis ? 0.35 : 1 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 500, margin: 0 }}>{row.label}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{row.desc}</p>
            </div>
            <Toggle value={privacy[row.key]} onChange={v => !row.dis && setPrivacy(p => ({ ...p, [row.key]: v }))} />
          </div>
        ))}
      </div>
      <button onClick={() => onComplete(newGoal)} style={S.primaryBtn(cat?.color)}>Finish and View Goals</button>
    </div>
  );
}

// ── Goal Data ─────────────────────────────────────────────────────────────────
const INITIAL_GOALS = [
  { id: 1, name: "Emergency Fund", purpose: "3 months of expenses", icon: "shield", color: T.green, saved: 1200, target: 5000, locked: true, unlockDate: null, cooldown: 48, isPublic: true, showAmount: true, showPercent: true },
  { id: 2, name: "House Down Payment", purpose: "First home for my family", icon: "building", color: T.accent, saved: 8400, target: 40000, locked: true, unlockDate: "2027-01-01", cooldown: null, isPublic: true, showAmount: false, showPercent: true },
  { id: 3, name: "Retirement Fund", purpose: "Financial independence by 55", icon: "award", color: T.purple, saved: 3200, target: 100000, locked: true, unlockDate: "2055-01-01", cooldown: null, isPublic: false, showAmount: false, showPercent: true },
  { id: 4, name: "Pay Off Car", purpose: "Own my vehicle outright", icon: "wallet", color: T.green, saved: 2100, target: 6800, locked: false, unlockDate: null, cooldown: 24, isPublic: true, showAmount: true, showPercent: true },
];

// ── Community Feed ────────────────────────────────────────────────────────────
const EMOJIS = ["🔥", "💪", "❤️", "🙌", "⭐"];
const BADGES = ["You have got this!", "Inspiring!", "Keep going!", "Legend status!", "Amazing work!"];

const FEED = [
  { id: 101, user: "Marcus T.", initials: "MT", userColor: T.gold, goalName: "Emergency Fund", purpose: "Safety net for my family", icon: "shield", color: T.green, pct: 80, amount: 4000, target: 5000, showAmount: true, event: "deposit", eventAmt: 200, time: "2m ago", reactions: { "🔥": 12, "💪": 8, "❤️": 3 }, badges: ["Inspiring!", "You have got this!"] },
  { id: 102, user: "Priya K.", initials: "PK", userColor: T.purple, goalName: "Debt Free", purpose: "Paying off student loans", icon: "barChart", color: T.red, pct: 100, amount: 18000, target: 18000, showAmount: false, event: "completed", eventAmt: null, time: "18m ago", reactions: { "🔥": 47, "💪": 31, "❤️": 22, "🙌": 19 }, badges: ["Legend status!", "Inspiring!"] },
  { id: 103, user: "Devon R.", initials: "DR", userColor: T.green, goalName: "House Down Payment", purpose: "Buying my first home", icon: "building", color: T.accent, pct: 50, amount: null, target: null, showAmount: false, event: "milestone", eventAmt: null, time: "45m ago", reactions: { "🔥": 9, "💪": 14 }, badges: ["Keep going!"] },
  { id: 104, user: "James O.", initials: "JO", userColor: T.accent, goalName: "Pay Off Car", purpose: "Never a car payment again", icon: "wallet", color: T.green, pct: 67, amount: 4556, target: 6800, showAmount: true, event: "deposit", eventAmt: 450, time: "2h ago", reactions: { "🔥": 5, "🙌": 3 }, badges: ["You have got this!"] },
];

function FeedCard({ item }) {
  const [reactions, setReactions] = useState(item.reactions);
  const [myReaction, setMyReaction] = useState(null);
  const [badges, setBadges] = useState(item.badges);
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [myBadge, setMyBadge] = useState(null);

  const handleReact = (emoji) => {
    const u = { ...reactions };
    if (myReaction === emoji) { u[emoji] = Math.max(0, (u[emoji] || 1) - 1); if (!u[emoji]) delete u[emoji]; setMyReaction(null); }
    else { if (myReaction) { u[myReaction] = Math.max(0, (u[myReaction] || 1) - 1); if (!u[myReaction]) delete u[myReaction]; } u[emoji] = (u[emoji] || 0) + 1; setMyReaction(emoji); }
    setReactions(u);
  };

  const evtInfo = { deposit: { label: `Added $${item.eventAmt?.toLocaleString()} to goal`, color: T.green }, completed: { label: "Completed their goal", color: T.gold }, milestone: { label: "Reached 50% milestone", color: T.purple }, joined: { label: "Started their journey", color: T.accent } }[item.event];

  return (
    <div style={{ background: item.event === "completed" ? `linear-gradient(135deg, ${T.gold}0a, ${T.card})` : T.card, border: item.event === "completed" ? `1px solid ${T.gold}30` : `1px solid ${T.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
      {item.event === "completed" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.gold}, ${T.gold}50)` }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${item.userColor}22`, border: `1px solid ${item.userColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: item.userColor, flexShrink: 0 }}>{item.initials}</div>
          <div>
            <p style={{ color: T.text, fontWeight: 600, fontSize: 13, margin: 0 }}>{item.user}</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{item.time}</p>
          </div>
        </div>
        <span style={{ ...S.tag(item.color) }}>{item.goalName}</span>
      </div>
      <p style={{ color: T.textMid, fontSize: 12, margin: 0, fontStyle: "italic" }}>&ldquo;{item.purpose}&rdquo;</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: evtInfo.color, flexShrink: 0 }} />
        <span style={{ color: evtInfo.color, fontSize: 12, fontWeight: 600 }}>{evtInfo.label}</span>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: T.textSub, fontSize: 11 }}>Progress</span>
          <div style={{ display: "flex", gap: 8 }}>
            {item.showAmount && item.amount && <span style={{ color: item.color, fontSize: 11, fontWeight: 600 }}>${item.amount.toLocaleString()}{item.target ? ` / $${item.target.toLocaleString()}` : ""}</span>}
            <span style={{ color: T.textMid, fontSize: 11, fontWeight: 700 }}>{item.pct}%</span>
          </div>
        </div>
        <ProgressBar pct={item.pct} color={item.event === "completed" ? T.gold : item.color} height={5} />
      </div>
      {badges.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{badges.map((b, i) => <span key={i} style={{ ...S.tag(T.purple) }}>{b}</span>)}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", gap: 4 }}>
          {EMOJIS.map(e => {
            const c = reactions[e] || 0;
            const active = myReaction === e;
            return (
              <button key={e} onClick={() => handleReact(e)} style={{ background: active ? `${T.accent}18` : "rgba(255,255,255,0.04)", border: active ? `1px solid ${T.accent}40` : `1px solid ${T.border}`, borderRadius: 99, padding: "3px 7px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 12 }}>{e}</span>
                {c > 0 && <span style={{ color: active ? T.accent : T.textSub, fontSize: 10 }}>{c}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => !myBadge && setShowBadgePicker(p => !p)} style={{ background: myBadge ? `${T.purple}15` : "rgba(255,255,255,0.04)", border: myBadge ? `1px solid ${T.purple}40` : `1px solid ${T.border}`, borderRadius: 99, padding: "4px 10px", cursor: myBadge ? "default" : "pointer", color: myBadge ? T.purple : T.textSub, fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap" }}>
            {myBadge ? `Sent: ${myBadge}` : "Encourage"}
          </button>
          {showBadgePicker && (
            <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, background: "#1E293B", border: `1px solid ${T.borderHi}`, borderRadius: 10, padding: 8, zIndex: 50, minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 6px 8px", textTransform: "uppercase", letterSpacing: 1 }}>Send anonymously</p>
              {BADGES.map(b => (
                <button key={b} onClick={() => { if (!myBadge) { setBadges(p => p.includes(b) ? p : [...p, b]); setMyBadge(b); } setShowBadgePicker(false); }} style={{ display: "block", width: "100%", background: "none", border: "none", color: T.textMid, padding: "7px 10px", cursor: "pointer", textAlign: "left", fontSize: 13, fontFamily: "'Inter',sans-serif", borderRadius: 7 }}>{b}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Privacy Modal ─────────────────────────────────────────────────────────────
function PrivacyModal({ goal, onClose, onSave }) {
  const [isPublic, setIsPublic] = useState(goal.isPublic);
  const [showAmount, setShowAmount] = useState(goal.showAmount);
  const [showPercent, setShowPercent] = useState(goal.showPercent);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "18px 18px 0 0", padding: 24, width: "100%", maxWidth: 420, border: `1px solid ${T.borderHi}`, borderBottom: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${goal.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={goal.icon} size={17} color={goal.color} />
          </div>
          <div>
            <h3 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>Sharing Settings</h3>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{goal.name}</p>
          </div>
        </div>
        {[
          { label: "Share on Community Feed", desc: "Others can see your progress", val: isPublic, set: setIsPublic, dis: false },
          { label: "Show dollar amounts", desc: "Display actual savings total", val: showAmount, set: setShowAmount, dis: !isPublic },
          { label: "Show percentage", desc: "Show how close to your goal", val: showPercent, set: setShowPercent, dis: !isPublic },
        ].map((row, i, a) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < a.length - 1 ? `1px solid ${T.border}` : "none", opacity: row.dis ? 0.35 : 1 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 500, margin: 0 }}>{row.label}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{row.desc}</p>
            </div>
            <Toggle value={row.val} onChange={v => !row.dis && row.set(v)} />
          </div>
        ))}
        <button onClick={() => onSave({ isPublic, showAmount, showPercent })} style={{ ...S.primaryBtn(), marginTop: 18 }}>Save</button>
      </div>
    </div>
  );
}

// ── Goal Breakdown ────────────────────────────────────────────────────────────
function GoalBreakdown({ goal }) {
  const remaining = Math.max(0, goal.target - goal.saved);
  const hasDate = !!goal.unlockDate;
  let daysLeft = null, weeksLeft = null, monthsLeft = null;
  if (hasDate) {
    daysLeft = Math.max(1, Math.ceil((new Date(goal.unlockDate) - new Date()) / 86400000));
    weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
    monthsLeft = Math.max(1, Math.ceil(daysLeft / 30.44));
  }
  const daily = hasDate ? (remaining / daysLeft).toFixed(2) : null;
  const weekly = hasDate ? (remaining / weeksLeft).toFixed(2) : null;
  const monthly = hasDate ? (remaining / monthsLeft).toFixed(2) : null;
  let suggested = null;
  if (hasDate) suggested = parseFloat(daily) < 5 ? "daily" : parseFloat(weekly) < 50 ? "weekly" : "monthly";

  return (
    <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ color: T.text, fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: 0.5, textTransform: "uppercase" }}>Savings Plan</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <p style={{ color: T.textSub, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Still Needed</p>
            <InfoTip text="Your target minus what you have saved so far." />
          </div>
          <p style={{ color: goal.color, fontWeight: 700, fontSize: 15, margin: 0 }}>${Number(remaining).toLocaleString()}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <p style={{ color: T.textSub, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Time Left</p>
            <InfoTip text="Days until your target date. The sooner you start, the smaller each deposit." />
          </div>
          {hasDate ? <p style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>{monthsLeft} mo</p> : <p style={{ color: T.textSub, fontSize: 12, margin: 0, fontStyle: "italic" }}>No date set</p>}
        </div>
      </div>
      {hasDate ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[{ label: "Daily", value: daily }, { label: "Weekly", value: weekly }, { label: "Monthly", value: monthly }].map(row => {
            const isSug = suggested === row.label.toLowerCase();
            return (
              <div key={row.label} style={{ background: isSug ? `${goal.color}10` : "rgba(255,255,255,0.02)", border: isSug ? `1px solid ${goal.color}35` : `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: isSug ? goal.color : T.textSub, fontSize: 12, fontWeight: isSug ? 700 : 400 }}>{row.label}</span>
                  {isSug && <span style={{ ...S.tag(goal.color), fontSize: 10 }}>Suggested</span>}
                </div>
                <span style={{ color: isSug ? goal.color : T.text, fontWeight: 700, fontSize: 14 }}>${parseFloat(row.value).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: `${T.gold}0a`, border: `1px solid ${T.gold}25`, borderRadius: 8, padding: 12 }}>
          <p style={{ color: T.gold, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Add a target date to unlock your plan</p>
          <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.5 }}>Once you set a deadline, we will calculate exactly how much to save daily, weekly, and monthly.</p>
        </div>
      )}
    </div>
  );
}

// ── Edit Goal Modal ───────────────────────────────────────────────────────────
function EditGoalModal({ goal, onClose, onSave, onDelete }) {
  const [name,       setName]       = useState(goal.name);
  const [purpose,    setPurpose]    = useState(goal.purpose);
  const [target,     setTarget]     = useState(String(goal.target));
  const [date,       setDate]       = useState(goal.unlockDate || "");
  const [useLock,    setUseLock]    = useState(!!goal.locked || !!goal.cooldown);
  const [lockType,   setLockType]   = useState(goal.unlockDate ? "date" : "cooldown");
  const [cooldown,   setCooldown]   = useState(String(goal.cooldown || 24));
  const [confirmDel, setConfirmDel] = useState(false);
  const [tab,        setTabInner]   = useState("details"); // details | lock | danger

  const hasChanges =
    name !== goal.name ||
    purpose !== goal.purpose ||
    parseFloat(target) !== goal.target ||
    date !== (goal.unlockDate || "");

  const pct = Math.round((goal.saved / (parseFloat(target) || goal.target)) * 100);
  const remaining = Math.max(0, (parseFloat(target) || goal.target) - goal.saved);

  const TABS_INNER = [
    { id: "details", label: "Details", icon: "target" },
    { id: "lock",    label: "Lock",    icon: "lock"   },
    { id: "danger",  label: "Danger",  icon: "x"      },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 420, border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(123,110,246,0.4)" }}>
              <Icon name={goal.icon} size={20} color="#fff" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: T.textMid, fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", margin: 0 }}>Editing Goal</p>
              <p style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: "2px 0 0" }}>{goal.name}</p>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="x" size={16} color={T.textSub} />
            </button>
          </div>

          {/* Mini progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: T.textSub, fontSize: 11 }}>Saved: <strong style={{ color: T.green }}>${goal.saved.toLocaleString()}</strong></span>
              <span style={{ color: T.textSub, fontSize: 11 }}>Target: <strong style={{ color: T.text }}>${(parseFloat(target) || goal.target).toLocaleString()}</strong></span>
              <span style={{ color: T.purple, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color={T.purple} height={5} />
          </div>

          {/* Inner tab bar */}
          <div style={{ display: "flex", gap: 4, marginBottom: -1 }}>
            {TABS_INNER.map(t => (
              <button key={t.id} onClick={() => setTabInner(t.id)} style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${t.id === "danger" ? T.red : T.purple}` : "2px solid transparent", padding: "8px 0 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: tab === t.id ? (t.id === "danger" ? T.red : T.purple) : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: tab === t.id ? 700 : 400, fontSize: 12, transition: "all 0.2s" }}>
                <Icon name={t.icon} size={12} color={tab === t.id ? (t.id === "danger" ? T.red : T.purple) : T.textSub} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>

          {/* ── Details tab ── */}
          {tab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={S.label}>Goal name</label>
                <input value={name} onChange={e => setName(e.target.value)} style={S.input} placeholder="e.g. Emergency Fund" />
              </div>
              <div>
                <label style={S.label}>Your reason — why this matters</label>
                <input value={purpose} onChange={e => setPurpose(e.target.value)} style={S.input} placeholder="e.g. 6 months of safety for my family" />
                <p style={{ color: T.textSub, fontSize: 11, margin: "5px 0 0" }}>This shows on your goal card as your motivation anchor.</p>
              </div>
              <div>
                <label style={S.label}>Target amount ($)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
                  <input value={target} onChange={e => setTarget(e.target.value)} type="number" style={{ ...S.input, paddingLeft: 28, fontSize: 18, fontWeight: 700 }} placeholder="0" />
                </div>
                {target && parseFloat(target) !== goal.target && (
                  <div style={{ background: "rgba(123,110,246,0.1)", border: "1px solid rgba(123,110,246,0.25)", borderRadius: 9, padding: 11, marginTop: 10 }}>
                    <p style={{ color: T.purple, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                      {parseFloat(target) > goal.target
                        ? `Increasing by $${(parseFloat(target) - goal.target).toLocaleString()}. New amount still needed: $${Math.max(0, parseFloat(target) - goal.saved).toLocaleString()}.`
                        : `Decreasing by $${(goal.target - parseFloat(target)).toLocaleString()}.${goal.saved > parseFloat(target) ? " You have already saved more than this new target — goal will be marked complete!" : ""}`
                      }
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label style={S.label}>Target date (optional)</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.input, colorScheme: "dark" }} />
                {date && remaining > 0 && (
                  <div style={{ background: "rgba(29,217,160,0.08)", border: "1px solid rgba(29,217,160,0.2)", borderRadius: 9, padding: 11, marginTop: 10 }}>
                    {(() => {
                      const days = Math.max(1, Math.ceil((new Date(date) - new Date()) / 86400000));
                      const monthly = Math.round(remaining / (days / 30.44));
                      const weekly  = Math.round(remaining / (days / 7));
                      const daily   = (remaining / days).toFixed(2);
                      return (
                        <div>
                          <p style={{ color: T.green, fontSize: 12, fontWeight: 700, margin: "0 0 6px" }}>To hit ${parseFloat(target).toLocaleString()} by {new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}:</p>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                            {[{ label: "Daily", value: `$${daily}` }, { label: "Weekly", value: `$${weekly}` }, { label: "Monthly", value: `$${monthly}` }].map(r => (
                              <div key={r.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                                <p style={{ color: T.green, fontWeight: 700, fontSize: 13, margin: 0 }}>{r.value}</p>
                                <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>{r.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Lock tab ── */}
          {tab === "lock" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "rgba(123,110,246,0.08)", border: "1px solid rgba(123,110,246,0.2)", borderRadius: 12, padding: 14 }}>
                <p style={{ color: T.purple, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>Why use a lock?</p>
                <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.6 }}>Withdrawal locks protect you from impulse decisions. Set a date lock to hold until a specific date, or a cooldown that forces a waiting period before any withdrawal clears.</p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 15px" }}>
                <div>
                  <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: 0 }}>Enable withdrawal lock</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Protects against impulse spending</p>
                </div>
                <Toggle value={useLock} onChange={setUseLock} />
              </div>

              {useLock && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[{ val: "date", label: "Lock until date", icon: "calendar" }, { val: "cooldown", label: "Cooldown timer", icon: "clock" }].map(o => (
                      <button key={o.val} onClick={() => setLockType(o.val)} style={{ background: lockType === o.val ? "rgba(123,110,246,0.12)" : "rgba(255,255,255,0.03)", border: lockType === o.val ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <Icon name={o.icon} size={18} color={lockType === o.val ? T.purple : T.textSub} />
                        <span style={{ color: lockType === o.val ? T.purple : T.textMid, fontSize: 12, fontWeight: lockType === o.val ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{o.label}</span>
                      </button>
                    ))}
                  </div>

                  {lockType === "date" ? (
                    <div>
                      <label style={S.label}>Lock until this date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...S.input, colorScheme: "dark" }} />
                      {date && <p style={{ color: T.purple, fontSize: 12, margin: "8px 0 0" }}>Funds cannot be withdrawn until {new Date(date).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}.</p>}
                    </div>
                  ) : (
                    <div>
                      <label style={S.label}>Cooldown period before withdrawal clears</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                        {["12", "24", "48", "72"].map(h => (
                          <button key={h} onClick={() => setCooldown(h)} style={{ background: cooldown === h ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.03)", border: cooldown === h ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "9px 0", cursor: "pointer", color: cooldown === h ? T.purple : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13 }}>{h}hr</button>
                        ))}
                      </div>
                      <p style={{ color: T.textSub, fontSize: 11, margin: "8px 0 0", lineHeight: 1.5 }}>A withdrawal request will wait {cooldown} hours before processing — giving you time to reconsider.</p>
                    </div>
                  )}
                </>
              )}

              {!useLock && (
                <div style={{ background: "rgba(255,90,110,0.08)", border: "1px solid rgba(255,90,110,0.2)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: T.red, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Without a lock, you can withdraw from this goal at any time. Locks significantly improve goal completion rates.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Danger tab ── */}
          {tab === "danger" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "rgba(255,90,110,0.06)", border: "1px solid rgba(255,90,110,0.15)", borderRadius: 12, padding: 14 }}>
                <p style={{ color: T.red, fontSize: 13, fontWeight: 700, margin: "0 0 5px" }}>Danger Zone</p>
                <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.6 }}>These actions are permanent and cannot be undone. Your saved funds will be returned to your available balance.</p>
              </div>

              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} style={{ background: "rgba(255,90,110,0.08)", border: "1px solid rgba(255,90,110,0.25)", borderRadius: 12, padding: "14px 0", cursor: "pointer", color: T.red, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="x" size={16} color={T.red} />
                  Delete This Goal
                </button>
              ) : (
                <div style={{ background: "rgba(255,90,110,0.1)", border: "1px solid rgba(255,90,110,0.35)", borderRadius: 12, padding: 18 }}>
                  <p style={{ color: T.red, fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>Are you sure?</p>
                  <p style={{ color: T.textMid, fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>Deleting <strong style={{ color: T.text }}>{goal.name}</strong> is permanent. Your ${goal.saved.toLocaleString()} in savings will be released.</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setConfirmDel(false)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 0", cursor: "pointer", color: T.textMid, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13 }}>Cancel</button>
                    <button onClick={() => onDelete(goal.id)} style={{ flex: 1, background: T.red, border: "none", borderRadius: 10, padding: "11px 0", cursor: "pointer", color: "#fff", fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, boxShadow: "0 4px 16px rgba(255,90,110,0.4)" }}>Yes, Delete</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer save button */}
        {tab !== "danger" && (
          <div style={{ padding: "14px 20px 32px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => {
              onSave({
                ...goal,
                name: name.trim() || goal.name,
                purpose: purpose.trim() || goal.purpose,
                target: parseFloat(target) || goal.target,
                unlockDate: lockType === "date" && useLock ? date : null,
                locked: lockType === "date" && useLock && !!date,
                cooldown: lockType === "cooldown" && useLock ? parseInt(cooldown) : null,
              });
            }} style={{ ...S.primaryBtn(), opacity: hasChanges || tab === "lock" ? 1 : 0.5 }}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
const GOAL_GRADIENTS = [
  "linear-gradient(135deg, #4FACFE 0%, #7B6EF6 100%)",
  "linear-gradient(135deg, #7B6EF6 0%, #B06BFF 100%)",
  "linear-gradient(135deg, #FF7849 0%, #FF4FA1 100%)",
  "linear-gradient(135deg, #1DD9A0 0%, #4FACFE 100%)",
  "linear-gradient(135deg, #F5A623 0%, #FF7849 100%)",
];

function GoalCard({ goal, onDeposit, onWithdraw, onPrivacy, onEdit, idx = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((goal.saved / goal.target) * 100);
  const cardGrad = GOAL_GRADIENTS[idx % GOAL_GRADIENTS.length];

  return (
    <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", marginBottom: 2 }}>
      {/* Vivid gradient header */}
      <div style={{ background: cardGrad, padding: "18px 18px 20px", position: "relative", overflow: "hidden" }}>
        {/* Decorative circle */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={goal.icon} size={18} color="#fff" strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, margin: 0, letterSpacing: 0.8, textTransform: "uppercase" }}>{goal.purpose}</p>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: "2px 0 0" }}>{goal.name}</p>
            </div>
          </div>
          <button onClick={() => onPrivacy(goal)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name={goal.isPublic ? "globe" : "lock"} size={11} color="#fff" />
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{goal.isPublic ? "Public" : "Private"}</span>
          </button>
        </div>

        {/* Big savings number */}
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 28, margin: "0 0 4px", letterSpacing: -1, position: "relative" }}>${goal.saved.toLocaleString()}</p>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "0 0 14px", position: "relative" }}>of ${goal.target.toLocaleString()} goal &middot; {pct}%</p>

        {/* Progress bar on gradient */}
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 5, overflow: "hidden", position: "relative" }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "#fff", borderRadius: 99, boxShadow: "0 0 8px rgba(255,255,255,0.8)" }} />
        </div>
      </div>

      {/* Dark action footer */}
      <div style={{ background: T.card, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 20px 20px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDeposit(goal)} style={{ flex: 2, background: GRAD.purple, color: "#fff", border: "none", borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", boxShadow: "0 4px 14px rgba(123,110,246,0.4)" }}>Add Funds</button>
          <button onClick={() => onWithdraw(goal)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: T.textMid, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 0", fontWeight: 500, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Withdraw</button>
          <button onClick={() => onEdit(goal)} style={{ background: "rgba(123,110,246,0.12)", border: "1px solid rgba(123,110,246,0.25)", borderRadius: 10, padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="edit" size={14} color={T.purple} />
          </button>
          <button onClick={() => setExpanded(e => !e)} style={{ background: expanded ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.05)", border: expanded ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={expanded ? "chevronUp" : "barChart"} size={14} color={expanded ? T.purple : T.textSub} />
          </button>
        </div>
        {expanded && <GoalBreakdown goal={goal} />}
      </div>
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────
function WithdrawModal({ goal, onClose }) {
  const [step, setStep] = useState("warn");
  if (!goal) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "18px 18px 0 0", padding: 24, width: "100%", maxWidth: 420, border: `1px solid ${T.borderHi}`, borderBottom: "none" }}>
        {step === "warn" && (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: T.redLo, border: `1px solid ${T.red}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon name="lock" size={20} color={T.red} />
            </div>
            <h3 style={{ color: T.text, textAlign: "center", marginBottom: 8, fontSize: 17, fontWeight: 700 }}>Confirm Withdrawal</h3>
            <p style={{ color: T.textMid, fontSize: 13, textAlign: "center", lineHeight: 1.6, marginBottom: 18 }}>
              {goal.locked ? "This goal is date-locked. Early withdrawal undermines your long-term commitment." : `A ${goal.cooldown}-hour cooldown protects you from impulse decisions.`}
            </p>
            <div style={{ background: `${T.gold}0a`, border: `1px solid ${T.gold}25`, borderRadius: 8, padding: 12, marginBottom: 18 }}>
              <p style={{ color: T.gold, fontSize: 12, margin: 0, lineHeight: 1.6 }}>Every dollar withdrawn today is a step back from your goal. Is this withdrawal truly necessary?</p>
            </div>
            {goal.locked
              ? <button onClick={onClose} style={S.primaryBtn()}>Keep My Commitment</button>
              : <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={onClose} style={{ ...S.primaryBtn(), flex: 2 }}>Stay the Course</button>
                  <button onClick={() => setStep("amount")} style={{ ...S.ghostBtn, flex: 1 }}>Proceed</button>
                </div>
            }
          </>
        )}
        {step === "amount" && (
          <>
            <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Withdraw from {goal.name}</h3>
            <input type="number" placeholder="Amount ($)" style={{ ...S.input, marginBottom: 14 }} />
            <button onClick={() => setStep("confirm")} style={S.primaryBtn(T.red)}>Start {goal.cooldown}hr Cooldown</button>
          </>
        )}
        {step === "confirm" && (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: T.accentLo, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon name="clock" size={20} color={T.accent} />
            </div>
            <h3 style={{ color: T.text, textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Cooldown Active</h3>
            <p style={{ color: T.textMid, fontSize: 13, textAlign: "center", lineHeight: 1.6, marginBottom: 18 }}>Your {goal.cooldown}-hour timer has started. Use this time to reconsider.</p>
            <button onClick={onClose} style={S.primaryBtn()}>Understood</button>
          </>
        )}
      </div>
    </div>
  );
}

function DepositModal({ goal, onClose }) {
  const [amount, setAmount] = useState("");
  const [autoDeposit, setAutoDeposit] = useState(false);
  const [autoFreq, setAutoFreq] = useState("weekly");
  const [autoDay, setAutoDay] = useState("Monday");
  if (!goal) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "18px 18px 0 0", padding: 24, width: "100%", maxWidth: 420, border: `1px solid ${T.borderHi}`, borderBottom: "none", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: `${goal.color}15`, border: `1px solid ${goal.color}35`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Icon name={goal.icon} size={20} color={goal.color} />
        </div>
        <h3 style={{ color: T.text, textAlign: "center", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Add to {goal.name}</h3>
        <p style={{ color: T.textSub, fontSize: 12, textAlign: "center", marginBottom: 18 }}>Current: <span style={{ color: goal.color, fontWeight: 600 }}>${goal.saved.toLocaleString()}</span></p>
        <label style={S.label}>Amount ($)</label>
        <div style={{ position: "relative", marginBottom: 18 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" style={{ ...S.input, paddingLeft: 28, fontSize: 17 }} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: autoDeposit ? 14 : 0 }}>
            <div>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>Auto-Deposit</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Recurring transfers — no manual effort</p>
            </div>
            <Toggle value={autoDeposit} onChange={setAutoDeposit} />
          </div>
          {autoDeposit && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {["daily", "weekly", "biweekly", "monthly"].map(f => (
                  <button key={f} onClick={() => setAutoFreq(f)} style={{ background: autoFreq === f ? T.accentLo : "rgba(255,255,255,0.03)", border: autoFreq === f ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 7, padding: "7px 0", cursor: "pointer", color: autoFreq === f ? T.accent : T.textSub, fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif", textTransform: "capitalize" }}>{f}</button>
                ))}
              </div>
              {(autoFreq === "weekly" || autoFreq === "biweekly") && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <button key={d} onClick={() => setAutoDay(d)} style={{ background: autoDay === d ? T.accentLo : "rgba(255,255,255,0.03)", border: autoDay === d ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 6, padding: "5px 9px", cursor: "pointer", color: autoDay === d ? T.accent : T.textSub, fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>{d}</button>
                  ))}
                </div>
              )}
              {amount && (
                <div style={{ background: T.accentLo, border: `1px solid ${T.accent}25`, borderRadius: 8, padding: 10 }}>
                  <p style={{ color: T.accent, fontSize: 12, margin: 0 }}>${amount} will transfer automatically {autoFreq}{autoFreq === "weekly" || autoFreq === "biweekly" ? ` every ${autoDay}` : ""}. Cancel anytime.</p>
                </div>
              )}
            </div>
          )}
        </div>
        {goal.isPublic && <div style={{ background: T.accentLo, border: `1px solid ${T.accent}30`, borderRadius: 8, padding: 10, marginBottom: 14 }}><p style={{ color: T.accent, fontSize: 12, margin: 0 }}>This deposit will appear on the Community Feed.</p></div>}
        <button onClick={onClose} style={S.primaryBtn(goal.color)}>
          {autoDeposit && amount ? `Set Up $${amount} Auto-Deposit` : "Confirm Deposit"}
        </button>
      </div>
    </div>
  );
}

// ── Investment Chart ───────────────────────────────────────────────────────────
function InvestChart({ inv }) {
  const [range, setRange] = useState("1M");
  const [hoverIdx, setHoverIdx] = useState(null);
  const ranges = ["1D", "1W", "1M", "6M", "YTD", "1Y", "All"];

  const data = useMemo(() => {
    const pts = { "1D": 48, "1W": 56, "1M": 60, "6M": 72, "YTD": 80, "1Y": 90, "All": 120 }[range];
    const vol = { "1D": 0.3, "1W": 0.8, "1M": 1.5, "6M": 3, "YTD": 4, "1Y": 5, "All": 8 }[range];
    const trend = inv.changePct >= 0 ? 1 : -1;
    let val = inv.price * (range === "All" ? 0.4 : 0.85);
    return Array.from({ length: pts }, () => {
      val += (Math.random() - 0.46) * vol + trend * inv.price * 0.001;
      return Math.max(val, inv.price * 0.3);
    });
  }, [range, inv.id]);

  const dates = useMemo(() => {
    const now = new Date();
    const mins = { "1D": 30, "1W": 180, "1M": 720, "6M": 4320, "YTD": 5040, "1Y": 10080, "All": 43200 }[range];
    return data.map((_, i) => {
      const d = new Date(now.getTime() - (data.length - 1 - i) * mins * 60000);
      return range === "1D" ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" });
    });
  }, [range, data]);

  const min = Math.min(...data), max = Math.max(...data);
  const norm = data.map(v => (v - min) / (max - min || 1));
  const W = 360, H = 120;
  const pts = norm.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v * (H - 12) + 6)}`).join(" ");

  const idx = hoverIdx !== null ? hoverIdx : data.length - 1;
  const activeVal = data[idx];
  const isPos = activeVal >= data[0];
  const lc = isPos ? T.green : T.red;
  const changePct = ((activeVal - data[0]) / data[0] * 100).toFixed(2);
  const changeAbs = (activeVal - data[0]).toFixed(2);

  const hx = idx !== null ? (idx / (data.length - 1)) * W : null;
  const hy = idx !== null ? H - (norm[idx] * (H - 12) + 6) : null;

  const handleMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0]?.clientX) || 0) - rect.left;
    const i = Math.round((x / rect.width) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <p style={{ color: T.text, fontWeight: 700, fontSize: 26, margin: 0 }}>${activeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
          <Icon name={isPos ? "arrowUp" : "arrowDown"} size={12} color={isPos ? T.green : T.red} />
          <span style={{ color: isPos ? T.green : T.red, fontSize: 12, fontWeight: 600 }}>${Math.abs(parseFloat(changeAbs)).toFixed(2)} ({isPos ? "+" : ""}{changePct}%)</span>
          <span style={{ color: T.textSub, fontSize: 11 }}>{range}</span>
          {hoverIdx !== null && <span style={{ color: T.textSub, fontSize: 11 }}>{dates[hoverIdx]}</span>}
        </div>
        {hoverIdx !== null && <p style={{ color: T.textSub, fontSize: 10, margin: "3px 0 0" }}>Drag to explore chart</p>}
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ cursor: "crosshair", touchAction: "none", display: "block" }}
        onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={handleMove} onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`g-${inv.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lc} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lc} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#g-${inv.id})`} />
        <polyline points={pts} fill="none" stroke={lc} strokeWidth="1.8" />
        {hoverIdx !== null && (
          <>
            <line x1={hx} y1={0} x2={hx} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={hx} cy={hy} r={4} fill={lc} stroke={T.bg} strokeWidth={2} />
          </>
        )}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {ranges.map(r => (
          <button key={r} onClick={() => { setRange(r); setHoverIdx(null); }} style={{ background: range === r ? T.accentLo : "none", border: range === r ? `1px solid ${T.accent}50` : "1px solid transparent", borderRadius: 6, padding: "4px 7px", cursor: "pointer", color: range === r ? T.accent : T.textSub, fontSize: 11, fontWeight: range === r ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{r}</button>
        ))}
      </div>
    </div>
  );
}

// ── Investments ───────────────────────────────────────────────────────────────
const INVESTMENTS = [
  { id: "sp500", name: "S&P 500 Index", ticker: "VOO", type: "etf", cats: ["etf", "longterm", "lowrisk"], price: 512.40, changePct: 0.24, color: T.green, icon: "package", risk: "Low", horizon: "Long-Term", avgReturn: "10.5%/yr", lock: "5 years", desc: "Tracks the 500 largest US companies. The gold standard of passive investing." },
  { id: "vti", name: "Total Market", ticker: "VTI", type: "etf", cats: ["etf", "longterm", "lowrisk"], price: 248.10, changePct: 0.36, color: T.accent, icon: "pieChart", risk: "Low", horizon: "Long-Term", avgReturn: "10.2%/yr", lock: "5 years", desc: "Captures the entire US stock market — over 3,500 companies in one fund." },
  { id: "qqq", name: "Nasdaq 100", ticker: "QQQ", type: "etf", cats: ["etf", "longterm", "highrisk"], price: 438.60, changePct: 0.72, color: T.purple, icon: "trendUp", risk: "Medium", horizon: "Long-Term", avgReturn: "13.1%/yr", lock: "5 years", desc: "Top 100 Nasdaq companies. Tech-heavy with strong historical returns." },
  { id: "aapl", name: "Apple Inc.", ticker: "AAPL", type: "stock", cats: ["stocks", "longterm"], price: 213.50, changePct: 0.99, color: T.textMid, icon: "building", risk: "Medium", horizon: "Long-Term", avgReturn: "~15%/yr", lock: "2 years", desc: "Consumer electronics, software, and services giant. Consistent long-term performer." },
  { id: "msft", name: "Microsoft", ticker: "MSFT", type: "stock", cats: ["stocks", "longterm"], price: 415.20, changePct: 1.05, color: T.accent, icon: "building", risk: "Medium", horizon: "Long-Term", avgReturn: "~18%/yr", lock: "2 years", desc: "Cloud computing and AI leader. One of the most stable large-cap tech stocks." },
  { id: "nvda", name: "Nvidia", ticker: "NVDA", type: "stock", cats: ["stocks", "highrisk"], price: 875.40, changePct: 2.59, color: T.green, icon: "zap", risk: "High", horizon: "Medium", avgReturn: "~40%/yr*", lock: "1 year", desc: "AI chip leader. High reward potential with significant price volatility." },
  { id: "btc", name: "Bitcoin", ticker: "BTC", type: "crypto", cats: ["crypto", "highrisk"], price: 67840, changePct: 1.86, color: T.gold, icon: "bitcoin", risk: "High", horizon: "Long-Term", avgReturn: "~50%/yr*", lock: "2 years", desc: "Original cryptocurrency. Limited supply of 21M coins. Highly volatile." },
  { id: "eth", name: "Ethereum", ticker: "ETH", type: "crypto", cats: ["crypto", "highrisk"], price: 3420, changePct: 2.64, color: T.purple, icon: "repeat", risk: "High", horizon: "Medium", avgReturn: "~40%/yr*", lock: "2 years", desc: "Programmable blockchain. Second largest crypto by market cap." },
  { id: "usdc", name: "USD Coin", ticker: "USDC", type: "crypto", cats: ["crypto", "lowrisk"], price: 1.00, changePct: 0, color: T.accent, icon: "dollarSign", risk: "Low", horizon: "Short-Term", avgReturn: "4-5%/yr", lock: "None", desc: "Stablecoin pegged to the US dollar. Earns yield without price volatility." },
];

const INV_CATS = [
  { id: "all", label: "All" }, { id: "longterm", label: "Long-Term" },
  { id: "etf", label: "ETFs" }, { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" }, { id: "lowrisk", label: "Low Risk" },
  { id: "highrisk", label: "High Risk" },
];

const RETURNS = [
  { label: "Savings Account", rate: 0.5, color: "#475569", desc: "National average APY" },
  { label: "High-Yield Savings", rate: 4.8, color: T.accent, desc: "HYSA average" },
  { label: "Bonds / CDs", rate: 5.1, color: T.green, desc: "Government bonds / CDs" },
  { label: "S&P 500 (avg)", rate: 10.5, color: T.gold, desc: "30-year historical average" },
  { label: "Nasdaq 100 (avg)", rate: 13.1, color: T.purple, desc: "Tech-heavy index" },
  { label: "Bitcoin (5yr avg)", rate: 49, color: T.gold, desc: "Highly variable — past results not guaranteed" },
];

function InvestDetailModal({ inv, onClose, onInvest }) {
  const stats = [
    { label: "Open", value: `$${(inv.price * 0.998).toFixed(2)}` },
    { label: "High", value: `$${(inv.price * 1.012).toFixed(2)}` },
    { label: "Low", value: `$${(inv.price * 0.988).toFixed(2)}` },
    { label: "Avg Return", value: inv.avgReturn },
    { label: "Risk", value: inv.risk },
    { label: "Horizon", value: inv.horizon },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }}>
      <div style={{ background: T.bg, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 420, border: `1px solid ${T.borderHi}`, borderBottom: "none", maxHeight: "94vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: `${inv.color}18`, border: `1px solid ${inv.color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={inv.icon} size={20} color={inv.color} />
            </div>
            <div>
              <h3 style={{ color: T.text, fontSize: 17, fontWeight: 700, margin: 0 }}>{inv.name}</h3>
              <p style={{ color: T.textSub, fontSize: 12, margin: "2px 0 0" }}>{inv.ticker} &middot; {inv.type.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={20} color={T.textSub} />
          </button>
        </div>
        <div style={{ padding: "14px 20px 0" }}>
          <InvestChart inv={inv} />
        </div>
        <div style={{ height: 1, background: T.border, margin: "14px 20px" }} />
        <div style={{ padding: "0 20px" }}>
          <SectionLabel>Key Stats</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: T.card, borderRadius: 8, padding: "9px 10px" }}>
                <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
                <p style={{ color: T.text, fontSize: 12, fontWeight: 700, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: 0.5 }}>About</p>
            <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{inv.desc}</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <span style={S.tag(inv.color)}>{inv.avgReturn}</span>
            <span style={S.tag(inv.risk === "Low" ? T.green : inv.risk === "High" ? T.red : T.gold)}>{inv.risk} Risk</span>
            <span style={S.tag(T.textSub)}>{inv.horizon}</span>
            {inv.lock !== "None" && <span style={S.tag(T.purple)}>Suggest {inv.lock} hold</span>}
          </div>
        </div>
        <div style={{ padding: "0 20px 32px" }}>
          <button onClick={() => { onClose(); onInvest(inv); }} style={S.primaryBtn(inv.color)}>Invest in {inv.ticker}</button>
        </div>
      </div>
    </div>
  );
}

function VestModal({ inv, onClose, onConfirm }) {
  const [useVest, setUseVest] = useState(true);
  const [vestType, setVestType] = useState("preset");
  const [preset, setPreset] = useState(inv?.lock || "2 years");
  const [custVal, setCustVal] = useState("18");
  const [custUnit, setCustUnit] = useState("months");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  if (!inv) return null;

  const presets = ["None", "6 months", "1 year", "2 years", "3 years", "5 years", "10 years"];
  const vestLabel = useVest ? (vestType === "preset" ? preset : `${custVal} ${custUnit}`) : "None";

  const vestMonths = vestLabel === "None" ? 0
    : vestLabel.includes("year") ? parseInt(vestLabel) * 12
    : vestLabel.includes("month") ? parseInt(vestLabel)
    : vestLabel.includes("week") ? Math.round(parseInt(vestLabel) / 4.3)
    : parseInt(vestLabel);

  const unlockDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + vestMonths);
    return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  };

  if (showConfirm) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 420, border: `1px solid ${T.borderHi}`, borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ color: T.text, fontSize: 17, fontWeight: 700, margin: 0 }}>Review and Confirm</h3>
          <button onClick={() => setShowConfirm(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="chevronLeft" size={16} color={T.textSub} />
            <span style={{ color: T.textSub, fontSize: 12 }}>Edit</span>
          </button>
        </div>
        <div style={{ background: T.card, border: `1px solid ${inv.color}30`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${inv.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={inv.icon} size={18} color={inv.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>{inv.name}</p>
              <p style={{ color: T.textSub, fontSize: 12, margin: "2px 0 0" }}>{inv.ticker}</p>
            </div>
            <p style={{ color: inv.color, fontWeight: 800, fontSize: 20, margin: 0 }}>${parseFloat(amount).toLocaleString()}</p>
          </div>
          {[
            { label: "Vesting Period", value: vestLabel === "None" ? "No lock" : vestLabel },
            { label: "Locked Until", value: vestLabel === "None" ? "Withdraw anytime" : unlockDate() },
            { label: "Avg Historical Return", value: inv.avgReturn },
            { label: "Fee", value: inv.type === "crypto" ? `$${(parseFloat(amount) * 0.0075).toFixed(2)} (0.75%)` : "Commission-free" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.textSub, fontSize: 12 }}>{r.label}</span>
              <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>
        {vestLabel !== "None" && (
          <div style={{ background: `${T.purple}10`, border: `1px solid ${T.purple}30`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
            <p style={{ color: T.purple, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              Your <strong style={{ color: T.text }}>${parseFloat(amount).toLocaleString()}</strong> will be locked until <strong style={{ color: T.text }}>{unlockDate()}</strong>. You can monitor performance anytime but cannot sell until then.
            </p>
          </div>
        )}
        <div style={{ background: `${T.red}08`, border: `1px solid ${T.red}18`, borderRadius: 8, padding: 10, marginBottom: 16 }}>
          <p style={{ color: T.textSub, fontSize: 11, margin: 0 }}>Not financial advice. All investing involves risk including loss of principal.</p>
        </div>
        <button onClick={() => onConfirm({ inv, amount: parseFloat(amount), vestingPeriod: vestLabel })} style={S.primaryBtn(inv.color)}>
          Confirm — Invest ${parseFloat(amount).toLocaleString()} in {inv.ticker}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 420, border: `1px solid ${T.borderHi}`, borderBottom: "none", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `${inv.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={inv.icon} size={19} color={inv.color} />
          </div>
          <div>
            <p style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>{inv.name}</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{inv.ticker} &middot; {inv.risk} Risk &middot; {inv.avgReturn}</p>
          </div>
        </div>
        <label style={S.label}>Investment Amount ($)</label>
        <div style={{ position: "relative", marginBottom: 18 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" style={{ ...S.input, paddingLeft: 28, fontSize: 17 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>Vesting Lock</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Prevents panic-selling during dips</p>
          </div>
          <Toggle value={useVest} onChange={setUseVest} />
        </div>
        {useVest && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["preset", "custom"].map(t => (
                <button key={t} onClick={() => setVestType(t)} style={{ flex: 1, background: vestType === t ? T.accentLo : "none", border: vestType === t ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 7, padding: "8px 0", cursor: "pointer", color: vestType === t ? T.accent : T.textSub, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
                  {t === "preset" ? "Preset Periods" : "Custom Period"}
                </button>
              ))}
            </div>
            {vestType === "preset" ? (
              <>
                <p style={{ color: inv.color, fontSize: 11, fontWeight: 600, margin: "0 0 10px" }}>Suggested: {inv.lock}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {presets.map(p => (
                    <button key={p} onClick={() => setPreset(p)} style={{ background: preset === p ? `${inv.color}18` : "rgba(255,255,255,0.03)", border: preset === p ? `1px solid ${inv.color}50` : `1px solid ${T.border}`, borderRadius: 6, padding: "5px 11px", cursor: "pointer", color: preset === p ? inv.color : T.textSub, fontSize: 12, fontWeight: preset === p ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{p}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 10px" }}>Enter any custom vesting period</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={custVal} onChange={e => setCustVal(e.target.value.replace(/\D/g, ""))} type="number" min="1" placeholder="18" style={{ ...S.input, width: 80, flexShrink: 0, textAlign: "center", fontSize: 16, fontWeight: 700 }} />
                  <div style={{ display: "flex", gap: 6, flex: 1 }}>
                    {["days", "weeks", "months", "years"].map(u => (
                      <button key={u} onClick={() => setCustUnit(u)} style={{ flex: 1, background: custUnit === u ? T.accentLo : "none", border: custUnit === u ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 7, cursor: "pointer", color: custUnit === u ? T.accent : T.textSub, fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif", padding: "8px 0" }}>{u}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <div style={{ background: `${T.red}08`, border: `1px solid ${T.red}20`, borderRadius: 8, padding: 10, marginBottom: 18 }}>
          <p style={{ color: T.red, fontSize: 11, margin: 0 }}>{inv.type === "crypto" ? "0.75% fee on crypto trades." : "Commission-free via brokerage partner."}</p>
        </div>
        <button onClick={() => amount && setShowConfirm(true)} style={{ ...S.primaryBtn(inv.color), opacity: amount ? 1 : 0.4 }}>Review and Confirm</button>
      </div>
    </div>
  );
}

function InvestTab() {
  const [activeCat, setActiveCat] = useState("all");
  const [detailInv, setDetailInv] = useState(null);
  const [vestInv, setVestInv] = useState(null);
  const [showEdu, setShowEdu] = useState(false);
  const [showReturns, setShowReturns] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [confirmed, setConfirmed] = useState(null);

  const filtered = activeCat === "all" ? INVESTMENTS : INVESTMENTS.filter(i => i.cats.includes(activeCat));
  const portfolioValue = portfolio.reduce((a, p) => a + p.amount, 0);

  const handleConfirm = (data) => {
    setPortfolio(prev => [...prev, { ...data, id: Date.now() }]);
    setVestInv(null);
    setConfirmed(data);
    setTimeout(() => setConfirmed(null), 3000);
  };

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 20 }}>
      {portfolio.length > 0 && (
        <div style={{ ...S.card }}>
          <SectionLabel>Portfolio</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[{ label: "Invested", value: `$${portfolioValue.toLocaleString()}`, color: T.accent }, { label: "Holdings", value: portfolio.length, color: T.green }, { label: "Est. 1yr Gain", value: `+$${Math.round(portfolioValue * 0.105).toLocaleString()}`, color: T.gold }].map(s => (
              <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 4px" }}>
                <p style={{ color: s.color, fontWeight: 700, fontSize: 14, margin: 0 }}>{s.value}</p>
                <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
              </div>
            ))}
          </div>
          {portfolio.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "9px 12px", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${p.inv.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={p.inv.icon} size={13} color={p.inv.color} />
                </div>
                <div>
                  <p style={{ color: T.text, fontSize: 12, fontWeight: 600, margin: 0 }}>{p.inv.ticker}</p>
                  <p style={{ color: T.textSub, fontSize: 10, margin: 0 }}>{p.vestingPeriod !== "None" ? `Locked ${p.vestingPeriod}` : "No lock"}</p>
                </div>
              </div>
              <p style={{ color: p.inv.color, fontWeight: 700, fontSize: 13, margin: 0 }}>${p.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {!portfolio.length && (
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: T.greenLo, border: `1px solid ${T.green}35`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Icon name="trendUp" size={20} color={T.green} />
          </div>
          <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Start Growing Your Wealth</p>
          <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>The S&amp;P 500 has averaged 10.5%/yr for 30 years. A savings account? 0.5%.</p>
          <button onClick={() => setShowReturns(true)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 16px", color: T.textMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Compare Returns</button>
        </div>
      )}

      {confirmed && (
        <div style={{ background: T.greenLo, border: `1px solid ${T.green}35`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="check" size={16} color={T.green} />
          <p style={{ color: T.green, fontSize: 12, fontWeight: 600, margin: 0 }}>Invested ${confirmed.amount.toLocaleString()} in {confirmed.inv.ticker}{confirmed.vestingPeriod !== "None" ? ` — Locked ${confirmed.vestingPeriod}` : ""}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={() => setShowEdu(true)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Icon name="book" size={15} color={T.accent} />
          <span style={{ color: T.accent, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Investing Primer</span>
        </button>
        <button onClick={() => setShowReturns(r => !r)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Icon name="barChart" size={15} color={T.gold} />
          <span style={{ color: T.gold, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Return Comparison</span>
        </button>
      </div>

      {showReturns && (
        <div style={S.card}>
          <SectionLabel>Average Annual Returns</SectionLabel>
          <p style={{ color: T.textSub, fontSize: 11, margin: "-6px 0 14px", fontStyle: "italic" }}>Historical averages only. Past performance does not guarantee future results.</p>
          {RETURNS.map(r => (
            <div key={r.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: T.textMid, fontSize: 12 }}>{r.label}</span>
                <span style={{ color: r.color, fontSize: 12, fontWeight: 700 }}>{r.rate}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.min((r.rate / 50) * 100, 100)}%`, height: "100%", background: r.color, borderRadius: 99 }} />
              </div>
              <p style={{ color: "#2D3F55", fontSize: 10, margin: "3px 0 0" }}>{r.desc}</p>
            </div>
          ))}
          <div style={{ background: T.accentLo, border: `1px solid ${T.accent}30`, borderRadius: 8, padding: 12, marginTop: 6 }}>
            <p style={{ color: T.accent, fontSize: 12, margin: 0, lineHeight: 1.6 }}><strong>$200/month at 10.5% for 25 years = $272,000.</strong> At 0.5% (savings account) = $62,000. The difference: $210,000.</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
        {INV_CATS.map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} style={{ flexShrink: 0, background: activeCat === c.id ? T.accentLo : "rgba(255,255,255,0.03)", border: activeCat === c.id ? `1px solid ${T.accent}50` : `1px solid ${T.border}`, borderRadius: 99, padding: "5px 13px", cursor: "pointer", color: activeCat === c.id ? T.accent : T.textSub, fontSize: 12, fontWeight: activeCat === c.id ? 700 : 400, fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap" }}>{c.label}</button>
        ))}
      </div>

      {filtered.map(inv => {
        const isUp = inv.changePct >= 0;
        return (
          <button key={inv.id} onClick={() => setDetailInv(inv)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${inv.color}15`, border: `1px solid ${inv.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={inv.icon} size={17} color={inv.color} />
                </div>
                <div>
                  <p style={{ color: T.text, fontWeight: 700, fontSize: 13, margin: 0 }}>{inv.ticker}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{inv.name}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>${inv.price.toLocaleString()}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}>
                  <Icon name={isUp ? "arrowUp" : "arrowDown"} size={10} color={isUp ? T.green : T.red} />
                  <span style={{ color: isUp ? T.green : T.red, fontSize: 11, fontWeight: 600 }}>{Math.abs(inv.changePct).toFixed(2)}%</span>
                </div>
              </div>
            </div>
            <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>{inv.desc}</p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <span style={S.tag(inv.color)}>{inv.avgReturn}</span>
              <span style={S.tag(inv.risk === "Low" ? T.green : inv.risk === "High" ? T.red : T.gold)}>{inv.risk} Risk</span>
              <span style={S.tag(T.textSub)}>{inv.horizon}</span>
              {inv.lock !== "None" && <span style={S.tag(T.purple)}>Suggest {inv.lock}</span>}
            </div>
          </button>
        );
      })}

      <p style={{ color: "#1A2740", fontSize: 11, textAlign: "center" }}>FreedomFund is not a registered investment advisor. Nothing here is financial advice. All investing involves risk.</p>

      {detailInv && <InvestDetailModal inv={detailInv} onClose={() => setDetailInv(null)} onInvest={i => setVestInv(i)} />}
      {vestInv && <VestModal inv={vestInv} onClose={() => setVestInv(null)} onConfirm={handleConfirm} />}
      {showEdu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 20 }}>
          <div style={{ background: T.surface, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, border: `1px solid ${T.borderHi}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ color: T.textSub, fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Investing Primer</p>
              <button onClick={() => setShowEdu(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color={T.textSub} /></button>
            </div>
            {[
              { title: "Why Invest at All?", body: "Money in a savings account earns ~0.5% per year while inflation runs at ~3%. Your purchasing power shrinks every year you do not invest. Investing puts your money to work." },
              { title: "ETFs: The Foundation", body: "An ETF lets you own a slice of hundreds of companies at once. The S&P 500 has returned ~10.5% per year on average over 30 years." },
              { title: "Crypto: High Risk", body: "Cryptocurrencies can deliver explosive gains — and equally dramatic losses. Never invest more than you could afford to lose entirely." },
              { title: "Time in Market Wins", body: "$5/day at 10%/yr for 30 years becomes ~$328,000. Starting early — even with small amounts — is the single most powerful move you can make." },
            ].map(s => (
              <div key={s.title} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: "0 0 5px" }}>{s.title}</p>
                <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
            <button onClick={() => setShowEdu(false)} style={S.primaryBtn()}>Start Investing</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pro Upgrade ───────────────────────────────────────────────────────────────
function ProScreen({ onClose, onUpgrade, isPro }) {
  const [plan, setPlan] = useState("yearly");
  const pricing = {
    monthly: { label: "Monthly", price: "$3.99", period: "/mo", sub: "$47.88 billed annually" },
    yearly: { label: "Annual", price: "$29.99", period: "/yr", sub: "$2.50/month equivalent", save: "37% off" },
  };
  const sel = pricing[plan];
  const features = ["Unlimited savings goals", "Advanced savings schedule", "Full community participation", "Complete budget tracker", "PDF progress reports", "Goal streak tracking", "Priority support", "Early feature access"];
  const compare = [
    { text: "Up to 3 savings goals", free: true }, { text: "Basic breakdown plan", free: true },
    { text: "Community feed (read-only)", free: true }, { text: "Financial tips", free: true },
    { text: "Unlimited goals", free: false }, { text: "Advanced schedule", free: false },
    { text: "Full community + badges", free: false }, { text: "Budget tracker", free: false },
  ];

  if (isPro) return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "52px 20px 40px", maxWidth: 420, margin: "0 auto" }}>
      <button onClick={onClose} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
        <Icon name="chevronLeft" size={16} color={T.textSub} />
        <span style={{ fontSize: 13 }}>Back</span>
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 15, background: T.goldLo, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="crown" size={28} color={T.gold} />
        </div>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Pro Active</h2>
        <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7, margin: 0 }}>Thank you for supporting FreedomFund. Your subscription helps bring financial literacy to students at no cost.</p>
        <div style={{ ...S.card, width: "100%", textAlign: "left" }}>
          {features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Icon name="check" size={14} color={T.gold} />
              <span style={{ color: T.textMid, fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={S.primaryBtn(T.gold)}>Return to App</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, maxWidth: 420, margin: "0 auto" }}>
      <div style={{ position: "relative", padding: "52px 20px 28px", background: `linear-gradient(180deg, ${T.gold}10 0%, transparent 100%)`, textAlign: "center" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 52, left: 20, background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
          <Icon name="chevronLeft" size={16} color={T.textSub} />
        </button>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: T.goldLo, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon name="crown" size={24} color={T.gold} />
        </div>
        <h1 style={{ color: T.text, fontSize: 24, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.5 }}>FreedomFund Pro</h1>
        <p style={{ color: T.textSub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>Everything you need to accelerate your financial independence.</p>
      </div>
      <div style={{ padding: "0 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {["monthly", "yearly"].map(p => (
            <button key={p} onClick={() => setPlan(p)} style={{ borderRadius: 7, padding: "10px 0", border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13, background: plan === p ? T.gold : "transparent", color: plan === p ? "#0F172A" : T.textSub, position: "relative" }}>
              {pricing[p].label}
              {pricing[p].save && <span style={{ position: "absolute", top: -8, right: 6, background: T.green, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99 }}>{pricing[p].save}</span>}
            </button>
          ))}
        </div>
        <div style={{ background: `linear-gradient(135deg, ${T.gold}12, ${T.card})`, border: `1px solid ${T.gold}30`, borderRadius: 14, padding: 22, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.gold}, ${T.gold}50)` }} />
          {plan === "yearly" && <div style={{ position: "absolute", top: 14, right: 14, background: T.green, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99 }}>BEST VALUE</div>}
          <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>FreedomFund Pro</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, marginBottom: 5 }}>
            <span style={{ color: T.gold, fontWeight: 700, fontSize: 42, lineHeight: 1 }}>{sel.price}</span>
            <span style={{ color: T.textSub, fontSize: 13, marginBottom: 6 }}>{sel.period}</span>
          </div>
          <p style={{ color: T.green, fontSize: 12, fontWeight: 600, margin: "0 0 3px" }}>{sel.sub}</p>
          <p style={{ color: T.textSub, fontSize: 11, margin: 0 }}>Less than a coffee per month</p>
        </div>
        <div style={S.card}>
          <SectionLabel>What is Included</SectionLabel>
          {features.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.goldLo, border: `1px solid ${T.gold}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="check" size={10} color={T.gold} />
              </div>
              <span style={{ color: T.textMid, fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ ...S.card, overflow: "hidden" }}>
          <SectionLabel>Free vs Pro</SectionLabel>
          {compare.map((f, i) => (
            <div key={f.text} style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px", alignItems: "center", padding: "8px 0", borderBottom: i < compare.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ color: T.textMid, fontSize: 12 }}>{f.text}</span>
              <div style={{ textAlign: "center" }}><Icon name={f.free ? "check" : "x"} size={13} color={f.free ? T.green : T.red} /></div>
              <div style={{ textAlign: "center" }}><Icon name="check" size={13} color={T.gold} /></div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 40px", paddingTop: 10 }}>
            <span />
            <p style={{ color: T.textSub, fontSize: 10, textAlign: "center", margin: 0, fontWeight: 700 }}>FREE</p>
            <p style={{ color: T.gold, fontSize: 10, textAlign: "center", margin: 0, fontWeight: 700 }}>PRO</p>
          </div>
        </div>
        <div style={{ background: T.accentLo, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: 14 }}>
          <p style={{ color: T.accent, fontSize: 13, fontWeight: 600, margin: "0 0 5px" }}>Supporting a larger mission</p>
          <p style={{ color: T.textSub, fontSize: 12, margin: 0, lineHeight: 1.6 }}>Your Pro subscription funds free access to FreedomFund in high school classrooms nationwide.</p>
        </div>
        <button onClick={() => onUpgrade(plan)} style={{ ...S.primaryBtn(T.gold), fontSize: 15, padding: 15, boxShadow: `0 4px 20px ${T.gold}30` }}>
          Start Pro — {sel.price}{sel.period}
        </button>
        <p style={{ color: "#1A2740", fontSize: 12, textAlign: "center", margin: "-8px 0 0" }}>No contracts. Cancel anytime. USD.</p>
      </div>
    </div>
  );
}

// ── Weekly Spending Chart ─────────────────────────────────────────────────────
function WeeklySpendingChart() {
  const [activeWeek, setActiveWeek] = useState(3); // default to current week
  const [hoverDay, setHoverDay] = useState(null);

  const weeks = ["4 wks ago", "3 wks ago", "2 wks ago", "This week"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Simulated weekly spending data per category
  const weeklyData = [
    { groceries: [62, 0, 0, 88, 0, 45, 0], dining: [0, 34, 22, 0, 48, 62, 30], transport: [12, 12, 12, 12, 12, 0, 0], shopping: [0, 0, 120, 0, 0, 85, 0], entertainment: [0, 0, 0, 0, 45, 0, 80], other: [18, 22, 8, 14, 30, 12, 20] },
    { groceries: [0, 0, 74, 0, 0, 92, 0], dining: [28, 0, 38, 0, 55, 42, 18], transport: [12, 12, 12, 12, 12, 0, 0], shopping: [0, 65, 0, 0, 0, 0, 44], entertainment: [0, 0, 0, 38, 0, 90, 0], other: [10, 15, 25, 8, 22, 18, 12] },
    { groceries: [0, 55, 0, 0, 78, 0, 0], dining: [0, 42, 0, 55, 0, 78, 35], transport: [12, 12, 12, 12, 12, 0, 0], shopping: [0, 0, 0, 95, 0, 0, 60], entertainment: [0, 0, 55, 0, 0, 40, 70], other: [20, 8, 14, 22, 10, 28, 16] },
    { groceries: [88, 0, 0, 0, 65, 0, 0], dining: [0, 28, 45, 0, 32, 55, 0], transport: [12, 12, 12, 12, 12, 0, 0], shopping: [0, 0, 0, 0, 0, 110, 0], entertainment: [0, 0, 0, 42, 0, 0, 65], other: [14, 18, 12, 8, 24, 16, 10] },
  ];

  const cats = [
    { key: "groceries",    label: "Groceries",     color: T.green  },
    { key: "dining",       label: "Dining Out",    color: T.gold   },
    { key: "transport",    label: "Transport",     color: T.accent },
    { key: "shopping",     label: "Shopping",      color: T.purple },
    { key: "entertainment",label: "Entertainment", color: T.red    },
    { key: "other",        label: "Other",         color: T.textSub},
  ];

  const week = weeklyData[activeWeek];

  // Build stacked daily totals
  const dayTotals = days.map((_, di) =>
    cats.reduce((sum, cat) => sum + week[cat.key][di], 0)
  );
  const maxTotal = Math.max(...dayTotals, 1);

  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);
  const prevWeekTotal = activeWeek > 0
    ? days.reduce((sum, _, di) => sum + cats.reduce((s, c) => s + weeklyData[activeWeek - 1][c.key][di], 0), 0)
    : null;
  const weekDiff = prevWeekTotal !== null ? weekTotal - prevWeekTotal : null;

  // Category totals for selected week
  const catTotals = cats.map(cat => ({
    ...cat,
    total: week[cat.key].reduce((a, b) => a + b, 0),
  })).sort((a, b) => b.total - a.total);

  const BAR_H = 110;
  const BAR_W = 36;

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <SectionLabel>Weekly Spending</SectionLabel>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <p style={{ color: T.text, fontWeight: 800, fontSize: 22, margin: 0 }}>${weekTotal.toLocaleString()}</p>
            {weekDiff !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Icon name={weekDiff > 0 ? "arrowUp" : "arrowDown"} size={12} color={weekDiff > 0 ? T.red : T.green} />
                <span style={{ color: weekDiff > 0 ? T.red : T.green, fontSize: 12, fontWeight: 600 }}>
                  ${Math.abs(weekDiff)} vs last week
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Week selector */}
        <div style={{ display: "flex", gap: 4 }}>
          {weeks.map((_, i) => (
            <button key={i} onClick={() => { setActiveWeek(i); setHoverDay(null); }} style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", background: activeWeek === i ? T.accent : "rgba(255,255,255,0.15)", padding: 0, transition: "background 0.2s" }} />
          ))}
        </div>
      </div>

      <p style={{ color: T.textSub, fontSize: 11, margin: "-8px 0 12px", fontWeight: 500 }}>{weeks[activeWeek]}</p>

      {/* Stacked bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: BAR_H, marginBottom: 6, position: "relative" }}>
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map(pct => (
          <div key={pct} style={{ position: "absolute", left: 0, right: 0, bottom: `${pct * 100}%`, borderTop: `1px dashed rgba(255,255,255,0.05)`, pointerEvents: "none" }} />
        ))}

        {days.map((day, di) => {
          const total = dayTotals[di];
          const barH = total > 0 ? Math.max((total / maxTotal) * BAR_H, 4) : 2;
          const isHovered = hoverDay === di;

          // Build stacked segments bottom-up
          let stackedPct = 0;
          const segments = cats.map(cat => {
            const val = week[cat.key][di];
            const pct = total > 0 ? (val / total) : 0;
            const seg = { cat, val, pct, startPct: stackedPct };
            stackedPct += pct;
            return seg;
          }).filter(s => s.val > 0);

          return (
            <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}
              onMouseEnter={() => setHoverDay(di)}
              onMouseLeave={() => setHoverDay(null)}
            >
              {/* Hover tooltip */}
              {isHovered && total > 0 && (
                <div style={{ position: "absolute", bottom: BAR_H + 14, left: "50%", transform: "translateX(-50%)", background: "#1E293B", border: `1px solid ${T.borderHi}`, borderRadius: 9, padding: "8px 10px", zIndex: 50, minWidth: 130, boxShadow: "0 6px 20px rgba(0,0,0,0.5)", pointerEvents: "none" }}>
                  <p style={{ color: T.text, fontWeight: 700, fontSize: 13, margin: "0 0 5px" }}>{day} — ${total}</p>
                  {segments.map(s => (
                    <div key={s.cat.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.cat.color, flexShrink: 0 }} />
                        <span style={{ color: T.textSub, fontSize: 11 }}>{s.cat.label}</span>
                      </div>
                      <span style={{ color: T.textMid, fontSize: 11, fontWeight: 600 }}>${s.val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stacked bar */}
              <div style={{ width: BAR_W, height: barH, borderRadius: 5, overflow: "hidden", position: "relative", opacity: isHovered ? 1 : 0.85, transition: "opacity 0.15s", cursor: "pointer" }}>
                {total === 0
                  ? <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 5 }} />
                  : segments.map(s => (
                      <div key={s.cat.key} style={{ position: "absolute", left: 0, right: 0, bottom: `${s.startPct * 100}%`, height: `${s.pct * 100}%`, background: s.cat.color, minHeight: s.val > 0 ? 2 : 0 }} />
                    ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        {days.map((day, di) => (
          <div key={day} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ color: hoverDay === di ? T.accent : T.textSub, fontSize: 10, fontWeight: hoverDay === di ? 700 : 400, transition: "color 0.15s" }}>{day}</span>
          </div>
        ))}
      </div>

      {/* Category legend with totals */}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.8 }}>Breakdown</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {catTotals.filter(c => c.total > 0).map(cat => (
            <div key={cat.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "7px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <span style={{ color: T.textSub, fontSize: 11 }}>{cat.label}</span>
              </div>
              <span style={{ color: cat.color, fontSize: 12, fontWeight: 700 }}>${cat.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily average */}
      <div style={{ marginTop: 12, background: T.accentLo, border: `1px solid ${T.accent}25`, borderRadius: 8, padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: T.textSub, fontSize: 12 }}>Daily average this week</span>
        <span style={{ color: T.accent, fontWeight: 700, fontSize: 14 }}>${Math.round(weekTotal / 7)}/day</span>
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ goals, userName, isPro, onUpgrade, onSignOut }) {
  const totalSaved = goals.reduce((a, g) => a + g.saved, 0);
  const totalTarget = goals.reduce((a, g) => a + g.target, 0);
  const overallPct = Math.round((totalSaved / totalTarget) * 100);
  const initials = userName ? userName.slice(0, 2).toUpperCase() : "ME";
  const [selAch, setSelAch] = useState(null);

  const achievements = [
    { icon: "target", label: "First Goal Set", earned: true, howTo: "Create your very first savings goal in the Goals tab." },
    { icon: "wallet", label: "First Deposit", earned: goals.some(g => g.saved > 0), howTo: "Make your first deposit into any goal. Tap Add Funds on any goal card." },
    { icon: "fire", label: "7-Day Streak", earned: true, howTo: "Open the app and check your goals 7 days in a row." },
    { icon: "shield", label: "Emergency Fund Started", earned: goals.some(g => g.name.includes("Emergency")), howTo: "Create an Emergency Fund goal and make at least one deposit." },
    { icon: "globe", label: "Community Member", earned: goals.some(g => g.isPublic), howTo: "Set at least one goal to Public in the sharing settings." },
    { icon: "award", label: "Goal Completed", earned: goals.some(g => g.saved >= g.target), howTo: "Reach 100% on any savings goal by depositing consistently." },
    { icon: "lock", label: "No Impulse Withdrawals", earned: true, howTo: "Go 30 days without withdrawing from any locked goal." },
    { icon: "star", label: "3 Active Goals", earned: goals.length >= 3, howTo: "Have 3 or more active savings goals at the same time." },
    { icon: "trendUp", label: "First Investment", earned: false, howTo: "Make your first investment in the Invest tab. Any amount counts." },
    { icon: "crown", label: "Pro Member", earned: isPro, howTo: "Upgrade to FreedomFund Pro to unlock unlimited goals and advanced features." },
    { icon: "repeat", label: "Auto-Saver", earned: false, howTo: "Set up an automatic recurring deposit on any goal using the Auto-Deposit toggle." },
    { icon: "barChart", label: "Budget Master", earned: false, howTo: "Stay within your recommended spending budget for an entire month." },
  ];

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {!isPro ? (
        <button onClick={onUpgrade} style={{ background: `linear-gradient(135deg, ${T.gold}12, ${T.card})`, border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: T.goldLo, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="crown" size={16} color={T.gold} />
            </div>
            <div>
              <p style={{ color: T.gold, fontSize: 13, fontWeight: 700, margin: 0 }}>Upgrade to Pro</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Unlimited goals &middot; Reports &middot; Full community</p>
            </div>
          </div>
          <span style={{ background: T.gold, color: "#0F172A", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6 }}>From $2.50/mo</span>
        </button>
      ) : (
        <button onClick={onUpgrade} style={{ background: `linear-gradient(135deg, ${T.gold}10, ${T.card})`, border: `1px solid ${T.gold}25`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left" }}>
          <Icon name="crown" size={18} color={T.gold} />
          <div>
            <p style={{ color: T.gold, fontSize: 13, fontWeight: 700, margin: 0 }}>FreedomFund Pro</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Active — thank you for your support</p>
          </div>
        </button>
      )}

      <div style={{ background: `linear-gradient(135deg, ${T.accentLo}, ${T.card})`, border: `1px solid ${T.accent}25`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", border: `2px solid ${T.accent}50` }}>{initials}</div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 3px" }}>{userName || "My Profile"}</h3>
          <p style={{ color: T.textSub, fontSize: 12, margin: 0 }}>Member since May 2026 &middot; 7-day streak</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, width: "100%" }}>
          {[{ label: "Goals", value: goals.length }, { label: "Total Saved", value: `$${totalSaved.toLocaleString()}` }, { label: "Freedom", value: `${overallPct}%` }].map(s => (
            <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 4px" }}>
              <p style={{ color: T.accent, fontWeight: 700, fontSize: 14, margin: 0 }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ color: T.textMid, fontSize: 13, fontWeight: 600, margin: 0 }}>Overall Freedom Progress</p>
          <span style={{ color: T.accent, fontSize: 13, fontWeight: 700 }}>{overallPct}%</span>
        </div>
        <ProgressBar pct={overallPct} color={T.accent} height={8} />
        <p style={{ color: T.textSub, fontSize: 11, margin: "8px 0 0", textAlign: "center" }}>${totalSaved.toLocaleString()} saved toward ${totalTarget.toLocaleString()} in total goals</p>
      </div>

      <WeeklySpendingChart />

      <div style={S.card}>
        <SectionLabel>Goal Summary</SectionLabel>
        {goals.map(g => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${g.color}15`, border: `1px solid ${g.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={g.icon} size={14} color={g.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: T.textMid, fontSize: 12, fontWeight: 600 }}>{g.name}</span>
                  <span style={{ color: g.color, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
                </div>
                <ProgressBar pct={pct} color={g.color} height={4} />
              </div>
              <Icon name={g.isPublic ? "globe" : "lock"} size={12} color={T.textSub} />
            </div>
          );
        })}
      </div>

      <div style={{ ...S.card, marginBottom: 8 }}>
        <SectionLabel>Achievements</SectionLabel>
        <p style={{ color: T.textSub, fontSize: 11, margin: "-6px 0 12px" }}>Tap any achievement to learn how to earn it</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {achievements.map(a => (
            <button key={a.label} onClick={() => setSelAch(a)} style={{ background: a.earned ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.01)", border: `1px solid ${a.earned ? T.borderHi : T.border}`, borderRadius: 9, padding: "11px 10px", display: "flex", alignItems: "center", gap: 9, opacity: a.earned ? 1 : 0.45, cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: a.earned ? T.accentLo : "rgba(255,255,255,0.04)", border: `1px solid ${a.earned ? T.accent + "40" : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={a.icon} size={13} color={a.earned ? T.accent : T.textSub} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ color: a.earned ? T.textMid : T.textSub, fontSize: 11, fontWeight: a.earned ? 600 : 400, lineHeight: 1.3, display: "block" }}>{a.label}</span>
                {a.earned && <span style={{ color: T.accent, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>EARNED</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selAch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={() => setSelAch(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "18px 18px 0 0", padding: 24, width: "100%", maxWidth: 420, border: `1px solid ${T.borderHi}`, borderBottom: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: selAch.earned ? T.accentLo : "rgba(255,255,255,0.04)", border: `1px solid ${selAch.earned ? T.accent + "40" : T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={selAch.icon} size={22} color={selAch.earned ? T.accent : T.textSub} />
              </div>
              <div>
                <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{selAch.label}</h3>
                <p style={{ color: selAch.earned ? T.green : T.textSub, fontSize: 12, margin: "3px 0 0", fontWeight: 600 }}>{selAch.earned ? "Achieved" : "Not yet earned"}</p>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>How to earn</p>
              <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{selAch.howTo}</p>
            </div>
            {!selAch.earned && (
              <div style={{ background: T.accentLo, border: `1px solid ${T.accent}30`, borderRadius: 9, padding: 12, marginBottom: 16 }}>
                <p style={{ color: T.accent, fontSize: 12, margin: 0 }}>Keep going — this achievement is within reach.</p>
              </div>
            )}
            <button onClick={() => setSelAch(null)} style={S.primaryBtn()}>Got It</button>
          </div>
        </div>
      )}
      {onSignOut && (
        <button onClick={async () => { await sb.signOut(); onSignOut(); }} style={{ background: "rgba(255,90,110,0.06)", border: "1px solid rgba(255,90,110,0.18)", borderRadius: 12, padding: "13px 0", cursor: "pointer", color: T.red, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 14, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
          <Icon name="x" size={15} color={T.red} />
          Sign Out
        </button>
      )}
    </div>
  );
}

// ── Deals ─────────────────────────────────────────────────────────────────────
const DEALS = [
  { id: 1, store: "Walmart", cat: "Groceries", title: "10% off produce and dairy", expires: "Today", saving: "Up to $12", code: "FF-WMT-10", color: T.accent },
  { id: 2, store: "Target", cat: "Household", title: "$5 off $40+ household items", expires: "3 days", saving: "$5.00", code: "FF-TGT-5", color: T.red },
  { id: 3, store: "Costco", cat: "Groceries", title: "$10 off $100+ groceries", expires: "This week", saving: "$10.00", code: "FF-CST-10", color: T.accent },
  { id: 4, store: "Kroger", cat: "Groceries", title: "Buy 2 get 1 free on pantry items", expires: "2 days", saving: "Varies", code: "FF-KRO-B2G1", color: T.green },
  { id: 5, store: "Home Depot", cat: "Home", title: "$20 off $100+ tools", expires: "5 days", saving: "$20.00", code: "FF-HD-20", color: T.gold },
  { id: 6, store: "CVS", cat: "Health", title: "30% off vitamins", expires: "Today", saving: "Up to $15", code: "FF-CVS-30", color: T.red },
];

function DealsTab() {
  const [selDeal, setSelDeal] = useState(null);
  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 20 }}>
      <div style={S.card}>
        <SectionLabel>Savings Deals</SectionLabel>
        <p style={{ color: T.textMid, fontSize: 13, margin: "0 0 12px", lineHeight: 1.6 }}>Exclusive deals on necessities — show the code or barcode at checkout to save.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{ label: "Est. Monthly Savings", value: "$67", color: T.green }, { label: "Active Deals", value: "6", color: T.accent }].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ color: s.color, fontWeight: 700, fontSize: 18, margin: 0 }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      {DEALS.map(deal => (
        <button key={deal.id} onClick={() => setSelDeal(deal)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <p style={{ color: T.text, fontWeight: 700, fontSize: 13, margin: 0 }}>{deal.store}</p>
              <span style={{ ...S.tag(T.textSub), fontSize: 10 }}>{deal.cat}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: T.green, fontWeight: 700, fontSize: 13, margin: 0 }}>{deal.saving}</p>
              <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>Expires: {deal.expires}</p>
            </div>
          </div>
          <p style={{ color: T.textMid, fontSize: 13, margin: "0 0 8px" }}>{deal.title}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: T.textSub, fontSize: 11, fontFamily: "'Courier New',monospace", letterSpacing: 1 }}>{deal.code}</span>
            <span style={{ color: T.accent, fontSize: 11, fontWeight: 600 }}>Tap to show code</span>
          </div>
        </button>
      ))}
      <p style={{ color: "#1A2740", fontSize: 11, textAlign: "center" }}>FreedomFund may earn a small referral fee from partner deals — always disclosed.</p>

      {selDeal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 20 }} onClick={() => setSelDeal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: 16, padding: 24, width: "100%", maxWidth: 380, border: `1px solid ${T.borderHi}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{selDeal.store}</h3>
                <p style={{ color: T.textSub, fontSize: 12, margin: "2px 0 0" }}>{selDeal.title}</p>
              </div>
              <button onClick={() => setSelDeal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color={T.textSub} /></button>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "16px", textAlign: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 1, height: 50, marginBottom: 8 }}>
                {selDeal.code.split("").map((c, i) => (
                  c !== "-"
                    ? <div key={i} style={{ width: i % 3 === 0 ? 2 : 1, height: i % 5 === 0 ? 50 : i % 3 === 0 ? 42 : 36, background: "#111", borderRadius: 1 }} />
                    : <div key={i} style={{ width: 4 }} />
                ))}
              </div>
              <p style={{ color: "#111", fontSize: 13, fontFamily: "'Courier New',monospace", fontWeight: 700, margin: 0, letterSpacing: 2 }}>{selDeal.code}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: T.greenLo, border: `1px solid ${T.green}30`, borderRadius: 8, padding: 10, textAlign: "center" }}>
                <p style={{ color: T.green, fontWeight: 700, fontSize: 16, margin: 0 }}>{selDeal.saving}</p>
                <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>You Save</p>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, textAlign: "center" }}>
                <p style={{ color: T.text, fontWeight: 700, fontSize: 13, margin: 0 }}>Exp: {selDeal.expires}</p>
                <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Valid Until</p>
              </div>
            </div>
            <div style={{ background: T.accentLo, border: `1px solid ${T.accent}25`, borderRadius: 8, padding: 11 }}>
              <p style={{ color: T.accent, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Show this barcode to the cashier or let them scan your phone screen at checkout.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const trend = [14, 18, 22, 19, 28, 31, 26, 34, 38, 29, 42, 45, 40, 52, 48, 56, 61, 58, 67, 72, 69, 78, 74, 82, 88, 84, 91, 87, 96, 102];
  const tMin = Math.min(...trend), tMax = Math.max(...trend);
  const tNorm = trend.map(v => (v - tMin) / (tMax - tMin));
  const W = 340, H = 70;
  const tPts = tNorm.map((v, i) => `${(i / (trend.length - 1)) * W},${H - (v * (H - 8) + 4)}`).join(" ");

  const cats = [
    { label: "Emergency Fund", pct: 37, color: T.green, users: "6,840", avgTarget: "$12,000", avgSaved: "$3,200", withLock: "68%" },
    { label: "House Down Payment", pct: 22, color: T.accent, users: "4,120", avgTarget: "$45,000", avgSaved: "$11,800", withLock: "81%" },
    { label: "Debt Payoff", pct: 18, color: T.red, users: "3,320", avgTarget: "$18,000", avgSaved: "$4,100", withLock: "44%" },
    { label: "Retirement", pct: 12, color: T.purple, users: "2,210", avgTarget: "$120,000", avgSaved: "$8,400", withLock: "92%" },
    { label: "Travel / Big Purchase", pct: 11, color: T.gold, users: "1,912", avgTarget: "$5,500", avgSaved: "$1,200", withLock: "28%" },
  ];

  const adoption = [
    { label: "Auto-Deposit Enabled", pct: 61, color: T.green },
    { label: "Time-Lock Active on Goals", pct: 74, color: T.purple },
    { label: "Community Feed Public", pct: 48, color: T.accent },
    { label: "Investing Tab Active", pct: 33, color: T.gold },
    { label: "Pro Subscribers", pct: 12, color: T.gold },
  ];

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>
      <div style={{ background: `linear-gradient(135deg, ${T.accentLo}, ${T.card})`, border: `1px solid ${T.accent}25`, borderRadius: 12, padding: 16 }}>
        <SectionLabel>Platform Analytics</SectionLabel>
        <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.6 }}>Live trends, feature adoption, and community statistics across all FreedomFund users.</p>
      </div>

      <div style={S.card}>
        <SectionLabel>Platform Overview</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Active Users", value: "18,402", sub: "with goals set right now", color: T.accent, icon: "users" },
            { label: "Goals Active", value: "47,218", sub: "across all categories", color: T.green, icon: "target" },
            { label: "Total Saved", value: "$2.84M", sub: "community-wide", color: T.gold, icon: "dollarSign" },
            { label: "Goals Completed", value: "1,284", sub: "since launch", color: T.purple, icon: "award" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 9, padding: "11px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <Icon name={s.icon} size={13} color={s.color} />
                <p style={{ color: T.textSub, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
              </div>
              <p style={{ color: s.color, fontWeight: 800, fontSize: 18, margin: "0 0 2px" }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 10, margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <SectionLabel>Community Savings Trend</SectionLabel>
        <p style={{ color: T.textSub, fontSize: 11, margin: "-6px 0 10px" }}>Total deposits per day across all users ($K)</p>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.green} stopOpacity="0.2" />
              <stop offset="100%" stopColor={T.green} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={`0,${H} ${tPts} ${W},${H}`} fill="url(#trendGrad)" />
          <polyline points={tPts} fill="none" stroke={T.green} strokeWidth="1.8" />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ color: T.textSub, fontSize: 10 }}>30 days ago</span>
          <span style={{ color: T.green, fontSize: 11, fontWeight: 700 }}>+28% this month</span>
          <span style={{ color: T.textSub, fontSize: 10 }}>Today</span>
        </div>
      </div>

      <div style={S.card}>
        <SectionLabel>Goal Category Breakdown</SectionLabel>
        {cats.map(cat => (
          <div key={cat.label} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
              <div>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{cat.label}</p>
                <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>{cat.users} active users &middot; {cat.withLock} have a lock set</p>
              </div>
              <span style={{ color: cat.color, fontSize: 12, fontWeight: 700 }}>{cat.pct}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 5, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ width: `${cat.pct}%`, height: "100%", background: cat.color, borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: T.textSub, fontSize: 10 }}>Avg target: <span style={{ color: T.textMid, fontWeight: 600 }}>{cat.avgTarget}</span></span>
              <span style={{ color: T.textSub, fontSize: 10 }}>Avg saved: <span style={{ color: cat.color, fontWeight: 600 }}>{cat.avgSaved}</span></span>
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <SectionLabel>Feature Adoption</SectionLabel>
        {adoption.map(f => (
          <div key={f.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: T.textMid, fontSize: 12 }}>{f.label}</span>
              <span style={{ color: f.color, fontSize: 12, fontWeight: 700 }}>{f.pct}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 5 }}>
              <div style={{ width: `${f.pct}%`, height: "100%", background: f.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <SectionLabel>Lock Statistics</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Avg lock period", value: "26 months" },
            { label: "Most popular lock", value: "2 years" },
            { label: "Cooldown locks", value: "38% of goals" },
            { label: "Date-based locks", value: "62% of goals" },
            { label: "Early withdrawal rate", value: "4.2%" },
            { label: "Avg cooldown", value: "36 hours" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 11px" }}>
              <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.4 }}>{s.label}</p>
              <p style={{ color: T.purple, fontWeight: 700, fontSize: 14, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p style={{ color: "#1A2740", fontSize: 11, textAlign: "center" }}>Statistics updated daily. All figures are aggregated and anonymized.</p>
    </div>
  );
}

// ── Bills Tracker ─────────────────────────────────────────────────────────────
const BILL_CATEGORIES = [
  { id: "housing",       label: "Housing",        icon: "building",    color: T.blue   },
  { id: "utilities",     label: "Utilities",      icon: "zap",         color: T.gold   },
  { id: "insurance",     label: "Insurance",      icon: "shield",      color: T.green  },
  { id: "subscriptions", label: "Subscriptions",  icon: "repeat",      color: T.purple },
  { id: "transport",     label: "Transport",      icon: "send",        color: T.orange },
  { id: "debt",          label: "Debt / Loans",   icon: "wallet",      color: T.red    },
  { id: "phone",         label: "Phone / Internet",icon: "bell",       color: T.accent },
  { id: "other",         label: "Other",          icon: "dollarSign",  color: T.textMid},
];

const INITIAL_BILLS = [
  { id: 1, name: "Rent",           category: "housing",       amount: 1450, dueDay: 1,  autopay: true,  color: T.blue,   icon: "building",   notes: ""                     },
  { id: 2, name: "Electric",       category: "utilities",     amount: 94,   dueDay: 12, autopay: false, color: T.gold,   icon: "zap",        notes: "Varies by season"      },
  { id: 3, name: "Internet",       category: "phone",         amount: 69,   dueDay: 15, autopay: true,  color: T.accent, icon: "bell",       notes: ""                     },
  { id: 4, name: "Car Insurance",  category: "insurance",     amount: 142,  dueDay: 8,  autopay: false, color: T.green,  icon: "shield",     notes: ""                     },
  { id: 5, name: "Netflix",        category: "subscriptions", amount: 15,   dueDay: 22, autopay: true,  color: T.purple, icon: "repeat",     notes: ""                     },
  { id: 6, name: "Car Payment",    category: "transport",     amount: 380,  dueDay: 3,  autopay: false, color: T.orange, icon: "send",       notes: "18 months remaining"  },
  { id: 7, name: "Student Loan",   category: "debt",          amount: 210,  dueDay: 17, autopay: false, color: T.red,    icon: "wallet",     notes: ""                     },
  { id: 8, name: "Phone Bill",     category: "phone",         amount: 85,   dueDay: 20, autopay: true,  color: T.accent, icon: "bell",       notes: ""                     },
];

function AddEditBillModal({ bill, onClose, onSave }) {
  const isNew = !bill;
  const [name,     setName]     = useState(bill?.name     || "");
  const [amount,   setAmount]   = useState(bill ? String(bill.amount) : "");
  const [dueDay,   setDueDay]   = useState(bill ? String(bill.dueDay) : "1");
  const [cat,      setCat]      = useState(bill?.category || "other");
  const [autopay,  setAutopay]  = useState(bill?.autopay  || false);
  const [notes,    setNotes]    = useState(bill?.notes    || "");
  const [reminder, setReminder] = useState(bill ? (bill.reminderDays ?? 3) : 3);

  const selCat = BILL_CATEGORIES.find(c => c.id === cat) || BILL_CATEGORIES[7];

  const save = () => {
    if (!name.trim() || !amount || !dueDay) return;
    onSave({
      id: bill?.id || Date.now(),
      name: name.trim(), amount: parseFloat(amount), dueDay: parseInt(dueDay),
      category: cat, autopay, notes: notes.trim(), reminderDays: reminder,
      color: selCat.color, icon: selCat.icon,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 420, border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={selCat.icon} size={18} color="#fff" strokeWidth={1.8} />
            </div>
            <h3 style={{ color: T.text, fontSize: 17, fontWeight: 700, margin: 0 }}>{isNew ? "New Bill" : "Edit Bill"}</h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={16} color={T.textSub} />
          </button>
        </div>

        <div style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Bill name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Electric Bill" style={S.input} autoFocus />
          </div>

          <div>
            <label style={S.label}>Category</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {BILL_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={{ background: cat === c.id ? `${c.color}18` : "rgba(255,255,255,0.03)", border: cat === c.id ? `1px solid ${c.color}50` : "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                  <Icon name={c.icon} size={14} color={cat === c.id ? c.color : T.textSub} />
                  <span style={{ color: cat === c.id ? c.color : T.textMid, fontSize: 12, fontWeight: cat === c.id ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>Amount ($)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" style={{ ...S.input, paddingLeft: 26 }} />
              </div>
            </div>
            <div>
              <label style={S.label}>Due day of month</label>
              <select value={dueDay} onChange={e => setDueDay(e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={S.label}>Remind me this many days before due</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
              {[1, 2, 3, 5, 7].map(d => (
                <button key={d} onClick={() => setReminder(d)} style={{ background: reminder === d ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.03)", border: reminder === d ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "9px 0", cursor: "pointer", color: reminder === d ? T.purple : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: reminder === d ? 700 : 400, fontSize: 13 }}>{d}d</button>
              ))}
            </div>
            <p style={{ color: T.textSub, fontSize: 11, margin: "6px 0 0" }}>We will remind you {reminder} day{reminder > 1 ? "s" : ""} before the {dueDay}{parseInt(dueDay) === 1 ? "st" : parseInt(dueDay) === 2 ? "nd" : parseInt(dueDay) === 3 ? "rd" : "th"} of each month.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 15px" }}>
            <div>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>Autopay enabled</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Bill is paid automatically by your bank</p>
            </div>
            <Toggle value={autopay} onChange={setAutopay} />
          </div>

          <div>
            <label style={S.label}>Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Varies by usage, 18 months left..." style={S.input} />
          </div>

          <button onClick={save} style={{ ...S.primaryBtn(), opacity: name.trim() && amount && dueDay ? 1 : 0.4 }}>
            {isNew ? "Add Bill" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillsTab({ profileSubs = [] }) {
  const merged = [...INITIAL_BILLS];
  profileSubs.forEach(s => {
    if (s.name && !merged.find(b => b.name === s.name)) merged.push(s);
  });
  const [bills, setBills] = useState(merged);
  const [showAdd,      setShowAdd]      = useState(false);
  const [editBill,     setEditBill]     = useState(null);
  const [filterCat,    setFilterCat]    = useState("all");
  const [confirmPaid,  setConfirmPaid]  = useState(null);
  const [paidThisMonth,setPaidThisMonth] = useState([]);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleDateString([], { month: "long", year: "numeric" });

  const totalMonthly = bills.reduce((a, b) => a + b.amount, 0);
  const totalAutopay = bills.filter(b => b.autopay).reduce((a, b) => a + b.amount, 0);
  const totalManual  = totalMonthly - totalAutopay;

  const getDaysUntilDue = (dueDay) => {
    let d = dueDay - currentDay;
    if (d < 0) d += 28;
    return d;
  };

  const getUrgency = (dueDay) => {
    const days = getDaysUntilDue(dueDay);
    if (days === 0) return { label: "Due Today", color: T.red,    bg: `${T.red}15`    };
    if (days <= 2)  return { label: `Due in ${days}d`, color: T.red,   bg: `${T.red}10`   };
    if (days <= 5)  return { label: `Due in ${days}d`, color: T.gold,  bg: `${T.gold}10`  };
    if (days <= 7)  return { label: `Due in ${days}d`, color: T.accent,bg: `${T.accent}10`};
    return { label: `Due ${dueDay}${dueDay===1?"st":dueDay===2?"nd":dueDay===3?"rd":"th"}`, color: T.textSub, bg: "rgba(255,255,255,0.04)" };
  };

  const saveBill  = (b) => { setBills(prev => prev.find(x => x.id === b.id) ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]); setShowAdd(false); setEditBill(null); };
  const deleteBill = (id) => { setBills(prev => prev.filter(b => b.id !== id)); setEditBill(null); };
  const markPaid  = (id) => { setPaidThisMonth(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); setConfirmPaid(null); };

  const filtered = filterCat === "all" ? bills : bills.filter(b => b.category === filterCat);
  const sorted   = [...filtered].sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay));

  // Upcoming bills this week
  const upcoming = [...bills].filter(b => getDaysUntilDue(b.dueDay) <= 7 && !paidThisMonth.includes(b.id)).sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay));

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>

      {/* Header summary card */}
      <div style={{ ...S.card, background: GRAD.purple, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, left: 30, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 4px" }}>{currentMonth}</p>
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 32, margin: "0 0 4px", letterSpacing: -1 }}>${totalMonthly.toLocaleString()}</p>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "0 0 18px" }}>Total monthly bills ({bills.length} bills)</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Autopay",  value: `$${totalAutopay.toLocaleString()}`,    sub: `${bills.filter(b => b.autopay).length} bills` },
            { label: "Manual",   value: `$${totalManual.toLocaleString()}`,      sub: `${bills.filter(b => !b.autopay).length} bills` },
            { label: "Paid",     value: `${paidThisMonth.length}/${bills.length}`, sub: "this month" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: "1px 0 0" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming this week */}
      {upcoming.length > 0 && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.red, boxShadow: `0 0 8px ${T.red}` }} />
            <SectionLabel>Needs Attention This Week</SectionLabel>
          </div>
          {upcoming.map(bill => {
            const urgency = getUrgency(bill.dueDay);
            const paid = paidThisMonth.includes(bill.id);
            return (
              <div key={bill.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${bill.color}20`, border: `1px solid ${bill.color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={bill.icon} size={16} color={bill.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: T.text, fontWeight: 600, fontSize: 14, margin: 0 }}>{bill.name}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>${bill.amount.toLocaleString()} &middot; {bill.autopay ? "Autopay" : "Manual"}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  <span style={{ background: urgency.bg, color: urgency.color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>{urgency.label}</span>
                  {!bill.autopay && !paid && (
                    <button onClick={() => setConfirmPaid(bill)} style={{ background: "rgba(29,217,160,0.12)", border: "1px solid rgba(29,217,160,0.25)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", color: T.green, fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Mark Paid</button>
                  )}
                  {paid && <span style={{ color: T.green, fontSize: 11, fontWeight: 600 }}>Paid</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category filter + add button */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {[{ id: "all", label: "All" }, ...BILL_CATEGORIES].map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ flexShrink: 0, background: filterCat === c.id ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.03)", border: filterCat === c.id ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 99, padding: "5px 13px", cursor: "pointer", color: filterCat === c.id ? T.purple : T.textSub, fontSize: 12, fontWeight: filterCat === c.id ? 700 : 400, fontFamily: "'Inter',sans-serif", whiteSpace: "nowrap" }}>{c.label}</button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: GRAD.purple, border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(123,110,246,0.4)" }}>
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      {/* Bills list */}
      {sorted.map(bill => {
        const urgency = getUrgency(bill.dueDay);
        const paid = paidThisMonth.includes(bill.id);
        const daysLeft = getDaysUntilDue(bill.dueDay);

        return (
          <div key={bill.id} style={{ ...S.card, padding: 0, overflow: "hidden", opacity: paid ? 0.6 : 1, transition: "opacity 0.3s" }}>
            {/* Color accent top bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${bill.color}, ${bill.color}55)`, boxShadow: `0 0 8px ${bill.color}55` }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${bill.color}18`, border: `1px solid ${bill.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={bill.icon} size={19} color={bill.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ color: paid ? T.textSub : T.text, fontWeight: 700, fontSize: 15, margin: 0, textDecoration: paid ? "line-through" : "none" }}>{bill.name}</p>
                      <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{BILL_CATEGORIES.find(c => c.id === bill.category)?.label}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: paid ? T.textSub : bill.color, fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: -0.5 }}>${bill.amount.toLocaleString()}</p>
                      <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>per month</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={{ background: urgency.bg, color: urgency.color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>{urgency.label}</span>
                {bill.autopay
                  ? <span style={{ background: "rgba(29,217,160,0.1)", color: T.green, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6 }}>Autopay</span>
                  : <span style={{ background: "rgba(245,166,35,0.1)", color: T.gold, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6 }}>Manual</span>
                }
                {bill.reminderDays && <span style={{ background: "rgba(123,110,246,0.1)", color: T.purple, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 6 }}>Reminder: {bill.reminderDays}d before</span>}
                {paid && <span style={{ background: "rgba(29,217,160,0.12)", color: T.green, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>Paid this month</span>}
              </div>

              {bill.notes ? <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 12px", fontStyle: "italic", lineHeight: 1.5 }}>{bill.notes}</p> : null}

              <div style={{ display: "flex", gap: 7 }}>
                {!bill.autopay && !paid && (
                  <button onClick={() => setConfirmPaid(bill)} style={{ flex: 2, background: "rgba(29,217,160,0.1)", border: "1px solid rgba(29,217,160,0.25)", borderRadius: 9, padding: "8px 0", cursor: "pointer", color: T.green, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Icon name="check" size={13} color={T.green} strokeWidth={2.5} />
                    Mark Paid
                  </button>
                )}
                {paid && (
                  <button onClick={() => markPaid(bill.id)} style={{ flex: 2, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "8px 0", cursor: "pointer", color: T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 12 }}>
                    Undo Paid
                  </button>
                )}
                <button onClick={() => setEditBill(bill)} style={{ flex: 1, background: "rgba(123,110,246,0.08)", border: "1px solid rgba(123,110,246,0.2)", borderRadius: 9, padding: "8px 0", cursor: "pointer", color: T.purple, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Icon name="edit" size={13} color={T.purple} />
                  Edit
                </button>
                <button onClick={() => deleteBill(bill.id)} style={{ background: "rgba(255,90,110,0.08)", border: "1px solid rgba(255,90,110,0.18)", borderRadius: 9, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="x" size={14} color={T.red} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 4px 16px rgba(123,110,246,0.4)" }}>
            <Icon name="calendar" size={24} color="#fff" />
          </div>
          <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>No bills in this category</p>
          <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>Tap + to add your first bill</p>
        </div>
      )}

      {/* Monthly breakdown by category */}
      <div style={S.card}>
        <SectionLabel>Monthly Breakdown</SectionLabel>
        {BILL_CATEGORIES.map(cat => {
          const catBills = bills.filter(b => b.category === cat.id);
          if (!catBills.length) return null;
          const total = catBills.reduce((a, b) => a + b.amount, 0);
          const pct = Math.round((total / totalMonthly) * 100);
          return (
            <div key={cat.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon name={cat.icon} size={13} color={cat.color} />
                  <span style={{ color: T.textMid, fontSize: 12 }}>{cat.label}</span>
                  <span style={{ color: T.textSub, fontSize: 11 }}>({catBills.length})</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: cat.color, fontSize: 12, fontWeight: 700 }}>${total.toLocaleString()}</span>
                  <span style={{ color: T.textSub, fontSize: 11, width: 28, textAlign: "right" }}>{pct}%</span>
                </div>
              </div>
              <ProgressBar pct={pct} color={cat.color} height={4} />
            </div>
          );
        })}
      </div>

      <p style={{ color: "#1A2740", fontSize: 11, textAlign: "center" }}>Reminders are sent based on your notification settings. Autopay bills are tracked but not charged through FreedomFund.</p>

      {/* Add/Edit modal */}
      {showAdd && <AddEditBillModal onClose={() => setShowAdd(false)} onSave={saveBill} />}
      {editBill && <AddEditBillModal bill={editBill} onClose={() => setEditBill(null)} onSave={saveBill} />}

      {/* Mark paid confirmation */}
      {confirmPaid && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 24 }} onClick={() => setConfirmPaid(null)}>
          <div onClick={e => e.stopPropagation()} style={{ ...S.card, width: "100%", maxWidth: 360, padding: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(29,217,160,0.15)", border: "1px solid rgba(29,217,160,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon name="check" size={22} color={T.green} strokeWidth={2.5} />
            </div>
            <h3 style={{ color: T.text, fontSize: 17, fontWeight: 700, textAlign: "center", margin: "0 0 6px" }}>Mark as Paid?</h3>
            <p style={{ color: T.textSub, fontSize: 13, textAlign: "center", margin: "0 0 6px" }}>{confirmPaid.name}</p>
            <p style={{ color: T.green, fontSize: 22, fontWeight: 900, textAlign: "center", margin: "0 0 20px", letterSpacing: -0.5 }}>${confirmPaid.amount.toLocaleString()}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmPaid(null)} style={{ flex: 1, ...S.ghostBtn, padding: "11px 0" }}>Cancel</button>
              <button onClick={() => markPaid(confirmPaid.id)} style={{ flex: 2, background: "rgba(29,217,160,0.15)", border: "1px solid rgba(29,217,160,0.3)", borderRadius: 12, padding: "11px 0", cursor: "pointer", color: T.green, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 16px rgba(29,217,160,0.2)" }}>
                Yes, Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Daily Check-In ────────────────────────────────────────────────────────────
function DailyCheckIn({ profile, goals, onClose, onLog }) {
  const [spent, setSpent] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const dailyLimit = Math.round(((profile?.monthlyIncome || 4200) - (profile?.totalFixed || 2100)) / 30);
  const spentAmt = parseFloat(spent) || 0;
  const isOver = spentAmt > dailyLimit;
  const cats = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Other"];
  const topGoal = goals.reduce((a, g) => (g.target - g.saved < a.target - a.saved ? g : a), goals[0]);

  if (done) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: 24 }}>
      <div style={{ ...S.card, width: "100%", maxWidth: 360, textAlign: "center", padding: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: isOver ? `${T.red}18` : `${T.green}18`, border: `1px solid ${isOver ? T.red : T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon name={isOver ? "zap" : "check"} size={30} color={isOver ? T.red : T.green} strokeWidth={2} />
        </div>
        <h3 style={{ color: T.text, fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{isOver ? "Over budget today" : "Great job today!"}</h3>
        <p style={{ color: T.textMid, fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
          {isOver
            ? `You spent $${spentAmt} vs your $${dailyLimit} daily target. That is $${(spentAmt - dailyLimit).toFixed(2)} over. Tomorrow is a fresh start.`
            : `You spent $${spentAmt} vs your $${dailyLimit} daily target. You saved $${(dailyLimit - spentAmt).toFixed(2)} today.`}
        </p>
        {topGoal && (
          <div style={{ background: "rgba(123,110,246,0.1)", border: "1px solid rgba(123,110,246,0.2)", borderRadius: 10, padding: 12, marginBottom: 20 }}>
            <p style={{ color: T.purple, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              Your <strong>{topGoal.name}</strong> goal is {Math.round((topGoal.saved / topGoal.target) * 100)}% funded. Keep going.
            </p>
          </div>
        )}
        <button onClick={onClose} style={S.primaryBtn()}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(10px)" }}>
      <div style={{ background: T.surface, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 420, border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <p style={{ color: T.textSub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>Daily Check-In</p>
            <h3 style={{ color: T.text, fontSize: 20, fontWeight: 800, margin: "3px 0 0" }}>What did you spend today?</h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={16} color={T.textSub} />
          </button>
        </div>
        <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 20px" }}>Daily target: <strong style={{ color: T.green }}>${dailyLimit}</strong></p>

        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 20, fontWeight: 700 }}>$</span>
          <input value={spent} onChange={e => setSpent(e.target.value)} type="number" placeholder="0.00" autoFocus style={{ ...S.input, paddingLeft: 36, fontSize: 28, fontWeight: 800, color: isOver && spent ? T.red : T.text }} />
        </div>
        {spent && (
          <div style={{ background: isOver ? `${T.red}0f` : `${T.green}0f`, border: `1px solid ${isOver ? T.red : T.green}25`, borderRadius: 8, padding: 10, marginBottom: 14 }}>
            <p style={{ color: isOver ? T.red : T.green, fontSize: 12, fontWeight: 600, margin: 0 }}>
              {isOver ? `$${(spentAmt - dailyLimit).toFixed(2)} over your daily limit` : `$${(dailyLimit - spentAmt).toFixed(2)} under your daily limit`}
            </p>
          </div>
        )}

        <label style={S.label}>Category</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ background: category === c ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.04)", border: category === c ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: category === c ? T.purple : T.textMid, fontSize: 12, fontWeight: category === c ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{c}</button>
          ))}
        </div>

        <label style={S.label}>Note (optional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Lunch at work, Uber home..." style={{ ...S.input, marginBottom: 18 }} />

        <button onClick={() => { if (spent) { onLog({ amount: spentAmt, category, note }); setDone(true); } }} style={{ ...S.primaryBtn(), opacity: spent ? 1 : 0.4 }}>Log My Day</button>
      </div>
    </div>
  );
}

// ── Net Worth Tracker ─────────────────────────────────────────────────────────
function NetWorthTab({ goals, profile }) {
  const [assets, setAssets] = useState([
    { id: 1, name: "Checking Account",   amount: 2840,  cat: "Cash",        icon: "wallet"    },
    { id: 2, name: "Savings Account",    amount: 8200,  cat: "Cash",        icon: "shield"    },
    { id: 3, name: "Investment Account", amount: 14200, cat: "Investments", icon: "trendUp"   },
    { id: 4, name: "Car Value",          amount: 18000, cat: "Property",    icon: "send"      },
  ]);
  const [liabilities, setLiabilities] = useState([
    { id: 1, name: "Car Loan",       amount: 12400, rate: 5.9,  cat: "Loan",       icon: "send"       },
    { id: 2, name: "Student Loans",  amount: 28000, rate: 4.5,  cat: "Loan",       icon: "book"       },
    { id: 3, name: "Credit Card",    amount: 1800,  rate: 21.9, cat: "Credit Card", icon: "dollarSign" },
  ]);
  const [editMode, setEditMode]   = useState(false);
  const [showAddA, setShowAddA]   = useState(false);
  const [showAddL, setShowAddL]   = useState(false);
  const [newName, setNewName]     = useState("");
  const [newAmt,  setNewAmt]      = useState("");
  const [newRate, setNewRate]     = useState("");
  const [newCat,  setNewCat]      = useState("");

  const goalsSaved = goals.reduce((a, g) => a + g.saved, 0);
  const totalAssets = assets.reduce((a, x) => a + x.amount, 0) + goalsSaved;
  const totalLiabilities = liabilities.reduce((a, x) => a + x.amount, 0);
  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;

  const history = [
    { mo: "Jan", nw: netWorth - 4200 },
    { mo: "Feb", nw: netWorth - 3100 },
    { mo: "Mar", nw: netWorth - 2800 },
    { mo: "Apr", nw: netWorth - 1600 },
    { mo: "May", nw: netWorth - 900  },
    { mo: "Jun", nw: netWorth        },
  ];
  const minNW = Math.min(...history.map(h => h.nw));
  const maxNW = Math.max(...history.map(h => h.nw));
  const W = 340, H = 80;
  const pts = history.map((h, i) => `${(i / (history.length - 1)) * W},${H - ((h.nw - minNW) / (maxNW - minNW || 1)) * (H - 12) - 6}`).join(" ");

  const addAsset = () => { if (!newName || !newAmt) return; setAssets(p => [...p, { id: Date.now(), name: newName, amount: parseFloat(newAmt), cat: newCat || "Other", icon: "dollarSign" }]); setNewName(""); setNewAmt(""); setNewCat(""); setShowAddA(false); };
  const addLiability = () => { if (!newName || !newAmt) return; setLiabilities(p => [...p, { id: Date.now(), name: newName, amount: parseFloat(newAmt), rate: parseFloat(newRate) || 0, cat: newCat || "Other", icon: "dollarSign" }]); setNewName(""); setNewAmt(""); setNewRate(""); setNewCat(""); setShowAddL(false); };

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>

      {/* Net worth hero */}
      <div style={{ ...S.card, background: isPositive ? "linear-gradient(135deg, #0D1B30 0%, #0A2218 100%)" : "linear-gradient(135deg, #1A0D18 0%, #0D1B30 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: isPositive ? "rgba(29,217,160,0.07)" : "rgba(255,90,110,0.07)" }} />
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 6px" }}>Total Net Worth</p>
        <p style={{ color: isPositive ? T.green : T.red, fontWeight: 900, fontSize: 36, margin: "0 0 4px", letterSpacing: -1 }}>
          {isPositive ? "" : "-"}${Math.abs(netWorth).toLocaleString()}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
          <Icon name={isPositive ? "arrowUp" : "arrowDown"} size={13} color={isPositive ? T.green : T.red} />
          <span style={{ color: isPositive ? T.green : T.red, fontSize: 12, fontWeight: 600 }}>+$900 from last month</span>
        </div>

        {/* Trend chart */}
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? T.green : T.red} stopOpacity="0.2" />
              <stop offset="100%" stopColor={isPositive ? T.green : T.red} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#nwGrad)" />
          <polyline points={pts} fill="none" stroke={isPositive ? T.green : T.red} strokeWidth="2" />
          {history.map((h, i) => (
            <circle key={i} cx={(i / (history.length - 1)) * W} cy={H - ((h.nw - minNW) / (maxNW - minNW || 1)) * (H - 12) - 6} r={3} fill={isPositive ? T.green : T.red} />
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {history.map(h => <span key={h.mo} style={{ color: T.textSub, fontSize: 10 }}>{h.mo}</span>)}
        </div>
      </div>

      {/* Assets vs Liabilities summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ ...S.card, padding: 14 }}>
          <p style={{ color: T.textSub, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Total Assets</p>
          <p style={{ color: T.green, fontWeight: 800, fontSize: 20, margin: 0 }}>${totalAssets.toLocaleString()}</p>
          <p style={{ color: T.textSub, fontSize: 10, margin: "3px 0 0" }}>incl. ${goalsSaved.toLocaleString()} in goals</p>
        </div>
        <div style={{ ...S.card, padding: 14 }}>
          <p style={{ color: T.textSub, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Total Liabilities</p>
          <p style={{ color: T.red, fontWeight: 800, fontSize: 20, margin: 0 }}>${totalLiabilities.toLocaleString()}</p>
          <p style={{ color: T.textSub, fontSize: 10, margin: "3px 0 0" }}>{liabilities.length} debts tracked</p>
        </div>
      </div>

      {/* Assets */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>Assets</SectionLabel>
          <button onClick={() => setShowAddA(true)} style={{ background: GRAD.green || "rgba(29,217,160,0.15)", border: "1px solid rgba(29,217,160,0.3)", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: T.green, fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="plus" size={12} color={T.green} />Add
          </button>
        </div>
        {[...assets, { id: "goals", name: "Savings Goals", amount: goalsSaved, cat: "Savings", icon: "target", isGoal: true }].map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(29,217,160,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={a.icon} size={15} color={T.green} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{a.name}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "1px 0 0" }}>{a.cat}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ color: T.green, fontWeight: 700, fontSize: 14, margin: 0 }}>${a.amount.toLocaleString()}</p>
              {!a.isGoal && <button onClick={() => setAssets(p => p.filter(x => x.id !== a.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.5 }}><Icon name="x" size={13} color={T.red} /></button>}
            </div>
          </div>
        ))}
        {showAddA && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Asset name (e.g. Savings Account)" style={S.input} />
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
              <input value={newAmt} onChange={e => setNewAmt(e.target.value)} type="number" placeholder="Value" style={{ ...S.input, paddingLeft: 26 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addAsset} style={{ ...S.primaryBtn(T.green), flex: 2, padding: "10px 0" }}>Add Asset</button>
              <button onClick={() => setShowAddA(false)} style={{ ...S.ghostBtn, flex: 1, padding: "10px 0" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Liabilities */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>Liabilities</SectionLabel>
          <button onClick={() => setShowAddL(true)} style={{ background: "rgba(255,90,110,0.1)", border: "1px solid rgba(255,90,110,0.25)", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: T.red, fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="plus" size={12} color={T.red} />Add
          </button>
        </div>
        {liabilities.map(l => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,90,110,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={l.icon} size={15} color={T.red} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{l.name}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "1px 0 0" }}>{l.rate}% APR &middot; {l.cat}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ color: T.red, fontWeight: 700, fontSize: 14, margin: 0 }}>${l.amount.toLocaleString()}</p>
              <button onClick={() => setLiabilities(p => p.filter(x => x.id !== l.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.5 }}><Icon name="x" size={13} color={T.red} /></button>
            </div>
          </div>
        ))}
        {showAddL && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Liability name (e.g. Car Loan)" style={S.input} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
                <input value={newAmt} onChange={e => setNewAmt(e.target.value)} type="number" placeholder="Balance" style={{ ...S.input, paddingLeft: 26 }} />
              </div>
              <div style={{ position: "relative" }}>
                <input value={newRate} onChange={e => setNewRate(e.target.value)} type="number" placeholder="APR %" step="0.1" style={S.input} />
                <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 12 }}>%</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addLiability} style={{ ...S.primaryBtn(T.red), flex: 2, padding: "10px 0" }}>Add Liability</button>
              <button onClick={() => setShowAddL(false)} style={{ ...S.ghostBtn, flex: 1, padding: "10px 0" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <p style={{ color: "#1A2740", fontSize: 11, textAlign: "center" }}>Net worth is calculated from assets and liabilities you enter here. Connect your bank for automatic updates.</p>
    </div>
  );
}

// ── Debt Payoff Planner ───────────────────────────────────────────────────────
function DebtPayoffTab() {
  const [debts, setDebts] = useState([
    { id: 1, name: "Credit Card",   balance: 1800,  rate: 21.9, minPayment: 45  },
    { id: 2, name: "Car Loan",      balance: 12400, rate: 5.9,  minPayment: 380 },
    { id: 3, name: "Student Loan",  balance: 28000, rate: 4.5,  minPayment: 210 },
  ]);
  const [method, setMethod] = useState("avalanche"); // avalanche | snowball
  const [extra, setExtra] = useState("100");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBal, setNewBal] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newMin, setNewMin] = useState("");

  const totalDebt = debts.reduce((a, d) => a + d.balance, 0);
  const totalMin  = debts.reduce((a, d) => a + d.minPayment, 0);
  const monthlyExtra = parseFloat(extra) || 0;

  const sorted = method === "avalanche"
    ? [...debts].sort((a, b) => b.rate - a.rate)
    : [...debts].sort((a, b) => a.balance - b.balance);

  const estimatePayoff = (debt) => {
    let bal = debt.balance;
    let months = 0;
    const payment = debt.minPayment + (sorted[0].id === debt.id ? monthlyExtra : 0);
    while (bal > 0 && months < 600) {
      bal = bal * (1 + debt.rate / 1200) - payment;
      months++;
    }
    return months;
  };

  const totalInterest = debts.reduce((a, d) => {
    let bal = d.balance, interest = 0, months = 0;
    while (bal > 0 && months < 600) {
      const i = bal * (d.rate / 1200);
      interest += i;
      bal = bal * (1 + d.rate / 1200) - d.minPayment;
      months++;
    }
    return a + interest;
  }, 0);

  const addDebt = () => {
    if (!newName || !newBal || !newRate) return;
    setDebts(p => [...p, { id: Date.now(), name: newName, balance: parseFloat(newBal), rate: parseFloat(newRate), minPayment: parseFloat(newMin) || 25 }]);
    setNewName(""); setNewBal(""); setNewRate(""); setNewMin(""); setShowAdd(false);
  };

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>

      {/* Hero */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D18 0%, #0D1232 100%)" }}>
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px" }}>Total Debt</p>
        <p style={{ color: T.red, fontWeight: 900, fontSize: 32, margin: "0 0 4px", letterSpacing: -1 }}>${totalDebt.toLocaleString()}</p>
        <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 16px" }}>Est. ${Math.round(totalInterest).toLocaleString()} in interest at current payments</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 11 }}>
            <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 3px" }}>Min Monthly</p>
            <p style={{ color: T.text, fontWeight: 700, fontSize: 16, margin: 0 }}>${totalMin}/mo</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 11 }}>
            <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 3px" }}>Extra Payment</p>
            <p style={{ color: T.green, fontWeight: 700, fontSize: 16, margin: 0 }}>${monthlyExtra}/mo</p>
          </div>
        </div>
      </div>

      {/* Extra payment slider */}
      <div style={S.card}>
        <SectionLabel>Extra Monthly Payment</SectionLabel>
        <p style={{ color: T.textSub, fontSize: 12, margin: "-6px 0 12px", lineHeight: 1.5 }}>Pay more than the minimum and throw all extra at one debt at a time. This is how you get out fast.</p>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
          <input value={extra} onChange={e => setExtra(e.target.value)} type="number" placeholder="100" style={{ ...S.input, paddingLeft: 26, fontSize: 18, fontWeight: 700 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[50, 100, 200, 500].map(v => (
            <button key={v} onClick={() => setExtra(String(v))} style={{ flex: 1, background: extra === String(v) ? "rgba(123,110,246,0.15)" : "rgba(255,255,255,0.04)", border: extra === String(v) ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 0", cursor: "pointer", color: extra === String(v) ? T.purple : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13 }}>${v}</button>
          ))}
        </div>
      </div>

      {/* Method selector */}
      <div style={S.card}>
        <SectionLabel>Payoff Strategy</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { id: "avalanche", label: "Avalanche", icon: "zap",    color: T.red,    desc: "Highest interest rate first. Saves the most money overall." },
            { id: "snowball",  label: "Snowball",  icon: "repeat",  color: T.accent, desc: "Smallest balance first. Fastest psychological wins." },
          ].map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{ background: method === m.id ? `${m.color}15` : "rgba(255,255,255,0.03)", border: method === m.id ? `1px solid ${m.color}40` : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                <Icon name={m.icon} size={15} color={method === m.id ? m.color : T.textSub} />
                <span style={{ color: method === m.id ? m.color : T.text, fontSize: 13, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>{m.label}</span>
                {method === m.id && <Icon name="check" size={13} color={m.color} strokeWidth={2.5} />}
              </div>
              <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Payoff order */}
        <p style={{ color: T.textSub, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px", fontWeight: 600 }}>Payoff Order — Focus here first</p>
        {sorted.map((d, i) => {
          const months = estimatePayoff(d);
          const yrs = Math.floor(months / 12);
          const mo  = months % 12;
          const pct = Math.round((1 - d.balance / (totalDebt || 1)) * 100);
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: i === 0 ? GRAD.purple : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: i === 0 ? "0 2px 10px rgba(123,110,246,0.4)" : "none" }}>
                <span style={{ color: i === 0 ? "#fff" : T.textSub, fontSize: 12, fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: T.text, fontWeight: 600, fontSize: 13, margin: 0 }}>{d.name}</p>
                <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>${d.balance.toLocaleString()} &middot; {d.rate}% APR</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: i === 0 ? T.purple : T.textMid, fontSize: 12, fontWeight: 700, margin: 0 }}>{yrs > 0 ? `${yrs}y ` : ""}{mo}m</p>
                <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>to pay off</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add debt */}
      {showAdd ? (
        <div style={S.card}>
          <SectionLabel>Add a Debt</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Debt name (e.g. Credit Card)" style={S.input} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 12 }}>$</span><input value={newBal} onChange={e => setNewBal(e.target.value)} type="number" placeholder="Balance" style={{ ...S.input, paddingLeft: 22, fontSize: 13 }} /></div>
              <input value={newRate} onChange={e => setNewRate(e.target.value)} type="number" placeholder="APR %" step="0.1" style={S.input} />
              <div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 12 }}>$</span><input value={newMin} onChange={e => setNewMin(e.target.value)} type="number" placeholder="Min/mo" style={{ ...S.input, paddingLeft: 22, fontSize: 13 }} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addDebt} style={{ ...S.primaryBtn(), flex: 2, padding: "10px 0" }}>Add Debt</button>
              <button onClick={() => setShowAdd(false)} style={{ ...S.ghostBtn, flex: 1, padding: "10px 0" }}>Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{ background: "rgba(255,90,110,0.08)", border: "1px solid rgba(255,90,110,0.2)", borderRadius: 12, padding: "13px 0", cursor: "pointer", color: T.red, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="plus" size={16} color={T.red} />Add a Debt
        </button>
      )}

      <p style={{ color: "#1A2740", fontSize: 11, textAlign: "center" }}>Payoff estimates assume consistent minimum payments plus extra. Interest calculations are approximate.</p>
    </div>
  );
}

// ── Financial Health Score ────────────────────────────────────────────────────
function HealthScore({ goals, profile }) {
  const mo = profile?.monthlyIncome || 4200;
  const totalSaved = goals.reduce((a, g) => a + g.saved, 0);
  const emergFund = goals.find(g => g.name.toLowerCase().includes("emergency"));
  const months = emergFund ? emergFund.saved / (mo * 0.6) : 0;

  const scores = [
    {
      label: "Emergency Fund",
      score: Math.min(100, Math.round(months / 6 * 100)),
      weight: 25,
      color: T.green,
      icon: "shield",
      grade: months >= 6 ? "A" : months >= 3 ? "B" : months >= 1 ? "C" : "D",
      tip: months >= 6 ? "Fully funded — 6+ months covered." : `You have ${months.toFixed(1)} months covered. Target is 6 months.`,
    },
    {
      label: "Savings Rate",
      score: Math.min(100, Math.round((profile?.monthlyIncome ? 860 / mo * 100 / 20 * 100 : 50))),
      weight: 25,
      color: T.accent,
      icon: "trendUp",
      grade: 860 / mo >= 0.2 ? "A" : 860 / mo >= 0.1 ? "B" : 860 / mo >= 0.05 ? "C" : "D",
      tip: `You are saving ${Math.round(860 / mo * 100)}% of income. Target is 20%+.`,
    },
    {
      label: "Debt Load",
      score: 62,
      weight: 25,
      color: T.gold,
      icon: "wallet",
      grade: "C",
      tip: "Your debt-to-income ratio is moderate. Focus on high-interest debt first.",
    },
    {
      label: "Bill Payment",
      score: 90,
      weight: 15,
      color: T.purple,
      icon: "calendar",
      grade: "A",
      tip: "Bills paid consistently on time. Excellent payment history.",
    },
    {
      label: "Spending Control",
      score: 70,
      weight: 10,
      color: T.blue,
      icon: "barChart",
      grade: "B",
      tip: "Spending is mostly on target. Watch dining and subscriptions.",
    },
  ];

  const overallScore = Math.round(scores.reduce((a, s) => a + s.score * (s.weight / 100), 0));
  const overallGrade = overallScore >= 90 ? "A+" : overallScore >= 80 ? "A" : overallScore >= 70 ? "B" : overallScore >= 60 ? "C" : "D";
  const gradeColor = overallScore >= 80 ? T.green : overallScore >= 65 ? T.gold : T.red;

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>
      {/* Overall score */}
      <div style={{ ...S.card, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${gradeColor}15 0%, transparent 65%)` }} />
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 16px", position: "relative" }}>Financial Health Score</p>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 120, height: 120, borderRadius: "50%", background: `conic-gradient(${gradeColor} ${overallScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, marginBottom: 14, position: "relative" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: T.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: gradeColor, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{overallGrade}</span>
            <span style={{ color: T.textSub, fontSize: 12 }}>{overallScore}/100</span>
          </div>
        </div>
        <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.6, position: "relative" }}>
          {overallScore >= 80 ? "Your finances are in great shape. Keep building." : overallScore >= 65 ? "Solid foundation. A few areas need attention." : "Your finances need some work. Start with the lowest grade below."}
        </p>
      </div>

      {/* Category scores */}
      {scores.map(s => (
        <div key={s.label} style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={s.icon} size={17} color={s.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{s.label}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Weight: {s.weight}% of total score</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${s.color}20`, border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: s.color, fontSize: 14, fontWeight: 900 }}>{s.grade}</span>
            </div>
          </div>
          <ProgressBar pct={s.score} color={s.color} height={6} />
          <p style={{ color: T.textSub, fontSize: 12, margin: "8px 0 0", lineHeight: 1.5 }}>{s.tip}</p>
        </div>
      ))}
    </div>
  );
}

// ── What-If Calculator ────────────────────────────────────────────────────────
function WhatIfCalculator({ goals, profile }) {
  const [category, setCategory] = useState("dining");
  const [savingsPerMonth, setSavingsPerMonth] = useState("200");
  const [targetGoal, setTargetGoal] = useState(goals[0]?.id || null);

  const categories = [
    { id: "dining",        label: "Cut dining out",         icon: "dollarSign", currentSpend: 380  },
    { id: "subscriptions", label: "Cancel subscriptions",   icon: "repeat",     currentSpend: 130  },
    { id: "shopping",      label: "Reduce shopping",        icon: "package",    currentSpend: 340  },
    { id: "coffee",        label: "Skip daily coffee",      icon: "zap",        currentSpend: 120  },
    { id: "transport",     label: "Cut transport costs",    icon: "send",       currentSpend: 190  },
    { id: "custom",        label: "Custom amount",          icon: "barChart",   currentSpend: 0    },
  ];

  const sel = categories.find(c => c.id === category);
  const monthly = category === "custom" ? (parseFloat(savingsPerMonth) || 0) : (parseFloat(savingsPerMonth) || sel?.currentSpend || 0);
  const yearly  = monthly * 12;
  const goal    = goals.find(g => g.id === parseInt(targetGoal)) || goals[0];
  const remaining = goal ? Math.max(0, goal.target - goal.saved) : 0;
  const monthsToGoal = monthly > 0 ? Math.ceil(remaining / monthly) : null;

  const invested5yr  = Math.round(monthly * 12 * ((Math.pow(1.105, 5)  - 1) / 0.105 * 1.105));
  const invested10yr = Math.round(monthly * 12 * ((Math.pow(1.105, 10) - 1) / 0.105 * 1.105));

  return (
    <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #0E1232 0%, #1A0D18 100%)" }}>
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 6px" }}>What If Calculator</p>
        <p style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>What if I cut my spending — how much faster do I hit my goals?</p>
      </div>

      {/* Category picker */}
      <div style={S.card}>
        <SectionLabel>What would you cut?</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {categories.map(c => (
            <button key={c.id} onClick={() => { setCategory(c.id); if (c.id !== "custom") setSavingsPerMonth(String(c.currentSpend)); }} style={{ background: category === c.id ? "rgba(123,110,246,0.12)" : "rgba(255,255,255,0.03)", border: category === c.id ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name={c.icon} size={15} color={category === c.id ? T.purple : T.textSub} />
                <span style={{ color: category === c.id ? T.purple : T.text, fontSize: 13, fontWeight: category === c.id ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{c.label}</span>
              </div>
              {c.currentSpend > 0 && <span style={{ color: T.textSub, fontSize: 12 }}>~${c.currentSpend}/mo</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <div style={S.card}>
        <SectionLabel>How much would you save per month?</SectionLabel>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
          <input value={savingsPerMonth} onChange={e => setSavingsPerMonth(e.target.value)} type="number" placeholder="0" style={{ ...S.input, paddingLeft: 28, fontSize: 22, fontWeight: 800 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[50, 100, 200, 300].map(v => (
            <button key={v} onClick={() => setSavingsPerMonth(String(v))} style={{ flex: 1, background: savingsPerMonth === String(v) ? "rgba(123,110,246,0.12)" : "rgba(255,255,255,0.04)", border: savingsPerMonth === String(v) ? "1px solid rgba(123,110,246,0.35)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "7px 0", cursor: "pointer", color: savingsPerMonth === String(v) ? T.purple : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 12 }}>${v}</button>
          ))}
        </div>
      </div>

      {/* Target goal */}
      {goals.length > 0 && (
        <div style={S.card}>
          <SectionLabel>Apply toward which goal?</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {goals.map(g => (
              <button key={g.id} onClick={() => setTargetGoal(g.id)} style={{ background: targetGoal === g.id ? "rgba(123,110,246,0.12)" : "rgba(255,255,255,0.03)", border: targetGoal === g.id ? "1px solid rgba(123,110,246,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 13px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${g.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={g.icon} size={13} color={g.color} />
                  </div>
                  <span style={{ color: targetGoal === g.id ? T.purple : T.text, fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>{g.name}</span>
                </div>
                <span style={{ color: T.textSub, fontSize: 11 }}>${(g.target - g.saved).toLocaleString()} left</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {monthly > 0 && (
        <div style={{ ...S.card, background: "linear-gradient(135deg, rgba(123,110,246,0.12) 0%, rgba(29,217,160,0.06) 100%)", border: "1px solid rgba(123,110,246,0.25)" }}>
          <SectionLabel>Your Results</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Saved per year",    value: `$${yearly.toLocaleString()}`,        color: T.green  },
              { label: "Months to goal",    value: monthsToGoal ? `${monthsToGoal} mo` : "N/A", color: T.purple },
              { label: "Invested 5 years",  value: `$${invested5yr.toLocaleString()}`,   color: T.gold   },
              { label: "Invested 10 years", value: `$${invested10yr.toLocaleString()}`,  color: T.accent },
            ].map(r => (
              <div key={r.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 12 }}>
                <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>{r.label}</p>
                <p style={{ color: r.color, fontWeight: 800, fontSize: 18, margin: 0 }}>{r.value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 9, padding: 12 }}>
            <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Saving <strong style={{ color: T.text }}>${monthly}/mo</strong> by cutting {sel?.label.toLowerCase()} would fund your <strong style={{ color: T.text }}>{goal?.name}</strong> in <strong style={{ color: T.purple }}>{monthsToGoal} months</strong> — or become <strong style={{ color: T.gold }}>${invested10yr.toLocaleString()}</strong> invested over 10 years at 10.5%.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notification System ───────────────────────────────────────────────────────

const NOTIF_TYPES = {
  bill_due:        { icon: "calendar",   color: "#FF6B35", label: "Bill Due"           },
  bill_overdue:    { icon: "calendar",   color: "#FF5A6E", label: "Bill Overdue"       },
  goal_milestone:  { icon: "award",      color: "#9B6BFF", label: "Goal Milestone"     },
  goal_complete:   { icon: "check",      color: "#00D2A0", label: "Goal Complete"      },
  streak_risk:     { icon: "fire",       color: "#F5A623", label: "Streak at Risk"     },
  streak_milestone:{ icon: "fire",       color: "#F5A623", label: "Streak Milestone"   },
  overspend:       { icon: "zap",        color: "#FF5A6E", label: "Overspending"       },
  payday:          { icon: "dollarSign", color: "#00D2A0", label: "Payday Reminder"    },
  weekly_summary:  { icon: "barChart",   color: "#4FACFE", label: "Weekly Summary"     },
  savings_tip:     { icon: "zap",        color: "#7C5CFC", label: "Savings Insight"    },
  checkin_reminder:{ icon: "bell",       color: "#9B6BFF", label: "Daily Reminder"     },
  tax_reminder:    { icon: "barChart",   color: "#F5A623", label: "Tax Reminder"       },
};

function generateNotifications(goals, bills = [], streak = 0, checkInLog = [], profile = null) {
  const today = new Date();
  const currentDay = today.getDate();
  const dayOfWeek = today.getDay();
  const notifications = [];

  // 1. Bill due alerts
  bills.forEach(bill => {
    const daysLeft = bill.dueDay >= currentDay
      ? bill.dueDay - currentDay
      : 28 - currentDay + bill.dueDay;
    if (!bill.autopay) {
      if (daysLeft === 0) {
        notifications.push({
          id: `bill-today-${bill.id}`, type: "bill_overdue", read: false,
          title: `${bill.name} is due today`,
          body: `$${bill.amount.toLocaleString()} needs to be paid today. Tap to mark it paid.`,
          time: "Just now", priority: "high", action: "bills",
        });
      } else if (daysLeft <= 3) {
        notifications.push({
          id: `bill-soon-${bill.id}`, type: "bill_due", read: false,
          title: `${bill.name} due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
          body: `$${bill.amount.toLocaleString()} payment coming up on the ${bill.dueDay}${bill.dueDay===1?"st":bill.dueDay===2?"nd":bill.dueDay===3?"rd":"th"}. Set a reminder or pay now.`,
          time: `${daysLeft}d`, priority: "high", action: "bills",
        });
      } else if (daysLeft === 7) {
        notifications.push({
          id: `bill-week-${bill.id}`, type: "bill_due", read: true,
          title: `${bill.name} due in 1 week`,
          body: `$${bill.amount.toLocaleString()} is due on the ${bill.dueDay}th. Make sure you have funds ready.`,
          time: "7d", priority: "normal", action: "bills",
        });
      }
    }
  });

  // 2. Goal milestones
  goals.forEach(goal => {
    const pct = Math.round((goal.saved / goal.target) * 100);
    [25, 50, 75, 90, 100].forEach(milestone => {
      if (pct >= milestone && pct < milestone + 5) {
        notifications.push({
          id: `goal-${milestone}-${goal.id}`, type: milestone === 100 ? "goal_complete" : "goal_milestone",
          read: milestone < 75, title: milestone === 100
            ? `${goal.name} — GOAL COMPLETE`
            : `${goal.name} is ${milestone}% funded`,
          body: milestone === 100
            ? `You did it. $${goal.saved.toLocaleString()} saved. This is what financial discipline looks like.`
            : `$${goal.saved.toLocaleString()} of $${goal.target.toLocaleString()} saved. Keep going — you are building real freedom.`,
          time: "2d", priority: milestone >= 90 ? "high" : "normal", action: "goals",
        });
      }
    });
  });

  // 3. Streak alerts
  if (streak >= 7 && streak % 7 === 0) {
    notifications.push({
      id: `streak-${streak}`, type: "streak_milestone", read: false,
      title: `${streak}-day streak — incredible`,
      body: `You have checked in ${streak} days in a row. Most people quit by day 3. You are not most people.`,
      time: "Today", priority: "normal", action: "home",
    });
  }
  if (checkInLog.length === 0 && dayOfWeek !== 0) {
    notifications.push({
      id: "checkin-reminder-today", type: "checkin_reminder", read: false,
      title: "Have you logged your spending today?",
      body: `Your ${streak}-day streak is on the line. It takes 30 seconds. Tap to log now.`,
      time: "Today", priority: "high", action: "home",
    });
  }

  // 4. Overspending alert
  const monthlyDining = 380;
  const targetDining = 200;
  if (monthlyDining > targetDining) {
    notifications.push({
      id: "overspend-dining", type: "overspend", read: true,
      title: "Dining out is running high",
      body: `You have spent $${monthlyDining} on dining this month. Your target is $${targetDining}. You are $${monthlyDining - targetDining} over with ${28 - currentDay} days left.`,
      time: "3d", priority: "normal", action: "home",
    });
  }

  // 5. Weekly summary (Sundays)
  if (dayOfWeek === 0) {
    notifications.push({
      id: "weekly-summary", type: "weekly_summary", read: false,
      title: "Your weekly financial summary",
      body: "This week: $860 saved, $2,640 spent, 7-day streak maintained. You are on track. Tap to see the full breakdown.",
      time: "Today", priority: "normal", action: "profile",
    });
  }

  // 6. Payday reminder
  const payDay = profile?.payFreq === "biweekly" ? 15 : 1;
  const daysToPayday = payDay >= currentDay ? payDay - currentDay : 30 - currentDay + payDay;
  if (daysToPayday === 1) {
    notifications.push({
      id: "payday-reminder", type: "payday", read: false,
      title: "Payday is tomorrow — pay yourself first",
      body: "Before you spend a dollar, move money to your goals. This is the most important financial habit you can build.",
      time: "1d", priority: "high", action: "goals",
    });
  }

  // 7. Savings insight
  notifications.push({
    id: "savings-insight-subs", type: "savings_tip", read: true,
    title: "You could save $1,560 more per year",
    body: "Cutting your dining out spend in half ($190/mo in savings) would fully fund your Emergency Fund 6 months faster.",
    time: "5d", priority: "normal", action: "whatif",
  });

  // 8. Quarterly tax reminder
  const month = today.getMonth();
  if ([3, 5, 8, 11].includes(month) && currentDay <= 5) {
    notifications.push({
      id: "tax-quarterly", type: "tax_reminder", read: false,
      title: "Quarterly tax payment due this month",
      body: "If you have self-employment or side income, estimated taxes are due. Check your tax reserve goal.",
      time: "Today", priority: "high", action: "goals",
    });
  }

  // Sort: unread first, then by priority
  return notifications.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return 1;
    return 0;
  });
}

function NotificationBell({ notifications, onOpen }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <button onClick={onOpen} style={{ position: "relative", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
      <Icon name="bell" size={17} color={unread > 0 ? T.gold : T.textSub} />
      {unread > 0 && (
        <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.red, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 8px ${T.red}` }}>
          <span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>{Math.min(unread, 9)}</span>
        </div>
      )}
    </button>
  );
}

function NotificationCenter({ notifications, onClose, onRead, onReadAll, onNavigate, onOpenSettings }) {
  const [filter, setFilter] = useState("all");
  const filters = ["all", "unread", "bills", "goals", "insights"];

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "bills") return n.type.startsWith("bill");
    if (filter === "goals") return n.type.startsWith("goal");
    if (filter === "insights") return ["savings_tip", "weekly_summary", "overspend"].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />

      {/* Panel */}
      <div style={{ position: "relative", marginTop: "auto", background: T.surface, borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", maxHeight: "88vh", display: "flex", flexDirection: "column", zIndex: 501 }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0 }}>Notifications</h3>
              {unreadCount > 0 && <p style={{ color: T.textSub, fontSize: 12, margin: "3px 0 0" }}>{unreadCount} unread</p>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {unreadCount > 0 && (
                <button onClick={onReadAll} style={{ background: "rgba(124,92,252,0.12)", border: "1px solid rgba(124,92,252,0.25)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: T.purple, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
                  Mark all read
                </button>
              )}
              <button onClick={onOpenSettings} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="bell" size={15} color={T.textSub} />
              </button>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="x" size={15} color={T.textSub} />
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ flexShrink: 0, background: filter === f ? GRAD.purple : "rgba(255,255,255,0.04)", border: filter === f ? "none" : "1px solid rgba(255,255,255,0.07)", borderRadius: 99, padding: "5px 13px", cursor: "pointer", color: filter === f ? "#fff" : T.textSub, fontSize: 12, fontWeight: filter === f ? 700 : 400, fontFamily: "'Inter',sans-serif", textTransform: "capitalize", boxShadow: filter === f ? "0 2px 10px rgba(124,92,252,0.4)" : "none" }}>
                {f === "all" ? `All (${notifications.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 32px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(124,92,252,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Icon name="check" size={24} color={T.purple} />
              </div>
              <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>All caught up</p>
              <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>No {filter !== "all" ? filter : ""} notifications right now.</p>
            </div>
          ) : (
            filtered.map((notif, idx) => {
              const type = NOTIF_TYPES[notif.type] || NOTIF_TYPES.savings_tip;
              return (
                <button key={notif.id} onClick={() => { onRead(notif.id); onNavigate(notif.action); onClose(); }} style={{ width: "100%", background: notif.read ? "transparent" : "rgba(124,92,252,0.04)", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "14px 20px", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", transition: "background 0.15s" }}>

                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${type.color}18`, border: `1px solid ${type.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <Icon name={type.icon} size={18} color={type.color} />
                    {!notif.read && <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: T.purple, border: `2px solid ${T.surface}`, boxShadow: `0 0 6px ${T.purple}` }} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <p style={{ color: notif.read ? T.textMid : T.text, fontSize: 13, fontWeight: notif.read ? 500 : 700, margin: 0, lineHeight: 1.3, flex: 1, paddingRight: 8 }}>{notif.title}</p>
                      <span style={{ color: T.textSub, fontSize: 10, flexShrink: 0, marginTop: 1 }}>{notif.time}</span>
                    </div>
                    <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 6px", lineHeight: 1.5 }}>{notif.body}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...S.tag(type.color), fontSize: 10 }}>{type.label}</span>
                      {notif.priority === "high" && <span style={{ background: `${T.red}15`, color: T.red, border: `1px solid ${T.red}30`, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, fontFamily: "'Inter',sans-serif" }}>Urgent</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationSettings({ onClose }) {
  const [settings, setSettings] = useState({
    bill_due:         { enabled: true,  days: 3,    label: "Bill due reminders",         desc: "Get reminded before bills are due" },
    goal_milestone:   { enabled: true,  days: null, label: "Goal milestones",             desc: "Celebrate progress at 25%, 50%, 75%, 100%" },
    streak_risk:      { enabled: true,  days: null, label: "Streak protection",           desc: "Alert when you haven't checked in today" },
    overspend:        { enabled: true,  days: null, label: "Overspending alerts",         desc: "Warn when a category exceeds your budget" },
    payday:           { enabled: true,  days: 1,    label: "Payday reminder",             desc: "Remind you to pay yourself first on payday" },
    weekly_summary:   { enabled: true,  days: null, label: "Weekly summary",              desc: "Sunday recap of your financial week" },
    savings_tip:      { enabled: true,  days: null, label: "Savings insights",            desc: "Personalized tips based on your spending" },
    checkin_reminder: { enabled: true,  days: null, label: "Daily check-in reminder",     desc: "Evening reminder to log your spending" },
    tax_reminder:     { enabled: false, days: null, label: "Quarterly tax reminders",     desc: "Alerts before estimated tax payment dates" },
    streak_milestone: { enabled: true,  days: null, label: "Streak milestones",           desc: "Celebrate 7, 14, 30-day streaks" },
  });

  const toggle = (key) => setSettings(s => ({ ...s, [key]: { ...s[key], enabled: !s[key].enabled } }));
  const setDays = (key, val) => setSettings(s => ({ ...s, [key]: { ...s[key], days: val } }));

  const groups = [
    { label: "Bills", keys: ["bill_due"] },
    { label: "Goals", keys: ["goal_milestone", "streak_milestone"] },
    { label: "Daily Habits", keys: ["checkin_reminder", "streak_risk"] },
    { label: "Spending", keys: ["overspend", "savings_tip"] },
    { label: "Money Events", keys: ["payday", "weekly_summary", "tax_reminder"] },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", flexDirection: "column" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "relative", marginTop: "auto", background: T.surface, borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", maxHeight: "92vh", display: "flex", flexDirection: "column", zIndex: 601 }}>

        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0 }}>Notification Settings</h3>
            <p style={{ color: T.textSub, fontSize: 12, margin: "3px 0 0" }}>Control exactly what you get notified about</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={15} color={T.textSub} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px" }}>
          {groups.map(group => (
            <div key={group.label} style={{ marginBottom: 24 }}>
              <p style={{ color: T.textSub, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 10px" }}>{group.label}</p>
              {group.keys.map(key => {
                const s = settings[key];
                return (
                  <div key={key} style={{ background: s.enabled ? "rgba(124,92,252,0.06)" : "rgba(255,255,255,0.02)", border: s.enabled ? "1px solid rgba(124,92,252,0.18)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "13px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <p style={{ color: s.enabled ? T.text : T.textMid, fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>{s.label}</p>
                        <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                      </div>
                      <Toggle value={s.enabled} onChange={() => toggle(key)} />
                    </div>
                    {s.enabled && s.days !== null && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 7px" }}>Remind me how many days before?</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[1, 2, 3, 5, 7].map(d => (
                            <button key={d} onClick={() => setDays(key, d)} style={{ flex: 1, background: s.days === d ? GRAD.purple : "rgba(255,255,255,0.04)", border: s.days === d ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 0", cursor: "pointer", color: s.days === d ? "#fff" : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 12, boxShadow: s.days === d ? "0 2px 8px rgba(124,92,252,0.4)" : "none" }}>
                              {d}d
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Quiet hours */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ color: T.textSub, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 10px" }}>Quiet Hours</p>
            <div style={{ ...S.card, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>Do Not Disturb</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>No notifications during these hours</p>
                </div>
                <Toggle value={true} onChange={() => {}} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ ...S.label, fontSize: 10 }}>From</label>
                  <select style={{ ...S.input, padding: "8px 10px", fontSize: 13 }}>
                    {["9:00 PM","10:00 PM","11:00 PM","12:00 AM"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...S.label, fontSize: 10 }}>Until</label>
                  <select style={{ ...S.input, padding: "8px 10px", fontSize: 13 }}>
                    {["6:00 AM","7:00 AM","8:00 AM","9:00 AM"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={S.primaryBtn()}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

// ── Financial Calendar ────────────────────────────────────────────────────────
const CAL_EVENT_TYPES = {
  bill:         { color: "#FF6B35", icon: "calendar",   label: "Bill Due"        },
  bill_auto:    { color: "#4FACFE", icon: "repeat",     label: "Autopay"         },
  payday:       { color: "#00D2A0", icon: "dollarSign", label: "Payday"          },
  goal_deposit: { color: "#9B6BFF", icon: "target",     label: "Goal Deposit"    },
  subscription: { color: "#7C5CFC", icon: "repeat",     label: "Subscription"    },
  checkin:      { color: "#F5A623", icon: "check",      label: "Check-In"        },
  tax:          { color: "#FF5A6E", icon: "barChart",   label: "Tax Due"         },
};

function FinancialCalendar({ goals, bills = INITIAL_BILLS, checkInLog = [], profile }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); setSelectedDay(null); };

  // Build events for the month
  const buildEvents = () => {
    const events = {};
    const add = (day, event) => {
      if (day < 1 || day > daysInMonth) return;
      if (!events[day]) events[day] = [];
      events[day].push(event);
    };

    // Bills
    bills.forEach(bill => {
      const day = Math.min(bill.dueDay, daysInMonth);
      add(day, {
        id: `bill-${bill.id}`,
        type: bill.autopay ? "bill_auto" : "bill",
        title: bill.name,
        amount: bill.amount,
        subtitle: bill.autopay ? "Autopay" : "Manual payment",
        action: "bills",
      });
    });

    // Goal auto-deposits
    goals.forEach(goal => {
      if (goal.autoDepositDay) {
        add(goal.autoDepositDay, {
          id: `goal-deposit-${goal.id}`,
          type: "goal_deposit",
          title: goal.name,
          amount: goal.autoDepositAmount || 0,
          subtitle: "Auto-deposit",
          action: "goals",
        });
      }
      // Also add a deposit reminder on the 1st for goals with targets
      if (goal.saved < goal.target) {
        add(1, {
          id: `goal-remind-${goal.id}`,
          type: "goal_deposit",
          title: `Deposit to ${goal.name}`,
          amount: null,
          subtitle: `${Math.round((goal.saved/goal.target)*100)}% funded`,
          action: "goals",
        });
      }
    });

    // Payday
    const payDay = profile?.payFreq === "biweekly" ? [1, 15] : profile?.payFreq === "weekly" ? [1,8,15,22] : [1];
    payDay.forEach(d => {
      add(Math.min(d, daysInMonth), {
        id: `payday-${d}`,
        type: "payday",
        title: "Payday",
        amount: profile?.monthlyIncome || 4200,
        subtitle: profile?.payFreq || "Monthly",
        action: "home",
      });
    });

    // Quarterly tax (April 15, June 15, Sept 15, Jan 15)
    const taxMonths = [3, 5, 8, 0];
    if (taxMonths.includes(viewMonth)) {
      add(15, {
        id: "tax-quarterly",
        type: "tax",
        title: "Estimated Tax Due",
        amount: null,
        subtitle: "IRS quarterly deadline",
        action: "goals",
      });
    }

    // Check-ins from log
    checkInLog.forEach((entry, idx) => {
      const d = new Date(entry.date);
      if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
        add(d.getDate(), {
          id: `checkin-${idx}`,
          type: "checkin",
          title: `Logged $${entry.amount}`,
          amount: entry.amount,
          subtitle: entry.category,
          action: "home",
        });
      }
    });

    // Today's check-in reminder (if not yet logged and current month)
    if (isCurrentMonth && checkInLog.length === 0) {
      add(today.getDate(), {
        id: "checkin-today",
        type: "checkin",
        title: "Log today's spending",
        amount: null,
        subtitle: "Daily check-in",
        action: "home",
      });
    }

    return events;
  };

  const events = buildEvents();

  const selectedEvents = selectedDay ? (events[selectedDay] || []) : [];

  // Monthly totals
  const totalBillsDue = bills.reduce((a, b) => {
    const day = Math.min(b.dueDay, daysInMonth);
    return a + b.amount;
  }, 0);
  const totalAutoDeposits = goals.filter(g => g.autoDepositAmount).reduce((a, g) => a + (g.autoDepositAmount || 0), 0);

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

      {/* Month header */}
      <div style={{ ...S.card, background: GRAD.purple, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 9, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="chevronLeft" size={17} color="#fff" strokeWidth={2} />
          </button>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>{viewYear}</p>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: -0.5 }}>{monthNames[viewMonth]}</p>
          </div>
          <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 9, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="chevronLeft" size={17} color="#fff" strokeWidth={2} style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>

        {/* Month summary pills */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Bills",    value: `$${totalBillsDue.toLocaleString()}`,       color: T.orange },
            { label: "Events",   value: Object.values(events).flat().length,         color: "#fff"   },
            { label: "Auto-pay", value: bills.filter(b => b.autopay).length,         color: T.teal   },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
              <p style={{ color: s.color, fontWeight: 800, fontSize: 14, margin: 0 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={S.card}>
        {/* Day name headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
          {dayNames.map(d => (
            <div key={d} style={{ textAlign: "center", color: T.textSub, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: "1", padding: 2 }} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dayEvents = events[day] || [];
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = day === selectedDay;
            const hasUrgent = dayEvents.some(e => e.type === "bill" || e.type === "tax");
            const hasPayday = dayEvents.some(e => e.type === "payday");
            const isPast = isCurrentMonth && day < today.getDate();

            return (
              <button key={day} onClick={() => setSelectedDay(day === selectedDay ? null : day)} style={{ aspectRatio: "1", borderRadius: 9, border: "none", background: isSelected ? GRAD.purple : isToday ? "rgba(124,92,252,0.2)" : "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 2, position: "relative", transition: "all 0.15s", boxShadow: isSelected ? "0 3px 12px rgba(124,92,252,0.5)" : "none", opacity: isPast && !isToday ? 0.55 : 1 }}>
                <span style={{ color: isSelected ? "#fff" : isToday ? T.purple : T.text, fontSize: 12, fontWeight: isToday || isSelected ? 800 : 400, lineHeight: 1 }}>{day}</span>

                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 3, flexWrap: "wrap", justifyContent: "center", maxWidth: 28 }}>
                    {dayEvents.slice(0, 3).map((e, i) => {
                      const t = CAL_EVENT_TYPES[e.type];
                      return <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: t.color, boxShadow: `0 0 4px ${t.color}` }} />;
                    })}
                    {dayEvents.length > 3 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.textSub }} />}
                  </div>
                )}

                {/* Today ring */}
                {isToday && !isSelected && <div style={{ position: "absolute", inset: 1, borderRadius: 8, border: `1.5px solid ${T.purple}`, pointerEvents: "none" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.entries(CAL_EVENT_TYPES).map(([key, t]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, boxShadow: `0 0 5px ${t.color}` }} />
            <span style={{ color: T.textSub, fontSize: 10 }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(124,92,252,0.4)" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 800 }}>{selectedDay}</span>
            </div>
            <div>
              <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>{monthNames[viewMonth]} {selectedDay}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: 0 }}>{selectedEvents.length === 0 ? "No events" : `${selectedEvents.length} event${selectedEvents.length > 1 ? "s" : ""}`}</p>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: 24 }}>
              <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>Nothing scheduled. A quiet financial day.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedEvents.map(event => {
                const type = CAL_EVENT_TYPES[event.type];
                const isPast = isCurrentMonth && selectedDay < today.getDate();
                return (
                  <div key={event.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${type.color}, ${type.color}55)` }} />
                    <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${type.color}18`, border: `1px solid ${type.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name={type.icon} size={18} color={type.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{event.title}</p>
                            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{event.subtitle}</p>
                          </div>
                          {event.amount && (
                            <p style={{ color: event.type === "payday" ? T.green : T.orange, fontWeight: 800, fontSize: 16, margin: 0 }}>
                              {event.type === "payday" ? "+" : "-"}${event.amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <span style={{ ...S.tag(type.color), fontSize: 10 }}>{type.label}</span>
                          {isPast && <span style={{ background: "rgba(255,255,255,0.06)", color: T.textSub, fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Past</span>}
                          {!isPast && selectedDay === today.getDate() && <span style={{ background: `${T.green}15`, color: T.green, border: `1px solid ${T.green}30`, fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>Today</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events this month */}
      {!selectedDay && (
        <div style={S.card}>
          <SectionLabel>Upcoming This Month</SectionLabel>
          {(() => {
            const upcoming = [];
            Object.entries(events).forEach(([day, dayEvts]) => {
              const d = parseInt(day);
              if (!isCurrentMonth || d >= today.getDate()) {
                dayEvts.forEach(e => upcoming.push({ ...e, day: d }));
              }
            });
            upcoming.sort((a, b) => a.day - b.day);
            const toShow = upcoming.slice(0, 8);

            if (toShow.length === 0) return <p style={{ color: T.textSub, fontSize: 13, margin: 0, textAlign: "center" }}>No upcoming events this month.</p>;

            return toShow.map((event, idx) => {
              const type = CAL_EVENT_TYPES[event.type];
              const daysAway = event.day - today.getDate();
              return (
                <button key={`${event.id}-${idx}`} onClick={() => setSelectedDay(event.day)} style={{ width: "100%", background: "none", border: "none", padding: "10px 0", borderBottom: idx < toShow.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                  {/* Day number box */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${type.color}15`, border: `1px solid ${type.color}25`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: type.color, fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{event.day}</span>
                    <span style={{ color: T.textSub, fontSize: 8, fontWeight: 600 }}>{monthNames[viewMonth].slice(0,3).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: T.text, fontWeight: 600, fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</p>
                    <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{event.subtitle}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {event.amount && <p style={{ color: event.type === "payday" ? T.green : T.orange, fontWeight: 800, fontSize: 13, margin: 0 }}>{event.type === "payday" ? "+" : "-"}${event.amount.toLocaleString()}</p>}
                    <p style={{ color: daysAway === 0 ? T.green : daysAway <= 3 ? T.red : T.textSub, fontSize: 10, fontWeight: 700, margin: "2px 0 0" }}>
                      {daysAway === 0 ? "Today" : daysAway < 0 ? `${Math.abs(daysAway)}d ago` : `in ${daysAway}d`}
                    </p>
                  </div>
                </button>
              );
            });
          })()}
        </div>
      )}

      {/* Monthly cash flow summary */}
      <div style={S.card}>
        <SectionLabel>Month Cash Flow</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Expected income",    value: `+$${(profile?.monthlyIncome || 4200).toLocaleString()}`, color: T.green  },
            { label: "Bills total",        value: `-$${totalBillsDue.toLocaleString()}`,                    color: T.orange },
            { label: "Goal auto-deposits", value: `-$${totalAutoDeposits.toLocaleString()}`,                color: T.purple },
            { label: "Net remaining",      value: `$${((profile?.monthlyIncome || 4200) - totalBillsDue - totalAutoDeposits).toLocaleString()}`, color: T.teal },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: T.textMid, fontSize: 13 }}>{r.label}</span>
              <span style={{ color: r.color, fontSize: 14, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ color: "#1A1840", fontSize: 11, textAlign: "center" }}>Calendar events are generated from your bills, goals, and payday settings. Connect your bank to see real transaction history.</p>
    </div>
  );
}

// ── Annual Financial Review ───────────────────────────────────────────────────
function AnnualReview({ goals, profile, checkInLog, streak }) {
  const year = new Date().getFullYear();
  const [slide, setSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const mo = profile?.monthlyIncome || 4200;
  const totalIncome       = mo * 12;
  const totalSaved        = goals.reduce((a, g) => a + g.saved, 0);
  const totalSpent        = Math.round(totalIncome * 0.63);
  const goalsCompleted    = goals.filter(g => g.saved >= g.target).length;
  const savingsRate       = Math.round((totalSaved / totalIncome) * 100);
  const bestMonth         = "March";
  const bestMonthSaved    = 1240;
  const worstMonth        = "December";
  const worstMonthSaved   = 320;
  const streakBest        = Math.max(streak, 14);
  const checkInsTotal     = checkInLog.length + 287; // simulated full year
  const netWorthChange    = 4800;
  const topCategory       = "Housing";
  const topCategoryAmt    = Math.round(totalSpent * 0.38);
  const mostSavedGoal     = goals.reduce((a, g) => g.saved > (a?.saved || 0) ? g : a, goals[0]);
  const subsSaved         = 0;
  const rank              = "Top 18%";

  const totalBills = 12 * (1450 + 94 + 69 + 142 + 380 + 210 + 85 + 15);
  const savedVsLastYear   = Math.round(totalSaved * 0.28);

  // Slides — each is a full-screen "wrapped" card
  const slides = [
    {
      id: "intro",
      bg: "linear-gradient(160deg, #1A0D3A 0%, #0F0E2A 100%)",
      accent: T.purple,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>Your {year} in Review</p>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, margin: "0 0 16px", letterSpacing: -1, lineHeight: 1.1 }}>Financial<br />Year Wrapped</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 32px", lineHeight: 1.7 }}>Every dollar in. Every dollar out. Every goal hit. Let us show you what {year} really looked like.</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,92,252,0.2)", border: "1px solid rgba(124,92,252,0.4)", borderRadius: 99, padding: "8px 18px" }}>
            <Icon name="fire" size={16} color={T.gold} />
            <span style={{ color: T.gold, fontSize: 13, fontWeight: 700 }}>{streakBest}-day best streak</span>
          </div>
        </div>
      ),
    },
    {
      id: "income",
      bg: "linear-gradient(160deg, #0A2218 0%, #0F0E2A 100%)",
      accent: T.green,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: T.green, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>You Earned</p>
          <p style={{ color: "#fff", fontWeight: 900, fontSize: 48, margin: "0 0 6px", letterSpacing: -2 }}>${totalIncome.toLocaleString()}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 32px" }}>in {year}</p>
          <div style={{ background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 14, padding: 18, marginBottom: 16, textAlign: "left" }}>
            <p style={{ color: T.textMid, fontSize: 12, margin: "0 0 14px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>Breakdown</p>
            {[
              { label: "Saved",   value: `$${totalSaved.toLocaleString()}`,   pct: savingsRate,            color: T.green  },
              { label: "Spent",   value: `$${totalSpent.toLocaleString()}`,    pct: Math.round((totalSpent/totalIncome)*100),  color: T.orange },
              { label: "Bills",   value: `$${totalBills.toLocaleString()}`,    pct: Math.round((totalBills/totalIncome)*100),  color: T.red    },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: T.textMid, fontSize: 13 }}>{r.label}</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ color: r.color, fontWeight: 700, fontSize: 13 }}>{r.value}</span>
                    <span style={{ color: T.textSub, fontSize: 12 }}>{r.pct}%</span>
                  </div>
                </div>
                <ProgressBar pct={r.pct} color={r.color} height={6} />
              </div>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>You saved <strong style={{ color: T.green }}>{savingsRate}%</strong> of everything you earned. The national average is 4.6%.</p>
        </div>
      ),
    },
    {
      id: "savings",
      bg: "linear-gradient(160deg, #1A0D3A 0%, #0F0E2A 100%)",
      accent: T.purple,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: T.purple, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>You Saved</p>
          <p style={{ color: "#fff", fontWeight: 900, fontSize: 52, margin: "0 0 4px", letterSpacing: -2 }}>${totalSaved.toLocaleString()}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 28px" }}>across {goals.length} goals</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {goals.slice(0, 4).map((g, i) => {
              const pct = Math.round((g.saved / g.target) * 100);
              return (
                <div key={g.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: T.textSub, fontSize: 13, fontWeight: 700, width: 16, flexShrink: 0 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ color: T.text, fontSize: 12, fontWeight: 600 }}>{g.name}</span>
                      <span style={{ color: g.color, fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color={g.color} height={4} />
                  </div>
                </div>
              );
            })}
          </div>
          {savedVsLastYear > 0 && (
            <div style={{ background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.25)", borderRadius: 12, padding: 14 }}>
              <p style={{ color: T.green, fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>Up ${savedVsLastYear.toLocaleString()} from last year</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>You are accelerating. Keep going.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "habits",
      bg: "linear-gradient(160deg, #1A1208 0%, #0F0E2A 100%)",
      accent: T.gold,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: T.gold, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Your Habits</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Check-ins logged",    value: checkInsTotal,        color: T.gold,   icon: "check"      },
              { label: "Best streak",          value: `${streakBest} days`, color: T.orange, icon: "fire"       },
              { label: "Goals hit",            value: goalsCompleted,       color: T.green,  icon: "award"      },
              { label: "Community rank",       value: rank,                 color: T.purple, icon: "users"      },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 12px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <Icon name={s.icon} size={17} color={s.color} />
                </div>
                <p style={{ color: s.color, fontWeight: 900, fontSize: 20, margin: "0 0 4px" }}>{s.value}</p>
                <p style={{ color: T.textSub, fontSize: 10, margin: 0, lineHeight: 1.4 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, padding: 14 }}>
            <p style={{ color: T.gold, fontWeight: 700, fontSize: 14, margin: "0 0 5px" }}>Best month: {bestMonth}</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 5px" }}>You saved <strong style={{ color: T.gold }}>${bestMonthSaved}</strong> in a single month</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>Worst month: {worstMonth} (${worstMonthSaved} saved — but you kept going)</p>
          </div>
        </div>
      ),
    },
    {
      id: "spending",
      bg: "linear-gradient(160deg, #1A0A08 0%, #0F0E2A 100%)",
      accent: T.orange,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: T.orange, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Where It Went</p>
          <p style={{ color: T.textMid, fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>Your biggest spending category in {year}</p>
          <div style={{ width: 90, height: 90, borderRadius: 24, background: `${T.orange}18`, border: `1px solid ${T.orange}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="building" size={40} color={T.orange} strokeWidth={1.5} />
          </div>
          <p style={{ color: "#fff", fontWeight: 900, fontSize: 28, margin: "0 0 4px" }}>{topCategory}</p>
          <p style={{ color: T.orange, fontWeight: 800, fontSize: 22, margin: "0 0 24px" }}>${topCategoryAmt.toLocaleString()}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Housing",      pct: 38, color: T.orange  },
              { label: "Food",         pct: 12, color: T.gold    },
              { label: "Transport",    pct: 8,  color: T.green   },
              { label: "Subscriptions",pct: 5,  color: T.purple  },
              { label: "Shopping",     pct: 9,  color: T.accent  },
              { label: "Other",        pct: 28, color: T.textSub },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: T.textMid, fontSize: 12, width: 90, textAlign: "right", flexShrink: 0 }}>{c.label}</span>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 8 }}>
                  <div style={{ width: `${c.pct}%`, height: "100%", borderRadius: 99, background: c.color, boxShadow: `0 0 6px ${c.color}77` }} />
                </div>
                <span style={{ color: c.color, fontWeight: 700, fontSize: 12, width: 32 }}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "networth",
      bg: "linear-gradient(160deg, #0A1A0A 0%, #0F0E2A 100%)",
      accent: T.green,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: T.green, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Net Worth</p>
          <p style={{ color: T.textMid, fontSize: 14, margin: "0 0 8px" }}>Your net worth grew by</p>
          <p style={{ color: T.green, fontWeight: 900, fontSize: 52, margin: "0 0 4px", letterSpacing: -2 }}>+${netWorthChange.toLocaleString()}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 28px" }}>in {year}</p>
          {/* Mini trend chart */}
          <div style={{ background: "rgba(0,210,160,0.06)", border: "1px solid rgba(0,210,160,0.15)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            {(() => {
              const data = [0, 400, 900, 1600, 2100, 2800, 3200, 3600, 4000, 4300, 4600, 4800];
              const W = 280, H = 70;
              const max = Math.max(...data);
              const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * H}`).join(" ");
              return (
                <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="nwYearGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.green} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={T.green} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#nwYearGrad)" />
                  <polyline points={pts} fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${T.green})` }} />
                </svg>
              );
            })()}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ color: T.textSub, fontSize: 10 }}>Jan {year}</span>
              <span style={{ color: T.green, fontSize: 11, fontWeight: 700 }}>+${netWorthChange.toLocaleString()}</span>
              <span style={{ color: T.textSub, fontSize: 10 }}>Dec {year}</span>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            If you keep this pace, your net worth will grow by <strong style={{ color: T.green }}>${(netWorthChange * 1.15).toLocaleString()}</strong> next year.
          </p>
        </div>
      ),
    },
    {
      id: "community",
      bg: "linear-gradient(160deg, #150A2A 0%, #0F0E2A 100%)",
      accent: T.purple,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: T.purple, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>You vs Everyone</p>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 32px rgba(124,92,252,0.5)" }}>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>18%</span>
          </div>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: "0 0 6px" }}>Top 18% of savers</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 28px" }}>on FreedomFund in {year}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Avg user saved",   value: "$4,120",  yours: `$${totalSaved.toLocaleString()}`, better: totalSaved > 4120 },
              { label: "Avg savings rate", value: "9%",      yours: `${savingsRate}%`,                  better: savingsRate > 9  },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
                <p style={{ color: T.textMid, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Avg: {s.value}</p>
                <p style={{ color: s.better ? T.green : T.red, fontSize: 16, fontWeight: 900, margin: 0 }}>You: {s.yours}</p>
                {s.better && <p style={{ color: T.green, fontSize: 10, margin: "4px 0 0" }}>Above average</p>}
              </div>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>You outperformed 82% of people on this platform. That is not luck. That is discipline.</p>
        </div>
      ),
    },
    {
      id: "finale",
      bg: "linear-gradient(160deg, #1A0D3A 0%, #0A1A0A 100%)",
      accent: T.green,
      content: (
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏆</div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" }}>{year} Complete</p>
          <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: "0 0 16px", letterSpacing: -0.5, lineHeight: 1.2 }}>
            {profile?.name ? `${profile.name}, you` : "You"} are building<br />
            <span style={{ background: GRAD.green, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>real freedom.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: "0 0 28px", lineHeight: 1.7 }}>
            ${totalSaved.toLocaleString()} saved. {goalsCompleted} goal{goalsCompleted !== 1 ? "s" : ""} completed. {streakBest}-day streak. Net worth up ${netWorthChange.toLocaleString()}. Every one of those was a decision to choose your future over your present comfort.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[
              { label: "Saved",     value: `$${totalSaved.toLocaleString()}`,    color: T.green  },
              { label: "Goals done",value: goalsCompleted,                        color: T.purple },
              { label: "Streak",    value: `${streakBest}d`,                      color: T.gold   },
              { label: "NW growth", value: `+$${netWorthChange.toLocaleString()}`,color: T.teal   },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 8px" }}>
                <p style={{ color: s.color, fontWeight: 900, fontSize: 18, margin: "0 0 3px" }}>{s.value}</p>
                <p style={{ color: T.textSub, fontSize: 10, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0, fontStyle: "italic" }}>
            &ldquo;Sacrifice like no one else today — so you can live like no one else tomorrow.&rdquo;
          </p>
        </div>
      ),
    },
  ];

  const goNext = () => { if (slide < slides.length - 1) { setAnimKey(k => k + 1); setSlide(s => s + 1); } };
  const goPrev = () => { if (slide > 0) { setAnimKey(k => k + 1); setSlide(s => s - 1); } };

  const current = slides[slide];

  return (
    <div style={{ minHeight: "calc(100vh - 140px)", display: "flex", flexDirection: "column" }}>

      {/* Slide area */}
      <div key={animKey} style={{ flex: 1, background: current.bg, borderRadius: 20, margin: "0 16px 12px", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 32, paddingBottom: 32, position: "relative", overflow: "hidden", boxShadow: `0 8px 40px rgba(0,0,0,0.5)`, animation: "slideIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards" }}>
        <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>

        {/* Decorative background orbs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${current.accent}20 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${current.accent}15 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {current.content}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => { setAnimKey(k => k + 1); setSlide(i); }} style={{ width: i === slide ? 20 : 6, height: 6, borderRadius: 99, border: "none", cursor: "pointer", background: i === slide ? current.accent : "rgba(255,255,255,0.15)", transition: "all 0.3s", padding: 0, boxShadow: i === slide ? `0 0 8px ${current.accent}88` : "none" }} />
          ))}
        </div>

        {/* Nav buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {slide > 0 && (
            <button onClick={goPrev} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px 0", cursor: "pointer", color: T.textMid, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="chevronLeft" size={16} color={T.textMid} />Back
            </button>
          )}
          <button onClick={goNext} style={{ flex: 3, background: slide === slides.length - 1 ? GRAD.green : GRAD.purple, border: "none", borderRadius: 12, padding: "13px 0", cursor: "pointer", color: "#fff", fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, boxShadow: `0 4px 16px ${slide === slides.length - 1 ? T.green : T.purple}55`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {slide === slides.length - 1 ? (
              <><Icon name="check" size={16} color="#fff" strokeWidth={2.5} />Start {year + 1} Strong</>
            ) : (
              <>Next<Icon name="chevronLeft" size={16} color="#fff" style={{ transform: "rotate(180deg)" }} /></>
            )}
          </button>
        </div>

        {/* Slide counter */}
        <p style={{ color: T.textSub, fontSize: 11, textAlign: "center", margin: 0 }}>{slide + 1} of {slides.length}</p>
      </div>
    </div>
  );
}

// ── Smart Savings Recommendations ────────────────────────────────────────────
function generateRecommendations(goals, profile, bills = INITIAL_BILLS) {
  const mo = profile?.monthlyIncome || 4200;
  const recs = [];

  // Spending benchmarks (national averages as % of income)
  const benchmarks = {
    dining:        { label: "Dining Out",       avg: 0.05,  current: 380,  icon: "dollarSign", color: "#FF6B35" },
    groceries:     { label: "Groceries",        avg: 0.10,  current: profile?.groceries * 4.33 || 480, icon: "dollarSign", color: "#00D2A0" },
    subscriptions: { label: "Subscriptions",    avg: 0.03,  current: 210,  icon: "repeat",     color: "#7C5CFC" },
    shopping:      { label: "Shopping",         avg: 0.05,  current: 340,  icon: "package",    color: "#4FACFE" },
    transport:     { label: "Transport",        avg: 0.09,  current: profile?.fuelCost || 190, icon: "send", color: "#F5A623" },
    entertainment: { label: "Entertainment",    avg: 0.04,  current: profile?.entertainment || 120, icon: "zap", color: "#9B6BFF" },
    workLunch:     { label: "Work Lunches",     avg: 0,     current: (profile?.lunchSpend || 0) * 22, icon: "dollarSign", color: "#FF6B35" },
  };

  // Closest goal for timeline calculations
  const activeGoals = goals.filter(g => g.saved < g.target);
  const topGoal = activeGoals.sort((a, b) => (b.saved / b.target) - (a.saved / a.target))[0];
  const remaining = topGoal ? topGoal.target - topGoal.saved : 0;

  Object.entries(benchmarks).forEach(([key, b]) => {
    const target = mo * b.avg;
    const overage = b.current - target;

    if (key === "subscriptions" && b.current > 100) {
      const saveable = Math.round(b.current * 0.35);
      const monthsToGoal = topGoal && saveable > 0 ? Math.ceil(remaining / saveable) : null;
      recs.push({
        id: "subs-audit", priority: "high", category: "Subscriptions",
        icon: b.icon, color: b.color,
        title: "Subscription audit could save you big",
        body: `You spend $${b.current}/mo on subscriptions — $${(b.current * 12).toLocaleString()}/yr. Most people forget 30-40% of what they pay for. Canceling unused ones could free up $${saveable}/mo.`,
        savingsPerMonth: saveable,
        yearlyImpact: saveable * 12,
        goalImpact: monthsToGoal ? `Fund ${topGoal.name} ${monthsToGoal} months faster` : null,
        action: { label: "Review Subscriptions", tab: "bills" },
        steps: [
          "Open your Bills tab and filter by Subscriptions",
          "Mark any you have not used in the last 30 days",
          "Cancel directly through the service — not just the app",
          "Redirect that money to your top goal automatically",
        ],
      });
    }

    if (key === "dining" && overage > 50) {
      const saveable = Math.round(overage * 0.5);
      const monthsToGoal = topGoal && saveable > 0 ? Math.ceil(remaining / saveable) : null;
      recs.push({
        id: "dining-cut", priority: "high", category: "Dining Out",
        icon: b.icon, color: b.color,
        title: `Dining out is $${overage.toFixed(0)} above target`,
        body: `You spend $${b.current}/mo on dining. The target for your income is $${Math.round(target)}/mo. Cutting this in half saves $${saveable}/mo — $${(saveable * 12).toLocaleString()} per year.`,
        savingsPerMonth: saveable,
        yearlyImpact: saveable * 12,
        goalImpact: monthsToGoal ? `Reach ${topGoal?.name} ${monthsToGoal} months sooner` : null,
        action: { label: "See What-If Calculator", tab: "whatif" },
        steps: [
          "Set a weekly dining budget of $" + Math.round(target / 4.33),
          "Meal prep Sunday — it eliminates Monday-Wednesday dining temptation",
          "Use the check-in to track dining spend in real time",
          "Allow yourself 1 restaurant meal per week as a reward",
        ],
      });
    }

    if (key === "workLunch" && b.current > 150) {
      const saveable = Math.round(b.current * 0.6);
      recs.push({
        id: "work-lunch", priority: "medium", category: "Work Lunches",
        icon: b.icon, color: b.color,
        title: "Packing lunch 3 days a week saves a lot",
        body: `You spend ~$${b.current}/mo on work lunches. Packing just 3 days a week would save $${saveable}/mo — $${(saveable * 12).toLocaleString()}/yr. That is a real number.`,
        savingsPerMonth: saveable,
        yearlyImpact: saveable * 12,
        goalImpact: topGoal ? `That funds $${(saveable * 12).toLocaleString()} toward ${topGoal.name}` : null,
        action: { label: "Log a Check-In", tab: "home" },
        steps: [
          "Prep 3 lunches on Sunday evening — takes 30 minutes",
          "Set a calendar reminder to prep each week",
          "Track savings in your daily check-in under Food",
          "Redirect the savings to your goal auto-deposit",
        ],
      });
    }

    if (key === "shopping" && overage > 40) {
      const saveable = Math.round(overage * 0.6);
      recs.push({
        id: "shopping-cut", priority: "medium", category: "Shopping",
        icon: b.icon, color: b.color,
        title: "Shopping spend is running high",
        body: `$${b.current}/mo in shopping is ${Math.round((b.current / mo) * 100)}% of your income. The recommended limit is ${Math.round(b.avg * 100)}%. A 60-day purchase rule eliminates impulse buys.`,
        savingsPerMonth: saveable,
        yearlyImpact: saveable * 12,
        goalImpact: null,
        action: { label: "Open What-If", tab: "whatif" },
        steps: [
          "Before any purchase over $50, wait 48 hours",
          "Delete saved payment methods from retail apps",
          "Set a monthly shopping budget and track it in check-ins",
          "Unsubscribe from retailer marketing emails",
        ],
      });
    }
  });

  // Emergency fund check
  const emergFund = goals.find(g => g.name.toLowerCase().includes("emergency"));
  if (!emergFund) {
    recs.push({
      id: "no-emergency-fund", priority: "urgent", category: "Emergency Fund",
      icon: "shield", color: "#FF5A6E",
      title: "You have no emergency fund goal set",
      body: `Without an emergency fund, one unexpected expense — car repair, medical bill, job loss — forces you into debt. You need ${topGoal ? "this before anything else" : "this as your first goal"}.`,
      savingsPerMonth: null,
      yearlyImpact: null,
      goalImpact: "Protects every other goal you have built",
      action: { label: "Create Emergency Fund", tab: "goals" },
      steps: [
        "Start a new goal called Emergency Fund",
        "Target: 3 months of expenses = $" + Math.round((profile?.totalFixed || 2100) * 3).toLocaleString(),
        "Set a date lock so you cannot touch it without a waiting period",
        "Auto-deposit $50/week until it is fully funded",
      ],
    });
  } else if (emergFund.saved < emergFund.target * 0.5) {
    recs.push({
      id: "emergency-fund-low", priority: "high", category: "Emergency Fund",
      icon: "shield", color: "#FF5A6E",
      title: "Emergency fund is less than halfway funded",
      body: `You have $${emergFund.saved.toLocaleString()} saved but your target is $${emergFund.target.toLocaleString()}. Until this hits 3 months of expenses, every other financial goal is at risk.`,
      savingsPerMonth: null,
      yearlyImpact: null,
      goalImpact: "Priority #1 before investing or other goals",
      action: { label: "Add to Emergency Fund", tab: "goals" },
      steps: [
        "Make emergency fund deposits before any discretionary spending",
        "Set up a weekly auto-deposit of any amount — even $20 helps",
        "Add a date lock to prevent withdrawals",
        "Any unexpected income goes here first",
      ],
    });
  }

  // Auto-deposit opportunity
  const goalsWithoutAutoDeposit = goals.filter(g => !g.autoDepositAmount && g.saved < g.target);
  if (goalsWithoutAutoDeposit.length > 0) {
    recs.push({
      id: "no-auto-deposit", priority: "medium", category: "Automation",
      icon: "repeat", color: "#9B6BFF",
      title: `${goalsWithoutAutoDeposit.length} goal${goalsWithoutAutoDeposit.length > 1 ? "s" : ""} without auto-deposit`,
      body: "Goals with auto-deposits are completed 3x faster than manual ones. Set it and forget it — your goals will grow while you sleep.",
      savingsPerMonth: null,
      yearlyImpact: null,
      goalImpact: "3x faster goal completion on average",
      action: { label: "Set Up Auto-Deposits", tab: "goals" },
      steps: [
        "Tap Add Funds on any goal and toggle Auto-Deposit on",
        "Choose weekly or biweekly — aligns with most paychecks",
        "Start small if needed — $25/week is $1,300/year",
        "Increase the amount by $10 each month",
      ],
    });
  }

  // High interest debt warning
  recs.push({
    id: "high-interest-debt", priority: "high", category: "Debt Strategy",
    icon: "wallet", color: "#FF5A6E",
    title: "Credit card debt costs more than investing earns",
    body: "Paying 21% APR on credit card debt while earning 10% in the market is a net loss of 11% per year. Every dollar of high-interest debt paid off is a guaranteed 21% return.",
    savingsPerMonth: null,
    yearlyImpact: null,
    goalImpact: "Guaranteed 21% return — better than any investment",
    action: { label: "Open Debt Planner", tab: "debt" },
    steps: [
      "List every debt with its APR in the Debt Planner tab",
      "Pay minimums on everything, throw every extra dollar at the highest APR",
      "Once the highest is paid, roll that payment to the next one",
      "Do not invest more than your employer match until high-interest debt is gone",
    ],
  });

  // Sort by priority
  const order = { urgent: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

function SmartRecommendations({ goals, profile, bills }) {
  const recs = useMemo(() => generateRecommendations(goals, profile, bills), [goals, profile]);
  const [expanded, setExpanded] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  const visible = recs.filter(r => !dismissed.includes(r.id));
  const totalMonthlySavings = recs.filter(r => r.savingsPerMonth).reduce((a, r) => a + r.savingsPerMonth, 0);
  const totalYearlySavings  = recs.filter(r => r.yearlyImpact).reduce((a, r) => a + r.yearlyImpact, 0);

  const priorityConfig = {
    urgent: { label: "Urgent",  color: "#FF5A6E", bg: "rgba(255,90,110,0.12)"  },
    high:   { label: "High",    color: "#FF6B35", bg: "rgba(255,107,53,0.1)"   },
    medium: { label: "Medium",  color: "#F5A623", bg: "rgba(245,166,35,0.1)"   },
    low:    { label: "Low",     color: "#00D2A0", bg: "rgba(0,210,160,0.1)"    },
  };

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

      {/* Header impact card */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0A1A12 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,210,160,0.15) 0%, transparent 70%)" }} />
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 6px" }}>Smart Recommendations</p>
        <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 16px", lineHeight: 1.5 }}>Based on your real spending — not generic advice.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 12, padding: 13 }}>
            <p style={{ color: T.textSub, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Could save monthly</p>
            <p style={{ color: T.green, fontWeight: 900, fontSize: 22, margin: 0 }}>${totalMonthlySavings}/mo</p>
          </div>
          <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 12, padding: 13 }}>
            <p style={{ color: T.textSub, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Per year impact</p>
            <p style={{ color: T.purple, fontWeight: 900, fontSize: 22, margin: 0 }}>${totalYearlySavings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {visible.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎯</div>
          <p style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>Your finances look great</p>
          <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>No major recommendations right now. Keep it up.</p>
        </div>
      )}

      {visible.map(rec => {
        const pri = priorityConfig[rec.priority];
        const isOpen = expanded === rec.id;
        return (
          <div key={rec.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            {/* Color accent top bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${rec.color}, ${rec.color}44)`, boxShadow: `0 0 8px ${rec.color}66` }} />

            <div style={{ padding: "14px 16px" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${rec.color}15`, border: `1px solid ${rec.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={rec.icon} size={19} color={rec.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                    <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.3 }}>{rec.title}</p>
                    <span style={{ background: pri.bg, color: pri.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>{pri.label}</span>
                  </div>
                  <span style={{ ...S.tag(rec.color), fontSize: 10 }}>{rec.category}</span>
                </div>
              </div>

              <p style={{ color: T.textMid, fontSize: 13, margin: "0 0 12px", lineHeight: 1.6 }}>{rec.body}</p>

              {/* Impact pills */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                {rec.savingsPerMonth && (
                  <div style={{ background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.22)", borderRadius: 8, padding: "5px 10px" }}>
                    <span style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>Save ${rec.savingsPerMonth}/mo</span>
                  </div>
                )}
                {rec.yearlyImpact && (
                  <div style={{ background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.22)", borderRadius: 8, padding: "5px 10px" }}>
                    <span style={{ color: T.purple, fontSize: 12, fontWeight: 700 }}>${rec.yearlyImpact.toLocaleString()}/yr</span>
                  </div>
                )}
                {rec.goalImpact && (
                  <div style={{ background: "rgba(79,172,254,0.1)", border: "1px solid rgba(79,172,254,0.22)", borderRadius: 8, padding: "5px 10px" }}>
                    <span style={{ color: T.blue, fontSize: 12, fontWeight: 600 }}>{rec.goalImpact}</span>
                  </div>
                )}
              </div>

              {/* Expandable steps */}
              {isOpen && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <p style={{ color: T.textSub, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px" }}>Action Plan</p>
                  {rec.steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, boxShadow: "0 2px 8px rgba(124,92,252,0.4)" }}>
                        <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
                      </div>
                      <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{step}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setExpanded(isOpen ? null : rec.id)} style={{ flex: 1, background: isOpen ? "rgba(255,255,255,0.04)" : `${rec.color}12`, border: `1px solid ${rec.color}25`, borderRadius: 9, padding: "9px 0", cursor: "pointer", color: isOpen ? T.textMid : rec.color, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Icon name={isOpen ? "chevronUp" : "check"} size={13} color={isOpen ? T.textSub : rec.color} />
                  {isOpen ? "Hide steps" : "Show action plan"}
                </button>
                <button onClick={() => setDismissed(p => [...p, rec.id])} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="x" size={14} color={T.textSub} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {dismissed.length > 0 && (
        <button onClick={() => setDismissed([])} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 0", cursor: "pointer", color: T.textSub, fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600 }}>
          Restore {dismissed.length} dismissed recommendation{dismissed.length > 1 ? "s" : ""}
        </button>
      )}

      <p style={{ color: "#1A1840", fontSize: 11, textAlign: "center" }}>Recommendations are based on your profile and spending data. Connect your bank for even more personalized insights.</p>
    </div>
  );
}

// ── Couple / Family Mode ──────────────────────────────────────────────────────

const PARTNER_MOCK = {
  name: "Alex",
  avatar: "AX",
  color: "#FF6B35",
  income: 3800,
  payFreq: "biweekly",
  joined: "Jan 2025",
  savingsRate: 18,
  streak: 12,
  checkIns: 142,
};

const SHARED_GOALS_MOCK = [
  { id: "s1", name: "House Down Payment", target: 40000, saved: 18400, icon: "building", color: "#4FACFE", myContrib: 9800, partnerContrib: 8600, isShared: true },
  { id: "s2", name: "Emergency Fund",     target: 15000, saved: 7200,  icon: "shield",   color: "#00D2A0", myContrib: 4200, partnerContrib: 3000, isShared: true },
  { id: "s3", name: "Vacation Fund",      target: 5000,  saved: 1800,  icon: "send",     color: "#F5A623", myContrib: 900,  partnerContrib: 900,  isShared: true },
];

const SHARED_BILLS_MOCK = [
  { id: "sb1", name: "Rent",         amount: 2200, myShare: 0.5,  dueDay: 1,  autopay: true,  icon: "building",   color: "#4FACFE" },
  { id: "sb2", name: "Electricity",  amount: 140,  myShare: 0.5,  dueDay: 12, autopay: false, icon: "zap",        color: "#F5A623" },
  { id: "sb3", name: "Internet",     amount: 69,   myShare: 0.5,  dueDay: 15, autopay: true,  icon: "bell",       color: "#7C5CFC" },
  { id: "sb4", name: "Groceries",    amount: 600,  myShare: 0.5,  dueDay: 1,  autopay: false, icon: "dollarSign", color: "#00D2A0" },
  { id: "sb5", name: "Streaming",    amount: 45,   myShare: 0.5,  dueDay: 22, autopay: true,  icon: "repeat",     color: "#FF6B35" },
];

function CoupleMode({ profile, goals, myGoals }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(true); // demo: connected
  const [splitMode, setSplitMode] = useState("50/50");
  const [showPrivacyNote, setShowPrivacyNote] = useState(true);

  const mo = profile?.monthlyIncome || 4200;
  const partnerMo = PARTNER_MOCK.income;
  const combinedIncome = mo + partnerMo;
  const combinedSaved = SHARED_GOALS_MOCK.reduce((a, g) => a + g.saved, 0);
  const mySaved = SHARED_GOALS_MOCK.reduce((a, g) => a + g.myContrib, 0);
  const partnerSaved = SHARED_GOALS_MOCK.reduce((a, g) => a + g.partnerContrib, 0);
  const myBillShare = SHARED_BILLS_MOCK.reduce((a, b) => a + b.amount * b.myShare, 0);
  const totalBills = SHARED_BILLS_MOCK.reduce((a, b) => a + b.amount, 0);

  const sections = [
    { id: "overview",  label: "Overview"  },
    { id: "goals",     label: "Goals"     },
    { id: "bills",     label: "Bills"     },
    { id: "checkins",  label: "Activity"  },
  ];

  if (!partnerConnected) return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0F0E2A 100%)", textAlign: "center", padding: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 4px 24px rgba(124,92,252,0.4)" }}>
          <Icon name="users" size={32} color="#fff" strokeWidth={1.5} />
        </div>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: "0 0 10px", letterSpacing: -0.5 }}>Couple Mode</h2>
        <p style={{ color: T.textMid, fontSize: 14, margin: "0 0 28px", lineHeight: 1.7 }}>
          Share goals, split bills, and track finances together — while keeping your personal spending private. Stop guessing. Start aligning.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
          {[
            { icon: "target",     label: "Shared Goals",     desc: "Contribute together" },
            { icon: "calendar",   label: "Split Bills",       desc: "Fair and transparent" },
            { icon: "lock",       label: "Private Spending",  desc: "Your personal budget stays yours" },
            { icon: "barChart",   label: "Combined View",     desc: "Full household picture" },
          ].map(f => (
            <div key={f.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 8px" }}>
                <Icon name={f.icon} size={14} color="#fff" />
              </div>
              <p style={{ color: T.text, fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>{f.label}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setShowInviteModal(true)} style={{ ...S.primaryBtn(), marginBottom: 10 }}>
          Invite My Partner
        </button>
        <p style={{ color: T.textSub, fontSize: 12, margin: 0 }}>Your partner will receive a link to join FreedomFund and connect to your household.</p>
      </div>

      {showInviteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 24 }}>
          <div style={{ ...S.card, width: "100%", maxWidth: 380, padding: 28 }}>
            <h3 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Invite Your Partner</h3>
            <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>Enter their email and we will send them a link to join your FreedomFund household.</p>
            <label style={S.label}>Partner email</label>
            <input placeholder="partner@email.com" style={{ ...S.input, marginBottom: 12 }} />
            <label style={S.label}>Your message (optional)</label>
            <input placeholder="Let us work on this together" style={{ ...S.input, marginBottom: 20 }} />
            <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <p style={{ color: T.purple, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Your partner will only see shared goals and bills. Your personal spending and individual goals stay completely private unless you choose to share them.</p>
            </div>
            <button onClick={() => { setShowInviteModal(false); setPartnerConnected(true); }} style={{ ...S.primaryBtn(), marginBottom: 10 }}>Send Invite</button>
            <button onClick={() => setShowInviteModal(false)} style={S.ghostBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

      {/* Partner header */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0A1A12 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          {/* My avatar */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 auto 5px", boxShadow: "0 3px 12px rgba(124,92,252,0.4)" }}>
              {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "ME"}
            </div>
            <p style={{ color: T.textSub, fontSize: 10, margin: 0, fontWeight: 600 }}>You</p>
          </div>

          {/* Connection line */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: GRAD.green, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(0,210,160,0.5)", flexShrink: 0 }}>
              <Icon name="check" size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* Partner avatar */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: GRAD.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 auto 5px", boxShadow: "0 3px 12px rgba(255,107,53,0.4)" }}>
              {PARTNER_MOCK.avatar}
            </div>
            <p style={{ color: T.textSub, fontSize: 10, margin: 0, fontWeight: 600 }}>{PARTNER_MOCK.name}</p>
          </div>
        </div>

        {/* Combined stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Combined Income", value: `$${combinedIncome.toLocaleString()}`, color: T.green  },
            { label: "Total Saved",     value: `$${combinedSaved.toLocaleString()}`,  color: T.purple },
            { label: "Shared Goals",    value: SHARED_GOALS_MOCK.length,              color: T.blue   },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <p style={{ color: s.color, fontWeight: 800, fontSize: 15, margin: 0 }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 9, margin: "3px 0 0", lineHeight: 1.3 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      {showPrivacyNote && (
        <div style={{ background: "rgba(124,92,252,0.07)", border: "1px solid rgba(124,92,252,0.18)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Icon name="lock" size={16} color={T.purple} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: T.purple, fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>Privacy protected</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.5 }}>Your personal goals, individual spending, and private check-ins are never visible to {PARTNER_MOCK.name}. Only shared goals and joint bills are visible to both of you.</p>
          </div>
          <button onClick={() => setShowPrivacyNote(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
            <Icon name="x" size={14} color={T.textSub} />
          </button>
        </div>
      )}

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ flex: 1, background: activeSection === s.id ? GRAD.purple : "none", border: "none", borderRadius: 9, padding: "9px 0", cursor: "pointer", color: activeSection === s.id ? "#fff" : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: activeSection === s.id ? 700 : 400, fontSize: 12, boxShadow: activeSection === s.id ? "0 2px 10px rgba(124,92,252,0.4)" : "none", transition: "all 0.2s" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeSection === "overview" && (
        <>
          {/* Contribution comparison */}
          <div style={S.card}>
            <SectionLabel>Who Saved What</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { label: profile?.name || "You", value: mySaved, color: T.purple, pct: Math.round((mySaved / (mySaved + partnerSaved)) * 100) },
                { label: PARTNER_MOCK.name,        value: partnerSaved, color: PARTNER_MOCK.color, pct: Math.round((partnerSaved / (mySaved + partnerSaved)) * 100) },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}0f`, border: `1px solid ${s.color}25`, borderRadius: 12, padding: 14, textAlign: "center" }}>
                  <p style={{ color: s.color, fontWeight: 900, fontSize: 20, margin: "0 0 2px" }}>${s.value.toLocaleString()}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: "0 0 8px" }}>{s.label}</p>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 4 }}>
                    <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 99, boxShadow: `0 0 6px ${s.color}` }} />
                  </div>
                  <p style={{ color: s.color, fontSize: 11, fontWeight: 700, margin: "5px 0 0" }}>{s.pct}% of shared savings</p>
                </div>
              ))}
            </div>

            {/* Combined savings rate */}
            <div style={{ background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: T.textMid, fontSize: 12 }}>Combined savings rate</span>
                <span style={{ color: T.green, fontWeight: 800, fontSize: 14 }}>{Math.round(((mySaved + partnerSaved) / combinedIncome) * 100)}%</span>
              </div>
              <ProgressBar pct={Math.round(((mySaved + partnerSaved) / combinedIncome) * 100)} color={T.green} height={6} />
              <p style={{ color: T.textSub, fontSize: 11, margin: "7px 0 0" }}>Target: 20% minimum &middot; You are {Math.round(((mySaved + partnerSaved) / combinedIncome) * 100) >= 20 ? "hitting it" : "working toward it"}</p>
            </div>
          </div>

          {/* Income breakdown */}
          <div style={S.card}>
            <SectionLabel>Combined Income</SectionLabel>
            {[
              { label: profile?.name || "You", income: mo,          color: T.purple },
              { label: PARTNER_MOCK.name,       income: partnerMo,   color: PARTNER_MOCK.color },
            ].map(p => (
              <div key={p.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: T.textMid, fontSize: 13 }}>{p.label}</span>
                  <span style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>${p.income.toLocaleString()}/mo</span>
                </div>
                <ProgressBar pct={Math.round((p.income / combinedIncome) * 100)} color={p.color} height={6} />
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textMid, fontSize: 13, fontWeight: 600 }}>Combined</span>
              <span style={{ color: T.text, fontWeight: 800, fontSize: 16 }}>${combinedIncome.toLocaleString()}/mo</span>
            </div>
          </div>

          {/* Split setting */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <SectionLabel>Bill Split Method</SectionLabel>
                <p style={{ color: T.textSub, fontSize: 11, margin: "-6px 0 0" }}>How shared expenses are divided</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {["50/50", "By Income", "Custom"].map(m => (
                <button key={m} onClick={() => setSplitMode(m)} style={{ background: splitMode === m ? GRAD.purple : "rgba(255,255,255,0.04)", border: splitMode === m ? "none" : "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 0", cursor: "pointer", color: splitMode === m ? "#fff" : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: splitMode === m ? 700 : 400, fontSize: 12, boxShadow: splitMode === m ? "0 2px 10px rgba(124,92,252,0.4)" : "none" }}>
                  {m}
                </button>
              ))}
            </div>
            {splitMode === "By Income" && (
              <div style={{ marginTop: 12, background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 9, padding: 11 }}>
                <p style={{ color: T.purple, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  Based on income: {profile?.name || "You"} pays <strong>{Math.round((mo / combinedIncome) * 100)}%</strong> and {PARTNER_MOCK.name} pays <strong>{Math.round((partnerMo / combinedIncome) * 100)}%</strong> of shared bills.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Shared Goals ── */}
      {activeSection === "goals" && (
        <>
          <div style={{ background: "rgba(79,172,254,0.07)", border: "1px solid rgba(79,172,254,0.2)", borderRadius: 12, padding: "11px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="info" size={15} color={T.blue} />
            <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Shared goals are visible to both you and {PARTNER_MOCK.name}. Individual contributions are tracked separately.</p>
          </div>

          {SHARED_GOALS_MOCK.map(goal => {
            const pct = Math.round((goal.saved / goal.target) * 100);
            const myPct = Math.round((goal.myContrib / goal.saved) * 100);
            return (
              <div key={goal.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}44)` }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${goal.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={goal.icon} size={18} color={goal.color} />
                      </div>
                      <div>
                        <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{goal.name}</p>
                        <span style={{ background: "rgba(124,92,252,0.12)", color: T.purple, border: "1px solid rgba(124,92,252,0.25)", fontSize: 10, padding: "2px 8px", borderRadius: 5, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>Shared Goal</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: goal.color, fontWeight: 900, fontSize: 18, margin: 0 }}>{pct}%</p>
                      <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>${goal.saved.toLocaleString()} / ${goal.target.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Overall progress */}
                  <ProgressBar pct={pct} color={goal.color} height={7} />

                  {/* Individual contributions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    {[
                      { label: profile?.name || "You", contrib: goal.myContrib,      color: T.purple,           pct: myPct       },
                      { label: PARTNER_MOCK.name,        contrib: goal.partnerContrib, color: PARTNER_MOCK.color, pct: 100 - myPct },
                    ].map(c => (
                      <div key={c.label} style={{ background: `${c.color}0a`, border: `1px solid ${c.color}20`, borderRadius: 9, padding: "9px 11px" }}>
                        <p style={{ color: T.textSub, fontSize: 10, fontWeight: 600, margin: "0 0 3px" }}>{c.label}</p>
                        <p style={{ color: c.color, fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>${c.contrib.toLocaleString()}</p>
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 3 }}>
                          <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: 99 }} />
                        </div>
                        <p style={{ color: c.color, fontSize: 10, fontWeight: 700, margin: "4px 0 0" }}>{c.pct}% of total</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => alert("Add contribution to " + goal.name + " — connect your bank to enable real deposits.")} style={{ ...S.primaryBtn(goal.color), marginTop: 12, fontSize: 13, padding: "10px 0" }}>
                    Add My Contribution
                  </button>
                </div>
              </div>
            );
          })}

          <button onClick={() => alert("Create Shared Goal — coming soon. Will let both partners set a combined target and auto-split contributions.")} style={{ background: "rgba(124,92,252,0.08)", border: "1px dashed rgba(124,92,252,0.3)", borderRadius: 14, padding: "16px 0", cursor: "pointer", color: T.purple, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="plus" size={16} color={T.purple} />
            Create Shared Goal
          </button>
        </>
      )}

      {/* ── Shared Bills ── */}
      {activeSection === "bills" && (
        <>
          <div style={S.card}>
            <SectionLabel>Bill Summary</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Total monthly", value: `$${totalBills.toLocaleString()}`, color: T.orange },
                { label: "Your share",    value: `$${Math.round(myBillShare).toLocaleString()}`,     color: T.purple },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12 }}>
                  <p style={{ color: s.color, fontWeight: 800, fontSize: 18, margin: "0 0 3px" }}>{s.value}</p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <p style={{ color: T.textSub, fontSize: 12, margin: 0 }}>Split method: <strong style={{ color: T.purple }}>{splitMode}</strong></p>
          </div>

          {SHARED_BILLS_MOCK.map(bill => {
            const myAmt = Math.round(bill.amount * bill.myShare);
            const partnerAmt = bill.amount - myAmt;
            return (
              <div key={bill.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, ${bill.color}, ${bill.color}44)` }} />
                <div style={{ padding: "13px 15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${bill.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={bill.icon} size={16} color={bill.color} />
                      </div>
                      <div>
                        <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{bill.name}</p>
                        <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Due {bill.dueDay}{bill.dueDay===1?"st":bill.dueDay===2?"nd":bill.dueDay===3?"rd":"th"} &middot; {bill.autopay ? "Autopay" : "Manual"}</p>
                      </div>
                    </div>
                    <p style={{ color: T.text, fontWeight: 800, fontSize: 16, margin: 0 }}>${bill.amount}</p>
                  </div>

                  {/* Split bar */}
                  <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${Math.round(bill.myShare * 100)}%`, height: "100%", background: T.purple, boxShadow: `0 0 6px ${T.purple}` }} />
                    <div style={{ flex: 1, height: "100%", background: PARTNER_MOCK.color, boxShadow: `0 0 6px ${PARTNER_MOCK.color}` }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.purple, fontSize: 11, fontWeight: 700 }}>{profile?.name || "You"}: ${myAmt}</span>
                    <span style={{ color: PARTNER_MOCK.color, fontSize: 11, fontWeight: 700 }}>{PARTNER_MOCK.name}: ${partnerAmt}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <button onClick={() => alert("Add Shared Bill — coming soon. Will let you add any joint expense and split it by your chosen method.")} style={{ background: "rgba(255,107,53,0.08)", border: "1px dashed rgba(255,107,53,0.3)", borderRadius: 14, padding: "16px 0", cursor: "pointer", color: T.orange, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="plus" size={16} color={T.orange} />
            Add Shared Bill
          </button>
        </>
      )}

      {/* ── Activity Feed ── */}
      {activeSection === "checkins" && (
        <>
          <div style={S.card}>
            <SectionLabel>This Week</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: `${profile?.name || "Your"} streak`, value: `${7}d`, color: T.purple, icon: "fire" },
                { label: `${PARTNER_MOCK.name}'s streak`,     value: `${PARTNER_MOCK.streak}d`, color: PARTNER_MOCK.color, icon: "fire" },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}0f`, border: `1px solid ${s.color}22`, borderRadius: 11, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name={s.icon} size={18} color={s.color} />
                  <div>
                    <p style={{ color: s.color, fontWeight: 800, fontSize: 18, margin: 0 }}>{s.value}</p>
                    <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div style={S.card}>
            <SectionLabel>Recent Activity</SectionLabel>
            {[
              { user: profile?.name || "You",  color: T.purple,           action: "Added $200 to House Down Payment", time: "Today",      icon: "target"    },
              { user: PARTNER_MOCK.name,         color: PARTNER_MOCK.color, action: "Logged $45 on dining out",         time: "Today",      icon: "dollarSign" },
              { user: PARTNER_MOCK.name,         color: PARTNER_MOCK.color, action: "Paid Electric bill ($70 share)",   time: "Yesterday",  icon: "check"     },
              { user: profile?.name || "You",  color: T.purple,           action: "Logged $62 at grocery store",      time: "Yesterday",  icon: "dollarSign" },
              { user: profile?.name || "You",  color: T.purple,           action: "Added $150 to Emergency Fund",     time: "2 days ago", icon: "shield"    },
              { user: PARTNER_MOCK.name,         color: PARTNER_MOCK.color, action: "Added $150 to Emergency Fund",     time: "2 days ago", icon: "shield"    },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${item.color}20`, border: `1px solid ${item.color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={item.icon} size={13} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: T.text, fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>
                    <span style={{ color: item.color }}>{item.user}</span> {item.action}
                  </p>
                  <p style={{ color: T.textSub, fontSize: 11, margin: 0 }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(124,92,252,0.06)", border: "1px solid rgba(124,92,252,0.15)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 8, alignItems: "center" }}>
            <Icon name="lock" size={14} color={T.purple} />
            <p style={{ color: T.textSub, fontSize: 11, margin: 0, lineHeight: 1.5 }}>Personal spending details are private. {PARTNER_MOCK.name} sees activity type and goal contributions, not your individual purchase amounts unless you share them.</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Credit Score Tracker ──────────────────────────────────────────────────────
const SCORE_HISTORY = [
  { month: "Jul", score: 641 }, { month: "Aug", score: 648 },
  { month: "Sep", score: 652 }, { month: "Oct", score: 658 },
  { month: "Nov", score: 661 }, { month: "Dec", score: 667 },
  { month: "Jan", score: 672 }, { month: "Feb", score: 669 },
  { month: "Mar", score: 674 }, { month: "Apr", score: 680 },
  { month: "May", score: 688 }, { month: "Jun", score: 695 },
];

const SCORE_FACTORS = [
  {
    id: "payment",
    label: "Payment History",
    weight: 35,
    status: "good",
    score: 88,
    impact: "+",
    color: "#00D2A0",
    icon: "check",
    detail: "You have made on-time payments for 11 of the last 12 months. One late payment in September is still affecting your score but will fall off in 6 months.",
    action: "Set up autopay on all bills to never miss a payment again.",
    pointsIfFixed: 0,
  },
  {
    id: "utilization",
    label: "Credit Utilization",
    weight: 30,
    status: "warning",
    score: 58,
    impact: "-",
    color: "#F5A623",
    icon: "barChart",
    detail: "You are using 42% of your available credit. The ideal is under 30%, and under 10% is best. High utilization is the fastest thing you can fix.",
    action: "Pay down your credit card balance to under $540 (30% of your $1,800 limit) to see an immediate score boost.",
    pointsIfFixed: 28,
  },
  {
    id: "age",
    label: "Credit Age",
    weight: 15,
    status: "fair",
    score: 62,
    impact: "-",
    color: "#F5A623",
    icon: "clock",
    detail: "Average age of your accounts is 3 years 4 months. Older accounts help your score. Do not close old cards even if you do not use them.",
    action: "Keep your oldest credit card open and make a small purchase on it once every 6 months to keep it active.",
    pointsIfFixed: 8,
  },
  {
    id: "mix",
    label: "Credit Mix",
    weight: 10,
    status: "fair",
    score: 55,
    impact: "-",
    color: "#4FACFE",
    icon: "repeat",
    detail: "You have credit cards but no installment loans on your record. A mix of revolving and installment credit is viewed positively.",
    action: "A small personal loan or auto loan (if needed anyway) would diversify your credit mix. Do not take debt just for this.",
    pointsIfFixed: 12,
  },
  {
    id: "inquiries",
    label: "New Credit",
    weight: 10,
    status: "good",
    score: 82,
    impact: "+",
    color: "#00D2A0",
    icon: "zap",
    detail: "You have had 1 hard inquiry in the last 12 months from a car loan application. Hard inquiries fall off after 2 years and stop affecting your score after 12 months.",
    action: "Avoid applying for new credit for at least 6 more months.",
    pointsIfFixed: 0,
  },
];

const SCORE_RANGES = [
  { label: "Poor",      min: 300, max: 579, color: "#FF5A6E" },
  { label: "Fair",      min: 580, max: 669, color: "#FF6B35" },
  { label: "Good",      min: 670, max: 739, color: "#F5A623" },
  { label: "Very Good", min: 740, max: 799, color: "#00D2A0" },
  { label: "Excellent", min: 800, max: 850, color: "#4FACFE" },
];

function CreditScoreTracker() {
  const currentScore = SCORE_HISTORY[SCORE_HISTORY.length - 1].score;
  const prevScore    = SCORE_HISTORY[SCORE_HISTORY.length - 2].score;
  const change       = currentScore - prevScore;
  const yearStart    = SCORE_HISTORY[0].score;
  const yearChange   = currentScore - yearStart;

  const [selectedFactor, setSelectedFactor] = useState(null);
  const [showConnect, setShowConnect]        = useState(false);
  const [connected, setConnected]            = useState(true); // demo connected

  const scoreRange = SCORE_RANGES.find(r => currentScore >= r.min && currentScore <= r.max);
  const scoreColor = scoreRange?.color || T.textSub;
  const scorePct   = Math.round(((currentScore - 300) / 550) * 100);

  const totalPotentialGain = SCORE_FACTORS.filter(f => f.pointsIfFixed > 0).reduce((a, f) => a + f.pointsIfFixed, 0);

  // Mortgage impact calculator
  const loanAmount = 300000;
  const rateDiff = (score, targetScore) => {
    if (score >= 760) return 6.5;
    if (score >= 720) return 6.8;
    if (score >= 680) return 7.1;
    if (score >= 640) return 7.5;
    return 8.2;
  };
  const currentRate     = rateDiff(currentScore);
  const improvedRate    = rateDiff(currentScore + totalPotentialGain);
  const monthlyDiff     = Math.round(((currentRate - improvedRate) / 100 / 12) * loanAmount);
  const thirtyYearDiff  = monthlyDiff * 360;

  // Chart
  const minScore = Math.min(...SCORE_HISTORY.map(h => h.score)) - 10;
  const maxScore = Math.max(...SCORE_HISTORY.map(h => h.score)) + 10;
  const W = 340, H = 100;
  const pts = SCORE_HISTORY.map((h, i) => `${(i / (SCORE_HISTORY.length - 1)) * W},${H - ((h.score - minScore) / (maxScore - minScore)) * H}`).join(" ");

  if (!connected) return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0F0E2A 100%)", textAlign: "center", padding: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 4px 24px rgba(124,92,252,0.4)" }}>
          <Icon name="shield" size={32} color="#fff" strokeWidth={1.5} />
        </div>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Credit Score Tracker</h2>
        <p style={{ color: T.textMid, fontSize: 14, margin: "0 0 28px", lineHeight: 1.7 }}>See your score, understand what is hurting it, and get a specific action plan — ranked by impact.</p>
        <button onClick={() => setConnected(true)} style={{ ...S.primaryBtn(), marginBottom: 10 }}>Connect Credit Score</button>
        <p style={{ color: T.textSub, fontSize: 12, margin: 0 }}>Uses Experian or Credit Karma. Free. No hard inquiry. Never affects your score.</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

      {/* Score hero card */}
      <div style={{ ...S.card, background: "linear-gradient(145deg, #1A0D3A 0%, #0A1A12 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${scoreColor}18 0%, transparent 70%)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 4px" }}>Credit Score</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <p style={{ color: scoreColor, fontWeight: 900, fontSize: 52, margin: 0, letterSpacing: -2, textShadow: `0 0 30px ${scoreColor}66` }}>{currentScore}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name={change >= 0 ? "arrowUp" : "arrowDown"} size={14} color={change >= 0 ? T.green : T.red} />
                <span style={{ color: change >= 0 ? T.green : T.red, fontSize: 14, fontWeight: 700 }}>{Math.abs(change)}</span>
                <span style={{ color: T.textSub, fontSize: 12 }}>this month</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40`, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, fontFamily: "'Inter',sans-serif" }}>{scoreRange?.label}</span>
              <span style={{ color: T.textSub, fontSize: 12 }}>out of 850</span>
            </div>
          </div>
          {/* Mini donut */}
          <div style={{ position: "relative", width: 70, height: 70 }}>
            <svg width={70} height={70} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={35} cy={35} r={28} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
              <circle cx={35} cy={35} r={28} fill="none" stroke={scoreColor} strokeWidth={8}
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - scorePct / 100)}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: scoreColor, fontSize: 13, fontWeight: 800 }}>{scorePct}%</span>
            </div>
          </div>
        </div>

        {/* Score range bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
            {SCORE_RANGES.map(r => (
              <div key={r.label} style={{ flex: r.max - r.min, background: r.color, opacity: currentScore >= r.min && currentScore <= r.max ? 1 : 0.25, position: "relative" }}>
                {currentScore >= r.min && currentScore <= r.max && (
                  <div style={{ position: "absolute", top: "50%", left: `${((currentScore - r.min) / (r.max - r.min)) * 100}%`, transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: `0 0 8px ${r.color}`, border: `2px solid ${r.color}` }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: T.textSub, fontSize: 9 }}>300</span>
            {SCORE_RANGES.map(r => <span key={r.label} style={{ color: r.color, fontSize: 9, fontWeight: 600 }}>{r.label}</span>)}
            <span style={{ color: T.textSub, fontSize: 9 }}>850</span>
          </div>
        </div>

        {/* 12-month stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "12-mo gain",     value: `+${yearChange}`,             color: T.green  },
            { label: "Potential gain", value: `+${totalPotentialGain} pts`, color: T.purple },
            { label: "Updated",        value: "Today",                       color: T.textSub },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: "9px 8px", textAlign: "center" }}>
              <p style={{ color: s.color, fontWeight: 800, fontSize: 14, margin: 0 }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 9, margin: "3px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Score history chart */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>12-Month History</SectionLabel>
          <span style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>+{yearChange} pts this year</span>
        </div>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={scoreColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={scoreColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(p => (
            <line key={p} x1={0} y1={H * p} x2={W} y2={H * p} stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="4,4" />
          ))}
          <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#scoreGrad)" />
          <polyline points={pts} fill="none" stroke={scoreColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${scoreColor})` }} />
          {SCORE_HISTORY.map((h, i) => {
            const x = (i / (SCORE_HISTORY.length - 1)) * W;
            const y = H - ((h.score - minScore) / (maxScore - minScore)) * H;
            return <circle key={i} cx={x} cy={y} r={i === SCORE_HISTORY.length - 1 ? 5 : 3} fill={scoreColor} style={{ filter: `drop-shadow(0 0 4px ${scoreColor})` }} />;
          })}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {SCORE_HISTORY.map(h => <span key={h.month} style={{ color: T.textSub, fontSize: 9 }}>{h.month}</span>)}
        </div>
      </div>

      {/* What affects your score */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionLabel>Score Factors</SectionLabel>
          <span style={{ color: T.textSub, fontSize: 11 }}>Tap to see fix</span>
        </div>
        {SCORE_FACTORS.sort((a, b) => b.pointsIfFixed - a.pointsIfFixed).map(factor => {
          const isOpen = selectedFactor === factor.id;
          const statusColors = { good: T.green, warning: T.gold, fair: T.orange, poor: T.red };
          const fc = statusColors[factor.status] || T.textSub;
          return (
            <div key={factor.id} style={{ marginBottom: 10 }}>
              <button onClick={() => setSelectedFactor(isOpen ? null : factor.id)} style={{ width: "100%", background: isOpen ? "rgba(124,92,252,0.07)" : "rgba(255,255,255,0.03)", border: isOpen ? "1px solid rgba(124,92,252,0.2)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${fc}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={factor.icon} size={16} color={fc} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>{factor.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {factor.pointsIfFixed > 0 && (
                          <span style={{ background: "rgba(0,210,160,0.12)", color: T.green, border: "1px solid rgba(0,210,160,0.25)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, fontFamily: "'Inter',sans-serif" }}>+{factor.pointsIfFixed} pts</span>
                        )}
                        <span style={{ color: T.textSub, fontSize: 11 }}>{factor.weight}%</span>
                      </div>
                    </div>
                    <span style={{ color: T.textSub, fontSize: 11 }}>of your score</span>
                  </div>
                </div>
                <ProgressBar pct={factor.score} color={fc} height={5} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ color: fc, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{factor.status}</span>
                  <span style={{ color: T.textSub, fontSize: 11 }}>{factor.score}/100</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14, marginTop: 4 }}>
                  <p style={{ color: T.textMid, fontSize: 13, margin: "0 0 12px", lineHeight: 1.6 }}>{factor.detail}</p>
                  <div style={{ background: factor.pointsIfFixed > 0 ? "rgba(0,210,160,0.08)" : "rgba(124,92,252,0.08)", border: `1px solid ${factor.pointsIfFixed > 0 ? "rgba(0,210,160,0.22)" : "rgba(124,92,252,0.22)"}`, borderRadius: 9, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Icon name="zap" size={15} color={factor.pointsIfFixed > 0 ? T.green : T.purple} style={{ marginTop: 1, flexShrink: 0 }} />
                      <div>
                        <p style={{ color: factor.pointsIfFixed > 0 ? T.green : T.purple, fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>
                          {factor.pointsIfFixed > 0 ? `Fix this to gain up to +${factor.pointsIfFixed} points` : "Already working in your favor"}
                        </p>
                        <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{factor.action}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mortgage impact calculator */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #0A1A2A 0%, #1A0D3A 100%)" }}>
        <SectionLabel>Real Dollar Impact</SectionLabel>
        <p style={{ color: T.textMid, fontSize: 13, margin: "0 0 16px", lineHeight: 1.6 }}>Here is what improving your credit score from <strong style={{ color: scoreColor }}>{currentScore}</strong> to <strong style={{ color: T.green }}>{currentScore + totalPotentialGain}</strong> would save you on a $300,000 mortgage:</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Current rate",   value: `${currentRate}%`,   color: T.red    },
            { label: "Improved rate",  value: `${improvedRate}%`,  color: T.green  },
            { label: "Monthly saving", value: `$${monthlyDiff}`,   color: T.green  },
            { label: "30-year saving", value: `$${thirtyYearDiff.toLocaleString()}`, color: T.gold },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "11px 12px" }}>
              <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
              <p style={{ color: s.color, fontWeight: 900, fontSize: 18, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 10, padding: 12 }}>
          <p style={{ color: T.green, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>Your credit score is worth ${thirtyYearDiff.toLocaleString()} over 30 years</p>
          <p style={{ color: T.textSub, fontSize: 12, margin: 0, lineHeight: 1.5 }}>A {totalPotentialGain}-point improvement could cut your mortgage rate by {(currentRate - improvedRate).toFixed(1)}%. The fixes above are worth doing.</p>
        </div>
      </div>

      {/* Priority action list */}
      <div style={S.card}>
        <SectionLabel>Priority Actions</SectionLabel>
        <p style={{ color: T.textSub, fontSize: 12, margin: "-6px 0 14px" }}>Ranked by points gained — do these in order</p>
        {SCORE_FACTORS
          .filter(f => f.pointsIfFixed > 0)
          .sort((a, b) => b.pointsIfFixed - a.pointsIfFixed)
          .map((f, i) => (
            <div key={f.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 0", borderBottom: i < SCORE_FACTORS.filter(x => x.pointsIfFixed > 0).length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? GRAD.purple : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: i === 0 ? "0 2px 10px rgba(124,92,252,0.4)" : "none" }}>
                <span style={{ color: i === 0 ? "#fff" : T.textSub, fontSize: 12, fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: T.text, fontSize: 13, fontWeight: 700 }}>{f.label}</span>
                  <span style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>+{f.pointsIfFixed} pts</span>
                </div>
                <p style={{ color: T.textSub, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{f.action}</p>
              </div>
            </div>
          ))}
      </div>

      <p style={{ color: "#1A1840", fontSize: 11, textAlign: "center" }}>Score data via Experian. Checking your own score is a soft inquiry and never affects your credit. Updated monthly.</p>
    </div>
  );
}

// ── Investment Education Path ─────────────────────────────────────────────────
const INVEST_LEVELS = [
  {
    id: 1,
    title: "Why You Must Invest",
    subtitle: "The cost of doing nothing",
    icon: "zap",
    color: "#FF6B35",
    unlocked: true,
    lessons: [
      {
        id: "1a",
        title: "Inflation is stealing from you right now",
        duration: "3 min",
        content: `Every dollar sitting in a checking account loses value every year. Inflation averages 3% annually — meaning $10,000 today has the purchasing power of $7,440 in 10 years if it never grows.\n\nThe money is not safe because it is in the bank. It is losing.\n\nThe only way to outpace inflation is to put your money to work earning more than 3% per year. The S&P 500 has averaged 10.5% annually since 1926 — through crashes, recessions, and wars.`,
        keyTakeaway: "Doing nothing with money is not safe — it is a guaranteed slow loss.",
        quiz: {
          question: "If inflation is 3% and your savings account earns 0.5%, what happens to your purchasing power?",
          options: ["It grows slightly", "It stays the same", "It shrinks by about 2.5% per year", "It doubles over time"],
          correct: 2,
        },
      },
      {
        id: "1b",
        title: "The most powerful force in finance",
        duration: "3 min",
        content: `Compound interest means your earnings earn earnings. Albert Einstein reportedly called it the eighth wonder of the world.\n\n$200 per month invested at 10% average return:\n• After 10 years: $38,000 invested → $40,800 in gains → $78,800 total\n• After 20 years: $48,000 invested → $129,000 in gains → $177,000 total\n• After 30 years: $72,000 invested → $377,000 in gains → $449,000 total\n\nThe money you invested did not change much. Time did the work. This is why starting at 25 instead of 35 is worth hundreds of thousands of dollars.`,
        keyTakeaway: "Time in the market is more important than timing the market.",
        quiz: {
          question: "Which investor ends up with more money at age 65?",
          options: [
            "Starts at 25, invests $200/mo until 35, then stops",
            "Waits until 35, invests $400/mo until 65",
            "They end up exactly the same",
            "It depends on the market",
          ],
          correct: 0,
        },
      },
    ],
  },
  {
    id: 2,
    title: "Stocks, ETFs, Bonds & Crypto",
    subtitle: "What you are actually buying",
    icon: "barChart",
    color: "#9B6BFF",
    unlocked: true,
    lessons: [
      {
        id: "2a",
        title: "What a stock actually is",
        duration: "3 min",
        content: `When you buy a stock, you buy a tiny piece of ownership in a real company. If Apple has 16 billion shares and you own 10, you own 0.0000000625% of Apple.\n\nAs the company grows and earns more money, each share becomes worth more. This is a capital gain. Some companies also pay dividends — cash payments from profits to shareholders.\n\nStocks are volatile short-term but historically grow long-term. The risk is real: individual companies can fail. Enron, Lehman Brothers, and Blockbuster were once blue-chip stocks.`,
        keyTakeaway: "A stock is ownership in a business. Its value follows the business's value.",
        quiz: {
          question: "What happens when a company you own stock in goes bankrupt?",
          options: ["You get your money back from the government", "Your shares become worthless", "The stock just stops trading temporarily", "You owe the company money"],
          correct: 1,
        },
      },
      {
        id: "2b",
        title: "ETFs — the smart shortcut",
        duration: "4 min",
        content: `An ETF (Exchange-Traded Fund) is a basket of hundreds or thousands of stocks in one purchase. When you buy VTI (Vanguard Total Market ETF), you own a tiny piece of every major US company — Apple, Microsoft, Amazon, and 3,997 others.\n\nThis solves the individual stock problem: no single company failure destroys you. It also solves the research problem: you do not need to pick winners.\n\nWarren Buffett has said that for most investors, a low-cost S&P 500 index fund is the best investment they can make. He put this in writing in his will for his wife's inheritance.`,
        keyTakeaway: "ETFs give you instant diversification. One purchase = thousands of companies.",
        quiz: {
          question: "What is the main advantage of an ETF over individual stocks?",
          options: ["Higher guaranteed returns", "Instant diversification reduces risk", "No fees ever", "Faster growth"],
          correct: 1,
        },
      },
      {
        id: "2c",
        title: "Bonds and crypto — the full picture",
        duration: "3 min",
        content: `Bonds are loans you make to governments or companies. They pay you a fixed interest rate and return your principal at maturity. Lower risk, lower return (~3-5%). Good for stability near retirement.\n\nCrypto (Bitcoin, Ethereum) is a digital asset with no underlying business earnings. Its price is driven purely by supply and demand. It has produced enormous gains and enormous losses. It is speculation, not investing. Dave Ramsey's rule: never put more than 10% of your portfolio in anything you cannot explain to a 10-year-old.`,
        keyTakeaway: "Bonds = stability. Crypto = speculation. Both have a place, neither should dominate.",
        quiz: {
          question: "According to Dave Ramsey's rule, what percentage of a portfolio should high-risk speculative assets be limited to?",
          options: ["50%", "25%", "10%", "0%"],
          correct: 2,
        },
      },
    ],
  },
  {
    id: 3,
    title: "Your First ETF",
    subtitle: "Picking one and actually starting",
    icon: "target",
    color: "#00D2A0",
    unlocked: false,
    lessons: [
      {
        id: "3a",
        title: "The only 3 ETFs most people ever need",
        duration: "4 min",
        content: `Three funds cover the entire world of investing:\n\n1. VTI — Vanguard Total US Market. 4,000+ US companies. 0.03% annual fee. The whole US economy in one fund.\n\n2. VXUS — Vanguard Total International. 7,500+ companies outside the US. Protects against US-specific downturns.\n\n3. BND — Vanguard Total Bond Market. Stability and income. Add this as you get closer to retirement.\n\nA classic starting allocation for someone in their 30s: 70% VTI, 20% VXUS, 10% BND.`,
        keyTakeaway: "You do not need 47 funds. Three well-chosen ETFs can build real wealth.",
        quiz: {
          question: "What does a 0.03% expense ratio on a $10,000 investment cost you per year?",
          options: ["$300", "$30", "$3", "$0.30"],
          correct: 2,
        },
      },
      {
        id: "3b",
        title: "Dollar-cost averaging — remove emotion",
        duration: "3 min",
        content: `Dollar-cost averaging (DCA) means investing a fixed amount on a fixed schedule regardless of price. $200 every two weeks, no matter what the market does.\n\nWhen prices are high, your $200 buys fewer shares. When prices are low, it buys more. You automatically buy more when things are cheap — without trying to time the market.\n\nThis removes the biggest investor mistake: selling when scared and missing the recovery. The investors who lost the most in 2008 were the ones who sold at the bottom. The ones who held (or kept buying) recovered everything and more.`,
        keyTakeaway: "Set it and forget it. Automate your investments. Emotion is the enemy.",
        quiz: {
          question: "What is the main benefit of dollar-cost averaging?",
          options: ["Guarantees higher returns", "Removes emotional decision-making from investing", "Lets you time the market perfectly", "Reduces your tax bill"],
          correct: 1,
        },
      },
    ],
  },
  {
    id: 4,
    title: "Understanding Risk",
    subtitle: "What you can actually stomach",
    icon: "shield",
    color: "#4FACFE",
    unlocked: false,
    lessons: [
      {
        id: "4a",
        title: "Volatility is not risk — time horizon is",
        duration: "3 min",
        content: `The S&P 500 drops 20%+ every 3-5 years on average. It dropped 50% in 2008-2009. It dropped 34% in March 2020.\n\nEvery single time it recovered and hit new all-time highs.\n\nVolatility feels like risk but for long-term investors, it is just noise. Real risk is needing your money before the market recovers. A 25-year-old with a 40-year horizon can hold 100% stocks. A 60-year-old who needs money in 5 years cannot afford a 50% drawdown.`,
        keyTakeaway: "Risk is about when you need the money, not how scary the chart looks.",
        quiz: {
          question: "A 30-year-old investor should be most worried about:",
          options: ["Short-term market drops", "Not investing at all", "Owning too many ETFs", "The market being too high right now"],
          correct: 1,
        },
      },
    ],
  },
  {
    id: 5,
    title: "Tax-Advantaged Accounts",
    subtitle: "The accounts that change everything",
    icon: "dollarSign",
    color: "#F5A623",
    unlocked: false,
    lessons: [
      {
        id: "5a",
        title: "401k, IRA, and HSA explained",
        duration: "5 min",
        content: `Three accounts let your investments grow without paying taxes — or paying far less:\n\n401(k): Your employer takes money from your paycheck before taxes and invests it. You pay no tax until withdrawal. If your employer matches contributions, that is a 50-100% instant return on that money. Never leave an employer match unclaimed.\n\nRoth IRA: You invest after-tax dollars but ALL growth is tax-free forever. $6,500/year limit (2024). Best for people who expect to be in a higher tax bracket in retirement.\n\nHSA: Health Savings Account. Triple tax advantage — pre-tax contributions, tax-free growth, tax-free withdrawals for medical. The best account in the tax code if you qualify.`,
        keyTakeaway: "Order of operations: 401k (to match) → HSA → Roth IRA → rest of 401k → taxable brokerage.",
        quiz: {
          question: "If your employer matches 50% of 401k contributions up to 6% of salary, what should you do?",
          options: ["Skip it and invest in a brokerage account", "Contribute exactly 6% to get the full match", "Contribute 3% to keep it simple", "Max out IRA first"],
          correct: 1,
        },
      },
    ],
  },
  {
    id: 6,
    title: "Building Your Portfolio",
    subtitle: "Putting it all together",
    icon: "pieChart",
    color: "#7C5CFC",
    unlocked: false,
    lessons: [
      {
        id: "6a",
        title: "Your first real portfolio",
        duration: "5 min",
        content: `Here is a starter portfolio for someone in their 20s-30s with a 30+ year horizon:\n\n• 60% VTI (US Total Market)\n• 30% VXUS (International)\n• 10% BND (Bonds — add more as you age)\n\nRebalance once a year. When US stocks do well, they become more than 60% of your portfolio — sell a little and buy international to get back to target.\n\nAs you approach retirement, shift bonds higher. A common rule: hold your age in bonds. At 30, hold 30% bonds. At 60, hold 60% bonds. More conservative investors hold more; more aggressive hold less.`,
        keyTakeaway: "Simple beats complex. A 3-fund portfolio has outperformed most actively managed funds over 20+ years.",
        quiz: {
          question: "Why should you rebalance your portfolio once per year?",
          options: ["To maximize short-term gains", "To maintain your target risk level", "Because the government requires it", "To minimize trading fees"],
          correct: 1,
        },
      },
    ],
  },
];

function InvestEducationPath({ onTabChange }) {
  const [completedLessons, setCompletedLessons] = useState(["1a", "1b", "2a"]);
  const [completedQuizzes, setCompletedQuizzes] = useState(["1a", "1b"]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeLevel, setActiveLevel] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [xp, setXp] = useState(350);

  const totalLessons = INVEST_LEVELS.reduce((a, l) => a + l.lessons.length, 0);
  const completedCount = completedLessons.length;
  const overallPct = Math.round((completedCount / totalLessons) * 100);

  const isLevelUnlocked = (level) => {
    if (level.unlocked) return true;
    const prevLevel = INVEST_LEVELS.find(l => l.id === level.id - 1);
    if (!prevLevel) return true;
    return prevLevel.lessons.every(les => completedLessons.includes(les.id));
  };

  const isLevelComplete = (level) => level.lessons.every(l => completedLessons.includes(l.id));

  const completeLesson = (lessonId) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons(p => [...p, lessonId]);
      setXp(p => p + 100);
    }
  };

  const submitQuiz = (lesson) => {
    if (quizAnswer === null) return;
    setQuizSubmitted(true);
    if (quizAnswer === lesson.quiz.correct && !completedQuizzes.includes(lesson.id)) {
      setCompletedQuizzes(p => [...p, lesson.id]);
      setXp(p => p + 50);
    }
  };

  // Lesson view
  if (activeLesson) {
    const lesson = activeLesson;
    const isPassed = quizSubmitted && quizAnswer === lesson.quiz.correct;
    const isFailed = quizSubmitted && quizAnswer !== lesson.quiz.correct;
    const alreadyDone = completedLessons.includes(lesson.id);
    const paragraphs = lesson.content.split("\n\n").filter(Boolean);

    return (
      <div style={{ padding: "0 16px 40px" }}>
        {/* Back button */}
        <button onClick={() => { setActiveLesson(null); setQuizAnswer(null); setQuizSubmitted(false); }} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "0 0 16px", fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
          <Icon name="chevronLeft" size={16} color={T.textSub} />Back to lessons
        </button>

        {/* Lesson header */}
        <div style={{ ...S.card, background: `linear-gradient(135deg, ${activeLevel?.color}18 0%, rgba(15,14,42,0.9) 100%)`, border: `1px solid ${activeLevel?.color}25`, marginBottom: 14 }}>
          <div style={{ display: "flex", justify: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                <span style={{ background: `${activeLevel?.color}22`, color: activeLevel?.color, fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 5, fontFamily: "'Inter',sans-serif" }}>Level {activeLevel?.id}</span>
                <span style={{ color: T.textSub, fontSize: 11 }}>{lesson.duration} read</span>
              </div>
              <h2 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{lesson.title}</h2>
            </div>
            {alreadyDone && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.green + "20", border: `1px solid ${T.green}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="check" size={16} color={T.green} strokeWidth={2.5} />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {paragraphs.map((para, i) => (
            <div key={i} style={{ ...S.card, padding: "14px 16px" }}>
              <p style={{ color: T.textMid, fontSize: 14, margin: 0, lineHeight: 1.8 }}>{para}</p>
            </div>
          ))}
        </div>

        {/* Key takeaway */}
        <div style={{ background: `${activeLevel?.color}12`, border: `1px solid ${activeLevel?.color}30`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: activeLevel?.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="zap" size={14} color="#fff" />
          </div>
          <div>
            <p style={{ color: activeLevel?.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Key Takeaway</p>
            <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{lesson.keyTakeaway}</p>
          </div>
        </div>

        {/* Quiz */}
        <div style={{ ...S.card, marginBottom: 14 }}>
          <p style={{ color: T.textSub, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Quick Check — +50 XP</p>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: "0 0 14px", lineHeight: 1.5 }}>{lesson.quiz.question}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {lesson.quiz.options.map((opt, i) => {
              const isSelected = quizAnswer === i;
              const isCorrect = quizSubmitted && i === lesson.quiz.correct;
              const isWrong = quizSubmitted && isSelected && i !== lesson.quiz.correct;
              return (
                <button key={i} onClick={() => !quizSubmitted && setQuizAnswer(i)} style={{ background: isCorrect ? "rgba(0,210,160,0.12)" : isWrong ? "rgba(255,90,110,0.12)" : isSelected ? "rgba(124,92,252,0.12)" : "rgba(255,255,255,0.03)", border: isCorrect ? "1px solid rgba(0,210,160,0.4)" : isWrong ? "1px solid rgba(255,90,110,0.4)" : isSelected ? "1px solid rgba(124,92,252,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", cursor: quizSubmitted ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: isCorrect ? T.green : isWrong ? T.red : isSelected ? T.purple : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {quizSubmitted && isCorrect ? <Icon name="check" size={12} color="#fff" strokeWidth={2.5} /> : quizSubmitted && isWrong ? <Icon name="x" size={12} color="#fff" /> : <span style={{ color: T.textSub, fontSize: 11, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>}
                  </div>
                  <span style={{ color: isCorrect ? T.green : isWrong ? T.red : isSelected ? T.purple : T.textMid, fontSize: 13, fontWeight: isSelected || quizSubmitted ? 600 : 400, fontFamily: "'Inter',sans-serif" }}>{opt}</span>
                </button>
              );
            })}
          </div>
          {!quizSubmitted ? (
            <button onClick={() => submitQuiz(lesson)} style={{ ...S.primaryBtn(activeLevel?.color), opacity: quizAnswer !== null ? 1 : 0.4 }}>Submit Answer</button>
          ) : isPassed ? (
            <div style={{ background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.25)", borderRadius: 10, padding: 14, textAlign: "center" }}>
              <p style={{ color: T.green, fontWeight: 800, fontSize: 16, margin: "0 0 4px" }}>Correct! +50 XP</p>
              <p style={{ color: T.textSub, fontSize: 12, margin: 0 }}>You understand this concept. On to the next one.</p>
            </div>
          ) : (
            <div style={{ background: "rgba(255,90,110,0.08)", border: "1px solid rgba(255,90,110,0.2)", borderRadius: 10, padding: 14 }}>
              <p style={{ color: T.red, fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>Not quite — re-read the lesson</p>
              <button onClick={() => { setQuizAnswer(null); setQuizSubmitted(false); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", color: T.textMid, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600 }}>Try Again</button>
            </div>
          )}
        </div>

        {(isPassed || alreadyDone) && (
          <button onClick={() => { completeLesson(lesson.id); setActiveLesson(null); setQuizAnswer(null); setQuizSubmitted(false); }} style={{ ...S.primaryBtn() }}>
            {alreadyDone ? "Back to Path" : "Complete Lesson +100 XP"}
          </button>
        )}
      </div>
    );
  }

  // Level view
  if (activeLevel) {
    const level = activeLevel;
    const unlocked = isLevelUnlocked(level);
    return (
      <div style={{ padding: "0 16px 40px" }}>
        <button onClick={() => setActiveLevel(null)} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "0 0 16px", fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
          <Icon name="chevronLeft" size={16} color={T.textSub} />Back to all levels
        </button>

        <div style={{ ...S.card, background: `linear-gradient(135deg, ${level.color}18 0%, rgba(15,14,42,0.95) 100%)`, border: `1px solid ${level.color}30`, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: `${level.color}22`, border: `1px solid ${level.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={level.icon} size={22} color={level.color} />
            </div>
            <div>
              <p style={{ color: level.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 3px" }}>Level {level.id}</p>
              <h2 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0 }}>{level.title}</h2>
            </div>
          </div>
          <ProgressBar pct={Math.round((level.lessons.filter(l => completedLessons.includes(l.id)).length / level.lessons.length) * 100)} color={level.color} height={6} />
          <p style={{ color: T.textSub, fontSize: 12, margin: "7px 0 0" }}>{level.lessons.filter(l => completedLessons.includes(l.id)).length} of {level.lessons.length} lessons complete</p>
        </div>

        {level.lessons.map((lesson, i) => {
          const done = completedLessons.includes(lesson.id);
          const quizDone = completedQuizzes.includes(lesson.id);
          const prevDone = i === 0 || completedLessons.includes(level.lessons[i - 1].id);
          const canOpen = unlocked && prevDone;
          return (
            <button key={lesson.id} onClick={() => { if (canOpen) { setActiveLesson(lesson); setQuizAnswer(null); setQuizSubmitted(false); } }} style={{ width: "100%", ...S.card, marginBottom: 10, cursor: canOpen ? "pointer" : "not-allowed", opacity: canOpen ? 1 : 0.45, textAlign: "left", display: "flex", alignItems: "center", gap: 14, padding: 16, background: done ? `${level.color}0a` : GRAD.card, border: done ? `1px solid ${level.color}25` : "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: done ? `${level.color}22` : "rgba(255,255,255,0.06)", border: done ? `1px solid ${level.color}40` : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {done ? <Icon name="check" size={18} color={level.color} strokeWidth={2.5} /> : !canOpen ? <Icon name="lock" size={16} color={T.textSub} /> : <span style={{ color: T.textSub, fontSize: 14, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: done ? level.color : T.text, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{lesson.title}</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: T.textSub, fontSize: 11 }}>{lesson.duration}</span>
                  {done && <span style={{ background: "rgba(0,210,160,0.1)", color: T.green, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, fontFamily: "'Inter',sans-serif" }}>+100 XP</span>}
                  {quizDone && <span style={{ background: "rgba(124,92,252,0.1)", color: T.purple, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, fontFamily: "'Inter',sans-serif" }}>Quiz +50 XP</span>}
                </div>
              </div>
              {canOpen && !done && <Icon name="chevronLeft" size={16} color={T.textSub} style={{ transform: "rotate(180deg)" }} />}
            </button>
          );
        })}
      </div>
    );
  }

  // Main path view
  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

      {/* XP + progress header */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0F0E2A 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 4px" }}>Investment Path</p>
            <p style={{ color: T.text, fontSize: 17, fontWeight: 800, margin: 0 }}>{completedCount} of {totalLessons} lessons done</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 10, padding: "6px 12px" }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <span style={{ color: T.gold, fontWeight: 900, fontSize: 16 }}>{xp} XP</span>
            </div>
          </div>
        </div>
        <ProgressBar pct={overallPct} color={T.purple} height={8} />
        <p style={{ color: T.textSub, fontSize: 11, margin: "7px 0 0" }}>{overallPct}% complete &middot; {totalLessons - completedCount} lessons remaining</p>
      </div>

      {/* Level cards */}
      {INVEST_LEVELS.map((level, i) => {
        const unlocked = isLevelUnlocked(level);
        const complete = isLevelComplete(level);
        const inProgress = !complete && level.lessons.some(l => completedLessons.includes(l.id));
        const lessonsDone = level.lessons.filter(l => completedLessons.includes(l.id)).length;
        const levelPct = Math.round((lessonsDone / level.lessons.length) * 100);

        return (
          <button key={level.id} onClick={() => unlocked && setActiveLevel(level)} style={{ ...S.card, cursor: unlocked ? "pointer" : "not-allowed", textAlign: "left", opacity: unlocked ? 1 : 0.5, position: "relative", overflow: "hidden", padding: 0 }}>
            {/* Color bar */}
            <div style={{ height: 3, background: complete ? `linear-gradient(90deg, ${level.color}, ${level.color}55)` : `linear-gradient(90deg, ${level.color}44, ${level.color}11)`, boxShadow: complete ? `0 0 8px ${level.color}66` : "none" }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {/* Icon */}
                <div style={{ width: 48, height: 48, borderRadius: 13, background: complete ? `${level.color}22` : "rgba(255,255,255,0.05)", border: complete ? `1px solid ${level.color}40` : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {!unlocked ? <Icon name="lock" size={20} color={T.textSub} /> : complete ? <Icon name="check" size={22} color={level.color} strokeWidth={2.5} /> : <Icon name={level.icon} size={22} color={level.color} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                      <p style={{ color: level.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 2px" }}>Level {level.id}</p>
                      <p style={{ color: unlocked ? T.text : T.textMid, fontSize: 15, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{level.title}</p>
                      <p style={{ color: T.textSub, fontSize: 12, margin: "2px 0 0" }}>{level.subtitle}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      {complete ? (
                        <span style={{ background: `${level.color}18`, color: level.color, border: `1px solid ${level.color}35`, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, fontFamily: "'Inter',sans-serif" }}>Done</span>
                      ) : inProgress ? (
                        <span style={{ background: "rgba(124,92,252,0.12)", color: T.purple, border: "1px solid rgba(124,92,252,0.25)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, fontFamily: "'Inter',sans-serif" }}>In Progress</span>
                      ) : !unlocked ? (
                        <span style={{ background: "rgba(255,255,255,0.05)", color: T.textSub, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, fontFamily: "'Inter',sans-serif" }}>Locked</span>
                      ) : (
                        <span style={{ background: `${level.color}12`, color: level.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, fontFamily: "'Inter',sans-serif" }}>Start</span>
                      )}
                    </div>
                  </div>

                  {/* Lesson dots */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {level.lessons.map(l => (
                        <div key={l.id} style={{ width: 8, height: 8, borderRadius: "50%", background: completedLessons.includes(l.id) ? level.color : "rgba(255,255,255,0.1)", boxShadow: completedLessons.includes(l.id) ? `0 0 5px ${level.color}` : "none" }} />
                      ))}
                    </div>
                    <span style={{ color: T.textSub, fontSize: 11 }}>{lessonsDone}/{level.lessons.length} lessons</span>
                    <span style={{ color: T.textSub, fontSize: 11 }}>&middot; {level.lessons.reduce((a, l) => a + parseInt(l.duration), 0)} min</span>
                  </div>

                  {inProgress && (
                    <div style={{ marginTop: 8 }}>
                      <ProgressBar pct={levelPct} color={level.color} height={4} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* XP breakdown */}
      <div style={S.card}>
        <SectionLabel>How XP Works</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { action: "Complete a lesson",  xp: "+100 XP", color: T.green  },
            { action: "Pass a quiz",        xp: "+50 XP",  color: T.purple },
            { action: "Complete a level",   xp: "+200 XP", color: T.gold   },
            { action: "Daily check-in",     xp: "+25 XP",  color: T.accent },
          ].map(r => (
            <div key={r.action} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: T.textMid, fontSize: 13 }}>{r.action}</span>
              <span style={{ color: r.color, fontWeight: 700, fontSize: 13 }}>{r.xp}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ color: "#1A1840", fontSize: 11, textAlign: "center" }}>Investment education is for informational purposes only and does not constitute financial advice.</p>
    </div>
  );
}

// ── Side Hustle Income Tracker ───────────────────────────────────────────────
function SideHustleTab({ profile }) {
  const [hustles, setHustles] = useState([
    { id: 1, name: "Freelance Design", category: "Freelance", color: T.purple, icon: "zap",        entries: [{ date: "Jun 15", amount: 850, note: "Logo project" }, { date: "Jun 8", amount: 400, note: "Business cards" }, { date: "May 28", amount: 1200, note: "Website redesign" }] },
    { id: 2, name: "Uber Driver",      category: "Gig Work",  color: T.orange, icon: "send",       entries: [{ date: "Jun 18", amount: 143, note: "Weekend shift" }, { date: "Jun 11", amount: 98,  note: "Evening hours"  }, { date: "Jun 4",  amount: 210, note: "Airport runs"   }] },
    { id: 3, name: "Etsy Shop",        category: "E-Commerce",color: T.teal,   icon: "dollarSign", entries: [{ date: "Jun 16", amount: 67,  note: "3 candles sold" }, { date: "Jun 9", amount: 134, note: "6 candles + card" }] },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat,  setNewCat]  = useState("Freelance");
  const [logEntry, setLogEntry] = useState(null);
  const [entryAmt, setEntryAmt] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [expanded, setExpanded] = useState(1);

  const cats = ["Freelance","Gig Work","E-Commerce","Rental","Tutoring","Content","Consulting","Other"];
  const catColors = { "Freelance": T.purple, "Gig Work": T.orange, "E-Commerce": T.teal, "Rental": T.blue, "Tutoring": T.green, "Content": T.gold, "Consulting": T.accent, "Other": T.textSub };

  const totalThisMonth = hustles.reduce((a, h) => a + h.entries.filter(e => e.date.startsWith("Jun")).reduce((b, e) => b + e.amount, 0), 0);
  const totalAllTime   = hustles.reduce((a, h) => a + h.entries.reduce((b, e) => b + e.amount, 0), 0);
  const taxRate        = 0.25;
  const taxOwed        = Math.round(totalThisMonth * taxRate);
  const mo             = profile?.monthlyIncome || 4200;
  const sideIncomeBoost = Math.round((totalThisMonth / mo) * 100);

  const addEntry = () => {
    if (!entryAmt || !logEntry) return;
    setHustles(p => p.map(h => h.id === logEntry ? { ...h, entries: [{ date: "Jun " + new Date().getDate(), amount: parseFloat(entryAmt), note: entryNote || "Income logged" }, ...h.entries] } : h));
    setEntryAmt(""); setEntryNote(""); setLogEntry(null);
  };

  const addHustle = () => {
    if (!newName) return;
    setHustles(p => [...p, { id: Date.now(), name: newName, category: newCat, color: catColors[newCat] || T.purple, icon: "dollarSign", entries: [] }]);
    setNewName(""); setShowAdd(false);
  };

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0A1A12 100%)" }}>
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 4px" }}>Side Hustle Income</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
          {[
            { label: "This month",  value: `$${totalThisMonth.toLocaleString()}`,  color: T.green  },
            { label: "Tax reserve", value: `$${taxOwed}`,                           color: T.red    },
            { label: "Income boost", value: `+${sideIncomeBoost}%`,                color: T.purple },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <p style={{ color: s.color, fontWeight: 900, fontSize: 18, margin: 0 }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 9, margin: "3px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 9, padding: 10 }}>
          <p style={{ color: T.gold, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Set aside <strong>${taxOwed}</strong> ({Math.round(taxRate * 100)}%) of your side income for taxes every month. Self-employment tax is real.</p>
        </div>
      </div>

      {/* Hustle cards */}
      {hustles.map(h => {
        const monthTotal = h.entries.filter(e => e.date.startsWith("Jun")).reduce((a, e) => a + e.amount, 0);
        const isOpen = expanded === h.id;
        return (
          <div key={h.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${h.color}, ${h.color}44)` }} />
            <div style={{ padding: "13px 16px" }}>
              <button onClick={() => setExpanded(isOpen ? null : h.id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${h.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={h.icon} size={17} color={h.color} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{h.name}</p>
                    <span style={{ ...S.tag(h.color), fontSize: 10 }}>{h.category}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: h.color, fontWeight: 900, fontSize: 18, margin: 0 }}>${monthTotal}</p>
                  <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>this month</p>
                </div>
              </button>

              {isOpen && (
                <div style={{ marginTop: 12 }}>
                  {h.entries.map((e, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div>
                        <p style={{ color: T.textMid, fontSize: 13, fontWeight: 600, margin: 0 }}>{e.note}</p>
                        <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{e.date}</p>
                      </div>
                      <p style={{ color: T.green, fontWeight: 700, fontSize: 14, margin: 0 }}>+${e.amount}</p>
                    </div>
                  ))}
                  <button onClick={() => setLogEntry(h.id)} style={{ ...S.primaryBtn(h.color), marginTop: 12, fontSize: 13, padding: "10px 0" }}>
                    + Log Income
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button onClick={() => setShowAdd(true)} style={{ background: "rgba(124,92,252,0.08)", border: "1px dashed rgba(124,92,252,0.3)", borderRadius: 14, padding: "15px 0", cursor: "pointer", color: T.purple, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Icon name="plus" size={16} color={T.purple} />Add Income Stream
      </button>

      {/* Log entry modal */}
      {logEntry && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 24 }} onClick={() => setLogEntry(null)}>
          <div onClick={e => e.stopPropagation()} style={{ ...S.card, width: "100%", maxWidth: 360, padding: 24 }}>
            <h3 style={{ color: T.text, fontSize: 17, fontWeight: 800, margin: "0 0 18px" }}>Log Income</h3>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 18 }}>$</span>
              <input value={entryAmt} onChange={e => setEntryAmt(e.target.value)} type="number" placeholder="0.00" style={{ ...S.input, paddingLeft: 28, fontSize: 24, fontWeight: 800 }} autoFocus />
            </div>
            <input value={entryNote} onChange={e => setEntryNote(e.target.value)} placeholder="What was it for?" style={{ ...S.input, marginBottom: 16 }} />
            <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 9, padding: 10, marginBottom: 16 }}>
              <p style={{ color: T.gold, fontSize: 12, margin: 0 }}>Tax reserve: <strong>${Math.round((parseFloat(entryAmt) || 0) * taxRate)}</strong> — set this aside before spending the rest.</p>
            </div>
            <button onClick={addEntry} style={{ ...S.primaryBtn(), marginBottom: 8 }}>Log It</button>
            <button onClick={() => setLogEntry(null)} style={S.ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add hustle modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 24 }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...S.card, width: "100%", maxWidth: 360, padding: 24 }}>
            <h3 style={{ color: T.text, fontSize: 17, fontWeight: 800, margin: "0 0 18px" }}>New Income Stream</h3>
            <label style={S.label}>Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Freelance Photography" style={{ ...S.input, marginBottom: 14 }} autoFocus />
            <label style={S.label}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 }}>
              {cats.map(c => <button key={c} onClick={() => setNewCat(c)} style={{ background: newCat === c ? GRAD.purple : "rgba(255,255,255,0.04)", border: newCat === c ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: 99, padding: "5px 12px", cursor: "pointer", color: newCat === c ? "#fff" : T.textSub, fontSize: 12, fontWeight: newCat === c ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{c}</button>)}
            </div>
            <button onClick={addHustle} style={{ ...S.primaryBtn(), marginBottom: 8 }}>Add Stream</button>
            <button onClick={() => setShowAdd(false)} style={S.ghostBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tax Estimator ─────────────────────────────────────────────────────────────
function TaxEstimator({ profile }) {
  const [filingStatus, setFilingStatus]   = useState("single");
  const [sideIncome,   setSideIncome]     = useState("1200");
  const [w2Income,     setW2Income]       = useState(String(profile?.income ? profile.income * 12 : 50400));
  const [deductions,   setDeductions]     = useState("standard");
  const [state,        setStateTax]       = useState(profile?.state || "TX");
  const [quarter,      setQuarter]        = useState("Q2");

  const w2  = parseFloat(w2Income)  || 0;
  const side = parseFloat(sideIncome) || 0;
  const totalIncome = w2 + side;

  // Federal brackets 2024 (single)
  const calcFederal = (income, status) => {
    const brackets = status === "married"
      ? [[23200,0.10],[94300,0.12],[201050,0.22],[383900,0.24],[487450,0.32],[731200,0.35],[Infinity,0.37]]
      : [[11600,0.10],[47150,0.12],[100525,0.22],[191950,0.24],[243725,0.32],[609350,0.35],[Infinity,0.37]];
    const stdDed = status === "married" ? 27700 : 13850;
    const taxable = Math.max(0, income - (deductions === "standard" ? stdDed : stdDed * 1.4));
    let tax = 0, prev = 0;
    for (const [limit, rate] of brackets) {
      if (taxable <= prev) break;
      tax += (Math.min(taxable, limit) - prev) * rate;
      prev = limit;
    }
    return Math.round(tax);
  };

  const selfEmploymentTax = Math.round(side * 0.9235 * 0.153);
  const federalTax = calcFederal(totalIncome, filingStatus);
  const stateTaxRate = { TX: 0, FL: 0, NY: 0.0685, CA: 0.093, WA: 0, IL: 0.0495, GA: 0.055, NC: 0.0499 };
  const stateTax = Math.round(totalIncome * (stateTaxRate[state] || 0.05));
  const totalTax = federalTax + selfEmploymentTax + stateTax;
  const effectiveRate = Math.round((totalTax / totalIncome) * 100);
  const w2WithheldEst = Math.round(federalTax * (w2 / totalIncome) * 0.9);
  const owedExtra = Math.max(0, totalTax - w2WithheldEst);
  const quarterlyPayment = Math.round(owedExtra / 4);

  const quarters = [
    { id: "Q1", label: "Q1", dates: "Jan 1 – Mar 31", due: "Apr 15" },
    { id: "Q2", label: "Q2", dates: "Apr 1 – May 31",  due: "Jun 17" },
    { id: "Q3", label: "Q3", dates: "Jun 1 – Aug 31",  due: "Sep 16" },
    { id: "Q4", label: "Q4", dates: "Sep 1 – Dec 31",  due: "Jan 15" },
  ];

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0800 0%, #0F0E2A 100%)" }}>
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 4px" }}>Tax Estimator</p>
        <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 16px", lineHeight: 1.5 }}>Estimate what you owe so nothing surprises you on April 15.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Est. total tax", value: `$${totalTax.toLocaleString()}`, color: T.red    },
            { label: "Effective rate", value: `${effectiveRate}%`,             color: T.gold   },
            { label: "Quarterly est.", value: `$${quarterlyPayment}`,          color: T.orange },
            { label: "SE tax",         value: `$${selfEmploymentTax}`,         color: T.purple },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "11px 12px" }}>
              <p style={{ color: s.color, fontWeight: 900, fontSize: 20, margin: 0 }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 10, margin: "3px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div style={S.card}>
        <SectionLabel>Your Situation</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={S.label}>Filing status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["single","married","head"].map(s => (
                <button key={s} onClick={() => setFilingStatus(s)} style={{ flex: 1, background: filingStatus === s ? GRAD.purple : "rgba(255,255,255,0.04)", border: filingStatus === s ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 0", cursor: "pointer", color: filingStatus === s ? "#fff" : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: filingStatus === s ? 700 : 400, fontSize: 11, textTransform: "capitalize" }}>{s === "head" ? "HOH" : s}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={S.label}>W-2 / Salary income (annual)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
              <input value={w2Income} onChange={e => setW2Income(e.target.value)} type="number" style={{ ...S.input, paddingLeft: 26 }} />
            </div>
          </div>
          <div>
            <label style={S.label}>Side / self-employment income (annual)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.textSub }}>$</span>
              <input value={sideIncome} onChange={e => setSideIncome(e.target.value)} type="number" style={{ ...S.input, paddingLeft: 26 }} />
            </div>
          </div>
          <div>
            <label style={S.label}>State</label>
            <select value={state} onChange={e => setStateTax(e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
              {["TX","FL","WA","NY","CA","IL","GA","NC","Other"].map(s => <option key={s} value={s}>{s}{["TX","FL","WA"].includes(s) ? " (no income tax)" : ""}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Deductions</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{id:"standard",label:"Standard"},{id:"itemized",label:"Itemized (est.)"}].map(d => (
                <button key={d.id} onClick={() => setDeductions(d.id)} style={{ flex: 1, background: deductions === d.id ? GRAD.purple : "rgba(255,255,255,0.04)", border: deductions === d.id ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 0", cursor: "pointer", color: deductions === d.id ? "#fff" : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: deductions === d.id ? 700 : 400, fontSize: 12 }}>{d.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={S.card}>
        <SectionLabel>Tax Breakdown</SectionLabel>
        {[
          { label: "Federal income tax",  value: federalTax,        note: `${effectiveRate}% effective rate`           },
          { label: "Self-employment tax", value: selfEmploymentTax,  note: "15.3% on net SE income (SS + Medicare)"    },
          { label: `${state} state tax`,  value: stateTax,           note: stateTaxRate[state] === 0 ? "No income tax" : `${((stateTaxRate[state]||0.05)*100).toFixed(1)}% flat/effective` },
          { label: "Est. W-2 withheld",   value: -w2WithheldEst,    note: "Already paid through payroll"              },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <p style={{ color: T.textMid, fontSize: 13, fontWeight: 600, margin: 0 }}>{r.label}</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{r.note}</p>
            </div>
            <p style={{ color: r.value < 0 ? T.green : T.red, fontWeight: 700, fontSize: 14, margin: 0 }}>{r.value < 0 ? "-" : ""}${Math.abs(r.value).toLocaleString()}</p>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
          <p style={{ color: T.text, fontWeight: 700, fontSize: 14, margin: 0 }}>Extra owed</p>
          <p style={{ color: T.red, fontWeight: 900, fontSize: 18, margin: 0 }}>${owedExtra.toLocaleString()}</p>
        </div>
      </div>

      {/* Quarterly schedule */}
      <div style={S.card}>
        <SectionLabel>Quarterly Payment Schedule</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {quarters.map(q => {
            const isCurrent = q.id === quarter;
            return (
              <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isCurrent ? "rgba(124,92,252,0.1)" : "rgba(255,255,255,0.03)", border: isCurrent ? "1px solid rgba(124,92,252,0.3)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: isCurrent ? GRAD.purple : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isCurrent ? "0 2px 8px rgba(124,92,252,0.4)" : "none" }}>
                    <span style={{ color: isCurrent ? "#fff" : T.textSub, fontSize: 11, fontWeight: 800 }}>{q.label}</span>
                  </div>
                  <div>
                    <p style={{ color: isCurrent ? T.text : T.textMid, fontSize: 13, fontWeight: isCurrent ? 700 : 400, margin: 0 }}>Due {q.due}</p>
                    <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{q.dates}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: isCurrent ? T.purple : T.textMid, fontWeight: 700, fontSize: 15, margin: 0 }}>${quarterlyPayment.toLocaleString()}</p>
                  {isCurrent && <p style={{ color: T.purple, fontSize: 10, margin: "2px 0 0", fontWeight: 600 }}>Current quarter</p>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 9, padding: 11 }}>
          <p style={{ color: T.gold, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Pay quarterly to the IRS at irs.gov/payments. Missing payments results in a penalty on top of what you owe.</p>
        </div>
      </div>
      <p style={{ color: "#1A1840", fontSize: 11, textAlign: "center" }}>Estimates only. Consult a tax professional for your actual liability. Numbers based on 2024 brackets.</p>
    </div>
  );
}

// ── Emergency Fund Calculator ─────────────────────────────────────────────────
function EmergencyFundCalc({ profile, goals, onNavigate }) {
  const [jobStability,   setJobStability]   = useState("moderate");
  const [healthFactor,   setHealthFactor]   = useState("healthy");
  const [dependentsFact, setDependentsFact] = useState(profile?.hasDependents === "Yes" ? "yes" : "no");
  const [incomeType,     setIncomeType]     = useState(profile?.payFreq === "weekly" ? "variable" : "stable");
  const [showBreakdown,  setShowBreakdown]  = useState(false);

  const fixedExpenses = profile?.totalFixed || 2100;
  const varExpenses   = profile?.totalVariable || 800;
  const monthlyEssentials = fixedExpenses + Math.round(varExpenses * 0.6);

  const stabilityMultiplier   = { "stable": 3, "moderate": 4, "unstable": 6 }[jobStability];
  const healthMultiplier      = { "healthy": 0, "managed": 0.5, "chronic": 1 }[healthFactor];
  const dependentsMultiplier  = dependentsFact === "yes" ? 1 : 0;
  const incomeMultiplier      = incomeType === "variable" ? 1 : 0;

  const recommendedMonths = stabilityMultiplier + healthMultiplier + dependentsMultiplier + incomeMultiplier;
  const targetAmount = Math.round(monthlyEssentials * recommendedMonths);

  const existingFund = goals.find(g => g.name.toLowerCase().includes("emergency"));
  const currentSaved = existingFund?.saved || 0;
  const stillNeeded  = Math.max(0, targetAmount - currentSaved);
  const monthsToFull = stillNeeded > 0 ? Math.ceil(stillNeeded / 300) : 0;
  const pct = Math.min(100, Math.round((currentSaved / targetAmount) * 100));
  const coverageMonths = Math.round(currentSaved / (monthlyEssentials || 1) * 10) / 10;

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

      {/* Hero */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #0A1A12 0%, #1A0D3A 100%)", textAlign: "center", padding: 24 }}>
        <div style={{ width: 70, height: 70, borderRadius: 18, background: "rgba(0,210,160,0.15)", border: "1px solid rgba(0,210,160,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Icon name="shield" size={32} color={T.green} strokeWidth={1.5} />
        </div>
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 4px" }}>Your Emergency Fund Target</p>
        <p style={{ color: T.green, fontWeight: 900, fontSize: 40, margin: "0 0 4px", letterSpacing: -1 }}>${targetAmount.toLocaleString()}</p>
        <p style={{ color: T.textMid, fontSize: 13, margin: "0 0 16px" }}>Based on {recommendedMonths} months of essential expenses</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Currently saved", value: `$${currentSaved.toLocaleString()}`,  color: T.green  },
            { label: "Coverage",        value: `${coverageMonths}mo`,                 color: T.blue   },
            { label: "Still needed",    value: `$${stillNeeded.toLocaleString()}`,    color: stillNeeded > 0 ? T.red : T.green },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: "9px 6px", textAlign: "center" }}>
              <p style={{ color: s.color, fontWeight: 800, fontSize: 15, margin: 0 }}>{s.value}</p>
              <p style={{ color: T.textSub, fontSize: 9, margin: "3px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      {existingFund && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>Emergency Fund Progress</p>
            <span style={{ color: T.green, fontWeight: 700, fontSize: 14 }}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} color={T.green} height={8} />
          <p style={{ color: T.textSub, fontSize: 12, margin: "8px 0 0" }}>
            {pct < 25 ? "Just getting started. Prioritize this above all other goals." : pct < 50 ? "Good start. Keep the momentum — you need this fully funded." : pct < 100 ? `Almost there. $${stillNeeded.toLocaleString()} more to full coverage.` : "Fully funded. Your financial foundation is solid."}
          </p>
        </div>
      )}

      {/* Personal factors */}
      <div style={S.card}>
        <SectionLabel>Your Risk Factors</SectionLabel>
        <p style={{ color: T.textSub, fontSize: 12, margin: "-6px 0 14px", lineHeight: 1.5 }}>These determine how large your specific fund needs to be. Generic advice says 3-6 months. Your number may be different.</p>

        {[
          {
            label: "Job stability",
            value: jobStability,
            setter: setJobStability,
            options: [
              { id: "stable",   label: "Very stable",  sub: "Government, tenured, strong union — 3 months",   months: "+3 mo" },
              { id: "moderate", label: "Moderate",      sub: "Private sector, replaceable skills — 4 months",  months: "+4 mo" },
              { id: "unstable", label: "Volatile",      sub: "Freelance, startup, commission-based — 6 months",months: "+6 mo" },
            ],
          },
          {
            label: "Health situation",
            value: healthFactor,
            setter: setHealthFactor,
            options: [
              { id: "healthy",  label: "Generally healthy", sub: "Low medical expenses expected", months: "+0 mo" },
              { id: "managed",  label: "Managed condition",  sub: "Regular medication or appointments",months: "+0.5 mo" },
              { id: "chronic",  label: "Ongoing medical",    sub: "Significant healthcare costs",   months: "+1 mo" },
            ],
          },
          {
            label: "Dependents",
            value: dependentsFact,
            setter: setDependentsFact,
            options: [
              { id: "no",  label: "No dependents",   sub: "Just you (or you and partner)", months: "+0 mo" },
              { id: "yes", label: "Have dependents", sub: "Kids or others rely on your income", months: "+1 mo" },
            ],
          },
          {
            label: "Income type",
            value: incomeType,
            setter: setIncomeType,
            options: [
              { id: "stable",   label: "Stable paycheck", sub: "Same amount every period",          months: "+0 mo" },
              { id: "variable", label: "Variable income",  sub: "Freelance, gig, commission, tips",  months: "+1 mo" },
            ],
          },
        ].map(factor => (
          <div key={factor.label} style={{ marginBottom: 16 }}>
            <p style={{ color: T.textMid, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>{factor.label}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {factor.options.map(opt => (
                <button key={opt.id} onClick={() => factor.setter(opt.id)} style={{ background: factor.value === opt.id ? "rgba(124,92,252,0.1)" : "rgba(255,255,255,0.03)", border: factor.value === opt.id ? "1px solid rgba(124,92,252,0.35)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 13px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                  <div>
                    <p style={{ color: factor.value === opt.id ? T.purple : T.text, fontSize: 13, fontWeight: factor.value === opt.id ? 700 : 400, margin: 0 }}>{opt.label}</p>
                    <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>{opt.sub}</p>
                  </div>
                  <span style={{ color: factor.value === opt.id ? T.purple : T.textSub, fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{opt.months}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Expense breakdown */}
      <div style={S.card}>
        <button onClick={() => setShowBreakdown(b => !b)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, marginBottom: showBreakdown ? 12 : 0 }}>
          <SectionLabel>Monthly Essential Expenses</SectionLabel>
          <Icon name={showBreakdown ? "chevronUp" : "chevronDown"} size={16} color={T.textSub} />
        </button>
        {showBreakdown && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: "Housing",      value: profile?.housingCost || 1200,   color: T.blue   },
              { label: "Food",         value: Math.round((profile?.groceries || 100) * 4.33), color: T.green  },
              { label: "Transport",    value: (profile?.carPayment || 0) + (profile?.fuelCost || 80), color: T.orange },
              { label: "Utilities",    value: profile?.utilities || 140,       color: T.gold   },
              { label: "Insurance",    value: (profile?.healthInsurance || 0) + (profile?.carInsurance || 100), color: T.purple },
              { label: "Phone",        value: profile?.phoneBill || 80,        color: T.accent },
            ].map(e => (
              <div key={e.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
                  <span style={{ color: T.textMid, fontSize: 13 }}>{e.label}</span>
                </div>
                <span style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>${e.value.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 700 }}>
              <span style={{ color: T.text, fontSize: 14 }}>Total essentials</span>
              <span style={{ color: T.green, fontSize: 16 }}>${monthlyEssentials.toLocaleString()}/mo</span>
            </div>
          </div>
        )}
      </div>

      {/* Build plan */}
      {stillNeeded > 0 && (
        <div style={{ ...S.card, background: "rgba(0,210,160,0.06)", border: "1px solid rgba(0,210,160,0.2)" }}>
          <SectionLabel>Get There Faster</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[100, 200, 300].map(mo => (
              <div key={mo} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: "10px 8px", textAlign: "center" }}>
                <p style={{ color: T.green, fontWeight: 800, fontSize: 14, margin: 0 }}>${mo}/mo</p>
                <p style={{ color: T.textSub, fontSize: 10, margin: "3px 0 0" }}>{Math.ceil(stillNeeded / mo)} months</p>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate && onNavigate("goals")} style={{ ...S.primaryBtn(T.green) }}>
            {existingFund ? "Add to Emergency Fund" : "Create Emergency Fund Goal"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Joneses Comparison (Community Benchmarking) ───────────────────────────────
function JonesesComparison({ profile, goals }) {
  const [category, setCategory] = useState("savings");
  const mo = profile?.monthlyIncome || 4200;
  const totalSaved = goals.reduce((a, g) => a + g.saved, 0);
  const savingsRate = Math.round((800 / mo) * 100);

  const cats = ["savings","spending","debt","networth","goals"];

  const data = {
    savings: {
      label: "Savings Rate",
      yours: savingsRate,
      unit: "%",
      format: v => `${v}%`,
      brackets: [
        { label: "Bottom 25%",   value: 2,   color: T.red    },
        { label: "Average",      value: 5,   color: T.textSub},
        { label: "Good (20%+)",  value: 20,  color: T.gold   },
        { label: "Top 10%",      value: 28,  color: T.green  },
      ],
      insight: savingsRate >= 20 ? `Your ${savingsRate}% savings rate puts you in the top 15% of earners. The average American saves just 4-5%. You are building real wealth.` : `Most Americans save less than 5%. You are at ${savingsRate}%. Getting to 20% would put you in the top 15% of wealth builders.`,
      insightColor: savingsRate >= 20 ? T.green : T.gold,
    },
    spending: {
      label: "Monthly Dining Spend",
      yours: 380,
      unit: "$",
      format: v => `$${v}`,
      brackets: [
        { label: "Frugal",     value: 150, color: T.green  },
        { label: "Average",    value: 340, color: T.textSub},
        { label: "High",       value: 500, color: T.gold   },
        { label: "Very high",  value: 700, color: T.red    },
      ],
      insight: "You spend $380/mo on dining — $40 above the national average. Cutting to the average saves $480/yr. Cutting to the frugal level saves $2,760/yr.",
      insightColor: T.gold,
    },
    debt: {
      label: "Credit Card Debt",
      yours: 1800,
      unit: "$",
      format: v => `$${v.toLocaleString()}`,
      brackets: [
        { label: "None",          value: 0,    color: T.green  },
        { label: "National avg",  value: 6500, color: T.textSub},
        { label: "High",          value: 12000,color: T.red    },
      ],
      insight: "Your $1,800 CC balance is well below the national average of $6,500. Paying it off entirely saves you ~$378/yr in interest at 21% APR.",
      insightColor: T.green,
    },
    networth: {
      label: "Net Worth by Age",
      yours: 18000,
      unit: "$",
      format: v => `$${v.toLocaleString()}`,
      brackets: [
        { label: "Bottom 25%",  value: -3000, color: T.red   },
        { label: "Median 30s",  value: 35000, color: T.textSub},
        { label: "Top 25%",     value: 120000,color: T.gold  },
        { label: "Top 10%",     value: 300000,color: T.green },
      ],
      insight: "At $18,000 net worth you are ahead of the bottom 25% but below median. The median for your age group is ~$35,000. You are building — keep going.",
      insightColor: T.gold,
    },
    goals: {
      label: "Active Savings Goals",
      yours: goals.length,
      unit: "",
      format: v => `${v}`,
      brackets: [
        { label: "None",    value: 0, color: T.red    },
        { label: "1-2",     value: 2, color: T.textSub},
        { label: "3-5",     value: 4, color: T.gold   },
        { label: "5+",      value: 6, color: T.green  },
      ],
      insight: `You have ${goals.length} active savings goal${goals.length !== 1 ? "s" : ""}. FreedomFund users with 3+ goals save 2.4x more than those with 1 or none. Goal-setting makes the math automatic.`,
      insightColor: goals.length >= 3 ? T.green : T.gold,
    },
  };

  const d = data[category];
  const allVals = d.brackets.map(b => Math.abs(b.value));
  const maxVal = Math.max(...allVals, Math.abs(d.yours));

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0F0E2A 100%)" }}>
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 6px" }}>The Joneses Comparison</p>
        <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.5 }}>See how you actually stack up.</p>
        <p style={{ color: T.textSub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>Anonymous, opt-in benchmarks from real FreedomFund users and national financial data. No names. No judgment. Just truth.</p>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ flexShrink: 0, background: category === c ? GRAD.purple : "rgba(255,255,255,0.04)", border: category === c ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: 99, padding: "6px 14px", cursor: "pointer", color: category === c ? "#fff" : T.textSub, fontSize: 12, fontWeight: category === c ? 700 : 400, fontFamily: "'Inter',sans-serif", textTransform: "capitalize", boxShadow: category === c ? "0 2px 10px rgba(124,92,252,0.4)" : "none" }}>{data[c].label}</button>
        ))}
      </div>

      {/* Your number */}
      <div style={S.card}>
        <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 6px" }}>Your {d.label}</p>
        <p style={{ color: T.purple, fontWeight: 900, fontSize: 40, margin: "0 0 16px", letterSpacing: -1 }}>{d.format(d.yours)}</p>

        {/* Comparison bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Yours */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: T.purple, fontSize: 12, fontWeight: 700 }}>You</span>
              <span style={{ color: T.purple, fontWeight: 700, fontSize: 12 }}>{d.format(d.yours)}</span>
            </div>
            <ProgressBar pct={Math.round((Math.abs(d.yours) / maxVal) * 100)} color={T.purple} height={8} />
          </div>

          {d.brackets.map(b => (
            <div key={b.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: T.textMid, fontSize: 12 }}>{b.label}</span>
                <span style={{ color: b.color, fontWeight: 600, fontSize: 12 }}>{d.format(b.value)}</span>
              </div>
              <ProgressBar pct={Math.round((Math.abs(b.value) / maxVal) * 100)} color={b.color} height={5} />
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      <div style={{ background: `${d.insightColor}0a`, border: `1px solid ${d.insightColor}25`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${d.insightColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="zap" size={14} color={d.insightColor} />
          </div>
          <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.7 }}>{d.insight}</p>
        </div>
      </div>

      {/* Community stats */}
      <div style={S.card}>
        <SectionLabel>FreedomFund Community Stats</SectionLabel>
        {[
          { label: "Avg savings rate on this app",  value: "14%",     color: T.purple },
          { label: "Avg goals per active user",      value: "3.2",     color: T.blue   },
          { label: "Users who hit first goal",       value: "68%",     color: T.green  },
          { label: "Avg time to first goal",         value: "8 mo",    color: T.gold   },
          { label: "Users ahead of national avg",    value: "82%",     color: T.teal   },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: T.textMid, fontSize: 13 }}>{s.label}</span>
            <span style={{ color: s.color, fontWeight: 800, fontSize: 15 }}>{s.value}</span>
          </div>
        ))}
      </div>

      <p style={{ color: "#1A1840", fontSize: 11, textAlign: "center" }}>All comparisons use anonymized aggregate data. No individual user data is shared. National figures from Federal Reserve 2023 SCF.</p>
    </div>
  );
}

// ── Referral System ───────────────────────────────────────────────────────────
function ReferralSystem({ profile }) {
  const [copied, setCopied] = useState(false);
  const code = profile?.name ? profile.name.toUpperCase().slice(0, 6) + "2025" : "FREEDOM2025";
  const referrals = [
    { name: "Jordan M.", date: "Jun 12", status: "active",  reward: "3 mo Pro" },
    { name: "Taylor S.", date: "Jun 3",  status: "active",  reward: "3 mo Pro" },
    { name: "Casey R.",  date: "May 28", status: "pending", reward: "Pending"  },
  ];
  const activeCount  = referrals.filter(r => r.status === "active").length;
  const proMonthsEarned = activeCount * 3;

  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>
      {/* Hero */}
      <div style={{ ...S.card, background: GRAD.purple, position: "relative", overflow: "hidden", textAlign: "center", padding: "28px 20px" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 8px" }}>Give &amp; Get</p>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "0 0 8px", letterSpacing: -0.5 }}>3 months free — for both of you</h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>Invite a friend to FreedomFund. When they sign up and complete onboarding, you both get 3 months of Pro free. No limits.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Referrals sent", value: referrals.length },
            { label: "Active",         value: activeCount      },
            { label: "Pro months earned", value: `${proMonthsEarned}mo` },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <p style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, margin: "3px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral code */}
      <div style={S.card}>
        <SectionLabel>Your Referral Code</SectionLabel>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.25)", borderRadius: 10, padding: "13px 16px", display: "flex", alignItems: "center" }}>
            <span style={{ color: T.purple, fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>{code}</span>
          </div>
          <button onClick={copy} style={{ background: copied ? "rgba(0,210,160,0.15)" : GRAD.purple, border: "none", borderRadius: 10, padding: "13px 18px", cursor: "pointer", color: "#fff", fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, flexShrink: 0, boxShadow: "0 3px 12px rgba(124,92,252,0.4)" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 12px" }}>Or share your personal link:</p>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: T.textMid, fontSize: 12 }}>freedomfund.app/join/{code.toLowerCase()}</span>
          <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Icon name="send" size={16} color={T.accent} />
          </button>
        </div>
      </div>

      {/* Share options */}
      <div style={S.card}>
        <SectionLabel>Share Via</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "iMessage",  color: T.green,  icon: "bell"      },
            { label: "Email",     color: T.blue,   icon: "send"      },
            { label: "WhatsApp",  color: "#25D366",icon: "users"     },
            { label: "Instagram", color: T.orange, icon: "zap"       },
          ].map(s => (
            <button key={s.label} onClick={copy} style={{ background: `${s.color}0f`, border: `1px solid ${s.color}22`, borderRadius: 11, padding: "13px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name={s.icon} size={16} color={s.color} />
              <span style={{ color: s.color, fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Referral history */}
      <div style={S.card}>
        <SectionLabel>Your Referrals</SectionLabel>
        {referrals.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < referrals.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: r.status === "active" ? "rgba(0,210,160,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: r.status === "active" ? T.green : T.textSub, fontSize: 12, fontWeight: 800 }}>{r.name.slice(0, 2)}</span>
              </div>
              <div>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 600, margin: 0 }}>{r.name}</p>
                <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>Joined {r.date}</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ background: r.status === "active" ? "rgba(0,210,160,0.1)" : "rgba(255,255,255,0.05)", color: r.status === "active" ? T.green : T.textSub, border: `1px solid ${r.status === "active" ? "rgba(0,210,160,0.25)" : "rgba(255,255,255,0.08)"}`, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, fontFamily: "'Inter',sans-serif" }}>
                {r.reward}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={S.card}>
        <SectionLabel>How It Works</SectionLabel>
        {[
          { step: "1", text: "Share your code or link with a friend",          icon: "send"       },
          { step: "2", text: "They sign up and complete the financial profile", icon: "check"      },
          { step: "3", text: "Both of you get 3 months of Pro instantly",       icon: "award"      },
          { step: "4", text: "No limit — invite as many friends as you want",   icon: "users"      },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: parseInt(s.step) < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(124,92,252,0.4)" }}>
              <Icon name={s.icon} size={14} color="#fff" />
            </div>
            <p style={{ color: T.textMid, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── School / Student Mode ─────────────────────────────────────────────────────
const STUDENT_LESSONS = [
  {
    id: "s1", title: "What Money Actually Is", emoji: "💵", xp: 50, unlocked: true,
    content: "Money is just a tool — a way to trade your time and skills for things you need. When you earn $15/hr mowing lawns, you are trading 1 hour of your life for $15. The question is: is what you spend that $15 on worth an hour of your life?",
    keyTakeaway: "Every dollar you spend costs you time. Spend intentionally.",
    quiz: { q: "You earn $12/hr. A $60 video game costs you...", opts: ["1 hour of work","5 hours of work","12 hours of work","60 hours of work"], correct: 1 },
  },
  {
    id: "s2", title: "The Difference Between Needs and Wants", emoji: "🛒", xp: 50, unlocked: true,
    content: "A need is something you cannot survive without — food, shelter, clothing, transportation to work or school. A want is everything else. A $3 coffee is a want. New sneakers when your current ones work fine is a want. Most financial mistakes happen when we treat wants like needs.",
    keyTakeaway: "Needs first. Wants only after savings. Never the other way.",
    quiz: { q: "Which of these is a NEED?", opts: ["AirPods","Netflix","Groceries","Concert tickets"], correct: 2 },
  },
  {
    id: "s3", title: "Why Saving $5 a Day Changes Everything", emoji: "📈", xp: 75, unlocked: true,
    content: "Five dollars a day sounds like nothing. But $5 × 365 = $1,825 a year. Invested at 10% average return:\n• In 10 years: $31,000\n• In 20 years: $95,000\n• In 30 years: $247,000\n\nThe secret is starting NOW. Every year you wait costs you tens of thousands of dollars.",
    keyTakeaway: "Start small. Start now. Time is more valuable than the amount.",
    quiz: { q: "Saving $5/day for 30 years at 10% growth gives you approximately:", opts: ["$54,750","$105,000","$247,000","$500,000"], correct: 2 },
  },
  {
    id: "s4", title: "Good Debt vs Bad Debt", emoji: "💳", xp: 75, unlocked: false,
    content: "Not all debt is equal. Good debt (like a student loan for a high-paying career, or a mortgage on a home that appreciates) can build your net worth over time. Bad debt — like credit card debt at 21% APR to buy clothes or takeout — costs you money and builds nothing.\n\nThe rule: never borrow money for things that lose value.",
    keyTakeaway: "Borrow for assets. Never borrow for expenses or things that depreciate.",
    quiz: { q: "Which is an example of BAD debt?", opts: ["Student loan for nursing degree","Mortgage on a home","Credit card balance for concert tickets","Business loan for equipment"], correct: 2 },
  },
  {
    id: "s5", title: "Your First Budget in 3 Steps", emoji: "📋", xp: 100, unlocked: false,
    content: "Budgeting is not complicated. Three numbers are all you need:\n\n1. What comes in (income)\n2. What must go out (rent, food, phone)\n3. What is left (savings + spending money)\n\nThe only rule: number 1 must always be bigger than number 2. Everything else follows from there.",
    keyTakeaway: "Spend less than you earn. Save the difference. That is the whole game.",
    quiz: { q: "You earn $800/mo. Rent is $400, food is $150, phone is $50. What is left?", opts: ["$100","$200","$300","$400"], correct: 1 },
  },
  {
    id: "s6", title: "How to Build Credit Responsibly", emoji: "🏦", xp: 100, unlocked: false,
    content: "Credit is trust — banks lending you money because they believe you will pay it back. A good credit score saves you thousands on car loans, apartments, and mortgages later in life.\n\nBuild it early and carefully:\n• Get a secured credit card (your own money as collateral)\n• Use it for ONE small recurring purchase (like Spotify)\n• Pay the FULL balance every single month\n• Never miss a payment",
    keyTakeaway: "Use credit like a debit card. Only spend what you already have. Pay in full every month.",
    quiz: { q: "The BEST way to build credit as a student is:", opts: ["Max out your credit card and pay minimums","Get as many cards as possible","Use a card for small purchases and pay in full monthly","Avoid credit entirely"], correct: 2 },
  },
];

const PARENT_MISSIONS = [
  { id: "m1", title: "Complete 3 lessons",         reward: "$5 bonus",     done: true  },
  { id: "m2", title: "Set your first savings goal", reward: "$10 match",   done: true  },
  { id: "m3", title: "Log spending for 7 days",     reward: "Movie night", done: false },
  { id: "m4", title: "Save $50 total",               reward: "$15 match",  done: false },
];

function SchoolMode({ onExitSchoolMode }) {
  const [completedLessons, setCompletedLessons] = useState(["s1", "s2"]);
  const [completedQuizzes, setCompletedQuizzes]  = useState(["s1"]);
  const [activeLesson,     setActiveLesson]       = useState(null);
  const [quizAnswer,       setQuizAnswer]         = useState(null);
  const [quizSubmitted,    setQuizSubmitted]       = useState(false);
  const [xp,               setXp]                 = useState(125);
  const [savings,          setSavings]             = useState(47);
  const [savingsGoal,      setSavingsGoal]         = useState(100);
  const [showMissions,     setShowMissions]        = useState(false);
  const [showParentView,   setShowParentView]      = useState(false);
  const [goalName,         setGoalName]            = useState("New Sneakers");

  const totalLessons = STUDENT_LESSONS.length;
  const doneCount    = completedLessons.length;
  const pct          = Math.round((doneCount / totalLessons) * 100);
  const savingsPct   = Math.round((savings / savingsGoal) * 100);
  const level        = Math.floor(xp / 100) + 1;

  const isUnlocked = (lesson) => lesson.unlocked || completedLessons.includes(STUDENT_LESSONS[STUDENT_LESSONS.indexOf(lesson) - 1]?.id);

  const complete = (id) => {
    if (!completedLessons.includes(id)) {
      const les = STUDENT_LESSONS.find(l => l.id === id);
      setCompletedLessons(p => [...p, id]);
      setXp(p => p + (les?.xp || 50));
    }
  };

  // Parent view
  if (showParentView) return (
    <div style={{ padding: "0 16px 32px" }}>
      <button onClick={() => setShowParentView(false)} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "0 0 16px", fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
        <Icon name="chevronLeft" size={16} color={T.textSub} />Back
      </button>
      <div style={{ ...S.card, background: GRAD.purple, marginBottom: 14, textAlign: "center", padding: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>Parent Dashboard</p>
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: "0 0 16px" }}>Your child is making progress</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Lessons done", value: doneCount     },
            { label: "XP earned",    value: xp            },
            { label: "$ saved",      value: `$${savings}` },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 9, padding: "10px 6px", textAlign: "center" }}>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: 0 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, margin: "3px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <SectionLabel>Missions You Set</SectionLabel>
        <p style={{ color: T.textSub, fontSize: 12, margin: "-6px 0 14px", lineHeight: 1.5 }}>Reward your child when they hit these milestones. Tie real-world rewards to financial behavior.</p>
        {PARENT_MISSIONS.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: m.done ? "rgba(0,210,160,0.15)" : "rgba(255,255,255,0.06)", border: m.done ? "1px solid rgba(0,210,160,0.3)" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {m.done ? <Icon name="check" size={14} color={T.green} strokeWidth={2.5} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: m.done ? T.textMid : T.text, fontSize: 13, fontWeight: 600, margin: 0, textDecoration: m.done ? "line-through" : "none" }}>{m.title}</p>
              <p style={{ color: T.green, fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Reward: {m.reward}</p>
            </div>
            {m.done && <span style={{ background: "rgba(0,210,160,0.1)", color: T.green, border: "1px solid rgba(0,210,160,0.25)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, fontFamily: "'Inter',sans-serif" }}>Done</span>}
          </div>
        ))}
        <button style={{ ...S.primaryBtn(), marginTop: 14 }} onClick={() => {}}>Add a Mission</button>
      </div>

      <div style={S.card}>
        <SectionLabel>Savings Match</SectionLabel>
        <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>Match your child savings dollar-for-dollar up to an amount you set. This teaches them that saving is always rewarded — just like a 401k employer match.</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 10, padding: 12 }}>
            <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 3px" }}>Child saved</p>
            <p style={{ color: T.green, fontWeight: 800, fontSize: 18, margin: 0 }}>${savings}</p>
          </div>
          <div style={{ flex: 1, background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 10, padding: 12 }}>
            <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 3px" }}>Your match (up to $50)</p>
            <p style={{ color: T.purple, fontWeight: 800, fontSize: 18, margin: 0 }}>${Math.min(savings, 50)}</p>
          </div>
        </div>
        <button style={{ ...S.primaryBtn(T.green) }} onClick={() => {}}>Transfer Match to Their Goal</button>
      </div>
    </div>
  );

  // Lesson view
  if (activeLesson) {
    const lesson = activeLesson;
    const done = completedLessons.includes(lesson.id);
    const paras = lesson.content.split("\n\n").filter(Boolean);
    const isPassed = quizSubmitted && quizAnswer === lesson.quiz.correct;
    const isFailed = quizSubmitted && quizAnswer !== lesson.quiz.correct;

    return (
      <div style={{ padding: "0 16px 40px" }}>
        <button onClick={() => { setActiveLesson(null); setQuizAnswer(null); setQuizSubmitted(false); }} style={{ background: "none", border: "none", color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "0 0 16px", fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
          <Icon name="chevronLeft" size={16} color={T.textSub} />Back to lessons
        </button>

        <div style={{ ...S.card, background: "linear-gradient(135deg, rgba(124,92,252,0.15) 0%, rgba(15,14,42,0.9) 100%)", border: "1px solid rgba(124,92,252,0.2)", marginBottom: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{lesson.emoji}</div>
          <h2 style={{ color: T.text, fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{lesson.title}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: "rgba(245,166,35,0.15)", color: T.gold, border: "1px solid rgba(245,166,35,0.3)", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 5, fontFamily: "'Inter',sans-serif" }}>+{lesson.xp} XP</span>
            {done && <span style={{ background: "rgba(0,210,160,0.12)", color: T.green, border: "1px solid rgba(0,210,160,0.25)", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 5, fontFamily: "'Inter',sans-serif" }}>Completed</span>}
          </div>
        </div>

        {paras.map((p, i) => (
          <div key={i} style={{ ...S.card, marginBottom: 10, padding: "14px 16px" }}>
            <p style={{ color: T.textMid, fontSize: 15, margin: 0, lineHeight: 1.8 }}>{p}</p>
          </div>
        ))}

        <div style={{ background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 12, padding: 16, marginBottom: 14, display: "flex", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="zap" size={14} color="#fff" />
          </div>
          <div>
            <p style={{ color: T.green, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 3px" }}>Key Takeaway</p>
            <p style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>{lesson.keyTakeaway}</p>
          </div>
        </div>

        <div style={{ ...S.card, marginBottom: 14 }}>
          <p style={{ color: T.textSub, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Quick Quiz — +{Math.round(lesson.xp * 0.5)} XP</p>
          <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 14px", lineHeight: 1.4 }}>{lesson.quiz.q}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {lesson.quiz.opts.map((opt, i) => {
              const isSelected = quizAnswer === i;
              const isCorrect  = quizSubmitted && i === lesson.quiz.correct;
              const isWrong    = quizSubmitted && isSelected && i !== lesson.quiz.correct;
              return (
                <button key={i} onClick={() => !quizSubmitted && setQuizAnswer(i)} style={{ background: isCorrect ? "rgba(0,210,160,0.12)" : isWrong ? "rgba(255,90,110,0.12)" : isSelected ? "rgba(124,92,252,0.12)" : "rgba(255,255,255,0.03)", border: isCorrect ? "1px solid rgba(0,210,160,0.4)" : isWrong ? "1px solid rgba(255,90,110,0.4)" : isSelected ? "1px solid rgba(124,92,252,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "13px 14px", cursor: quizSubmitted ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: isCorrect ? T.green : isWrong ? T.red : isSelected ? T.purple : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {quizSubmitted && isCorrect ? <Icon name="check" size={12} color="#fff" strokeWidth={2.5} /> : quizSubmitted && isWrong ? <Icon name="x" size={12} color="#fff" /> : <span style={{ color: T.textSub, fontSize: 11, fontWeight: 700 }}>{String.fromCharCode(65 + i)}</span>}
                  </div>
                  <span style={{ color: isCorrect ? T.green : isWrong ? T.red : isSelected ? T.purple : T.textMid, fontSize: 14, fontWeight: isSelected || quizSubmitted ? 600 : 400, fontFamily: "'Inter',sans-serif" }}>{opt}</span>
                </button>
              );
            })}
          </div>
          {!quizSubmitted
            ? <button onClick={() => { if (quizAnswer !== null) { setQuizSubmitted(true); if (quizAnswer === lesson.quiz.correct && !completedQuizzes.includes(lesson.id)) { setCompletedQuizzes(p => [...p, lesson.id]); setXp(p => p + Math.round(lesson.xp * 0.5)); } } }} style={{ ...S.primaryBtn(), opacity: quizAnswer !== null ? 1 : 0.4 }}>Check My Answer</button>
            : isPassed
              ? <div style={{ background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.25)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <p style={{ color: T.green, fontWeight: 800, fontSize: 16, margin: "0 0 4px" }}>Correct! +{Math.round(lesson.xp * 0.5)} XP</p>
                  <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>You got it. Ready for the next one.</p>
                </div>
              : <div style={{ background: "rgba(255,90,110,0.08)", border: "1px solid rgba(255,90,110,0.2)", borderRadius: 10, padding: 14 }}>
                  <p style={{ color: T.red, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>Not quite — re-read the lesson</p>
                  <button onClick={() => { setQuizAnswer(null); setQuizSubmitted(false); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", color: T.textMid, fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600 }}>Try Again</button>
                </div>
          }
        </div>

        {(isPassed || done) && (
          <button onClick={() => { complete(lesson.id); setActiveLesson(null); setQuizAnswer(null); setQuizSubmitted(false); }} style={{ ...S.primaryBtn() }}>
            {done ? "Back to Lessons" : "Complete +"+lesson.xp+" XP"}
          </button>
        )}
      </div>
    );
  }

  // Main student view
  return (
    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 24 }}>

      {/* Student header */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A0D3A 0%, #0A1A12 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(124,92,252,0.5)" }}>
                <span style={{ fontSize: 13 }}>🎓</span>
              </div>
              <span style={{ background: "rgba(124,92,252,0.2)", color: T.purple, border: "1px solid rgba(124,92,252,0.35)", fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 5, fontFamily: "'Inter',sans-serif" }}>Student Mode</span>
            </div>
            <p style={{ color: T.text, fontWeight: 800, fontSize: 20, margin: 0 }}>Level {level} Learner</p>
            <p style={{ color: T.textSub, fontSize: 12, margin: "3px 0 0" }}>{xp} XP &middot; {doneCount}/{totalLessons} lessons</p>
          </div>
          <button onClick={() => setShowParentView(true)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: T.textMid, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Parent View</button>
        </div>
        <ProgressBar pct={pct} color={T.purple} height={7} />
        <p style={{ color: T.textSub, fontSize: 11, margin: "7px 0 0" }}>{pct}% of Money Basics complete</p>
      </div>

      {/* Savings goal tracker */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <SectionLabel>My Savings Goal</SectionLabel>
            <p style={{ color: T.text, fontWeight: 700, fontSize: 16, margin: "-6px 0 0" }}>{goalName}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: T.green, fontWeight: 900, fontSize: 22, margin: 0 }}>${savings}</p>
            <p style={{ color: T.textSub, fontSize: 11, margin: "2px 0 0" }}>of ${savingsGoal}</p>
          </div>
        </div>
        <ProgressBar pct={savingsPct} color={T.green} height={8} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => setSavings(s => Math.min(savingsGoal, s + 5))} style={{ flex: 1, background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.25)", borderRadius: 9, padding: "10px 0", cursor: "pointer", color: T.green, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Icon name="plus" size={14} color={T.green} />Add $5
          </button>
          <button onClick={() => setSavings(s => Math.min(savingsGoal, s + 10))} style={{ flex: 1, background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.25)", borderRadius: 9, padding: "10px 0", cursor: "pointer", color: T.green, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13 }}>Add $10</button>
          <button onClick={() => setSavings(s => Math.min(savingsGoal, s + 20))} style={{ flex: 1, background: GRAD.green, border: "none", borderRadius: 9, padding: "10px 0", cursor: "pointer", color: "#fff", fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13, boxShadow: "0 3px 10px rgba(0,210,160,0.35)" }}>Add $20</button>
        </div>
        {savings >= savingsGoal && (
          <div style={{ marginTop: 12, background: "rgba(0,210,160,0.1)", border: "1px solid rgba(0,210,160,0.25)", borderRadius: 9, padding: 12, textAlign: "center" }}>
            <p style={{ color: T.green, fontWeight: 800, fontSize: 15, margin: 0 }}>Goal reached! You did it.</p>
          </div>
        )}
      </div>

      {/* Missions */}
      <div style={S.card}>
        <button onClick={() => setShowMissions(m => !m)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0 }}>
          <SectionLabel>Parent Missions</SectionLabel>
          <Icon name={showMissions ? "chevronUp" : "chevronDown"} size={16} color={T.textSub} />
        </button>
        {showMissions && PARENT_MISSIONS.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: m.done ? "rgba(0,210,160,0.15)" : "rgba(255,255,255,0.06)", border: m.done ? "1px solid rgba(0,210,160,0.3)" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {m.done ? <Icon name="check" size={12} color={T.green} strokeWidth={2.5} /> : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: m.done ? T.textMid : T.text, fontSize: 13, fontWeight: m.done ? 400 : 600, margin: 0, textDecoration: m.done ? "line-through" : "none" }}>{m.title}</p>
            </div>
            <span style={{ color: T.green, fontSize: 11, fontWeight: 700 }}>{m.reward}</span>
          </div>
        ))}
      </div>

      {/* Lesson list */}
      <SectionLabel>Money Basics — 6 Lessons</SectionLabel>
      {STUDENT_LESSONS.map((lesson, i) => {
        const done     = completedLessons.includes(lesson.id);
        const unlocked = isUnlocked(lesson);
        const quizDone = completedQuizzes.includes(lesson.id);
        return (
          <button key={lesson.id} onClick={() => unlocked && setActiveLesson(lesson)} style={{ ...S.card, cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.45, textAlign: "left", display: "flex", gap: 12, alignItems: "center", padding: 16, background: done ? "rgba(0,210,160,0.06)" : GRAD.card, border: done ? "1px solid rgba(0,210,160,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: done ? "rgba(0,210,160,0.15)" : unlocked ? "rgba(124,92,252,0.12)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>
              {done ? "✅" : !unlocked ? "🔒" : lesson.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: done ? T.green : unlocked ? T.text : T.textMid, fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>{lesson.title}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ background: "rgba(245,166,35,0.1)", color: T.gold, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, fontFamily: "'Inter',sans-serif" }}>+{lesson.xp} XP</span>
                {done && <span style={{ background: "rgba(0,210,160,0.1)", color: T.green, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, fontFamily: "'Inter',sans-serif" }}>Done</span>}
                {quizDone && <span style={{ background: "rgba(124,92,252,0.1)", color: T.purple, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, fontFamily: "'Inter',sans-serif" }}>Quiz passed</span>}
              </div>
            </div>
            {unlocked && !done && <Icon name="chevronLeft" size={16} color={T.textSub} style={{ transform: "rotate(180deg)" }} />}
          </button>
        );
      })}

      {/* Exit school mode */}
      <button onClick={onExitSchoolMode} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 0", cursor: "pointer", color: T.textSub, fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600 }}>
        Switch to Adult Mode
      </button>
    </div>
  );
}

// ── Quick-Start Onboarding ────────────────────────────────────────────────────
function QuickStartOnboarding({ onComplete, onFullOnboarding }) {
  const [step,   setStep]   = useState(0);
  const [name,   setName]   = useState("");
  const [income, setIncome] = useState("");
  const [goal,   setGoal]   = useState("");
  const [amount, setAmount] = useState("");
  const [animKey, setAnimKey] = useState(0);

  const fonts = <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />;

  const next = () => { setAnimKey(k => k + 1); setStep(s => s + 1); };

  const finish = () => {
    onComplete({
      name,
      income: parseFloat(income) || 0,
      payFreq: "monthly",
      monthlyIncome: parseFloat(income) || 0,
      totalFixed: Math.round((parseFloat(income) || 0) * 0.5),
      totalVariable: Math.round((parseFloat(income) || 0) * 0.2),
      quickStart: true,
      firstGoal: { name: goal, target: parseFloat(amount) || 1000 },
      skipGoalCreation: true,
    });
  };

  const slides = [
    // Step 0 — Name
    <div key="name" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>👋</div>
      <h1 style={{ color: T.text, fontSize: 28, fontWeight: 900, margin: "0 0 8px", letterSpacing: -0.5 }}>What should we call you?</h1>
      <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>Just your first name. This is your financial life — we keep it personal.</p>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={{ ...S.input, fontSize: 20, fontWeight: 700, padding: "16px 18px", marginBottom: 16, textAlign: "center" }} autoFocus />
      <button onClick={() => name.trim() && next()} style={{ ...S.primaryBtn(), opacity: name.trim() ? 1 : 0.35, padding: "15px 0", fontSize: 16 }}>
        {name.trim() ? `Let's go, ${name} →` : "Enter your name"}
      </button>
    </div>,

    // Step 1 — Income
    <div key="income" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>💰</div>
      <h1 style={{ color: T.text, fontSize: 26, fontWeight: 900, margin: "0 0 8px", letterSpacing: -0.5 }}>What do you take home each month?</h1>
      <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 }}>After taxes. This is your starting point. You can update it anytime.</p>
      <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 10, padding: 11, marginBottom: 20 }}>
        <p style={{ color: T.purple, fontSize: 12, margin: 0 }}>Not sure? Rough estimate is fine. We will refine it together over time.</p>
      </div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 24, fontWeight: 700 }}>$</span>
        <input value={income} onChange={e => setIncome(e.target.value)} type="number" placeholder="0" style={{ ...S.input, fontSize: 32, fontWeight: 900, paddingLeft: 44, paddingRight: 18, padding: "16px 18px 16px 44px", textAlign: "center" }} />
      </div>
      {income && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 9, padding: 11, textAlign: "center" }}>
            <p style={{ color: T.green, fontWeight: 700, fontSize: 14, margin: 0 }}>${Math.round(parseFloat(income) * 0.2)}/mo</p>
            <p style={{ color: T.textSub, fontSize: 10, margin: "3px 0 0" }}>20% to savings</p>
          </div>
          <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: 9, padding: 11, textAlign: "center" }}>
            <p style={{ color: T.purple, fontWeight: 700, fontSize: 14, margin: 0 }}>${Math.round(parseFloat(income) / 30)}/day</p>
            <p style={{ color: T.textSub, fontSize: 10, margin: "3px 0 0" }}>daily limit</p>
          </div>
        </div>
      )}
      <button onClick={() => income && next()} style={{ ...S.primaryBtn(), opacity: income ? 1 : 0.35, padding: "15px 0", fontSize: 16 }}>Continue →</button>
    </div>,

    // Step 2 — First goal
    <div key="goal" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🎯</div>
      <h1 style={{ color: T.text, fontSize: 26, fontWeight: 900, margin: "0 0 8px", letterSpacing: -0.5 }}>What are you saving for?</h1>
      <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>Pick the one thing that matters most right now. You can add more later.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {["Emergency Fund","House Down Payment","Pay Off Debt","New Car","Vacation","Investment Account","Wedding","Other"].map(g => (
          <button key={g} onClick={() => setGoal(g)} style={{ background: goal === g ? "rgba(124,92,252,0.15)" : "rgba(255,255,255,0.03)", border: goal === g ? "1px solid rgba(124,92,252,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "13px 16px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: goal === g ? T.purple : T.text, fontSize: 14, fontWeight: goal === g ? 700 : 400, fontFamily: "'Inter',sans-serif" }}>{g}</span>
            {goal === g && <Icon name="check" size={16} color={T.purple} strokeWidth={2.5} />}
          </button>
        ))}
      </div>
      <button onClick={() => goal && next()} style={{ ...S.primaryBtn(), opacity: goal ? 1 : 0.35, padding: "15px 0", fontSize: 16 }}>Continue →</button>
    </div>,

    // Step 3 — Target amount
    <div key="amount" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🏁</div>
      <h1 style={{ color: T.text, fontSize: 26, fontWeight: 900, margin: "0 0 8px", letterSpacing: -0.5 }}>How much do you need?</h1>
      <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 }}>For your <strong style={{ color: T.purple }}>{goal}</strong>. Rough number is fine — adjust anytime.</p>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 24, fontWeight: 700 }}>$</span>
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0" style={{ ...S.input, fontSize: 32, fontWeight: 900, paddingLeft: 44, padding: "16px 18px 16px 44px", textAlign: "center" }} autoFocus />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["1000","5000","10000","25000"].map(v => (
          <button key={v} onClick={() => setAmount(v)} style={{ flex: 1, background: amount === v ? "rgba(124,92,252,0.15)" : "rgba(255,255,255,0.04)", border: amount === v ? "1px solid rgba(124,92,252,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 0", cursor: "pointer", color: amount === v ? T.purple : T.textSub, fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13 }}>${parseInt(v).toLocaleString()}</button>
        ))}
      </div>
      {amount && income && (
        <div style={{ background: "rgba(0,210,160,0.08)", border: "1px solid rgba(0,210,160,0.2)", borderRadius: 10, padding: 13, marginBottom: 16 }}>
          <p style={{ color: T.green, fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>Saving 20% of your income:</p>
          <p style={{ color: T.textMid, fontSize: 13, margin: 0 }}>You could reach ${parseInt(amount).toLocaleString()} in <strong style={{ color: T.green }}>{Math.ceil(parseFloat(amount) / (parseFloat(income) * 0.2))} months</strong>.</p>
        </div>
      )}
      <button onClick={() => amount && finish()} style={{ ...S.primaryBtn(), opacity: amount ? 1 : 0.35, padding: "15px 0", fontSize: 16 }}>
        Show Me My Dashboard →
      </button>
    </div>,
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {fonts}
      {/* Top bar */}
      <div style={{ padding: "52px 28px 0" }}>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ flex: i === step ? 2 : 1, height: 4, borderRadius: 99, background: i === step ? GRAD.purple : i < step ? "rgba(124,92,252,0.5)" : "rgba(255,255,255,0.1)", transition: "all 0.35s", boxShadow: i === step ? "0 0 8px rgba(124,92,252,0.6)" : "none" }} />
          ))}
        </div>
        <p style={{ color: T.textSub, fontSize: 12, margin: 0 }}>Step {step + 1} of 4</p>
      </div>

      {/* Slide */}
      <div key={animKey} style={{ flex: 1, display: "flex", flexDirection: "column", animation: "qs 0.3s ease forwards" }}>
        <style>{`@keyframes qs { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        {slides[step]}
      </div>

      {/* Full onboarding link */}
      <div style={{ padding: "0 28px 48px", textAlign: "center" }}>
        <button onClick={onFullOnboarding} style={{ background: "none", border: "none", color: T.textSub, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif", textDecoration: "underline" }}>
          Take the full financial profile instead (12 steps, more accurate plan)
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
const TIPS = [
  "Freedom is not a bigger paycheck. It is owing nothing to anyone.",
  "The Joneses are broke. Do not follow them.",
  "Every dollar saved today is a day you do not have to work tomorrow.",
  "Credit cards do not give you freedom. They rent it to you with interest.",
  "An emergency fund is not pessimism. It is power.",
  "Retirement is not an age. It is a number — start building it now.",
  "Paid-off beats financed. Every single time.",
];

const MONTHLY = {
  income: 4200, spent: 2640, saved: 860,
  cats: [
    { name: "Rent", amount: 1200, color: "#475569" },
    { name: "Food", amount: 480, color: T.gold },
    { name: "Transport", amount: 310, color: T.green },
    { name: "Goals", amount: 860, color: T.accent },
    { name: "Other", amount: 390, color: T.purple },
  ],
};

export default function App() {
  const [authUser,  setAuthUser]  = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [screen, setScreen] = useState("auth");
  const [profile, setProfile] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [tab, setTab] = useState("home");
  const [tipIdx, setTipIdx] = useState(0);
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [withdrawGoal,   setWithdrawGoal]   = useState(null);
  const [depositGoal,    setDepositGoal]    = useState(null);
  const [privacyGoal,    setPrivacyGoal]    = useState(null);
  const [editGoal,       setEditGoal]       = useState(null);
  const [showFreedomTip, setShowFreedomTip] = useState(false);
  const [showCheckIn,    setShowCheckIn]    = useState(false);
  const [checkInLog,     setCheckInLog]     = useState([]);
  const [streak,         setStreak]         = useState(0);
  const [showMoreMenu,   setShowMoreMenu]   = useState(false);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [showNotifSettings,  setShowNotifSettings]  = useState(false);
  const [readNotifs,         setReadNotifs]         = useState([]);
  const [dbLoading,          setDbLoading]          = useState(false);

  // ── Auth: in-memory only, no session to restore on mount ─────────
  // Users must log in each time (artifact sandbox limitation)



  // ── Load all user data from Supabase ─────────────────────────────
  const loadUserData = async (uid) => {
    setDbLoading(true);
    const token = sb._token();
    const headers = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}` };

    try {
      // Load profile
      const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&limit=1`, { headers });
      const profData = await profRes.json();
      const prof = profData[0];
      if (prof) {
        setProfile({
          name: prof.name, income: prof.income, payFreq: prof.pay_freq,
          monthlyIncome: prof.monthly_income, totalFixed: prof.total_fixed,
          totalVariable: prof.total_variable, state: prof.state, city: prof.city,
          housingType: prof.housing_type, housingCost: prof.housing_cost,
          lunchHabit: prof.lunch_habit, vacationFreq: prof.vacation_freq,
          creditCardBalance: prof.credit_card_bal, quickStart: prof.quick_start,
        });
        setScreen("app");
      } else {
        setScreen("onboarding");
        setAuthReady(true);
        setDbLoading(false);
        return;
      }

      // Load goals
      const goalsRes = await fetch(`${SUPABASE_URL}/rest/v1/goals?user_id=eq.${uid}&order=sort_order.asc`, { headers });
      const goalsData = await goalsRes.json();
      if (Array.isArray(goalsData) && goalsData.length > 0) {
        setGoals(goalsData.map(g => ({
          id: g.id, name: g.name, target: g.target, saved: g.saved,
          icon: g.icon || "target", color: g.color || T.purple,
          purpose: g.purpose, unlockDate: g.unlock_date,
          locked: g.locked, cooldown: g.cooldown, isPublic: g.is_public,
          autoDepositAmount: g.auto_deposit_amount, autoDepositDay: g.auto_deposit_day,
        })));
      }

      // Load check-ins
      const ciRes = await fetch(`${SUPABASE_URL}/rest/v1/check_ins?user_id=eq.${uid}&order=checked_in_at.desc&limit=90`, { headers });
      const ciData = await ciRes.json();
      if (Array.isArray(ciData)) {
        setCheckInLog(ciData.map(c => ({ amount: c.amount, category: c.category, note: c.note, date: c.checked_in_at?.split("T")[0] })));
        let s = 0;
        const dates = [...new Set(ciData.map(c => c.checked_in_at?.split("T")[0]))].sort().reverse();
        for (let i = 0; i < dates.length; i++) {
          const expected = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
          if (dates[i] === expected) s++; else break;
        }
        setStreak(s);
      }

      // Load notification reads
      const nrRes = await fetch(`${SUPABASE_URL}/rest/v1/notification_reads?user_id=eq.${uid}&select=notification_id`, { headers });
      const nrData = await nrRes.json();
      if (Array.isArray(nrData)) setReadNotifs(nrData.map(r => r.notification_id));

    } catch (err) {
      console.error("Error loading user data:", err);
      setScreen("onboarding");
    }
    setDbLoading(false);
    setAuthReady(true);
  };

  // ── Save profile to Supabase ──────────────────────────────────────
  const saveProfile = async (p, uid) => {
    const token = sb._token();
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}`, "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id: uid, name: p.name, income: p.income, pay_freq: p.payFreq,
        monthly_income: p.monthlyIncome, total_fixed: p.totalFixed,
        total_variable: p.totalVariable, state: p.state, city: p.city,
        housing_type: p.housingType, housing_cost: p.housingCost,
        lunch_habit: p.lunchHabit, vacation_freq: p.vacationFreq,
        credit_card_bal: p.creditCardBalance, quick_start: p.quickStart || false,
        updated_at: new Date().toISOString(),
      }),
    });
  };

  // ── Save goal to Supabase ─────────────────────────────────────────
  const saveGoal = async (goal) => {
    if (!authUser) return;
    const token = sb._token();
    const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}`, "Prefer": "return=minimal" };
    const isNew = typeof goal.id === "number";
    if (isNew) {
      await fetch(`${SUPABASE_URL}/rest/v1/goals`, {
        method: "POST", headers,
        body: JSON.stringify({ user_id: authUser.id, name: goal.name, target: goal.target, saved: goal.saved || 0, icon: goal.icon, color: goal.color, purpose: goal.purpose, is_public: goal.isPublic || false, sort_order: goals.length }),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/goals?id=eq.${goal.id}&user_id=eq.${authUser.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ name: goal.name, target: goal.target, saved: goal.saved, icon: goal.icon, color: goal.color, purpose: goal.purpose, unlock_date: goal.unlockDate, locked: goal.locked, cooldown: goal.cooldown, is_public: goal.isPublic, auto_deposit_amount: goal.autoDepositAmount, auto_deposit_day: goal.autoDepositDay, updated_at: new Date().toISOString() }),
      });
    }
  };

  // ── Log check-in to Supabase ──────────────────────────────────────
  const logCheckIn = async (entry) => {
    if (!authUser) return;
    const token = sb._token();
    await fetch(`${SUPABASE_URL}/rest/v1/check_ins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ user_id: authUser.id, amount: entry.amount, category: entry.category, note: entry.note }),
    });
  };

  // ── Mark notification read in Supabase ───────────────────────────
  const markReadDb = async (id) => {
    if (!authUser) return;
    const token = sb._token();
    await fetch(`${SUPABASE_URL}/rest/v1/notification_reads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}`, "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: authUser.id, notification_id: id }),
    });
  };

  // ── Handle onboarding complete ───────────────────────────────────
  const handleOnboardingComplete = async (p) => {
    setProfile(p);
    if (authUser) await saveProfile(p, authUser.id);
    setScreen(p.skipGoalCreation ? "app" : "newGoal");
    setTab("home");
  };

  // ── Handle goal save ─────────────────────────────────────────────
  const handleGoalSave = async (updated) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    setEditGoal(null);
    await saveGoal(updated);
  };

  const handleGoalDelete = async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setEditGoal(null);
    if (authUser) {
      const token = sb._token();
      await fetch(`${SUPABASE_URL}/rest/v1/goals?id=eq.${id}&user_id=eq.${authUser.id}`, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token || SUPABASE_KEY}` },
      });
    }
  };

  const handlePrivacySave = (s) => {
    setGoals(prev => prev.map(g => g.id === privacyGoal.id ? { ...g, ...s } : g));
    setPrivacyGoal(null);
    saveGoal({ ...privacyGoal, ...s });
  };

  const markRead = async (id) => { setReadNotifs(p => [...p, id]); await markReadDb(id); };
  const markAllRead = () => { notifications.forEach(n => markReadDb(n.id)); setReadNotifs(notifications.map(n => n.id)); };



  const allNotifications = useMemo(
    () => generateNotifications(goals, INITIAL_BILLS, streak, checkInLog, profile),
    [goals, streak, checkInLog, profile]
  );
  const notifications = allNotifications.map(n => ({ ...n, read: n.read || readNotifs.includes(n.id) }));
  const unreadCount = notifications.filter(n => !n.read).length;

  const totalSaved = goals.reduce((a, g) => a + g.saved, 0);
  const totalTarget = goals.reduce((a, g) => a + g.target, 0);
  const overallPct = Math.round((totalSaved / totalTarget) * 100);
  const free = MONTHLY.income - MONTHLY.spent - MONTHLY.saved;
  const monthlyIncome = profile ? (profile.payFreq === "weekly" ? Math.round(profile.income * 52 / 12) : profile.payFreq === "biweekly" ? Math.round(profile.income * 26 / 12) : profile.payFreq === "yearly" ? Math.round(profile.income / 12) : Math.round(profile.income)) : MONTHLY.income;

  const TABS = [
    { id: "home",      icon: "home",       label: "Home"      },
    { id: "goals",     icon: "target",     label: "Goals"     },
    { id: "calendar",  icon: "calendar",   label: "Calendar"  },
    { id: "bills",     icon: "repeat",     label: "Bills"     },
    { id: "networth",  icon: "barChart",   label: "Wealth"    },
    { id: "debt",      icon: "wallet",     label: "Debt"      },
    { id: "hustle",    icon: "zap",        label: "Hustle"    },
    { id: "tax",       icon: "barChart",   label: "Tax"       },
    { id: "emergency", icon: "shield",     label: "Emergency" },
    { id: "joneses",   icon: "users",      label: "Joneses"   },
    { id: "referral",  icon: "send",       label: "Referral"  },
    { id: "school",    icon: "award",      label: "School"    },
    { id: "learn",     icon: "award",      label: "Learn"     },
    { id: "credit",    icon: "shield",     label: "Credit"    },
    { id: "couple",    icon: "users",      label: "Couple"    },
    { id: "insights",  icon: "zap",        label: "Insights"  },
    { id: "review",    icon: "award",      label: "Year"      },
    { id: "health",    icon: "shield",     label: "Health"    },
    { id: "whatif",    icon: "zap",        label: "What-If"   },
    { id: "community", icon: "users",      label: "Community" },
    { id: "analytics", icon: "pieChart",   label: "Stats"     },
    { id: "invest",    icon: "trendUp",    label: "Invest"    },
    { id: "deals",     icon: "dollarSign", label: "Deals"     },
    { id: "profile",   icon: "user",       label: "Profile"   },
  ];

  const fonts = <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />;

  // ── Auth gate — must be logged in to see anything ─────────────────
  if (!authUser) return <AuthScreen onAuth={user => { setAuthUser(user); loadUserData(user.id); }} />;

  if (dbLoading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Inter',sans-serif" }}>
      {fonts}
      <div style={{ width: 56, height: 56, borderRadius: 16, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(124,92,252,0.5)" }}>
        <style>{`@keyframes ffpulse{0%,100%{opacity:1}50%{opacity:0.4}} .ffpulse{animation:ffpulse 1.5s infinite}`}</style>
        <div className="ffpulse" style={{ display: "flex" }}><Icon name="shield" size={26} color="#fff" /></div>
      </div>
      <p style={{ color: T.textSub, fontSize: 13 }}>Loading your data...</p>
    </div>
  );

  if (screen === "onboarding") return (
    <div style={{ minHeight: "100vh", background: T.bg, maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", gap: 16 }}>
      {fonts}
      <div style={{ width: 64, height: 64, borderRadius: 18, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, boxShadow: "0 4px 24px rgba(124,92,252,0.5)" }}>
        <Icon name="shield" size={30} color="#fff" strokeWidth={1.8} />
      </div>
      <h1 style={{ color: T.text, fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: -1, textAlign: "center" }}>FreedomFund</h1>
      <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 8px", textAlign: "center", lineHeight: 1.7, maxWidth: 320 }}>Stop living for the Joneses. Build real financial freedom — starting in the next 3 minutes.</p>
      <button onClick={() => setScreen("quickstart")} style={{ ...S.primaryBtn(), padding: "16px 0", fontSize: 16, width: "100%", maxWidth: 360 }}>
        Quick Start — 3 questions, 3 minutes
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 360 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        <span style={{ color: T.textSub, fontSize: 12 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>
      <button onClick={() => setScreen("fullonboarding")} style={{ ...S.ghostBtn, padding: "15px 0", fontSize: 15, width: "100%", maxWidth: 360 }}>
        Full Profile — 12 steps, more accurate plan
      </button>
      <button onClick={() => { setScreen("app"); setTab("school"); }} style={{ background: "none", border: "none", color: T.textSub, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", textDecoration: "underline", marginTop: 4 }}>
        Student Mode — I am learning the basics
      </button>
      <button onClick={() => sb.signOut()} style={{ background: "none", border: "none", color: T.textSub, fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif", marginTop: 8 }}>
        Sign out
      </button>
    </div>
  );
  if (screen === "quickstart") return <QuickStartOnboarding onComplete={p => { handleOnboardingComplete(p); if (p.firstGoal) { const newGoal = { id: Date.now(), ...p.firstGoal, saved: 0, color: T.purple, icon: "target", purpose: "My first goal", isPublic: false }; setGoals(prev => [...prev, newGoal]); saveGoal(newGoal); } }} onFullOnboarding={() => setScreen("fullonboarding")} />;
  if (screen === "fullonboarding") return <>{fonts}<Onboarding onComplete={handleOnboardingComplete} /></>;
  if (screen === "newGoal") return <>{fonts}<GoalCreationFlow onComplete={g => { if (g) setGoals(p => [...p, g]); setScreen("app"); setTab("goals"); }} onCancel={() => setScreen("app")} /></>;
  if (screen === "pro") return <>{fonts}<ProScreen isPro={isPro} onClose={() => setScreen("app")} onUpgrade={() => { setIsPro(true); setScreen("app"); }} /></>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter',sans-serif", color: T.text, maxWidth: 420, margin: "0 auto", position: "relative", paddingBottom: 80, overflow: "hidden" }}>
      {fonts}
      {/* Bold background glow matching reference */}
      <div style={{ position: "fixed", top: -140, left: -100, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,110,246,0.22) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,120,73,0.18) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "35%", right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,172,254,0.12) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1 }}>

      <div style={{ padding: "52px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(123,110,246,0.5)" }}>
              <Icon name="shield" size={18} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p style={{ color: T.textSub, fontSize: 10, margin: 0, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>{profile?.name ? `Hey, ${profile.name}` : "Good morning"}</p>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.5, background: GRAD.purple, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FreedomFund</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell notifications={notifications} onOpen={() => setShowNotifications(true)} />
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFreedomTip(t => !t)} style={{ background: GRAD.purple, border: "none", borderRadius: 12, padding: "8px 16px", textAlign: "center", cursor: "pointer", boxShadow: "0 4px 20px rgba(123,110,246,0.5)" }}>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, margin: 0, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Freedom</p>
                <p style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0 }}>{overallPct}%</p>
              </button>
              {showFreedomTip && (
                <>
                  <div onClick={() => setShowFreedomTip(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, ...S.card, zIndex: 50, width: 240, padding: 14 }}>
                    <p style={{ color: T.text, fontSize: 12, fontWeight: 700, margin: "0 0 5px" }}>Your Freedom Score</p>
                    <p style={{ color: T.textMid, fontSize: 11, margin: "0 0 8px", lineHeight: 1.6 }}>The percentage of all your combined savings goal targets you have reached so far. 100% means every goal is fully funded.</p>
                    <p style={{ color: T.purple, fontSize: 11, margin: 0, fontWeight: 700 }}>${totalSaved.toLocaleString()} of ${totalTarget.toLocaleString()} saved</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {tab === "home" && (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Daily check-in banner */}
          <button onClick={() => setShowCheckIn(true)} style={{ background: GRAD.purple, border: "none", borderRadius: 14, padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(124,92,252,0.4)" }}>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 2px" }}>Daily Check-In</p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: 0 }}>Log your spending today</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "3px 10px" }}>
                <Icon name="fire" size={12} color={T.gold} />
                <span style={{ color: T.gold, fontSize: 11, fontWeight: 700 }}>{streak}d</span>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="plus" size={16} color="#fff" strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* Row 1: Weekly sparkline + Freedom donut */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <p style={{ color: T.textMid, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", margin: 0 }}>Weekly Saved</p>
                  <p style={{ color: T.orange, fontWeight: 900, fontSize: 17, margin: "2px 0 0" }}>${MONTHLY.saved.toLocaleString()}</p>
                </div>
                <span style={{ background: T.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 99, fontFamily: "'Inter',sans-serif" }}>+12%</span>
              </div>
              <svg width="100%" height={44} viewBox="0 0 120 44" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="spkG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.orange} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={T.orange} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points="0,44 0,30 15,22 30,27 45,14 60,20 75,10 90,17 105,7 120,12 120,44" fill="url(#spkG)" />
                <polyline points="0,30 15,22 30,27 45,14 60,20 75,10 90,17 105,7 120,12" fill="none" stroke={T.orange} strokeWidth="2" strokeLinecap="round" />
                {[[45,14],[75,10],[105,7]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r={2.5} fill={T.orange} />)}
              </svg>
            </div>
            <div style={{ ...S.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <p style={{ color: T.textMid, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", margin: 0 }}>Freedom</p>
              <DonutRing pct={overallPct} color={T.purple} size={72} strokeWidth={8} />
              <p style={{ color: T.textSub, fontSize: 10, margin: 0 }}>goals funded</p>
            </div>
          </div>

          {/* Row 2: Goal analysis donuts + Income gauge */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: 0 }}>Goals</p>
                <div style={{ display: "flex", gap: 4 }}>
                  <span style={{ background: T.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, fontFamily: "'Inter',sans-serif" }}>Active</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { pct: Math.round(((goals[0]?.saved||0)/(goals[0]?.target||1))*100), color: T.orange, label: (goals[0]?.name||"Goal 1").split(" ")[0] },
                  { pct: Math.round(((goals[1]?.saved||0)/(goals[1]?.target||1))*100), color: T.purple, label: (goals[1]?.name||"Goal 2").split(" ")[0] },
                  { pct: Math.round(((goals[2]?.saved||0)/(goals[2]?.target||1))*100), color: T.teal,   label: (goals[2]?.name||"Goal 3").split(" ")[0] },
                ].map(r => <DonutRing key={r.label} pct={r.pct} color={r.color} size={44} strokeWidth={5} label={r.label} />)}
              </div>
            </div>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: 0 }}>Budget</p>
                <span style={{ background: T.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99, fontFamily: "'Inter',sans-serif" }}>Live</span>
              </div>
              <GaugeMeter pct={Math.min(100, Math.round((MONTHLY.saved / monthlyIncome) * 100 * 5))} />
              <div style={{ marginTop: 8 }}>
                <SliderBar pct={Math.round((MONTHLY.saved/monthlyIncome)*100)} color={T.orange} label="Saved" value={`${Math.round((MONTHLY.saved/monthlyIncome)*100)}%`} />
                <SliderBar pct={Math.round((MONTHLY.spent/monthlyIncome)*100)} color={T.purple} label="Spent" value={`${Math.round((MONTHLY.spent/monthlyIncome)*100)}%`} />
              </div>
            </div>
          </div>

          {/* Row 3: Multi-line trend chart full width */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: 0 }}>Monthly Trends</p>
                <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>Income vs Spending vs Saved</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ c: T.orange, l: "Income" }, { c: T.purple, l: "Spent" }, { c: T.teal, l: "Saved" }].map(s => (
                  <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.c, boxShadow: `0 0 5px ${s.c}` }} />
                    <span style={{ color: T.textSub, fontSize: 9 }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            {(() => {
              const W = 340, H = 90;
              const months = ["Jan","Feb","Mar","Apr","May","Jun"];
              const income = [3800,4000,3900,4200,4100,4200];
              const spent  = [3100,3300,2900,2800,3000,2640];
              const saved  = [700,700,1000,1400,1100,860];
              const allVals = [...income,...spent,...saved];
              const min = Math.min(...allVals) * 0.8;
              const max = Math.max(...allVals) * 1.05;
              const norm = (v) => H - ((v - min) / (max - min)) * H;
              const pathFor = (arr) => arr.map((v,i) => `${(i/(arr.length-1))*W},${norm(v)}`).join(" ");
              return (
                <div>
                  <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                    {[0.25,0.5,0.75].map(p => (
                      <line key={p} x1={0} y1={H*p} x2={W} y2={H*p} stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="4,4" />
                    ))}
                    {[{arr:income,c:T.orange},{arr:spent,c:T.purple},{arr:saved,c:T.teal}].map(({arr,c}) => (
                      <g key={c}>
                        <polyline points={pathFor(arr)} fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${c})` }} />
                        {arr.map((v,i) => <circle key={i} cx={(i/(arr.length-1))*W} cy={norm(v)} r={2.5} fill={c} />)}
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    {months.map(m => <span key={m} style={{ color: T.textSub, fontSize: 9 }}>{m}</span>)}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Row 4: Next bill + savings rate donut */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={() => setTab("bills")} style={{ ...S.card, cursor: "pointer", textAlign: "left" }}>
              <p style={{ color: T.textMid, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", margin: "0 0 8px" }}>Next Bill</p>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${T.red}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                <Icon name="calendar" size={15} color={T.red} />
              </div>
              <p style={{ color: T.text, fontWeight: 800, fontSize: 15, margin: "0 0 2px" }}>$142</p>
              <p style={{ color: T.textSub, fontSize: 11, margin: 0 }}>Car Insurance in 3d</p>
              <div style={{ marginTop: 8 }}><ProgressBar pct={78} color={T.red} height={4} /></div>
            </button>
            <button onClick={() => setTab("health")} style={{ ...S.card, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <p style={{ color: T.textMid, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase", margin: 0 }}>Savings Rate</p>
              <DonutRing pct={Math.round((MONTHLY.saved/monthlyIncome)*100)} color={T.green} size={58} strokeWidth={6} />
              <p style={{ color: T.textSub, fontSize: 10, margin: 0 }}>Target: 20%+</p>
            </button>
          </div>

          {/* Row 5: Budget parameter sliders */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: 0 }}>Budget Parameters</p>
              <Toggle value={true} onChange={() => {}} />
            </div>
            <SliderBar pct={29} color={T.blue}   label="Housing"     value="29%" />
            <SliderBar pct={11} color={T.orange}  label="Food"        value="11%" />
            <SliderBar pct={7}  color={T.teal}    label="Transport"   value="7%"  />
            <SliderBar pct={20} color={T.purple}  label="Goals"       value="20%" />
            <SliderBar pct={Math.min(100, Math.round(free/30))} color={T.green} label="Daily limit" value={`$${Math.round(free/30)}`} />
          </div>

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Net Worth", icon: "barChart", tab: "networth", color: T.green  },
              { label: "Debt Plan", icon: "wallet",   tab: "debt",     color: T.red    },
              { label: "Insights",  icon: "zap",      tab: "insights", color: T.orange },
              { label: "What-If",   icon: "repeat",   tab: "whatif",   color: T.purple },
            ].map(a => (
              <button key={a.label} onClick={() => setTab(a.tab)} style={{ background: `${a.color}0e`, border: `1px solid ${a.color}22`, borderRadius: 12, padding: "12px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, textAlign: "left" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={a.icon} size={14} color={a.color} />
                </div>
                <span style={{ color: a.color, fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Motivational tip */}
          <div onClick={() => setTipIdx(i => (i + 1) % TIPS.length)} style={{ background: "rgba(124,92,252,0.07)", border: "1px solid rgba(124,92,252,0.15)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: GRAD.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="zap" size={13} color="#fff" />
            </div>
            <p style={{ color: T.textMid, fontSize: 12, margin: 0, lineHeight: 1.6, fontStyle: "italic", flex: 1 }}>{TIPS[tipIdx]}</p>
          </div>
        </div>
      )}


      {tab === "goals" && (
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <SectionLabel>Your Goals</SectionLabel>
            <button onClick={() => setScreen("newGoal")} style={{ background: T.accentLo, color: T.accent, border: `1px solid ${T.accent}40`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="plus" size={13} color={T.accent} />
              New Goal
            </button>
          </div>
          {goals.map((goal, idx) => <GoalCard key={goal.id} goal={goal} idx={idx} onDeposit={setDepositGoal} onWithdraw={setWithdrawGoal} onPrivacy={setPrivacyGoal} onEdit={setEditGoal} />)}
        </div>
      )}

      {tab === "community" && (
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <SectionLabel>Community Impact</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[{ label: "Goals Done", value: "1,284", color: T.gold }, { label: "Total Saved", value: "$2.8M", color: T.green }, { label: "Members", value: "18,402", color: T.accent }].map(s => (
                <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 4px" }}>
                  <p style={{ color: s.color, fontWeight: 700, fontSize: 16, margin: 0 }}>{s.value}</p>
                  <p style={{ color: T.textSub, fontSize: 10, margin: "2px 0 0" }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <SectionLabel>Where People Are Saving</SectionLabel>
              {[
                { label: "Emergency Fund", pct: 34, color: T.green, value: "$952K" },
                { label: "House / Property", pct: 28, color: T.accent, value: "$784K" },
                { label: "Debt Payoff", pct: 18, color: T.red, value: "$504K" },
                { label: "Retirement", pct: 12, color: T.purple, value: "$336K" },
                { label: "Other Goals", pct: 8, color: T.gold, value: "$224K" },
              ].map(cat => (
                <div key={cat.label} style={{ marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: T.textMid, fontSize: 12 }}>{cat.label}</span>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ color: T.textSub, fontSize: 11 }}>{cat.value}</span>
                      <span style={{ color: cat.color, fontSize: 11, fontWeight: 700, width: 30, textAlign: "right" }}>{cat.pct}%</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 5, overflow: "hidden" }}>
                    <div style={{ width: `${cat.pct}%`, height: "100%", background: cat.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <SectionLabel>Your Analytics</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Your Daily Avg", value: "$28.40", sub: "vs $14.20 community", color: T.green },
                { label: "Your Monthly", value: "$860", sub: "vs $431 community", color: T.accent },
                { label: "Streak", value: "7 days", sub: "Personal best: 14", color: T.gold },
                { label: "Consistency", value: "82%", sub: "Days you saved", color: T.purple },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 9, padding: "11px 12px" }}>
                  <p style={{ color: T.textSub, fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
                  <p style={{ color: s.color, fontWeight: 700, fontSize: 16, margin: "0 0 3px" }}>{s.value}</p>
                  <p style={{ color: T.textSub, fontSize: 10, margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>
            <div style={{ background: T.accentLo, border: `1px solid ${T.accent}25`, borderRadius: 8, padding: 11 }}>
              <p style={{ color: T.accent, fontSize: 12, margin: 0, lineHeight: 1.6 }}>You are saving <strong>2x the community average</strong>. At this rate you will hit your Emergency Fund goal <strong>8 months ahead of schedule.</strong></p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SectionLabel>Live Feed</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
              <span style={{ color: T.green, fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
          </div>
          {FEED.map(item => <FeedCard key={item.id} item={item} />)}
        </div>
      )}

      {tab === "school"    && <div style={{ paddingTop: 16 }}><SchoolMode onExitSchoolMode={() => setTab("home")} /></div>}
      {tab === "hustle"    && <div style={{ paddingTop: 16 }}><SideHustleTab profile={profile} /></div>}
      {tab === "tax"       && <div style={{ paddingTop: 16 }}><TaxEstimator profile={profile} /></div>}
      {tab === "emergency" && <div style={{ paddingTop: 16 }}><EmergencyFundCalc profile={profile} goals={goals} onNavigate={setTab} /></div>}
      {tab === "joneses"   && <div style={{ paddingTop: 16 }}><JonesesComparison profile={profile} goals={goals} /></div>}
      {tab === "referral"  && <div style={{ paddingTop: 16 }}><ReferralSystem profile={profile} /></div>}
      {tab === "networth"  && <div style={{ paddingTop: 16 }}><NetWorthTab goals={goals} profile={profile} /></div>}
      {tab === "debt"      && <div style={{ paddingTop: 16 }}><DebtPayoffTab /></div>}
      {tab === "health"    && <div style={{ paddingTop: 16 }}><HealthScore goals={goals} profile={profile} /></div>}
      {tab === "whatif"    && <div style={{ paddingTop: 16 }}><WhatIfCalculator goals={goals} profile={profile} /></div>}
      {tab === "learn"     && <div style={{ paddingTop: 16 }}><InvestEducationPath /></div>}
      {tab === "credit"    && <div style={{ paddingTop: 16 }}><CreditScoreTracker /></div>}
      {tab === "couple"    && <div style={{ paddingTop: 16 }}><CoupleMode profile={profile} goals={goals} /></div>}
      {tab === "insights"  && <div style={{ paddingTop: 16 }}><SmartRecommendations goals={goals} profile={profile} bills={INITIAL_BILLS} /></div>}
      {tab === "review"    && <div style={{ paddingTop: 16 }}><AnnualReview goals={goals} profile={profile} checkInLog={checkInLog} streak={streak} /></div>}
      {tab === "calendar" && <div style={{ paddingTop: 16 }}><FinancialCalendar goals={goals} bills={INITIAL_BILLS} checkInLog={checkInLog} profile={profile} /></div>}
      {tab === "bills" && <div style={{ paddingTop: 16 }}><BillsTab profileSubs={profile?.subscriptionsList || []} /></div>}
      {tab === "invest" && <div style={{ paddingTop: 16 }}><InvestTab /></div>}
      {tab === "analytics" && <div style={{ paddingTop: 16 }}><AnalyticsTab /></div>}
      {tab === "deals" && <div style={{ paddingTop: 16 }}><DealsTab /></div>}
      {tab === "profile" && <div style={{ paddingTop: 16 }}><ProfileTab goals={goals} userName={profile?.name} isPro={isPro} onUpgrade={() => setScreen("pro")} onSignOut={() => { sb.signOut(); setAuthUser(null); setProfile(null); setGoals(INITIAL_GOALS); setCheckInLog([]); setStreak(0); setAuthReady(true); }} /></div>}

      {/* Bottom Nav — primary 6 tabs + More */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "rgba(8,9,26,0.97)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(123,110,246,0.15)", zIndex: 100, boxShadow: "0 -8px 40px rgba(0,0,0,0.6)" }}>
        {/* More drawer — slides up when open */}
        {showMoreMenu && (
          <>
            <div onClick={() => setShowMoreMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
            <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, background: "rgba(8,9,26,0.98)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(123,110,246,0.2)", borderRadius: "16px 16px 0 0", padding: "16px 20px 10px", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}>
              <p style={{ color: T.textSub, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 12px" }}>More Features</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {TABS.slice(6).map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); setShowMoreMenu(false); }} style={{ background: tab === t.id ? GRAD.purple : "rgba(255,255,255,0.04)", border: tab === t.id ? "none" : "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, boxShadow: tab === t.id ? "0 4px 14px rgba(123,110,246,0.4)" : "none" }}>
                    <Icon name={t.icon} size={20} color={tab === t.id ? "#fff" : T.textSub} strokeWidth={1.6} />
                    <span style={{ color: tab === t.id ? "#fff" : T.textMid, fontSize: 11, fontWeight: tab === t.id ? 700 : 400, fontFamily: "'Inter',sans-serif", letterSpacing: 0.3 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Primary nav row */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 24px" }}>
          {TABS.slice(0, 6).map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setShowMoreMenu(false); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "4px 10px", position: "relative" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: tab === t.id ? GRAD.purple : "rgba(255,255,255,0.04)", border: tab === t.id ? "none" : "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", boxShadow: tab === t.id ? "0 4px 16px rgba(123,110,246,0.5)" : "none" }}>
                <Icon name={t.icon} size={17} color={tab === t.id ? "#fff" : T.textSub} strokeWidth={tab === t.id ? 2 : 1.5} />
              </div>
              <span style={{ fontSize: 9, color: tab === t.id ? T.purple : T.textSub, fontWeight: tab === t.id ? 700 : 400, letterSpacing: 0.5 }}>{t.label}</span>
            </button>
          ))}
          {/* More button */}
          <button onClick={() => setShowMoreMenu(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "4px 10px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: showMoreMenu || TABS.slice(6).some(t => t.id === tab) ? GRAD.purple : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s", boxShadow: showMoreMenu ? "0 4px 16px rgba(123,110,246,0.5)" : "none" }}>
              <Icon name={showMoreMenu ? "chevronDown" : "plus"} size={17} color={showMoreMenu || TABS.slice(6).some(t => t.id === tab) ? "#fff" : T.textSub} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 9, color: showMoreMenu || TABS.slice(6).some(t => t.id === tab) ? T.purple : T.textSub, fontWeight: 400, letterSpacing: 0.5 }}>More</span>
          </button>
        </div>
      </div>
      </div>

      <WithdrawModal goal={withdrawGoal} onClose={() => setWithdrawGoal(null)} />
      <DepositModal goal={depositGoal} onClose={() => setDepositGoal(null)} />
      {privacyGoal && <PrivacyModal goal={privacyGoal} onClose={() => setPrivacyGoal(null)} onSave={handlePrivacySave} />}
      {editGoal && <EditGoalModal goal={editGoal} onClose={() => setEditGoal(null)} onSave={handleGoalSave} onDelete={handleGoalDelete} />}
      {showCheckIn && <DailyCheckIn profile={profile} goals={goals} onClose={() => setShowCheckIn(false)} onLog={async entry => { const newEntry = { ...entry, date: new Date().toLocaleDateString() }; setCheckInLog(p => [...p, newEntry]); setStreak(s => s + 1); await logCheckIn(entry); }} />}
      {showNotifications && <NotificationCenter notifications={notifications} onClose={() => setShowNotifications(false)} onRead={markRead} onReadAll={markAllRead} onNavigate={t => setTab(t)} onOpenSettings={() => { setShowNotifications(false); setShowNotifSettings(true); }} />}
      {showNotifSettings && <NotificationSettings onClose={() => setShowNotifSettings(false)} />}
    </div>
  );
}
