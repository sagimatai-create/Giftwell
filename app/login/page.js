"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-3xl border-2 border-lilac p-6 space-y-4 shadow-sm">
        <div className="text-center">
          <span className="text-3xl">🎁</span>
          <h1 className="font-display font-bold text-2xl text-ink mt-1">Welcome back</h1>
        </div>
        {error && <p className="text-sm text-coral bg-cotton rounded-xl px-3 py-2">{error}</p>}
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-lilac text-sm" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border-2 border-lilac text-sm" />
        <button disabled={loading} type="submit" className="w-full py-2.5 rounded-xl bg-coral text-white font-semibold disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted">
          No account? <a href="/signup" className="text-lilac-text underline">Sign up</a>
        </p>
      </form>
    </div>
  );
}
