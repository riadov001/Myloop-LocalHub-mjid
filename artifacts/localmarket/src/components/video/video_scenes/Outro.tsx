import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Outro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 5000), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="w-24 h-24 rounded-2xl bg-blue-600 mb-8 flex items-center justify-center shadow-2xl shadow-blue-500/40 relative overflow-hidden"
        initial={{ scale: 0 }}
        animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="w-10 h-10 bg-white rounded-md" />
      </motion.div>

      <div className="overflow-hidden">
        <motion.h1
          className="text-6xl font-bold tracking-tighter text-white"
          initial={{ y: "100%" }}
          animate={phase >= 2 ? { y: 0 } : { y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          LocalMarket
        </motion.h1>
      </div>

      <motion.div
        className="h-[2px] bg-blue-500 mt-6"
        initial={{ width: 0 }}
        animate={phase >= 2 ? { width: "100px" } : { width: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      <div className="overflow-hidden mt-6">
        <motion.p
          className="text-2xl text-blue-200 font-medium tracking-wide"
          initial={{ y: "100%", opacity: 0 }}
          animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
          L'économie locale, repensée.
        </motion.p>
      </div>
      
      <motion.div
        className="mt-12 px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <p className="text-white/60 font-mono text-sm">localmarket.app</p>
      </motion.div>
    </motion.div>
  );
}
