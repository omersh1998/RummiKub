import { useState } from 'react';

export const useTileSelection = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((tileId) => tileId !== id)
        : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  return { selectedIds, toggleSelection, clearSelection };
};