import { useState, useEffect } from 'react';
import { Tile } from '../utils/engine';

export type GameOverResult = {
  winner: 'player' | 'bot0' | 'bot1' | 'bot2';
  scores: { player: number; bots: number[] };
  message: string;
};

export const useGame = () => {
  const [hand, setHand] = useState<Tile[]>([]);
  const [table, setTable] = useState<Tile[][]>([]);
  const [deckCount, setDeckCount] = useState(0);
  const [botTileCounts, setBotTileCounts] = useState<number[]>([0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<GameOverResult | null>(null);

  const API_URL = 'http://localhost:3001/api/game';

  const startGame = async () => {
    setLoading(true);
    try {
      const statusRes = await fetch(`${API_URL}/status`);
      const statusData = await statusRes.json();

      if (statusData.active) {
        setHand(statusData.playerHand);
        setTable(statusData.table);
        setDeckCount(statusData.deckCount ?? 0);
        setBotTileCounts(statusData.botTileCounts ?? [0, 0, 0]);
      } else {
        const startRes = await fetch(`${API_URL}/start`, { method: 'POST' });
        const startData = await startRes.json();
        setHand(startData.playerHand);
        setTable([]);
        setDeckCount(startData.deckCount ?? 50);
        setBotTileCounts(startData.botTileCounts ?? [14, 14, 14]);
      }
      setGameOver(null);
    } catch (err) {
      console.error("Connection error", err);
      setError('שגיאת חיבור');
    } finally {
      setLoading(false);
    }
  };

  const startNewGame = async () => {
    setLoading(true);
    try {
      const startRes = await fetch(`${API_URL}/start`, { method: 'POST' });
      const startData = await startRes.json();
      setHand(startData.playerHand);
      setTable([]);
      setDeckCount(startData.deckCount ?? 50);
      setBotTileCounts(startData.botTileCounts ?? [14, 14, 14]);
      setGameOver(null);
    } catch (err) {
      console.error("Connection error", err);
      setError('שגיאת חיבור');
    } finally {
      setLoading(false);
    }
  };

  // 2. Draw a Tile
  const drawTile = async (): Promise<{ updatedTable?: Tile[][]; hand?: Tile[]; gameOver?: GameOverResult }> => {
    let data: any;
    try {
      const res = await fetch(`${API_URL}/draw`, { method: 'POST' });
      data = await res.json();
      if (data.gameOver) {
        setGameOver(data);
        return { gameOver: data };
      }
      const newHand = data?.tile ? [...hand, data.tile] : hand;
      const result = await finishTurn(table, newHand, []);
      setHand(prev => (data?.tile ? [...prev, data.tile] : prev));
      return { ...result, hand: data?.tile ? newHand : undefined };
    } catch (err) {
      console.error("Error drawing tile:", err);
      return {};
    }
  };

  // 3. Finish Turn (Syncs Table and triggers AI)
  const finishTurn = async (
    currentTable: Tile[][],
    hand: Tile[],
    tilesPlayedThisTurn: Tile[] = []
  ): Promise<{ error?: string; updatedTable?: Tile[][]; gameOver?: GameOverResult }> => {
    try {
      const res = await fetch(`${API_URL}/finish-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: currentTable || table,
          hand,
          tilesPlayedThisTurn: tilesPlayedThisTurn.map(t => ({ id: t.id, value: t.value, color: t.color })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error ?? 'לא הצלחת לסיים תור' };
      }
      setTable(data.updatedTable);
      if (data.deckCount != null) setDeckCount(data.deckCount);
      if (data.botTileCounts) setBotTileCounts(data.botTileCounts);
      if (data.gameOver) setGameOver(data);
      return { updatedTable: data.updatedTable, gameOver: data.gameOver };
    } catch (err) {
      console.error("Error finishing turn:", err);
      return { error: 'שגיאת חיבור' };
    }
  };

  useEffect(() => {
    startGame();
  }, []);

  return { hand, setHand, table, setTable, deckCount, botTileCounts, loading, error, gameOver, drawTile, finishTurn, startGame, startNewGame };
};