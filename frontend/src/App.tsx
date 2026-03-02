import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { validateTable, sortSet, type Tile } from './utils/engine';
import { useTileSelection } from './components/TileComponent/hooks';
import { TableArea, DROP_TABLE } from './components/TableArea';
import { PlayerRack, DROP_RACK } from './components/PlayerRack';
import { GameActions } from './components/GameActions';
import { TileComponent } from './components/TileComponent';
import { useGame } from './hooks/useGame';
import { WinModal } from './components/WinModal';
import { OpponentsView } from './components/OpponentsView';
import { DrawPile } from './components/DrawPile';

const App = () => {
  const { hand, setHand, table, setTable, deckCount, botTileCounts, loading, drawTile, finishTurn, error } = useGame();
  const { selectedIds, toggleSelection, clearSelection } = useTileSelection();
  const [hasMovedThisTurn, setHasMovedThisTurn] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [activeTile, setActiveTile] = useState<Tile | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tilesAddedThisTurn, setTilesAddedThisTurn] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const tile = event.active.data.current?.tile as Tile | undefined;
    if (tile) setActiveTile(tile);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTile(null);
    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as { tile: Tile; source?: string; setIndex?: number } | undefined;
    const tile = data?.tile;
    if (!tile) return;

    const source = data?.source ?? 'hand';
    const sourceSetIndex = data?.setIndex;

    const overId = String(over.id);

    // Drop on rack: return tile to hand (only from table)
    if (overId === DROP_RACK) {
      if (source !== 'table' || sourceSetIndex === undefined) return;

      const newTable = table
        .map((set, idx) => (idx === sourceSetIndex ? set.filter(t => t.id !== tile.id) : set))
        .filter(set => set.length > 0);
      setTable(newTable);
      setHand(prev => [...prev, tile]);
      setTilesAddedThisTurn(prev => {
        const next = new Set(prev);
        next.delete(tile.id);
        return next;
      });
      clearSelection();
      setHasMovedThisTurn(true);
      setTableError(null);
      return;
    }

    // Drop on table or set: add tile to target set
    let targetSetIndex: number;
    if (overId === DROP_TABLE) {
      targetSetIndex = table.length;
    } else if (overId.startsWith('set-')) {
      targetSetIndex = parseInt(overId.replace('set-', ''), 10);
    } else {
      return;
    }

    const newTable = table.map((set) => [...set]);

    // Remove from source
    if (source === 'hand') {
      if (!hand.find(t => t.id === tile.id)) return;
    } else if (source === 'table' && sourceSetIndex !== undefined) {
      newTable[sourceSetIndex] = newTable[sourceSetIndex].filter(t => t.id !== tile.id);
      if (newTable[sourceSetIndex].length === 0) {
        newTable.splice(sourceSetIndex, 1);
        if (targetSetIndex > sourceSetIndex) targetSetIndex--;
      }
    }

    // Add to target
    if (targetSetIndex >= newTable.length) {
      newTable.push([tile]);
    } else {
      newTable[targetSetIndex] = [...newTable[targetSetIndex], tile];
    }
    newTable[targetSetIndex] = sortSet(newTable[targetSetIndex]);

    const newHand = source === 'hand' ? hand.filter(t => t.id !== tile.id) : hand;
    setTable(newTable);
    setHand(newHand);
    setTilesAddedThisTurn(prev => new Set(prev).add(tile.id));
    clearSelection();
    if (hand.length !== newHand.length) {
      setHasMovedThisTurn(true);
    }
    else {
      setHasMovedThisTurn(false);
    }
    setTableError(null);
    if (newHand.length === 0) setGameWon(true);
  };

  const handlePlayMove = () => {
    const selectedTiles = hand.filter(t => selectedIds.includes(t.id));
    const sortedTiles = sortSet(selectedTiles);
    const newTable = [...table, sortedTiles];
    const newHand = hand.filter(t => !selectedIds.includes(t.id));

    setTable(newTable);
    setHand(newHand);
    setTilesAddedThisTurn(prev => {
      const next = new Set(prev);
      sortedTiles.forEach(t => next.add(t.id));
      return next;
    });
    clearSelection();
    setHasMovedThisTurn(true);
    setTableError(null);
    if (newHand.length === 0) setGameWon(true);
  };

  const handleRemoveTileFromTable = (tileId: string) => {
    if (!tilesAddedThisTurn.has(tileId)) return;

    const tile = table.flat().find(t => t.id === tileId);
    if (!tile) return;

    const newTable = table
      .map(set => set.filter(t => t.id !== tileId))
      .filter(set => set.length > 0);
    setTable(newTable);
    setHand(prev => [...prev, tile]);

    setTilesAddedThisTurn(prev => {
      const next = new Set(prev);
      next.delete(tileId);
      return next;
    });
  };

  const onFinishTurn = () => {
    if (!validateTable(table)) {
      setTableError('Invalid table: every set must be a valid run or group of 3+ tiles.');
      return;
    }
    setTableError(null);
    finishTurn(table, hand);
    setHasMovedThisTurn(false);
    setTilesAddedThisTurn(new Set());
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-green-900 text-white">Shuffling...</div>;
  if (error) return <div className="text-red-500 p-10">{error}</div>;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-green-900 flex flex-col items-center p-4 sm:p-8 font-sans">
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-md">Rummikub Challenge</h1>

        <div className="flex items-center justify-between w-full max-w-5xl mb-4 gap-4">
          <div className="flex-1 flex justify-center">
            <OpponentsView botTileCounts={botTileCounts} />
          </div>
          <div className="flex-shrink-0">
            <DrawPile count={deckCount} />
          </div>
        </div>

        <TableArea
          table={table}
          tilesAddedThisTurn={tilesAddedThisTurn}
          onRemoveTile={handleRemoveTileFromTable}
        />

        {tableError && (
          <p className="text-amber-300 text-sm mt-2 px-4 py-2 bg-amber-900/40 rounded-lg">
            {tableError}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-6 w-full">
          <PlayerRack
            hand={hand}
            selectedIds={selectedIds}
            onTileClick={toggleSelection}
          />

          <GameActions
            onPlay={handlePlayMove}
            onDraw={drawTile}
            onFinish={onFinishTurn}
            canPlay={selectedIds.length >= 3}
            hasMoved={hasMovedThisTurn}
          />
        </div>

        {gameWon && <WinModal isOpen={gameWon} />}
      </div>

      <DragOverlay>
        {activeTile ? (
          <div className="cursor-grabbing rotate-3 scale-110">
            <TileComponent {...activeTile} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default App;