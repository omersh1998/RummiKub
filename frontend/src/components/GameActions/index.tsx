import React from 'react';
import Icon from '@mdi/react';
import { mdiCheck } from '@mdi/js';

interface GameActionsProps {
  onPlay: () => void;
  onDraw: () => void;
  onFinish: () => void;
  canPlay: boolean;
  hasMoved: boolean;
}

export const GameActions: React.FC<GameActionsProps> = ({
  onPlay, onDraw, onFinish, canPlay, hasMoved
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex gap-4">
        <button
          onClick={onPlay}
          disabled={!canPlay}
          className={`px-8 py-3 rounded-full font-bold text-white transition-all transform active:scale-95 shadow-lg ${canPlay ? 'bg-pink-500 hover:bg-pink-600' : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
        >
          Place Set
        </button>

        {!hasMoved ? (
          <button
            onClick={onDraw}
            className="px-8 py-3 rounded-full font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-lg border-b-4 border-amber-950 transition-all"
          >
            Draw Tile
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="flex gap-2 px-8 py-3 rounded-full font-bold bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-lg transition-all"
          >
            Finish Turn <Icon path={mdiCheck} size={1} />
          </button>
        )}
      </div>
    </div>
  );
};