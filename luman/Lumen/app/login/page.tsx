"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, signup } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode");
  const [mode, setMode] = useState<"login" | "signup">(
    urlMode === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode whenever URL search param changes
  useEffect(() => {
    const currentMode = searchParams.get("mode");
    if (currentMode === "signup" || currentMode === "login") {
      setMode(currentMode);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("EMAIL AND PASSWORD REQUIRED");
      return;
    }

    setLoading(true);
    try {
      const result = await login(trimmedEmail, trimmedPassword);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "LOGIN FAILED";
      if (!msg.includes("NEXT_REDIRECT")) {
        setError(msg);
        setLoading(false);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedUsername || !trimmedPassword) {
      setError("ALL FIELDS REQUIRED (EMAIL, USERNAME, PASSWORD)");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("PASSWORD MUST BE AT LEAST 6 CHARACTERS");
      return;
    }

    setLoading(true);
    try {
      const result = await signup(trimmedEmail, trimmedPassword, trimmedUsername);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "SIGNUP FAILED";
      if (!msg.includes("NEXT_REDIRECT")) {
        setError(msg);
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8"
      style={{
        backgroundColor: mode === "login" ? "#00FFCC" : "#FF00FF",
      }}
    >
      <div
        className="w-full max-w-md bg-white border-4 border-black p-6 md:p-8 relative"
        style={{ boxShadow: "8px 8px 0px #000000" }}
      >
        {/* Top Header Row: Back Link & DB Indicator */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-black">
          <Link
            href="/"
            className="font-press-start text-[10px] text-black hover:text-[#FF4F00] transition-colors flex items-center gap-1 font-bold"
          >
            <span>←</span> BACK TO HOME
          </Link>
          <span className="font-press-start text-[9px] px-2 py-0.5 bg-black text-[#FFCC00] font-bold">
            MONGODB ATLAS
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            id="tab-login"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`py-3 px-4 font-press-start text-xs border-4 border-black transition-all cursor-pointer select-none font-bold ${mode === "login"
                ? "bg-black text-white shadow-[4px_4px_0px_#000000] -translate-y-0.5"
                : "bg-white text-black hover:bg-yellow-100"
              }`}
            style={{
              backgroundColor: mode === "login" ? "#000000" : "#FFFFFF",
              color: mode === "login" ? "#FFFFFF" : "#000000",
              borderColor: "#000000",
            }}
          >
            LOGIN
          </button>
          <button
            type="button"
            id="tab-signup"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`py-3 px-4 font-press-start text-xs border-4 border-black transition-all cursor-pointer select-none font-bold ${mode === "signup"
                ? "bg-black text-white shadow-[4px_4px_0px_#000000] -translate-y-0.5"
                : "bg-white text-black hover:bg-yellow-100"
              }`}
            style={{
              backgroundColor: mode === "signup" ? "#000000" : "#FFFFFF",
              color: mode === "signup" ? "#FFFFFF" : "#000000",
              borderColor: "#000000",
            }}
          >
            SIGNUP
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="font-press-start text-base md:text-lg text-black font-black uppercase tracking-wide">
            {mode === "login" ? " ENTER LUMEN" : " CREATE ACCOUNT"}
          </h2>
          <p className="font-mono text-xs text-gray-700 mt-1 font-semibold">
            {mode === "login"
              ? "Access your AI study workspace & flashcards"
              : "Register to save your flashcards & mind maps"}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            className="bg-[#FF4F00] text-white border-3 border-black p-4 mb-6"
            style={{
              backgroundColor: "#FF4F00",
              color: "#FFFFFF",
              borderColor: "#000000",
              boxShadow: "4px 4px 0px #000000",
            }}
          >
            <p className="font-press-start text-xs text-center font-bold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block font-press-start text-xs mb-2 text-black font-bold">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              id="input-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="w-full border-4 border-black p-3 font-mono text-sm bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
              style={{ color: "#000000", backgroundColor: "#FFFFFF", borderColor: "#000000" }}
              placeholder="you@example.com"
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          {/* Username (Signup Only) */}
          {mode === "signup" && (
            <div>
              <label className="block font-press-start text-xs mb-2 text-black font-bold">
                USERNAME
              </label>
              <input
                type="text"
                id="input-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full border-4 border-black p-3 font-mono text-sm bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
                style={{ color: "#000000", backgroundColor: "#FFFFFF", borderColor: "#000000" }}
                placeholder="choose_username"
                disabled={loading}
                required
                autoComplete="username"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-press-start text-xs text-black font-bold">
                PASSWORD
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="font-mono text-xs text-gray-700 hover:text-black font-bold cursor-pointer"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="input-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full border-4 border-black p-3 font-mono text-sm bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] pr-10"
                style={{ color: "#000000", backgroundColor: "#FFFFFF", borderColor: "#000000" }}
                placeholder={mode === "signup" ? "Min 6 characters" : "Enter password"}
                disabled={loading}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
          </div>

          {/* HIGH-VISIBILITY SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-auth-submit"
              disabled={loading}
              className="w-full font-press-start text-sm py-4 px-6 border-4 border-black transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold active:translate-x-1 active:translate-y-1 block text-center"
              style={{
                backgroundColor: loading ? "#222222" : "#000000",
                color: "#FFFFFF",
                borderColor: "#000000",
                boxShadow: loading ? "none" : "5px 5px 0px #000000",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                  {mode === "login" ? "AUTHENTICATING..." : "CREATING ACCOUNT..."}
                </span>
              ) : mode === "login" ? (
                " LOGIN TO LUMEN"
              ) : (
                " CREATE ACCOUNT"
              )}
            </button>
          </div>
        </form>

        {/* Footer Mode Switch */}
        <div className="text-center font-mono text-xs mt-6 pt-4 border-t-2 border-gray-200 text-gray-700">
          {mode === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                id="link-switch-to-signup"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-bold underline text-black hover:text-[#FF4F00] cursor-pointer ml-1"
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button
                type="button"
                id="link-switch-to-login"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="font-bold underline text-black hover:text-[#FF4F00] cursor-pointer ml-1"
              >
                Log in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#00FFCC]">
          <div className="font-press-start text-sm bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000000]">
            LOADING LUMEN AUTH...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
