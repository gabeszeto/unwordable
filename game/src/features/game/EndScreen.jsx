import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./endScreenStyles.css";

export default function EndScreen({
    stats = {},
    onPlayAgain = () => { },
    onMenu = () => { },
}) {
    const {
        roundsSurvived = 10,
        bossesBeaten = 3,
        guessesUsed = 0,
        cashEarned = 0,
        perksUsed = 0,
        debuffsFaced = 0,
        time = null,
    } = stats;

    const shareText = useMemo(() => {
        const t = [
            "You're Unwordable 🏁",
            `Rounds: ${roundsSurvived}/10`,
            `Bosses beaten: ${bossesBeaten}`,
            `Guesses used: ${guessesUsed}`,
            `Perks used: ${perksUsed}`,
            `Debuffs faced: ${debuffsFaced}`,
            `Cash earned: ${cashEarned}`,
            time ? `Time: ${time}` : null,
            "Play at: (your link here)",
        ].filter(Boolean).join("\n");
        return t;
    }, [roundsSurvived, bossesBeaten, guessesUsed, perksUsed, debuffsFaced, cashEarned, time]);

    const onShare = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            alert("Run summary copied. Go brag. ✨");
        } catch {
            // fallback: open a prompt
            window.prompt("Copy your run summary:", shareText);
        }
    };

    // Confetti particles (lightweight, no deps)
    const confetti = useMemo(
        () =>
            Array.from({ length: 28 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,     // vw%
                d: 800 + Math.random() * 800, // duration ms
                r: -40 + Math.random() * 80,  // rotation deg
                size: 6 + Math.random() * 8,
                color:
                    [
                        "var(--green-hard)",
                        "var(--yellow-hard)",
                        "var(--blue-hard)",
                        "var(--red-hard)",
                    ][i % 4],
            })),
        []
    );

    return (
        <div className="endScreen-wrap">
            <AnimatePresence initial={true}>
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
                        You survived the run. Nicely done.
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
                            { label: "Rounds", value: `${roundsSurvived}/10`, tone: "green" },
                            { label: "Bosses", value: bossesBeaten, tone: "blue" },
                            { label: "Guesses", value: guessesUsed, tone: "yellow" },
                            { label: "Perks", value: perksUsed, tone: "blue" },
                            { label: "Debuffs", value: debuffsFaced, tone: "red" },
                            { label: "Cash", value: cashEarned, tone: "green" },
                        ].map((s, i) => (
                            <motion.div
                                key={s.label}
                                className={`stat-chip tone-${s.tone}`}
                                variants={{
                                    hidden: { opacity: 0, y: 6 },
                                    show: { opacity: 1, y: 0 },
                                }}
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

                {/* Confetti burst on first mount */}
                <div key="confetti" className="confetti-stage" aria-hidden="true">
                    {confetti.map((c, i) => (
                        <motion.span
                            key={c.id}
                            className="confetti-bit"
                            style={{
                                left: `${c.x}vw`,
                                width: c.size,
                                height: c.size * 0.6,
                                background: c.color,
                            }}
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
