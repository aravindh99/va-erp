import { useNavigate } from "react-router-dom";
import { Button } from "antd";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="max-w-xl w-full">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg p-8 text-center overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

            <div className="mb-6">
              <h1 className="text-[90px] leading-none font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 animate-fireHue select-none">
                404
              </h1>
            </div>

            <h2 className="text-2xl font-semibold text-white/90 mb-3">
              Oops! Page not found
            </h2>
            <p className="text-white/70 mb-8">
              The page you are looking for doesn’t exist or was moved.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button
                size="large"
                type="primary"
                onClick={() => navigate("/dashboard")}
                className="!h-11 !px-6 !rounded-xl !border-0 !bg-gradient-to-r !from-fuchsia-500 !via-pink-500 !to-orange-400 hover:!scale-[1.02] active:!scale-100 transition-transform"
              >
                Go to Dashboard
              </Button>
              <Button
                size="large"
                onClick={() => navigate(-1)}
                className="!h-11 !px-6 !rounded-xl !bg-white/10 !text-white hover:!bg-white/20 border border-white/20 backdrop-blur"
              >
                Go Back
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:120ms]" />
              <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse [animation-delay:240ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1b0028] via-[#150032] to-[#000217]" />
      <div className="absolute inset-0 -z-10 animate-gradientShift opacity-60" style={{
        background:
          "radial-gradient(40% 60% at 20% 20%, rgba(255,0,122,0.35) 0%, transparent 60%), radial-gradient(35% 55% at 80% 30%, rgba(255,149,0,0.35) 0%, transparent 60%), radial-gradient(50% 70% at 50% 80%, rgba(0,174,255,0.35) 0%, transparent 60%)",
      }} />

      <div className="pointer-events-none select-none">
        <FloatingOrb className="top-20 left-10 from-fuchsia-500 to-pink-500" size={220} delay={0} />
        <FloatingOrb className="bottom-16 right-16 from-orange-400 to-yellow-400" size={180} delay={4} />
        <FloatingOrb className="top-1/2 left-1/2 -translate-x-1/2 from-sky-400 to-indigo-500" size={260} delay={2} />
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { transform: translate3d(0,0,0) rotate(0deg) scale(1); filter: hue-rotate(0deg); }
          50% { transform: translate3d(-2%, -2%, 0) rotate(10deg) scale(1.05); filter: hue-rotate(25deg); }
          100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); filter: hue-rotate(0deg); }
        }
        .animate-gradientShift { animation: gradientShift 14s ease-in-out infinite; }

        @keyframes fireHue {
          0%,100% { filter: drop-shadow(0 0 0.45rem rgba(255,106,0,.35)); }
          50% { filter: drop-shadow(0 0 0.9rem rgba(255,149,0,.55)); }
        }
        .animate-fireHue { animation: fireHue 2.2s ease-in-out infinite; }
      `}</style>
    </>
  );
}

function FloatingOrb({ className = "", size = 200, delay = 0 }) {
  return (
    <div
      className={`absolute ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full opacity-25 blur-2xl bg-gradient-to-br animate-orbit"
        style={{ animationDelay: `${delay}s` }}
      />
      <style>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(10px) rotate(0deg); }
          50% { transform: rotate(180deg) translateX(18px) rotate(-180deg); }
          100% { transform: rotate(360deg) translateX(10px) rotate(-360deg); }
        }
        .animate-orbit { animation: orbit 18s linear infinite; }
      `}</style>
    </div>
  );
}


