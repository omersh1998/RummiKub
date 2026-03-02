import React, { useState, useEffect, useRef } from 'react';
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
import { GameOverModal } from './components/GameOverModal';
import { OpponentsView } from './components/OpponentsView';
import { DrawPile } from './components/DrawPile';

const App = () => {
  const { hand, setHand, table, setTable, deckCount, botTileCounts, loading, drawTile, finishTurn, error, gameOver, startNewGame } = useGame();
  const { selectedIds, toggleSelection, clearSelection } = useTileSelection();
  const [gameWon, setGameWon] = useState(false);
  const [showWinModal, setShowWinModal] = useState(true);
  const [showGameOverModal, setShowGameOverModal] = useState(true);
  const [activeTile, setActiveTile] = useState<Tile | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tilesAddedThisTurn, setTilesAddedThisTurn] = useState<Set<string>>(new Set());
  const [tableAtTurnStart, setTableAtTurnStart] = useState<Tile[][] | null>(null);
  const [handAtTurnStart, setHandAtTurnStart] = useState<Tile[] | null>(null);
  const hasInitializedTableStart = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const tile = event.active.data.current?.tile as Tile | undefined;
    if (tile) setActiveTile(tile);
  };

  useEffect(() => {
    if (!loading && !hasInitializedTableStart.current) {
      setTableAtTurnStart(JSON.parse(JSON.stringify(table)));
      setHandAtTurnStart(JSON.parse(JSON.stringify(hand)));
      hasInitializedTableStart.current = true;
    }
  }, [loading, table, hand]);

  useEffect(() => {
    if (gameOver) setShowGameOverModal(true);
  }, [gameOver]);

  const tablesEqual = (a: Tile[][], b: Tile[][] | null) => {
    if (!b) return false;
    if (a.length !== b.length) return false;
    return a.every((set, i) => {
      const other = b[i];
      if (!other || set.length !== other.length) return false;
      return set.every((t, j) => t.id === other[j]?.id);
    });
  };

  const hasTableChanged = !tablesEqual(table, tableAtTurnStart);

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

    // Drop on rack: return tile to hand (only tiles the player added from hand this turn)
    if (overId === DROP_RACK) {
      if (source !== 'table' || sourceSetIndex === undefined) return;
      if (!tilesAddedThisTurn.has(tile.id)) return;

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
    if (source === 'hand') {
      setTilesAddedThisTurn(prev => new Set(prev).add(tile.id));
    }
    clearSelection();
    setTableError(null);
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
    setTableError(null);
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

  const onFinishTurn = async () => {
    if (!validateTable(table)) {
      setTableError('לוח לא תקין: כל סדרה חייבת להיות רצף או קבוצה של 3+ אבנים.');
      return;
    }
    const tilesPlayed = table.flat().filter(t => tilesAddedThisTurn.has(t.id));
    const result = await finishTurn(table, hand, tilesPlayed);
    if (result.error) {
      setTableError(result.error);
      return;
    }
    setTableError(null);
    setTilesAddedThisTurn(new Set());
    if (result.gameOver) return;
    if (result.updatedTable) {
      setTableAtTurnStart(result.updatedTable);
      setHandAtTurnStart([...hand]);
    }
    if (hand.length === 0) {
      setGameWon(true);
      setShowWinModal(true);
    }
  };

  const handleNewGame = async () => {
    hasInitializedTableStart.current = false;
    setGameWon(false);
    setShowWinModal(true);
    setShowGameOverModal(true);
    setTilesAddedThisTurn(new Set());
    clearSelection();
    setTableError(null);
    await startNewGame();
  };

  const onDraw = async () => {
    const result = await drawTile();
    if (result.gameOver) return;
    if (result.updatedTable) {
      setTableAtTurnStart(result.updatedTable);
      if (result.hand) setHandAtTurnStart(result.hand);
    }
  };

  const onClearChanges = () => {
    if (tableAtTurnStart) setTable(JSON.parse(JSON.stringify(tableAtTurnStart)));
    if (handAtTurnStart) setHand(JSON.parse(JSON.stringify(handAtTurnStart)));
    setTilesAddedThisTurn(new Set());
    clearSelection();
    setTableError(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-green-900 text-white">מערבבים...</div>;
  if (error) return <div className="text-red-500 p-10">{error}</div>;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-green-900 flex flex-col items-center p-4 sm:p-8 font-sans">
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-md">אתגר רומיקוב</h1>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full max-w-5xl mb-4 gap-4">
          <div />
          <div className="flex justify-center">
            <OpponentsView botTileCounts={botTileCounts} />
          </div>
          <div className="flex justify-end">
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
            onDraw={onDraw}
            onFinish={onFinishTurn}
            onClearChanges={onClearChanges}
            canPlay={selectedIds.length >= 3}
            hasTableChanged={hasTableChanged}
          />
        </div>

        {gameWon && (
          <>
            <WinModal
              isOpen={showWinModal}
              onViewBoard={() => setShowWinModal(false)}
              onNewGame={handleNewGame}
            />
            {!showWinModal && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <button
                  onClick={handleNewGame}
                  className="px-8 py-4 rounded-full font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-lg text-lg"
                >
                  משחק חדש
                </button>
              </div>
            )}
          </>
        )}
        {gameOver && (
          <>
            <GameOverModal
              result={gameOver}
              showModal={showGameOverModal}
              onViewBoard={() => setShowGameOverModal(false)}
              onNewGame={handleNewGame}
            />
            {!showGameOverModal && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <button
                  onClick={handleNewGame}
                  className="px-8 py-4 rounded-full font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-lg text-lg"
                >
                  משחק חדש
                </button>
              </div>
            )}
          </>
        )}
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