// src/app/diep/engine/subsystems/sectors/sectors.interfaces.ts

export type SectorDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export const ALL_SECTOR_DIRECTIONS: SectorDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export type FactionColor = 'safe' | 'orange' | 'yellow' | 'green' | 'red' | 'blue' | 'purple';

export const FACTION_COLOR_HEX: Record<FactionColor, string> = {
  safe: '#2ecc71',
  orange: '#e67e22',
  yellow: '#f1c40f',
  green: '#27ae60',
  red: '#e74c3c',
  blue: '#3498db',
  purple: '#9b59b6'
};

export interface SectorDoor {
  direction: SectorDirection;
  isOpen: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SectorRoom {
  gridX: number; // Matrix column
  gridY: number; // Matrix row
  faction: FactionColor;
  isCleared: boolean;
  doors: Map<SectorDirection, SectorDoor>;
  discovered: boolean;
}