// src/app/diep/engine/subsystems/sectors/sectors.enemy-spawner.ts
import { Injectable } from '@angular/core';
import { Enemy, EnemyType } from '../../../core/diep.interfaces';
import { EnemyRegistry } from '../../../enemies/enemy.registry';
import { FactionColor, SectorRoom } from './sectors.interfaces';

/**
 * Configure spawn weights per room faction color.
 * Higher values = higher relative probability of spawning that enemy type in that room color.
 */
export const FACTION_SPAWN_WEIGHTS: Record<FactionColor, Partial<Record<EnemyType, number>>> = {
  neutral: { ROLLER: 70, CRASHER: 30 },
  orange:  { ROLLER: 40, BOMBER: 30, DETONATOR: 30 },
  yellow:  { ROLLER: 30, SNIPER: 40, BLASTER: 30 },
  green:   { ROLLER: 30, HEALER: 40, MEDIC: 30 },
  red:     { ROLLER: 20, SMASHER: 40, BLOATER: 40 },
  blue:    { ROLLER: 30, FLOATER: 40, GUNNER: 30 },
  purple:  { ROLLER: 20, CASTER: 40, HAUNTER: 40 }
};

interface RoomRespawnState {
  timer: number;
  intervalMs: number;
}

@Injectable({ providedIn: 'root' })
export class SectorsEnemySpawnerService {
  private roomRespawnStates = new Map<string, RoomRespawnState>();

  private getRandomRespawnInterval(): number {
    // Random interval between 4000ms (4s) and 6000ms (6s)
    return 4000 + Math.random() * 2000;
  }

  private getRoomState(key: string): RoomRespawnState {
    let state = this.roomRespawnStates.get(key);
    if (!state) {
      state = {
        timer: 0,
        intervalMs: this.getRandomRespawnInterval()
      };
      this.roomRespawnStates.set(key, state);
    }
    return state;
  }

  public loadOrSpawnRoomEnemies(
    engineEnemiesRef: Enemy[],
    room: SectorRoom,
    canvasWidth: number,
    canvasHeight: number
  ): Enemy[] {
    // Starting origin room (0,0) remains safe and enemy-free
    if (room.gridX === 0 && room.gridY === 0) {
      room.enemies = [];
      return [];
    }

    // If room already has saved state (or enemies that respawned while away), return them
    if (room.enemies && room.enemies.length > 0) {
      return [...room.enemies];
    }

    // If the room was cleared and has NOT repopulated yet while player was away, return empty array
    if (room.isCleared && (!room.enemies || room.enemies.length === 0)) {
      return [];
    }

    // Initial first-time room generation
    const distanceFromOrigin = Math.abs(room.gridX) + Math.abs(room.gridY);
    const initialCount = Math.min(3 + distanceFromOrigin, 10);
    const spawnedEnemies: Enemy[] = [];

    this.spawnFactionEnemiesForSector(
      spawnedEnemies,
      room.faction,
      initialCount,
      canvasWidth,
      canvasHeight
    );

    room.enemies = spawnedEnemies;
    room.isCleared = false;
    return spawnedEnemies;
  }

  public updateRespawns(
    engine: any,
    room: SectorRoom,
    deltaMs: number,
    isCurrentRoom: boolean = false
  ): void {
    // ABSOLUTE LOCKOUT: Never update timers or spawn anything in the room the player is currently occupying
    if (isCurrentRoom || (room.gridX === 0 && room.gridY === 0)) {
      return;
    }

    const roomKey = `${room.gridX},${room.gridY}`;
    const state = this.getRoomState(roomKey);

    state.timer += deltaMs;
    if (state.timer < state.intervalMs) return;

    // Reset this specific room's timer and generate next 4-6s interval
    state.timer = 0;
    state.intervalMs = this.getRandomRespawnInterval();

    const distanceFromOrigin = Math.abs(room.gridX) + Math.abs(room.gridY);
    const maxEnemiesPerRoom = Math.min(4 + distanceFromOrigin, 12);

    if (!room.enemies) {
      room.enemies = [];
    }

    if (room.enemies.length < maxEnemiesPerRoom) {
      this.spawnFactionEnemiesForSector(
        room.enemies,
        room.faction,
        1,
        engine.width,
        engine.height
      );
      // Room is repopulated, so it is no longer marked as completely cleared
      room.isCleared = false;
    }
  }

  public saveRoomState(room: SectorRoom, currentEnemies: Enemy[]): void {
    room.enemies = [...currentEnemies];
    if (currentEnemies.length === 0 && !(room.gridX === 0 && room.gridY === 0)) {
      room.isCleared = true;
    }
  }

  private spawnFactionEnemiesForSector(
    outEnemies: Enemy[],
    faction: FactionColor,
    count: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    const margin = 120;
    const spawnWidth = canvasWidth - margin * 2;
    const spawnHeight = canvasHeight - margin * 2;

    for (let i = 0; i < count; i++) {
      const selectedType = this.rollEnemyTypeForFaction(faction);
      const spawnX = margin + Math.random() * spawnWidth;
      const spawnY = margin + Math.random() * spawnHeight;

      if (selectedType === 'CRASHER') {
        const swarmSize = Math.floor(Math.random() * 3) + 2;
        for (let s = 0; s < swarmSize; s++) {
          const jitterX = (Math.random() - 0.5) * 30;
          const jitterY = (Math.random() - 0.5) * 30;
          this.finalizeEnemySpawn('CRASHER', spawnX + jitterX, spawnY + jitterY, outEnemies, canvasWidth, canvasHeight);
        }
      } else {
        this.finalizeEnemySpawn(selectedType, spawnX, spawnY, outEnemies, canvasWidth, canvasHeight);
      }
    }
  }

  private rollEnemyTypeForFaction(faction: FactionColor): EnemyType {
    const allTypes = EnemyRegistry.getRegisteredTypes();

    const factionMatchingTypes = allTypes.filter(type => {
      const meta = EnemyRegistry.getMetadata(type);
      return meta && meta.faction && meta.faction.toLowerCase() === faction.toLowerCase();
    });

    const candidateTypes = factionMatchingTypes.length > 0 ? factionMatchingTypes : allTypes;
    const weightsConfig = FACTION_SPAWN_WEIGHTS[faction] || {};

    const weightedEntries = candidateTypes.map(type => ({
      type,
      weight: weightsConfig[type] ?? 10
    }));

    const totalWeight = weightedEntries.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of weightedEntries) {
      if (roll < entry.weight) {
        return entry.type;
      }
      roll -= entry.weight;
    }

    return candidateTypes[0] || 'ROLLER';
  }

  private finalizeEnemySpawn(type: EnemyType, x: number, y: number, outEnemies: Enemy[], w: number, h: number): void {
    const enemy = EnemyRegistry.createEnemy(type, x, y);
    (enemy as any).metadata = EnemyRegistry.getMetadata(type);
    if (enemy.onSpawn) enemy.onSpawn(enemy, w, h);
    outEnemies.push(enemy as Enemy);
  }
}