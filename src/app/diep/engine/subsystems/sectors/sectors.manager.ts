// src/app/diep/engine/subsystems/sectors/sectors.manager.ts
import { Injectable } from '@angular/core';
import { GameSystem } from '../../../core/diep.interfaces';
import { SectorsRoomDirector } from './sectors.room-director';
import { SectorDirection } from './sectors.interfaces';

@Injectable({ providedIn: 'root' })
export class SectorsManagerService implements GameSystem {
  public showDebugMap = false;
  private transitionCooldown = 0; // Prevent instant bounce loops

  constructor(public roomDirector: SectorsRoomDirector) {}

  public init(width: number, height: number): void {
    this.roomDirector.reset();
    this.transitionCooldown = 0;
  }

  public update(engine: any, tick: number, ms: number): void {
    if (engine.currentMode !== 'SECTORS' || !engine.isGameStarted) return;

    if (this.transitionCooldown > 0) {
      this.transitionCooldown -= ms;
    }

    const player = engine.playerService?.player;
    if (!player) return;

    if (this.transitionCooldown <= 0) {
      this.checkDoorTransitions(player, engine.width, engine.height);
    }
  }

  private checkDoorTransitions(player: any, width: number, height: number): void {
    const room = this.roomDirector.currentRoom;

    room.doors.forEach((door) => {
      if (!door.isOpen) return;

      const dist = Math.hypot(player.x - door.x, player.y - door.y);
      if (dist < 35) { // Touch radius
        this.transitionToRoom(player, door.direction, width, height);
      }
    });
  }

  private transitionToRoom(player: any, dir: SectorDirection, width: number, height: number): void {
    const [nx, ny] = this.roomDirector.getNeighborCoords(
      this.roomDirector.currentGridX, 
      this.roomDirector.currentGridY, 
      dir
    );

    this.roomDirector.currentGridX = nx;
    this.roomDirector.currentGridY = ny;

    // Set cooldown (500ms) to prevent re-triggering upon spawning in the new room
    this.transitionCooldown = 500;

    // Reposition player at the entrance of the opposite door
    const oppDir = this.roomDirector.getOppositeDirection(dir);
    this.repositionPlayerAtDoor(player, oppDir, width, height);

    console.log(`[SECTORS] Entered Room (${nx}, ${ny}) - Faction: ${this.roomDirector.currentRoom.faction}`);
  }

  private repositionPlayerAtDoor(player: any, entryDoorDir: SectorDirection, width: number, height: number): void {
    const margin = 80; // Pushes player safe distance away from door trigger
    switch (entryDoorDir) {
      case 'N':  player.x = width / 2; player.y = margin; break;
      case 'NE': player.x = width - margin; player.y = margin; break;
      case 'E':  player.x = width - margin; player.y = height / 2; break;
      case 'SE': player.x = width - margin; player.y = height - margin; break;
      case 'S':  player.x = width / 2; player.y = height - margin; break;
      case 'SW': player.x = margin; player.y = height - margin; break;
      case 'W':  player.x = margin; player.y = height / 2; break;
      case 'NW': player.x = margin; player.y = margin; break;
    }
  }
}