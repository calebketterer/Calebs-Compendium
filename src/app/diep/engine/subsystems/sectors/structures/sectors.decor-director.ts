import { Injectable } from '@angular/core';
import { FactionColor, FACTION_COLOR_HEX, SectorRoom, SectorDoor } from '../sectors.interfaces';

@Injectable({ providedIn: 'root' })
export class SectorsDecorDirector {

  /**
   * Renders wall structures, door thresholds, and room portals
   */
  public drawRoomStructures(
    ctx: CanvasRenderingContext2D,
    room: SectorRoom,
    roomsMap: Map<string, SectorRoom>,
    getNeighborCoordsFn: (gx: number, gy: number, dir: any) => [number, number]
  ): void {
    if (!room?.doors) return;

    const doorList: SectorDoor[] = room.doors instanceof Map 
      ? Array.from(room.doors.values()) 
      : (Array.isArray(room.doors) ? room.doors : []);

    const pulse = (Math.sin(performance.now() / 400) + 1) / 2;

    doorList.forEach((door) => {
      if (!door.isOpen) return;

      const [nx, ny] = getNeighborCoordsFn(room.gridX, room.gridY, door.direction);
      const neighborKey = `${nx},${ny}`;
      const neighborRoom = roomsMap?.get ? roomsMap.get(neighborKey) : null;

      let accentHex = '#4b5563'; 
      if (neighborRoom) {
        const nFaction = neighborRoom.faction as FactionColor;
        accentHex = FACTION_COLOR_HEX[nFaction] || FACTION_COLOR_HEX.blue;
      }

      const halfW = door.width / 2;
      const halfH = door.height / 2;

      ctx.save();

      // 1. Threshold floor cutout (Matches exact #1a1a1a background)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(door.x - halfW, door.y - halfH, door.width, door.height);

      // 2. Animated Faction Pulse Glow Line
      ctx.shadowColor = accentHex;
      ctx.shadowBlur = 8 + pulse * 6;
      ctx.strokeStyle = accentHex;
      ctx.globalAlpha = 0.4 + pulse * 0.4;
      ctx.lineWidth = 2;
      ctx.strokeRect(door.x - halfW + 2, door.y - halfH + 2, door.width - 4, door.height - 4);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;

      // 3. Beveled Side Jambs / Frame (#2a2d32)
      ctx.fillStyle = '#2a2d32';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;

      const frameThickness = 6;
      if (door.direction === 'N' || door.direction === 'S') {
        ctx.fillRect(door.x - halfW - frameThickness, door.y - halfH, frameThickness, door.height);
        ctx.strokeRect(door.x - halfW - frameThickness, door.y - halfH, frameThickness, door.height);
        ctx.fillRect(door.x + halfW, door.y - halfH, frameThickness, door.height);
        ctx.strokeRect(door.x + halfW, door.y - halfH, frameThickness, door.height);
      } else if (door.direction === 'E' || door.direction === 'W') {
        ctx.fillRect(door.x - halfW, door.y - halfH - frameThickness, door.width, frameThickness);
        ctx.strokeRect(door.x - halfW, door.y - halfH - frameThickness, door.width, frameThickness);
        ctx.fillRect(door.x - halfW, door.y + halfH, door.width, frameThickness);
        ctx.strokeRect(door.x - halfW, door.y + halfH, door.width, frameThickness);
      }

      // 4. Direction Indicator
      ctx.fillStyle = accentHex;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.75;
      ctx.fillText(door.direction, door.x, door.y);

      ctx.restore();
    });
  }
}