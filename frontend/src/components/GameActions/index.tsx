import React from 'react';
import Icon from '@mdi/react';
import { mdiCheck, mdiUndo } from '@mdi/js';

interface GameActionsProps {
  onPlay: () => void;
  onDraw: () => void;
  onFinish: () => void;
  onClearChanges: () => void;
  canPlay: boolean;
  hasTableChanged: boolean;
}

export const GameActions: React.FC<GameActionsProps> = ({
  onPlay, onDraw, onFinish, onClearChanges, canPlay, hasTableChanged
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-wrap justify-center gap-3">
        {!hasTableChanged ? (
          <button
            onClick={onDraw}
            className="px-8 py-3 rounded-full font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-lg border-b-4 border-amber-950 transition-all"
          >
            שלוף אבן
          </button>
        ) : (
          <>
            <button
              onClick={onFinish}
              className="flex gap-2 px-8 py-3 rounded-full font-bold bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-lg transition-all"
            >
              סיים תור <Icon path={mdiCheck} size={1} />
            </button>
            <button
              onClick={onClearChanges}
              className="flex gap-2 px-6 py-3 rounded-full font-bold bg-slate-600 hover:bg-slate-700 text-white shadow-lg transition-all"
            >
              <Icon path={mdiUndo} size={1} /> בטל שינויים
            </button>
          </>
        )}
      </div>
    </div>
  );
};