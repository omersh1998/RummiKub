import React from 'react';

const BOT_NAMES = ['Alex', 'Sam', 'Jordan'];

interface OpponentsViewProps {
  botTileCounts: number[];
}

export const OpponentsView: React.FC<OpponentsViewProps> = ({ botTileCounts }) => {
  return (
    <div className="flex justify-center gap-6 sm:gap-10 mb-4">
      {botTileCounts.map((count, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-500/50 flex items-center justify-center shadow-lg">
            <span className="text-2xl sm:text-3xl" role="img" aria-hidden>
              🤖
            </span>
          </div>
          <span className="text-white/90 text-sm font-medium">{BOT_NAMES[idx] ?? `Bot ${idx + 1}`}</span>
          <div className="flex items-center gap-1">
            <span className="text-amber-200 text-xs font-bold">{count}</span>
            <span className="text-white/60 text-xs">tiles</span>
          </div>
        </div>
      ))}
    </div>
  );
};
