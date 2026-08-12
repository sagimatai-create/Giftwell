"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-sm bg-white rounded-3xl border-2 border-mint p-6">
          <span className="text-3xl">📬</span>
          <h1 className="font-display font-bold text-xl text-ink mt-2">Check your email</h1>
          <p className="text-sm text-muted mt-1">We sent a confirmation link — click it, then come back and sign in.</p>
          <a href="/login" className="inline-block mt-4 text-sm underline text-lilac-text">Go to sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-3xl border-2 border-lilac p-6 space-y-4 shadow-sm">
        <div className="text-center">
          <span className="text-3xl">🎁</span>
          <h1 className="font-display font-bold text-2xl text-ink mt-1">Create your account</h1>
        </div>
        {error && <p className="text-sm text-coral bg-cotton rounded-xl px-3 py-2">{error}</p>}
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-lilac text-sm" />
        <input type="password" required minLength={6} placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-lilac text-sm" />
        <button disabled={loading} type="submit" className="w-full py-2.5 rounded-xl bg-coral text-white font-semibold disabled:opacity-50">
          {loading ? "Creating…" : "Sign up"}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account? <a href="/login" className="text-lilac-text underline">Sign in</a>
        </p>
      </form>
    </div>
  );
}
