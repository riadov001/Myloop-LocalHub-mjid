import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Farmers() {
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
      className="absolute inset-0 flex flex-row-reverse items-center z-10 px-24"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-1/2 pl-12 relative z-20">
        <motion.div
          className="w-16 h-2 bg-green-500 mb-8"
          initial={{ scaleX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        <motion.h2
          className="text-6xl font-bold text-white leading-tight"
          initial={{ opacity: 0, x: 30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          En direct des<br />producteurs
        </motion.h2>

        <motion.p
          className="text-xl text-slate-300 mt-6 max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Produits frais, de saison, sans intermédiaire.
        </motion.p>
      </div>

      <div className="w-1/2 relative h-[70vh]">
        <motion.div
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={phase >= 1 ? { clipPath: "circle(100% at 50% 50%)" } : { clipPath: "circle(0% at 50% 50%)" }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/vegetables.jpg`} 
            alt="Farmers" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900/80 via-transparent to-transparent" />
        </motion.div>
        
        <motion.div 
          className="absolute -top-12 -right-12 w-48 h-48 border-2 border-green-500/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
      </div>
    </motion.div>
  );
}
