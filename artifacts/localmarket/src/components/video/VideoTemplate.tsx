import { motion, AnimatePresence } from "framer-motion";
import { useVideoPlayer } from "@/lib/video";
import { Intro } from "./video_scenes/Intro";
import { Neighbors } from "./video_scenes/Neighbors";
import { Farmers } from "./video_scenes/Farmers";
import { Artisans } from "./video_scenes/Artisans";
import { Outro } from "./video_scenes/Outro";

const SCENE_DURATIONS = {
  intro: 6000,
  neighbors: 7500,
  farmers: 5000,
  artisans: 7000,
  outro: 6000,
};

const bgColors = [
  "radial-gradient(circle at 50% 50%, #1e40af, #0f172a)",
  "radial-gradient(circle at 30% 70%, #2563eb, #0f172a)",
  "radial-gradient(circle at 70% 30%, #16a34a, #0f172a)",
  "radial-gradient(circle at 50% 50%, #d97706, #0f172a)",
  "radial-gradient(circle at 50% 50%, #1e40af, #0f172a)",
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 font-sans">
      {/* Persistent Background */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ background: bgColors[currentScene] }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Floating Ambient Shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[40vw] h-[40vw] rounded-full blur-[100px] bg-blue-500/20"
          animate={{
            x: ["-10vw", "30vw", "10vw"],
            y: ["10vh", "50vh", "20vh"],
            scale: [1, 1.2, 0.9],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-[50vw] h-[50vw] rounded-full blur-[120px] bg-indigo-500/20"
          animate={{
            x: ["10vw", "-20vw", "0vw"],
            y: ["-10vh", "-40vh", "-10vh"],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Persistent UI / Logo Anchor */}
      <motion.div
        className="absolute top-8 left-12 z-20"
        animate={{
          opacity: currentScene === 0 || currentScene === 4 ? 0 : 1,
          y: currentScene === 0 || currentScene === 4 ? -20 : 0,
        }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">Grainily</span>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Intro key="intro" />}
        {currentScene === 1 && <Neighbors key="neighbors" />}
        {currentScene === 2 && <Farmers key="farmers" />}
        {currentScene === 3 && <Artisans key="artisans" />}
        {currentScene === 4 && <Outro key="outro" />}
      </AnimatePresence>
    </div>
  );
}
