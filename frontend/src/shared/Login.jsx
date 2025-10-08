import api from "../service/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import lo from '../assets/lo.png'

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // no remember me / saved username

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!username || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/login", { username, password });
      const token = res.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("username", res.data.username || username);
      navigate("/");
    } catch (err) {
      const apiMsg = err?.response?.data?.message || "Invalid credentials";
      setErrorMsg(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleToggleShowPassword = () => setShowPassword((prev) => !prev);
  // no remember me

  return (
    <div className="relative min-h-screen w-full p-4">
      {/* Split background */}
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-white" />
        <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl" />
          </div>
        </div>

      </div>


      {/* Foreground layout: left content + right card */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
        {/* Left: Logo and animated headline (hidden on small) */}
        <div className="hidden lg:flex flex-col items-start justify-center px-2 mt-16 select-none">
          <div className="flex items-center gap-3 mb-6">

            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Venkateswara Associates</h2>
              <p className="text-sm text-gray-500">Reliable. Efficient. Modern ERP.</p>
            </div>
          </div>

          <style jsx="true">{`
            @keyframes floatY { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
            .animate-float { animation: floatY 2.5s ease-in-out infinite; display: inline-block; }
          `}</style>

          <div className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight italic" style={{ fontFamily: 'Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>
            {"Welcome to".split("").map((ch, i) => (
              <span
                key={`w1-${i}`}
                className="animate-float text-gray-900"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
            <br />
            {"VA ERP".split("").map((ch, i) => (
              <span
                key={`w2-${i}`}
                className="animate-float text-purple-700"
                style={{ animationDelay: `${(i + 3) * 90}ms` }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </div>
          <p className="mt-4 text-gray-600 max-w-md">
            Manage employees, machines, purchases, and production with a clean, unified workflow.
          </p>
        </div>

        {/* Right: Card aligned to right */}
        <div className="flex lg:justify-end justify-center items-center mt-36">
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-lg p-6 sm:p-8 text-gray-900"
            role="dialog"
            aria-label="Login"
          >
            {/* Header */}
            <div className="mb-6 select-none">
              <h1 className="text-2xl font-semibold leading-tight text-gray-900">Login</h1>
              <p className="text-sm text-gray-500">Secure sign in to continue</p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div
                className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={errorMsg ? 'login-error' : undefined}>
              <div>
                <label htmlFor="username" className="block text-sm mb-1 text-gray-700">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 outline-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm mb-1 text-gray-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 pr-10 outline-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={handleToggleShowPassword}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3l18 18" />
                        <path d="M10.73 5.08A9.46 9.46 0 0121 12s-3 6-9 6a8.94 8.94 0 01-4-.9" />
                        <path d="M9.9 9.9a3 3 0 104.2 4.2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-2.5 font-medium text-white shadow-md hover:from-purple-500 hover:to-purple-400 focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <span>© {new Date().getFullYear()} Venkateswara Associates</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed h-12 w-12 left-50 bottom-10">
        <img src={lo} alt="VA logo" className="h-12 w-12 rounded-xl object-contain ring-2 ring-purple-200" />
        <div className="absolute inset-0 rounded-xl bg-purple-50/50 blur-[2px]" />
      </div>

    </div>
  );
}
