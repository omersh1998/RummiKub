import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiTrophy } from '@mdi/js';

interface WinModalProps {
  isOpen: boolean;
  onViewBoard?: () => void;
  onNewGame?: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({ isOpen, onViewBoard, onNewGame }) => {
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
            <div className="absolute -top-10 -end-10 text-pink-100 select-none pointer-events-none">
              <Icon path={mdiTrophy} size={6} />
            </div>

            <h2 className="text-4xl font-serif font-bold text-pink-600 mb-6 flex items-center justify-center gap-2">
              <Icon path={mdiTrophy} size={1.5} />
              ניצחת!
            </h2>

            <p className="text-gray-800 font-medium leading-relaxed">
              סיימת את כל האבנים ביד. כל הכבוד!
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {onViewBoard && (
                <button
                  onClick={onViewBoard}
                  className="px-6 py-3 rounded-full font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                >
                  צפה בלוח
                </button>
              )}
              <button
                onClick={onNewGame ?? (() => window.location.reload())}
                className="px-6 py-3 rounded-full font-bold bg-pink-500 hover:bg-pink-600 text-white transition-colors"
              >
                משחק חדש
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
