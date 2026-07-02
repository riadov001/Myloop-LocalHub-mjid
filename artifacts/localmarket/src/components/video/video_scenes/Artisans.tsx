import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Artisans() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 5200), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center z-10 px-24"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, rotateX: 10, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 pr-12 relative z-20">
        <motion.div
          className="w-16 h-2 bg-amber-500 mb-8"
          initial={{ scaleX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        <motion.h2
          className="text-6xl font-bold text-white leading-tight"
          initial={{ opacity: 0, y: -30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Découvrez les<br />artisans locaux
        </motion.h2>

        <motion.p
          className="text-xl text-slate-300 mt-6 max-w-md"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Soutenez le savoir-faire de votre région.
        </motion.p>
      </div>

      <div className="w-1/2 relative h-[70vh]">
        <motion.div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={phase >= 1 ? { clipPath: "inset(0% 0 0 0)" } : { clipPath: "inset(100% 0 0 0)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/artisan.jpg`} 
            alt="Artisans" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent" />
        </motion.div>
      </div>
    </motion.div>
  );
}
