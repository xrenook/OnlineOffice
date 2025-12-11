import { MAP_WIDTH, MAP_HEIGHT } from './constants';

export const verticalZones = [
  { x: 80, w: 50 },  // Leftmost
  { x: 300, w: 50 }, // Between Col 1-2
  { x: 512, w: 50 }, // Middle
  { x: 730, w: 50 }, // Between Col 3-4
  { x: 940, w: 50 }, // Rightmost
];

export const horizontalZones = [
  { y: 150, h: 50 }, // Top
  { y: 380, h: 50 }, // Row 2
  { y: 610, h: 50 }, // Row 3
  { y: 850, h: 50 }, // Bottom
];

export const getRandomPointOnRedCarpet = (): { x: number; y: number } => {
  const pickVertical = Math.random() > 0.5;
  if (pickVertical) {
    const zone = verticalZones[Math.floor(Math.random() * verticalZones.length)];
    return {
      x: zone.x + Math.random() * zone.w,
      y: 50 + Math.random() * (MAP_HEIGHT - 100),
    };
  } else {
    const zone = horizontalZones[Math.floor(Math.random() * horizontalZones.length)];
    return {
      x: 50 + Math.random() * (MAP_WIDTH - 100),
      y: zone.y + Math.random() * zone.h,
    };
  }
};
