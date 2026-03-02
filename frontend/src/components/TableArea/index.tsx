import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Tile, sortSet } from '../../utils/engine';
import { DraggableTile } from '../DraggableTile';

export const DROP_TABLE = 'table';
export const dropIdForSet = (idx: number) => `set-${idx}`;

interface DroppableSetProps {
  setIndex: number;
  tiles: Tile[];
  tilesAddedThisTurn: Set<string>;
  onRemoveTile: (tileId: string) => void;
}

const DroppableSet: React.FC<DroppableSetProps> = ({
  setIndex,
  tiles,
  tilesAddedThisTurn,
  onRemoveTile,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: dropIdForSet(setIndex),
    data: { setIndex },
  });

  const sortedTiles = sortSet(tiles);

  return (
    <div
      ref={setNodeRef}
      dir="ltr"
      className={`flex bg-white/10 p-2 rounded-lg gap-1 border h-fit min-h-[88px] transition-colors ${
        isOver ? 'border-orange-400 bg-orange-900/30' : 'border-white/5'
      }`}
    >
      {sortedTiles.map(tile => (
        <DraggableTile
          key={tile.id}
          tile={tile}
          source="table"
          setIndex={setIndex}
          isHighlighted={tilesAddedThisTurn.has(tile.id)}
          onRemoveTile={tilesAddedThisTurn.has(tile.id) ? onRemoveTile : undefined}
        />
      ))}
    </div>
  );
};

interface TableAreaProps {
  table: Tile[][];
  tilesAddedThisTurn: Set<string>;
  onRemoveTile: (tileId: string) => void;
}

export const TableArea: React.FC<TableAreaProps> = ({
  table,
  tilesAddedThisTurn,
  onRemoveTile,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: DROP_TABLE,
    data: { setIndex: -1 },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 w-full max-w-5xl bg-green-800/50 rounded-3xl border-4 p-6 flex flex-wrap gap-4 content-start overflow-y-auto shadow-inner min-h-[300px] transition-colors ${
        isOver ? 'border-orange-400 bg-green-700/50' : 'border-green-950/30'
      }`}
    >
      {table.length === 0 ? (
        <p className="text-white/30 text-sm italic self-center m-auto">
          גרור אבנים לכאן כדי לשחק
        </p>
      ) : (
        table.map((set, idx) => (
          <DroppableSet
            key={idx}
            setIndex={idx}
            tiles={set}
            tilesAddedThisTurn={tilesAddedThisTurn}
            onRemoveTile={onRemoveTile}
          />
        ))
      )}
    </div>
  );
};