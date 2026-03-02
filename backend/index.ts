import express from 'express';
import cors from 'cors';
import type { Color, Tile } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- In-Memory State ---
const gameState = {
  active: false,
  deck: [] as Tile[],
  playerHand: [] as Tile[],
  botHands: [[], [], []] as Tile[][],
  table: [] as Tile[][],
};

// --- Game Logic ---
const checkValidSet = (tiles: Tile[]): boolean => {
  if (tiles.length < 3) return false;

  const sorted = [...tiles].sort((a, b) => a.value - b.value);
  const isRun = sorted.every((t, i) =>
    i === 0 || (t.color === sorted[0]!.color && t.value === sorted[i - 1]!.value + 1)
  );
  const uniqueColors = new Set(tiles.map(t => t.color));
  const isGroup = tiles.every(t => t.value === tiles[0]!.value) &&
    uniqueColors.size === tiles.length &&
    tiles.length <= 4;

  return isRun || isGroup;
};

const findValidSet = (hand: Tile[]): Tile[] | null => {
  for (let size = 3; size <= 4; size++) {
    const indices: number[] = [];
    const comb = (start: number, depth: number): Tile[] | null  => {
      if (depth === size) {
        const subset = indices.map(i => hand[i]!);
        if (checkValidSet(subset)) return subset;
        return null;
      }
      for (let i = start; i < hand.length; i++) {
        indices.push(i);
        const r = comb(i + 1, depth + 1);
        if (r) return r;
        indices.pop();
      }
      return null;
    };
    const found = comb(0, 0);
    if (found) return found;
  }
  return null;
};

// --- Helpers ---
const createDeck = () => {
  const colors = ['red', 'blue', 'black', 'yellow'] as Color[];
  const deck = [];
  for (const color of colors) {
    for (let i = 1; i <= 13; i++) {
      deck.push({ id: `${color}-${i}-a-${Math.random()}`, value: i, color });
      deck.push({ id: `${color}-${i}-b-${Math.random()}`, value: i, color });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

// --- Routes ---
app.get('/api/game/status', (req, res) => {
  if (gameState.active) {
    res.json({
      active: true,
      playerHand: gameState.playerHand,
      table: gameState.table,
      deckCount: gameState.deck.length,
      botTileCounts: gameState.botHands.map(h => h.length),
    });
  } else {
    res.json({ active: false });
  }
});

app.post('/api/game/start', (req, res) => {
  const fullDeck = createDeck();

  gameState.active = true;
  gameState.playerHand = fullDeck.splice(0, 14);
  gameState.botHands = [fullDeck.splice(0, 14), fullDeck.splice(0, 14), fullDeck.splice(0, 14)];
  gameState.deck = fullDeck;
  gameState.table = [];

  res.json({
    playerHand: gameState.playerHand,
    deckCount: gameState.deck.length,
    botTileCounts: gameState.botHands.map(h => h.length),
  });
});

app.post('/api/game/draw', (req, res) => {
  if (gameState.deck.length > 0) {
    const tile = gameState.deck.pop() as Tile;
    gameState.playerHand.push(tile);
    res.json({ tile, deckCount: gameState.deck.length });
  } else {
    res.status(400).json({ error: "Deck empty" });
  }
});

app.post('/api/game/finish-turn', (req, res) => {
  const { table: playerTable, hand } = req.body;

  gameState.table = playerTable;
  gameState.playerHand = hand;

  for (let i = 0; i < gameState.botHands.length; i++) {
    const botHand = gameState.botHands[i]!;
    const set = findValidSet(botHand);
    if (set) {
      gameState.table = [...gameState.table, set.sort((a, b) => a.value - b.value)];
      gameState.botHands[i] = botHand.filter(t => !set.some(s => s.id === t.id));
    } else if (gameState.deck.length > 0) {
      gameState.botHands[i] = [...botHand, gameState.deck.pop()!];
    }
  }

  res.json({
    updatedTable: gameState.table,
    deckCount: gameState.deck.length,
    botTileCounts: gameState.botHands.map(h => h.length),
  });
});

app.post('/api/game/bot-turn', (req, res) => {
  // "Not that good" AI: 
  // Each bot just draws a tile and does nothing else
  gameState.botHands = gameState.botHands.map(hand => {
    if (gameState.deck.length > 0) {
      const drawn = gameState.deck.pop();
      return [...hand, drawn];
    }
    return hand;
  }) as Tile[][];

  res.json({ message: "Bots have drawn tiles." });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`listening http://localhost:${PORT}`));