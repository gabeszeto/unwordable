import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./endScreenStyles.css";

type MinimalStats = {
  guessesUsed?: number;
  perksUsed?: number;
  cashEarnt?: number;     // net (+earn - spend)
  runStartedAt?: number; // optional, for fallback time calc
  time?: string | null;  // preformatted from parent ("3m 12s")
};

export default function EndScreen({
  stats = {},
  onPlayAgain = () => {},
  onMenu = () => {},
}: {
  stats?: MinimalStats;
  onPlayAgain?: () => void;
  onMenu?: () => void;
}) {
  const {
    guessesUsed = 0,
    perksUsed = 0,
    cashEarnt = 0,
    time = null,
    runStartedAt,
  } = stats as MinimalStats;

  // Fallback time if parent didn't pass one
  const displayTime = useMemo(() => {
    if (time) return time;
    if (!runStartedAt) return null;
    const ms = Date.now() - runStartedAt;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }, [time, runStartedAt]);

  const cashLabel = cashEarnt === 0 ? "0" : `${cashEarnt}`;

  const shareText = useMemo(() => {
    const lines = [
      "You're Unwordable 🏁",
      `Guesses: ${guessesUsed}`,
      `Perks used: ${perksUsed}`,
      `Cash (net): ${cashLabel}`,
      displayTime ? `Time: ${displayTime}` : null,
      "Play at: (your link here)",
    ].filter(Boolean);
    return lines.join("\n");
  }, [guessesUsed, perksUsed, cashLabel, displayTime]);

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Run summary copied. Go brag. ✨");
    } catch {
      window.prompt("Copy your run summary:", shareText);
    }
  };

  // Confetti (unchanged)
  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        d: 800 + Math.random() * 800,
        r: -40 + Math.random() * 80,
        size: 6 + Math.random() * 8,
        color: ["var(--green-hard)", "var(--yellow-hard)", "var(--blue-hard)", "var(--red-hard)"][i % 4],
      })),
    []
  );

  return (
    <div className="endScreen-wrap">
      <AnimatePresence initial>
        <motion.div
          key="card"
          className="endScreen-card"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <motion.h1
            className="endScreen-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="title-accent">You’re Unwordable</span> 🎉
          </motion.h1>

          <motion.p
            className="endScreen-sub"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            You finished the run. Here’s your summary:
          </motion.p>

          <motion.div
            className="endScreen-stats"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
              show: { transition: { staggerChildren: 0.04 } },
            }}
          >
            {[
              { label: "Guesses:", value: guessesUsed, tone: "yellow" },
              { label: "Consumables Used:", value: perksUsed, tone: "blue" },
              { label: "Cash Earnt:", value: cashLabel, tone: "green" },
              ...(displayTime ? [{ label: "Time:", value: displayTime, tone: "red" }] : []),
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className={`stat-chip tone-${s.tone}`}
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.25, delay: 0.08 + i * 0.03 }}
              >
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="endScreen-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.35 }}
          >
            <button className="btn btn-primary" onClick={onPlayAgain}>
              ▶️ Play Again
            </button>
            <button className="btn btn-ghost" onClick={onShare}>
              📋 Share Run
            </button>
            <button className="btn btn-soft" onClick={onMenu}>
              🏠 Main Menu
            </button>
          </motion.div>
        </motion.div>

        <div key="confetti" className="confetti-stage" aria-hidden="true">
          {confetti.map(c => (
            <motion.span
              key={c.id}
              className="confetti-bit"
              style={{ left: `${c.x}vw`, width: c.size, height: c.size * 0.6, background: c.color }}
              initial={{ y: -20, rotate: 0, opacity: 0 }}
              animate={{ y: "100vh", rotate: c.r, opacity: [0, 1, 1, 0] }}
              transition={{ duration: c.d / 1000, ease: "easeOut" }}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
