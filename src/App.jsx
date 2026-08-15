import { useState, useMemo, useEffect } from "react";

// ── Supabase client (fetch-based, no SDK needed) ──────────────────────────────
const SUPABASE_URL = "https://gqmoprupnykrfmdiameo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbW9wcnVwbnlrcmZtZGlhbWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzQ1NzAsImV4cCI6MjA5ODI1MDU3MH0.nLh3uzdhe7efGnerhLlaJ9ePKoHATeuirUt8mwTsJgg";

// Session: in-memory + localStorage persistence (guarded so sandboxed previews still work)
let _session = null;
const _saveSession = (data) => { try { if (data?.refresh_token) localStorage.setItem("ff_refresh", data.refresh_token); } catch (e) {} };
const _clearSession = () => { try { localStorage.removeItem("ff_refresh"); } catch (e) {} };

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
    if (data.access_token) { _session = data; _saveSession(data); }
    return data;
  },

  signIn: async (email, password) => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
