// src/components/TileComponent/index.tsx
import React from 'react';
import Icon from '@mdi/react';
import { mdiCircle } from '@mdi/js';
import { TileProps, Color } from './types';

const colorMap: Record<Color, string> = {
  red: 'text-red-600',
  blue: 'text-blue-600',
  black: 'text-gray-900',
  yellow: 'text-yellow-500',
};

export const TileComponent: React.FC<TileProps> = ({
  id,
  value,
  color,
  isSelected,
  isHighlighted,
  onClick,
  onContextMenu,
}) => {
  return (
    <div
      onClick={() => onClick?.(id)}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(id);
        }
      }}
      title={isHighlighted && onContextMenu ? 'לחיצה ימנית להחזרה ליד' : undefined}
      className={`
        relative flex flex-col items-center justify-center
        w-12 h-16 sm:w-14 sm:h-20
        bg-[#fdf6e3] rounded-lg cursor-pointer
        shadow-[2px_2px_0px_rgba(0,0,0,0.1)]
        transition-all duration-75 select-none
        border-2
        ${isSelected
          ? 'border-pink-500 -translate-y-2 shadow-lg'
          : isHighlighted
            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg'
            : 'border-transparent hover:border-gray-300'
        }
      `}
    >
      {/* The Number */}
      <span className={`text-2xl sm:text-3xl font-bold ${colorMap[color]}`}>
        {value}
      </span>

      {/* The little Rummikub dot */}
      <div className={`mt-1 opacity-40 ${colorMap[color]}`}>
        <Icon path={mdiCircle} size={0.4} />
      </div>

      {/* Subtle shine effect for a "plastic" feel */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-white opacity-30 rounded-full blur-[1px]" />
    </div>
  );
};