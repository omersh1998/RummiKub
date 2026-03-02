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
  hasPlayerMadeInitialPlay: false,
  hasBotMadeInitialPlay: [false, false, false] as boolean[],
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
    const comb = (start: number, depth: number): Tile[] | null => {
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

const sumTiles = (tiles: Tile[]) => tiles.reduce((s, t) => s + t.value, 0);

/** Find a tile from hand that can extend an existing run or group on the table */
const findTileToAddToTable = (hand: Tile[], table: Tile[][]): { tile: Tile; setIndex: number } | null => {
  for (let si = 0; si < table.length; si++) {
    const set = table[si]!;
    const sorted = [...set].sort((a, b) => a.value - b.value);

    const isRun = sorted.length >= 2 && sorted.every((t, i) =>
      i === 0 || (t.color === sorted[0]!.color && t.value === sorted[i - 1]!.value + 1)
    );
    const isGroup = sorted.length >= 2 && sorted.every(t => t.value === sorted[0]!.value) &&
      new Set(sorted.map(t => t.color)).size === sorted.length;

    if (isRun) {
      const minVal = sorted[0]!.value;
      const maxVal = sorted[sorted.length - 1]!.value;
      const color = sorted[0]!.color;
      for (const t of hand) {
        if (t.color === color && (t.value === minVal - 1 || t.value === maxVal + 1))
          return { tile: t, setIndex: si };
      }
    }
    if (isGroup && sorted.length < 4) {
      const val = sorted[0]!.value;
      const usedColors = new Set(sorted.map(t => t.color));
      for (const t of hand) {
        if (t.value === val && !usedColors.has(t.color))
          return { tile: t, setIndex: si };
      }
    }
  }
  return null;
};

/** Collect all valid sets of size 3 or 4 from hand */
const findAllValidSets = (hand: Tile[]): Tile[][] => {
  const results: Tile[][] = [];
  for (let size = 3; size <= 4; size++) {
    const indices: number[] = [];
    const comb = (start: number, depth: number) => {
      if (depth === size) {
        const subset = indices.map(i => hand[i]!);
        if (checkValidSet(subset)) results.push([...subset]);
        return;
      }
      for (let i = start; i < hand.length; i++) {
        indices.push(i);
        comb(i + 1, depth + 1);
        indices.pop();
      }
    };
    comb(0, 0);
  }
  return results;
};

const tilesOverlap = (a: Tile[], b: Tile[]) => a.some(t => b.some(t2 => t2.id === t.id));

/** Find valid sets from hand that together total at least minPoints (for initial play only). */
const findInitialPlay = (hand: Tile[], minPoints: number): Tile[][] | null => {
  const allSets = findAllValidSets(hand);
  // Single set of 3 or 4 tiles totaling >= minPoints (e.g. 10+11+12 = 33)
  for (const set of allSets) {
    const total = sumTiles(set);
    if (total >= minPoints) return [[...set].sort((a, b) => a.value - b.value)];
  }
  // Two disjoint sets totaling >= minPoints
  for (let i = 0; i < allSets.length; i++) {
    const si = allSets[i]!;
    for (let j = i + 1; j < allSets.length; j++) {
      const sj = allSets[j]!;
      if (tilesOverlap(si, sj)) continue;
      const total = sumTiles(si) + sumTiles(sj);
      if (total >= minPoints) {
        return [
          [...si].sort((a, b) => a.value - b.value),
          [...sj].sort((a, b) => a.value - b.value),
        ];
      }
    }
  }
  // Three disjoint sets totaling >= minPoints
  for (let i = 0; i < allSets.length; i++) {
    const si = allSets[i]!;
    for (let j = i + 1; j < allSets.length; j++) {
      const sj = allSets[j]!;
      for (let k = j + 1; k < allSets.length; k++) {
        const sk = allSets[k]!;
        if (tilesOverlap(si, sj) || tilesOverlap(si, sk) || tilesOverlap(sj, sk)) continue;
        const total = sumTiles(si) + sumTiles(sj) + sumTiles(sk);
        if (total >= minPoints) return [si, sj, sk].map(x => [...x].sort((a, b) => a.value - b.value));
      }
    }
  }
  return null;
}

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
  gameState.hasPlayerMadeInitialPlay = false;
  gameState.hasBotMadeInitialPlay = [false, false, false];

  res.json({
    playerHand: gameState.playerHand,
    deckCount: gameState.deck.length,
    botTileCounts: gameState.botHands.map(h => h.length),
  });
});

