// src/app/diep/engine/subsystems/sectors/sectors.room-director.ts
import { Injectable } from '@angular/core';
import { 
  SectorRoom, 
  SectorDirection, 
  ALL_SECTOR_DIRECTIONS, 
  FactionColor, 
  SectorDoor 
} from './sectors.interfaces';

@Injectable({ providedIn: 'root' })
export class SectorsRoomDirector {
  private roomsMap: Map<string, SectorRoom> = new Map();
  public currentGridX = 0;
  public currentGridY = 0;

  public get rooms(): Map<string, SectorRoom> {
    return this.roomsMap;
  }

  public get currentRoom(): SectorRoom {
    return this.getOrCreateRoom(this.currentGridX, this.currentGridY);
  }

  public reset(): void {
    this.roomsMap.clear();
    this.currentGridX = 0;
    this.currentGridY = 0;
    this.getOrCreateRoom(0, 0);
  }

  public getOrCreateRoom(gx: number, gy: number): SectorRoom {
    const key = `${gx},${gy}`;
    if (this.roomsMap.has(key)) {
      return this.roomsMap.get(key)!;
    }

    const isStartRoom = gx === 0 && gy === 0;
    const faction: FactionColor = isStartRoom ? 'blue' : this.getRandomFaction();

    const room: SectorRoom = {
      gridX: gx,
      gridY: gy,
      faction,
      isCleared: isStartRoom,
      doors: new Map(),
      discovered: true
    };

    this.roomsMap.set(key, room);
    this.generateDoorsForRoom(room);
    return room;
  }

  private getRandomFaction(): FactionColor {
    const factions: FactionColor[] = ['orange', 'yellow', 'green', 'red', 'purple'];
    return factions[Math.floor(Math.random() * factions.length)];
  }

  private generateDoorsForRoom(room: SectorRoom): void {
    const gx = room.gridX;
    const gy = room.gridY;

    ALL_SECTOR_DIRECTIONS.forEach(dir => {
      const oppDir = this.getOppositeDirection(dir);
      const [nx, ny] = this.getNeighborCoords(gx, gy, dir);
      const neighborKey = `${nx},${ny}`;

      if (this.roomsMap.has(neighborKey)) {
        const neighbor = this.roomsMap.get(neighborKey)!;
        if (neighbor.doors.has(oppDir)) {
          this.addDoor(room, dir);
        }
      }
    });

    const distanceFromOrigin = Math.abs(gx) + Math.abs(gy);
    const minDoors = distanceFromOrigin <= 3 ? 2 : 1;
    const randomCount = Math.floor(Math.random() * 4) + 1;
    const desiredDoorCount = Math.max(minDoors, randomCount);

    const shuffledDirs = [...ALL_SECTOR_DIRECTIONS].sort(() => Math.random() - 0.5);

    for (const dir of shuffledDirs) {
      if (room.doors.size >= desiredDoorCount) break;
      if (!room.doors.has(dir)) {
        this.addDoor(room, dir);
      }
    }
  }

  private addDoor(room: SectorRoom, dir: SectorDirection): void {
    let width = 80;
    let height = 24;
    let x = 400;
    let y = 300;
    const margin = 20;

    switch (dir) {
      case 'N':  x = 400; y = margin; width = 80; height = 24; break;
      case 'S':  x = 400; y = 600 - margin; width = 80; height = 24; break;
      case 'W':  x = margin; y = 300; width = 24; height = 80; break;
      case 'E':  x = 800 - margin; y = 300; width = 24; height = 80; break;
      case 'NW': x = 32; y = 32; width = 44; height = 44; break;
      case 'NE': x = 800 - 32; y = 32; width = 44; height = 44; break;
      case 'SW': x = 32; y = 600 - 32; width = 44; height = 44; break;
      case 'SE': x = 800 - 32; y = 600 - 32; width = 44; height = 44; break;
    }

    const door: SectorDoor = {
      direction: dir,
      isOpen: true,
      x,
      y,
      width,
      height
    };

    room.doors.set(dir, door);
  }

  public getOppositeDirection(dir: SectorDirection): SectorDirection {
    const opps: Record<SectorDirection, SectorDirection> = {
      N: 'S', NE: 'SW', E: 'W', SE: 'NW',
      S: 'N', SW: 'NE', W: 'E', NW: 'SE'
    };
    return opps[dir];
  }

  public getNeighborCoords(gx: number, gy: number, dir: SectorDirection): [number, number] {
    switch (dir) {
      case 'N':  return [gx, gy - 1];
      case 'NE': return [gx + 1, gy - 1];
      case 'E':  return [gx + 1, gy];
      case 'SE': return [gx + 1, gy + 1];
      case 'S':  return [gx, gy + 1];
      case 'SW': return [gx - 1, gy + 1];
      case 'W':  return [gx - 1, gy];
      case 'NW': return [gx - 1, gy - 1];
    }
  }
}