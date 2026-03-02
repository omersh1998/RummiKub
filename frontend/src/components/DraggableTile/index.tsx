import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Tile } from '../../utils/engine';
import { TileComponent } from '../TileComponent';

export type TileSource = 'hand' | 'table';

interface DraggableTileProps {
  tile: Tile;
  source?: TileSource;
  setIndex?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onTileClick?: (id: string) => void;
  onRemoveTile?: (id: string) => void;
}

export const DraggableTile: React.FC<DraggableTileProps> = ({
  tile,
  source = 'hand',
  setIndex,
  isSelected = false,
  isHighlighted = false,
  onTileClick,
  onRemoveTile,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tile.id,
    data: { tile, source, setIndex },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-50' : undefined}
    >
      <TileComponent
        {...tile}
        isSelected={isSelected}
        isHighlighted={isHighlighted}
        onClick={onTileClick}
        onContextMenu={onRemoveTile}
      />
    </div>
  );
};
