export type Color = 'red' | 'blue' | 'black' | 'yellow';
export type Tile = { id: string; value: number; color: Color };

/** Sorts tiles by value (small to big) for display and validation. */
export const sortSet = (tiles: Tile[]): Tile[] =>
  [...tiles].sort((a, b) => a.value - b.value);

export const checkValidSet = (tiles: Tile[]): boolean => {
  if (tiles.length < 3) return false;

  const sorted = [...tiles].sort((a, b) => a.value - b.value);

  // Check for a Run (1-2-3 same color)
  const isRun = sorted.every((t, i) =>
    i === 0 || (t.color === sorted[0].color && t.value === sorted[i - 1].value + 1)
  );

  // Check for a Group (7-7-7 different colors)
  const uniqueColors = new Set(tiles.map(t => t.color));
  const isGroup = tiles.every(t => t.value === tiles[0].value) &&
    uniqueColors.size === tiles.length &&
    tiles.length <= 4;

  return isRun || isGroup;
};

export const validateTable = (table: Tile[][]): boolean => {
  // 1. Every group on the table must be valid
  return table.every(set => {
    if (set.length < 3) return false;

    const sorted = [...set].sort((a, b) => a.value - b.value);

    // Check for a Run (e.g., 1-2-3-4 same color)
    const isRun = sorted.every((t, i) =>
      i === 0 || (t.color === sorted[0].color && t.value === sorted[i - 1].value + 1)
    );

    // Check for a Group (e.g., 4-4-4 different colors)
    const uniqueColors = new Set(set.map(t => t.color));
    const isGroup = set.every(t => t.value === set[0].value) &&
      uniqueColors.size === set.length &&
      set.length <= 4;

    return isRun || isGroup;
  });
};