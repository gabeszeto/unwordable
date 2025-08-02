import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Completed({ show, goldEarned }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="level-complete-message"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <p>🎉 Level Complete</p>
          <p>🪙 {goldEarned} Gold Earned</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
