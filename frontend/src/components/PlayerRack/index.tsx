import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Tile, Color } from '../../utils/engine';
import { DraggableTile } from '../DraggableTile';

export const DROP_RACK = 'rack';

const DroppableRack: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOver, setNodeRef } = useDroppable({ id: DROP_RACK });
  return (
    <div
      ref={setNodeRef}
      className={`bg-orange-900/40 p-6 rounded-2xl border-t-4 flex flex-wrap justify-center gap-3 shadow-2xl min-h-[120px] w-full transition-colors ${
        isOver ? 'border-orange-400 bg-orange-800/60' : 'border-orange-950'
      }`}
    >
      {children}
    </div>
  );
};

type SortMode = 'color-number' | 'number';

const COLOR_ORDER: Record<Color, number> = {
  red: 0,
  blue: 1,
  black: 2,
  yellow: 3,
};

const sortByColorAndNumber = (a: Tile, b: Tile): number => {
  const colorDiff = COLOR_ORDER[a.color] - COLOR_ORDER[b.color];
  return colorDiff !== 0 ? colorDiff : a.value - b.value;
};

const sortByNumber = (a: Tile, b: Tile): number => a.value - b.value;

interface PlayerRackProps {
  hand: Tile[];
  selectedIds: string[];
  onTileClick: (id: string) => void;
}

export const PlayerRack: React.FC<PlayerRackProps> = ({ hand, selectedIds, onTileClick }) => {
  const [sortMode, setSortMode] = React.useState<SortMode>('color-number');

  const sortedHand = useMemo(() => {
    const sorter = sortMode === 'color-number' ? sortByColorAndNumber : sortByNumber;
    return [...hand].sort(sorter);
  }, [hand, sortMode]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-4xl">
      <div className="flex gap-2">
        <button
          onClick={() => setSortMode('color-number')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortMode === 'color-number'
              ? 'bg-orange-700 text-white'
              : 'bg-orange-900/60 text-orange-200 hover:bg-orange-800/80'
          }`}
        >
          Color + Number
        </button>
        <button
          onClick={() => setSortMode('number')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortMode === 'number'
              ? 'bg-orange-700 text-white'
              : 'bg-orange-900/60 text-orange-200 hover:bg-orange-800/80'
          }`}
        >
          Number Only
        </button>
      </div>
      <DroppableRack>
        {sortedHand.map(tile => (
          <DraggableTile
            key={tile.id}
            tile={tile}
            isSelected={selectedIds.includes(tile.id)}
            onTileClick={onTileClick}
          />
        ))}
      </DroppableRack>
    </div>
  );
};