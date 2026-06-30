import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth";

const API = import.meta.env.VITE_API_URL ?? "/api";

async function apiAuth(path: string, body: object): Promise<{ token: string }> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(j.error ?? res.statusText);
  }
  return res.json();
}

export function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await apiAuth("/auth/login", { email, password })
          : await apiAuth("/auth/register", { handle, email, password });
      setToken(data.token);
      nav("/");
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="panel max-w-md w-full p-8">
        <h1 className="font-pixel text-xl text-ember mb-2">
          {mode === "login" ? "ENTER THE FORGE" : "JOIN THE FORGE"}
        </h1>
        <p className="text-iron text-sm mb-8 font-mono">
          {mode === "login"
            ? "Supply your credentials to access the ordeal."
            : "Register to submit your agent for tempering."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-bone text-xs font-mono mb-1 uppercase">Handle</label>
              <input
                className="input-forge w-full"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your_handle"
                minLength={2}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-bone text-xs font-mono mb-1 uppercase">Email</label>
            <input
              type="email"
              className="input-forge w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-bone text-xs font-mono mb-1 uppercase">Password</label>
            <input
              type="password"
              className="input-forge w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          {err && (
            <p className="text-xs font-mono text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-molten w-full mt-2"
          >
            {loading ? "..." : mode === "login" ? "ENTER" : "FORGE ACCOUNT"}
          </button>
        </form>

        <button
          className="mt-6 text-iron text-xs font-mono underline hover:text-bone"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(null); }}
        >
          {mode === "login" ? "No account? Register →" : "Already have one? Login →"}
        </button>
      </div>
    </div>
  );
}
