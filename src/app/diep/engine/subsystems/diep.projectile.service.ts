// src/app/diep/engine/subsystems/diep.projectile.service.ts
import { Injectable } from '@angular/core';
import { Bullet, TrailSegment, Player, GameSystem } from '../../core/diep.interfaces';
import { DiepTimeManager } from '../../core/diep.time-manager';
import { DiepGameEngineService } from '../diep.game-engine.service';
import { DiepPlayerService } from './diep.player.service';
import { DiepStatsService } from '../../core/diep.stats.service';

@Injectable({
    providedIn: 'root'
})
export class DiepProjectileService implements GameSystem {
    private shotTimer = 0;

    constructor(
        private playerService: DiepPlayerService,
        private diepStatsService: DiepStatsService
    ) {}

    public update(engine: DiepGameEngineService, tick: number, ms: number): void {
        const activePlayer = this.playerService.player;

        // Handle automated shooting checking the engine input state directly
        if (engine.mouseAiming && engine.mouseDown && activePlayer && activePlayer.health > 0) {
            this.shootBullet(activePlayer, engine.mousePos, engine.mouseAiming, engine.lastAngle, engine.bullets);
        }

        engine.bullets = this.updateBullets(
            engine.bullets, 
            tick, 
            engine.width, 
            engine.height, 
            activePlayer, 
            ms
        );

        engine.toxicTrails = this.updateTrails(
            engine.toxicTrails, 
            engine.bullets, 
            activePlayer, 
            ms
        );
    }

    public shootBullet(
        player: Player, 
        mousePos: { x: number; y: number }, 
        mouseAiming: boolean, 
        lastAngle: number, 
        bullets: Bullet[],
    ): void {
        this.shotTimer += DiepTimeManager.gameMs;
        
        const fireDelay = 1000 / player.fireRate;

        if (this.shotTimer < fireDelay) return;
        
        this.shotTimer = 0; 

        const angle = mouseAiming 
            ? Math.atan2(mousePos.y - player.y, mousePos.x - player.x) 
            : lastAngle;
            
        const barrelLength = player.radius * 2.0;
        const radius = 7.5;
        
        const bulletMass = (Math.pow(radius, 2) * Math.PI) * (player.bulletHealth * 0.001);
        const recoilForce = (bulletMass * player.bulletSpeed) / player.mass;

        player.vx -= Math.cos(angle) * recoilForce;
        player.vy -= Math.sin(angle) * recoilForce;

        bullets.push({
            id: Math.random().toString(36).substr(2, 9),
            x: player.x + Math.cos(angle) * barrelLength,
            y: player.y + Math.sin(angle) * barrelLength,
            dx: Math.cos(angle) * player.bulletSpeed,
            dy: Math.sin(angle) * player.bulletSpeed,
            radius: radius,
            mass: bulletMass,
            color: player.color,
            ownerType: 'PLAYER',
            health: player.bulletHealth,
            maxHealth: player.bulletHealth,
            damage: player.bulletDamage,
            isFlying: true,
            isGhost: false,
        });

        // Log the projectile execution telemetry
        this.diepStatsService.recordShotFired();
    }

    public resetCooldown(): void {
        this.shotTimer = 1000;
    }

    public updateBullets(
        bullets: Bullet[], 
        F: number, 
        width: number, 
        height: number, 
        player: Player, 
        deltaTime: number
    ): Bullet[] {
        if (deltaTime <= 0) return bullets;

        return bullets.map(b => {
            if (b.isBomb) {
                if (!b.isExploding) {
                    b.dx *= Math.pow(0.98, F);
                    b.dy *= Math.pow(0.98, F);
                } else {
                    b.dx = 0;
                    b.dy = 0;
                }
                
                if (b.timer !== undefined) {
                    b.timer -= deltaTime;
                }
            }

            b.x += b.dx * F;
            b.y += b.dy * F;
            return b;
        }).filter(b => {
            if (b.isBomb) {
                return b.timer !== undefined && b.timer > 0;
            }
            return b.health > 0 && b.x > -100 && b.x < width + 100 && b.y > -100 && b.y < height + 100;
        });
    }

    public updateTrails(
        trails: TrailSegment[], 
        bullets: Bullet[], 
        player: Player, 
        ms: number
    ): TrailSegment[] {
        bullets.forEach(bullet => {
            if (bullet.hasTrail) {
                trails.push({
                    x: bullet.x, y: bullet.y,
                    radius: 5, maxRadius: 20,
                    color: '#27ae60', opacity: 0.6,
                    creationTime: 0, 
                    lifespan: 1000 
                });
            }
        });

        for (let i = trails.length - 1; i >= 0; i--) {
            const t = trails[i];
            t.lifespan -= ms;

            if (t.lifespan <= 0) {
                trails.splice(i, 1);
                continue;
            }

            const lifeRatio = 1 - (t.lifespan / 1000); 

            t.radius = 5 + (t.maxRadius - 5) * lifeRatio;
            t.opacity = 0.6 * (1 - lifeRatio);

            const dx = player.x - t.x;
            const dy = player.y - t.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (ms > 0 && dist < t.radius + player.radius) {
                player.health -= 0.04 * DiepTimeManager.gameTick; 
            }
        }
        return trails;
    }
}