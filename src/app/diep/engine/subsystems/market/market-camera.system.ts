// src/app/diep/engine/subsystems/market/market-camera.system.ts
import { Injectable } from '@angular/core';

export type CameraMode = 'PLAYER' | 'STATIC' | 'DETACHED';

@Injectable({
  providedIn: 'root'
})
export class MarketCameraSystem {
  // Define a larger, open world dimension separate from screen resolution
  public worldWidth = 2400;
  public worldHeight = 2400;

  // Actual top-left coordinates of the viewport window relative to the world
  public x = 0;
  public y = 0;

  // Rendering scale factor (1 = normal size, < 1 = zoomed out)
  public scale = 1.0;

  public currentMode: CameraMode = 'PLAYER';
  private detachedSpeed = 8;

  /**
   * Updates the camera viewport coordinates depending on the active mode configuration
   */
  public update(g: any): void {
    const player = g.playerService.player;

    // Adjust effective viewport size based on current zoom scale factor
    const viewWidth = g.width / this.scale;
    const viewHeight = g.height / this.scale;

    switch (this.currentMode) {
      case 'PLAYER':
        if (player) {
          // Center camera directly on player position relative to active viewport sizes
          let targetX = player.x - viewWidth / 2;
          let targetY = player.y - viewHeight / 2;

          // Apply linear interpolation (lerp) for smooth cinematic camera catching
          this.x += (targetX - this.x) * 0.1;
          this.y += (targetY - this.y) * 0.1;

          this.clampViewport(viewWidth, viewHeight);
        }
        break;

      case 'DETACHED':
        // Dev Mode: Pan across world freely using Arrow Keys bypassing player location
        if (g.keys['ArrowUp'])    this.y -= this.detachedSpeed;
        if (g.keys['ArrowDown'])  this.y += this.detachedSpeed;
        if (g.keys['ArrowLeft'])  this.x -= this.detachedSpeed;
        if (g.keys['ArrowRight']) this.x += this.detachedSpeed;
        
        this.clampViewport(viewWidth, viewHeight);
        break;

      case 'STATIC':
      default:
        // Lock camera directly to the center coordinates of the map matching active zoom scales
        this.x = (this.worldWidth - viewWidth) / 2;
        this.y = (this.worldHeight - viewHeight) / 2;
        break;
    }

    // FIXED: Force hard physics environment constraints on the player position so they can't breach world borders
    if (player) {
      if (player.x < player.radius) player.x = player.radius;
      if (player.y < player.radius) player.y = player.radius;
      if (player.x > this.worldWidth - player.radius) player.x = this.worldWidth - player.radius;
      if (player.y > this.worldHeight - player.radius) player.y = this.worldHeight - player.radius;
    }
  }

  /**
   * Toggles camera tracking modes. Hook this into keybind triggers if needed.
   */
  public setMode(mode: CameraMode): void {
    this.currentMode = mode;
  }

  /**
   * Restricts camera viewport dimensions from revealing empty canvas voids
   */
  private clampViewport(viewWidth: number, viewHeight: number): void {
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x > this.worldWidth - viewWidth) this.x = this.worldWidth - viewWidth;
    if (this.y > this.worldHeight - viewHeight) this.y = this.worldHeight - viewHeight;
  }
}