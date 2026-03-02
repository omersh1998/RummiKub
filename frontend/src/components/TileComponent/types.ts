export type Color = 'red' | 'blue' | 'black' | 'yellow';

export interface TileProps {
  id: string;
  value: number;
  color: Color;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: (id: string) => void;
  onContextMenu?: (id: string) => void;
}