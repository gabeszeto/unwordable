import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useDeath } from "../../contexts/death/DeathContext";
import { useRunStats } from "../../contexts/RunStatsContext";
import { useLevel } from "../../contexts/level/LevelContext";
import { useCash } from "../../contexts/cash/CashContext";

import "./deathScreenStyles.css";

/**
 * Optional props:
 *  - time?: string (preformatted, e.g. "03:12")
 *  - onPlayAgain?: () => void
 *  - onMenu?: () => void
 */
export default function DeathScreen({ time = null, onPlayAgain, onMenu }) {
    const navigate = useNavigate();

    // Death info
    const { deathRound, reason, word, setDeathInfo } = useDeath();

    // Run stats
    const { stats } = useRunStats();
    const {
        guessesUsed = 0,
        perksUsed = 0,
        cashEarnt = 0,
        runStartedAt,
    } = stats || {};

    // Human-friendly reason
    const displayReason = useMemo(() => {
        const map = {
            GreyReaper: "The Grey Reaper claimed your soul.",
            "Out of guesses": "You ran out of guesses.",
        };
        return map[reason] || "You perished…";
    }, [reason]);

    // Time formatting (prefer prop)
    const displayTime = useMemo(() => {
        if (time) return time;
        if (!runStartedAt) return null;
        const ms = Date.now() - runStartedAt;
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }, [time, runStartedAt]);

    // Share text
    const shareText = useMemo(() => {
        const lines = [
            "Unwordable — You Died 💀",
            `Round: ${deathRound ?? "?"} / 10`,
            `Cause: ${reason || "Unknown"}`,
            word ? `Word: ${word}` : null,
            `Guesses: ${guessesUsed}`,
            `Consumables used: ${perksUsed}`,
            `Cash (net): ${cashEarnt || 0}`,
            displayTime ? `Time: ${displayTime}` : null,
            "Play at: (your link here)",
        ].filter(Boolean);
        return lines.join("\n");
    }, [deathRound, reason, word, guessesUsed, perksUsed, cashEarnt, displayTime]);

    // Fallback actions (if parent doesn't pass handlers)
    const { resetLevel } = useLevel();
    const { resetCash } = useCash();

    const fallbackPlayAgain = () => {
        resetLevel();
        resetCash();
        setDeathInfo({ deathRound: 0, reason: null, word: "" });
        navigate("/"); // or navigate("/play") to immediately restart
    };

    const handlePlayAgain = onPlayAgain || fallbackPlayAgain;
    const handleMenu = onMenu || (() => navigate("/"));

    const onShare = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            alert("Death summary copied.");
        } catch {
            window.prompt("Copy your death summary:", shareText);
        }
    };

    // Subtle falling motes
    const motes = useMemo(
        () =>
            Array.from({ length: 20 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                d: 900 + Math.random() * 900,
                r: -20 + Math.random() * 40,
                size: 4 + Math.random() * 6,
                color: ["var(--red-hard)", "var(--blue-hard)"][i % 2],
            })),
        []
    );

    return (
        <div className="deathScreen-wrap">
            <AnimatePresence initial>
                <motion.div
                    key="card"
                    className="deathScreen-card"
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                >
                    <motion.h1
                        className="deathScreen-title"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                    >
                        💀 You Died
                    </motion.h1>

                    <motion.p
                        className="deathScreen-sub"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.35 }}
                    >
                        {displayReason}
                    </motion.p>

                    <motion.div
                        className="deathScreen-stats"
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
                            show: { transition: { staggerChildren: 0.04 } },
                        }}
                    >
                        {[
                            { label: "Round:  ", value: deathRound ?? "—", tone: "yellow" },
                            { label: "The word was:  ", value: word ?? "—", tone: "blue" },
                            { label: "Guesses:  ", value: guessesUsed, tone: "yellow" },
                            { label: "Consumables Used:  ", value: perksUsed, tone: "blue" },
                            { label: "Cash Earnt:  ", value: cashEarnt || 0, tone: "green" },
                            ...(displayTime ? [{ label: "Time:  ", value: displayTime, tone: "red" }] : []),
                        ].map((s, i) => (
                            <motion.div
                                key={s.label}
                                className={`stat-chip tone-${s.tone}`}
                                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                                transition={{ duration: 0.25, delay: 0.08 + i * 0.03 }}
                            >
                                {s.label}{s.value}
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        className="deathScreen-actions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28, duration: 0.35 }}
                    >
                        <button className="btn btn-primary" onClick={handlePlayAgain}>
                            ↺ Try Again
                        </button>
                        <button className="btn btn-ghost" onClick={onShare}>
                            📋 Share
                        </button>
                        <button className="btn btn-soft" onClick={handleMenu}>
                            🏠 Main Menu
                        </button>
                    </motion.div>
                </motion.div>

                <div key="motes" className="motes-stage" aria-hidden="true">
                    {motes.map((m) => (
                        <motion.span
                            key={m.id}
                            className="mote-bit"
                            style={{ left: `${m.x}vw`, width: m.size, height: m.size * 0.6, background: m.color }}
                            initial={{ y: -20, rotate: 0, opacity: 0 }}
                            animate={{ y: "100vh", rotate: m.r, opacity: [0, 1, 1, 0] }}
                            transition={{ duration: m.d / 1000, ease: "easeOut" }}
                        />
                    ))}
                </div>
            </AnimatePresence>
        </div>
    );
}
