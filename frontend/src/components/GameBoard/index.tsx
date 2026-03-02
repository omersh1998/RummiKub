// src/components/GameBoard/index.tsx
import { TileComponent } from '../TileComponent';
import { useTileSelection } from '../TileComponent/hooks';

export const GameBoard = () => {
  const { selectedIds, toggleSelection } = useTileSelection();
  // Assume 'hand' comes from your game state hook
  const hand = [
    { id: '1', value: 7, color: 'red' as const },
    { id: '2', value: 8, color: 'red' as const },
    { id: '3', value: 9, color: 'red' as const },
  ];

  return (
    <div className="min-h-screen bg-green-800 p-8 flex flex-col items-center">
      <div className="flex-1 w-full flex justify-center items-center">
        {/* Table Area for played sets would go here */}
        <p className="text-white/50 italic">The bots are waiting for your move...</p>
      </div>

      {/* Player Rack */}
      <div className="bg-orange-900/40 p-6 rounded-xl border-t-4 border-orange-950 flex gap-3">
        {hand.map((tile) => (
          <TileComponent
            key={tile.id}
            {...tile}
            isSelected={selectedIds.includes(tile.id)}
            onClick={toggleSelection}
          />
        ))}
      </div>

      {/* Submit Action */}
      {selectedIds.length >= 3 && (
        <button className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full transition-bounce">
          Play Selected Set
        </button>
      )}
    </div>
  );
};