import { useState, useEffect } from 'react';
import { Tile } from '../utils/engine';

export const useGame = () => {
  const [hand, setHand] = useState<Tile[]>([]);
  const [table, setTable] = useState<Tile[][]>([]);
  const [deckCount, setDeckCount] = useState(0);
  const [botTileCounts, setBotTileCounts] = useState<number[]>([0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://localhost:3001/api/game';

  const startGame = async () => {
    setLoading(true);
    try {
      // First, check if a game exists
      const statusRes = await fetch(`${API_URL}/status`);
      const statusData = await statusRes.json();

      if (statusData.active) {
        setHand(statusData.playerHand);
        setTable(statusData.table);
        setDeckCount(statusData.deckCount ?? 0);
        setBotTileCounts(statusData.botTileCounts ?? [0, 0, 0]);
      } else {
        // Start fresh
        const startRes = await fetch(`${API_URL}/start`, { method: 'POST' });
        const startData = await startRes.json();
        setHand(startData.playerHand);
        setTable([]);
        setDeckCount(startData.deckCount ?? 50);
        setBotTileCounts(startData.botTileCounts ?? [14, 14, 14]);
      }
    } catch (err) {
      console.error("Connection error", err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Draw a Tile
  const drawTile = async () => {
    let data: any;
    try {
      const res = await fetch(`${API_URL}/draw`, { method: 'POST' });
      data = await res.json();

      await finishTurn(table, [...hand, data.tile]);
    } catch (err) {
      console.error("Error drawing tile:", err);
    } finally {
      setHand(prev => data?.tile ? [...prev, data.tile] : prev);
    }
  };

  // 3. Finish Turn (Syncs Table and triggers AI)
  const finishTurn = async (currentTable: Tile[][], hand: Tile[]) => {
    try {
      const res = await fetch(`${API_URL}/finish-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: currentTable || table, hand })
      });
      const data = await res.json();
      setTable(data.updatedTable);
      if (data.deckCount != null) setDeckCount(data.deckCount);
      if (data.botTileCounts) setBotTileCounts(data.botTileCounts);
    } catch (err) {
      console.error("Error finishing turn:", err);
    }
  };

  useEffect(() => {
    startGame();
  }, []);

  return { hand, setHand, table, setTable, deckCount, botTileCounts, loading, error, drawTile, finishTurn, startGame };
};