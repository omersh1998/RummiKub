import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// --- In-Memory State ---
let gameState = {
  deck: [] as any[],
  botHands: [[], [], []] as any[][],
  table: [] as any[][],
};

// --- Helpers ---
const createDeck = () => {
  const colors = ['red', 'blue', 'black', 'yellow'];
  const deck = [];
  for (const color of colors) {
    for (let i = 1; i <= 13; i++) {
      deck.push({ id: `${color}-${i}-a`, value: i, color });
      deck.push({ id: `${color}-${i}-b`, value: i, color });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

// --- Routes ---
app.post('/api/game/start', (req, res) => {
  const deck = createDeck();

  const playerHand = deck.splice(0, 14);
  gameState.botHands = [
    deck.splice(0, 14),
    deck.splice(0, 14),
    deck.splice(0, 14)
  ];
  gameState.deck = deck;
  gameState.table = [];

  res.json({ playerHand });
});

app.post('/api/game/draw', (req, res) => {
  if (gameState.deck.length > 0) {
    const tile = gameState.deck.pop();
    res.json({ tile });
  } else {
    res.status(400).json({ error: "Deck empty" });
  }
});

app.post('/api/game/finish-turn', (req, res) => {
  const { table: playerTable } = req.body;

  // Update server's table state
  gameState.table = playerTable;

  // Simple "Bad AI" turn: Each bot just draws 1 tile and does nothing
  gameState.botHands.forEach((hand, index) => {
    if (gameState.deck.length > 0) {
      gameState.botHands[index]!.push(gameState.deck.pop()!);
    }
  });

  // Return the table back (in case bots played, though here they don't)
  res.json({ updatedTable: gameState.table });
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
  });

  res.json({ message: "Bots have drawn tiles." });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`listening http://localhost:${PORT}`));