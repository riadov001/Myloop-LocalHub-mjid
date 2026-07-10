import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Intro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4800), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="w-24 h-24 rounded-2xl bg-blue-600 mb-8 flex items-center justify-center shadow-2xl shadow-blue-500/40 relative overflow-hidden"
        initial={{ y: 50, opacity: 0, rotate: -15 }}
        animate={phase >= 1 ? { y: 0, opacity: 1, rotate: 0 } : { y: 50, opacity: 0, rotate: -15 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        <div className="w-10 h-10 bg-white rounded-md" />
      </motion.div>

      <div className="overflow-hidden">
        <motion.h1
          className="text-7xl font-bold tracking-tighter text-white"
          initial={{ y: "100%" }}
          animate={phase >= 2 ? { y: 0 } : { y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          Grainily
        </motion.h1>
      </div>

      <div className="overflow-hidden mt-6">
        <motion.p
          className="text-2xl text-blue-200 font-medium tracking-wide"
          initial={{ y: "100%", opacity: 0 }}
          animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
          Connectez votre territoire.
        </motion.p>
      </div>
    </motion.div>
  );
}
