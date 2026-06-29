// src/app/diep/engine/subsystems/market/decor/decor-runtime.manager.ts
import { Injectable } from '@angular/core';
import { MarketDecorProp } from './decor.interface';
import { REGISTERED_DECOR_BLUEPRINTS } from './index';
import { Player } from '../../../../core/diep.interfaces';
@Injectable({
  providedIn: 'root'
})
export class MarketDecorRuntimeManager {
  public activeProps: MarketDecorProp[] = [];

  /**
   * Loops through registry blueprints and randomly allocates physical elements in open zones
   */
  public generateMarketDecor(worldWidth: number, worldHeight: number): void {
    this.activeProps = [];
    let instanceIdCounter = 0;

    // Semi-random spawning parameters spreading out elements
    const spawnPoints = [
      { x: worldWidth * 0.25, y: worldHeight * 0.25 },
      { x: worldWidth * 0.75, y: worldHeight * 0.25 },
      { x: worldWidth * 0.25, y: worldHeight * 0.75 },
      { x: worldWidth * 0.75, y: worldHeight * 0.75 },
      { x: worldWidth * 0.5,  y: worldHeight * 0.3 }
    ];

    for (const pt of spawnPoints) {
      // Pick a random index definition from our registered collection array
      const blueprint = REGISTERED_DECOR_BLUEPRINTS[Math.floor(Math.random() * REGISTERED_DECOR_BLUEPRINTS.length)];
      
      // Instantiate class signatures dynamically passing specific positions
      const propInstance = new blueprint.classRef(pt.x, pt.y);
      propInstance.id = `${blueprint.type}-${instanceIdCounter++}`;
      
      this.activeProps.push(propInstance);
    }
  }

  /**
   * Processes solid perimeter collisions between the player and decor instances
   */
  public processDecorCollisions(player: Player): void {
    if (!player) return;

    for (const prop of this.activeProps) {
      if (!prop.isSolid) continue;

      const dx = player.x - prop.x;
      const dy = player.y - prop.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = player.radius + prop.radius;

      if (distance < minDistance && distance > 0) {
        const overlap = minDistance - distance;
        const nx = dx / distance;
        const ny = dy / distance;

        // Force solid object circle pushing
        player.x += nx * overlap;
        player.y += ny * overlap;
      }
    }
  }
}