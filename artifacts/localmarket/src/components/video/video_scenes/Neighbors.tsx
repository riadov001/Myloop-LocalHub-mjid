import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Neighbors() {
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
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 pr-12 relative z-20">
        <motion.div
          className="w-16 h-2 bg-blue-500 mb-8"
          initial={{ scaleX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        <motion.h2
          className="text-6xl font-bold text-white leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Échangez avec<br />vos voisins
        </motion.h2>

        <motion.p
          className="text-xl text-slate-300 mt-6 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Prêts d'outils, coups de main, et services entre particuliers.
        </motion.p>
      </div>

      <div className="w-1/2 relative h-[70vh]">
        <motion.div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          initial={{ scale: 0.8, opacity: 0, rotateY: 15 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1, rotateY: 0 } : { scale: 0.8, opacity: 0, rotateY: 15 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/neighbors.jpg`} 
            alt="Neighbors" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent" />
        </motion.div>
        
        {/* Decorative elements */}
        <motion.div 
          className="absolute -bottom-8 -left-8 w-40 h-40 border border-blue-500/30 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