/** Determine winner when deck is empty: fewest tiles wins, tiebreaker = lowest sum of tile values */
const determineWinner = (): { winner: 'player' | 'bot0' | 'bot1' | 'bot2'; scores: { player: number; bots: number[] } } => {
  const players: { id: 'player' | 'bot0' | 'bot1' | 'bot2'; count: number; sum: number }[] = [
    { id: 'player', count: gameState.playerHand.length, sum: sumTiles(gameState.playerHand) },
    { id: 'bot0', count: gameState.botHands[0]!.length, sum: sumTiles(gameState.botHands[0]!) },
    { id: 'bot1', count: gameState.botHands[1]!.length, sum: sumTiles(gameState.botHands[1]!) },
    { id: 'bot2', count: gameState.botHands[2]!.length, sum: sumTiles(gameState.botHands[2]!) },
  ];
  players.sort((a, b) => a.count !== b.count ? a.count - b.count : a.sum - b.sum);
  return {
    winner: players[0]!.id,
    scores: {
      player: gameState.playerHand.length,
      bots: gameState.botHands.map(h => h.length),
    },
  };
};

app.post('/api/game/draw', (req, res) => {
  if (gameState.deck.length > 0) {
    const tile = gameState.deck.pop() as Tile;
    gameState.playerHand.push(tile);
    res.json({ tile, deckCount: gameState.deck.length });
  } else {
    gameState.active = false;
    const { winner, scores } = determineWinner();
    res.json({
      gameOver: true,
      winner,
      scores,
      message: winner === 'player' ? 'ניצחת! (הקופה ריקה, הכי פחות אבנים)' : 'בוט ניצח! (הקופה ריקה)',
    });
  }
});

const INITIAL_PLAY_MIN_POINTS = 30;

app.post('/api/game/finish-turn', (req, res) => {
  const { table: playerTable, hand, tilesPlayedThisTurn = [] } = req.body;

  if (!Array.isArray(tilesPlayedThisTurn) || tilesPlayedThisTurn.length === 0) {
    // Player drew or passed - no validation needed
  } else if (!gameState.hasPlayerMadeInitialPlay) {
    const total = tilesPlayedThisTurn.reduce((s: number, t: { value?: number }) => s + (t?.value ?? 0), 0);
    if (total < INITIAL_PLAY_MIN_POINTS) {
      return res.status(400).json({
        error: 'המשחק הראשון חייב להסתכם ב־30 נקודות לפחות (למשל 5+5+5 ו־6+6+6 = 33)',
        code: 'INITIAL_PLAY_TOO_LOW',
      });
    }
    gameState.hasPlayerMadeInitialPlay = true;
  }

  gameState.table = playerTable;
  gameState.playerHand = hand;

  for (let i = 0; i < gameState.botHands.length; i++) {
    let botHand = gameState.botHands[i]!;
    let played = false;

    if (!gameState.hasBotMadeInitialPlay[i]) {
      const sets = findInitialPlay(botHand, INITIAL_PLAY_MIN_POINTS);
      if (sets) {
        gameState.table = [...gameState.table, ...sets];
        for (const set of sets) {
          botHand = botHand.filter(t => !set.some(s => s.id === t.id));
        }
        gameState.botHands[i] = botHand;
        gameState.hasBotMadeInitialPlay[i] = true;
        played = true;
      }
      // First turn: only allow initial play (30+). No adding to table or playing other sets.
    } else {
      // Already made initial play: can extend table sets or play new sets
      // 1. Add tiles to existing sets as long as possible
      while (true) {
        const addToTable = findTileToAddToTable(botHand, gameState.table);
        if (!addToTable) break;
        const { tile, setIndex } = addToTable;
        const newSet = [...gameState.table[setIndex]!, tile].sort((a, b) => a.value - b.value);
        gameState.table = gameState.table.map((s, idx) => idx === setIndex ? newSet : s);
        botHand = botHand.filter(t => t.id !== tile.id);
        played = true;
      }
      gameState.botHands[i] = botHand;

      if (!played) {
        const set = findValidSet(botHand);
        if (set) {
          gameState.table = [...gameState.table, [...set].sort((a, b) => a.value - b.value)];
          gameState.botHands[i] = botHand.filter(t => !set.some(s => s.id === t.id));
          played = true;
        }
      }
    }

    if (!played && gameState.deck.length > 0) {
      gameState.botHands[i] = [...botHand, gameState.deck.pop()!];
    }
  }

  if (gameState.deck.length === 0) {
    gameState.active = false;
    const { winner, scores } = determineWinner();
    return res.json({
      updatedTable: gameState.table,
      deckCount: 0,
      botTileCounts: gameState.botHands.map(h => h.length),
      gameOver: true,
      winner,
      scores,
      message: winner === 'player' ? 'ניצחת! (הקופה ריקה, הכי פחות אבנים)' : 'בוט ניצח! (הקופה ריקה)',
    });
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