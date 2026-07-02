import { useState, useEffect, useRef } from 'react';

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const durationsList = Object.values(durations);
  const totalScenes = durationsList.length;
  
  useEffect(() => {
    // @ts-ignore
    window.startRecording?.();
    
    let isFirstPass = true;
    let timer: any;
    
    const playScene = (index: number) => {
      setCurrentScene(index);
      
      timer = setTimeout(() => {
        const nextScene = index + 1;
        if (nextScene >= totalScenes) {
          if (isFirstPass) {
            isFirstPass = false;
            // @ts-ignore
            window.stopRecording?.();
          }
          playScene(0);
        } else {
          playScene(nextScene);
        }
      }, durationsList[index]);
    };
    
    playScene(0);
    
    return () => clearTimeout(timer);
  }, [JSON.stringify(durationsList)]);

  return { currentScene };
}