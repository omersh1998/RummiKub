import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameOverResult } from '../../hooks/useGame';

const BOT_NAMES: Record<string, string> = {
  bot0: 'אלכס',
  bot1: 'סאם',
  bot2: 'ג\'ורדן',
};

interface GameOverModalProps {
  result: GameOverResult;
  showModal?: boolean;
  onViewBoard?: () => void;
  onNewGame?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ result, showModal = true, onViewBoard, onNewGame }) => {
  if (!showModal) return null;

  const isPlayerWinner = result.winner === 'player';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className={`rounded-2xl p-8 max-w-md text-center shadow-2xl border-t-8 relative overflow-hidden ${
            isPlayerWinner
              ? 'bg-[#fff9f0] border-pink-400 shadow-[0_20px_50px_rgba(236,72,153,0.3)]'
              : 'bg-slate-100 border-slate-500 shadow-[0_20px_50px_rgba(100,100,100,0.3)]'
          }`}
        >
          <h2 className={`text-4xl font-serif font-bold mb-4 ${isPlayerWinner ? 'text-pink-600' : 'text-slate-600'}`}>
            {isPlayerWinner ? 'ניצחת!' : `${BOT_NAMES[result.winner] ?? 'בוט'} ניצח!`}
          </h2>
          <p className="text-gray-700 mb-6">{result.message}</p>
          <div className="text-sm text-gray-600 space-y-1 mb-6">
            <p>ניקוד סופי (אבנים שנשארו):</p>
            <p>אתה: {result.scores.player} אבנים</p>
            <p>בוטים: {result.scores.bots.join(', ')} אבנים</p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
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
              className="px-6 py-3 rounded-full font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              משחק חדש
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
