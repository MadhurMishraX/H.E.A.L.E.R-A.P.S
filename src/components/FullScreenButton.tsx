import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { motion } from 'motion/react';

export const FullScreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleFullscreen}
      className="fixed top-4 left-4 z-[9999] p-3 glass-card rounded-full text-brand-secondary shadow-lg hover:shadow-brand-secondary/30 transition-all duration-300 flex items-center justify-center group"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      aria-label="Toggle Fullscreen"
    >
      <div className="relative flex items-center justify-center">
        {isFullscreen ? (
          <Minimize size={24} className="relative z-10" />
        ) : (
          <Maximize size={24} className="relative z-10" />
        )}
        <div className="absolute inset-0 bg-brand-secondary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.button>
  );
};
