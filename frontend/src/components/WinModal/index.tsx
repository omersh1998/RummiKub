import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinModalProps {
  isOpen: boolean;
}

export const WinModal: React.FC<WinModalProps> = ({ isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="bg-[#fff9f0] rounded-2xl p-8 max-w-md text-center shadow-[0_20px_50px_rgba(236,72,153,0.3)] border-t-8 border-pink-400 relative overflow-hidden"
          >
            {/* Decorative Heart Background */}
            <div className="absolute -top-10 -right-10 text-pink-100 text-9xl rotate-12 select-none pointer-events-none">
              ❤️
            </div>

            <h2 className="text-4xl font-serif font-bold text-pink-600 mb-6">You Won! ❤️</h2>

            <div className="space-y-4 text-gray-800 font-medium leading-relaxed italic">
              <p>"My dearest,"</p>
              <p>
                Watching you solve this game is like watching you solve life—with
                grace, intelligence, and a little bit of magic.
              </p>
              <p>
                Just like these tiles, we're a perfect match. I'm so proud of
                your win, but I'm even luckier to have you in my life.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-pink-100">
              <p className="text-pink-500 font-bold font-serif text-lg">- Your favorite developer</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-8 text-sm text-gray-400 hover:text-pink-400 transition-colors"
            >
              Play another round?
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};