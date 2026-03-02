import React from 'react';

interface DrawPileProps {
  count: number;
}

export const DrawPile: React.FC<DrawPileProps> = ({ count }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {/* Stacked tile effect - 3 overlapping rectangles */}
        <div className="w-12 h-16 sm:w-14 sm:h-20 bg-[#fdf6e3] rounded-lg border-2 border-amber-800/30 shadow-md absolute top-0 left-0 transform rotate-[-6deg]" />
        <div className="w-12 h-16 sm:w-14 sm:h-20 bg-[#fdf6e3] rounded-lg border-2 border-amber-800/30 shadow-md absolute top-0 left-0 transform rotate-[3deg] translate-x-1" />
        <div className="w-12 h-16 sm:w-14 sm:h-20 bg-[#fdf6e3] rounded-lg border-2 border-amber-800/50 shadow-lg flex items-center justify-center relative">
          <span className="text-amber-700 text-lg font-bold">?</span>
        </div>
      </div>
      <span className="text-white/90 text-sm font-bold">{count}</span>
      <span className="text-white/60 text-xs">in deck</span>
    </div>
  );
};
