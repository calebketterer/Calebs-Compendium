// src/app/diep/engine/subsystems/diep.collision.service.ts
import { Injectable } from '@angular/core';
import { Player, Bullet, Enemy, GameSystem } from '../../core/diep.interfaces';
import { EnemySpawnerService } from '../../enemies/diep.enemy-spawner';
import { DiepArenaManager, TileType } from './arena/arena.manager';
import { DiepGameEngineService } from '../diep.game-engine.service';
import { DiepPlayerService } from './diep.player.service';
import { DiepStatsService } from '../../core/diep.stats.service';

@Injectable({ providedIn: 'root' })
export class DiepCollisionService implements GameSystem {
    constructor(
        private spawner: EnemySpawnerService,
        private arenaManager: DiepArenaManager,
        private playerService: DiepPlayerService,
        private diepStatsService: DiepStatsService
    ) {}

    /**
     * Implementation of GameSystem interface.
     * Automatically handles both entity environmental boundaries and item/player collisions.
     */
    public update(engine: DiepGameEngineService, tick: number, ms: number): void {
        const activePlayer = this.playerService.player;

        // 1. Check entity collisions against environment tiles
        this.handleEnvironmentCollision(activePlayer);
        engine.enemies.forEach(e => this.handleEnvironmentCollision(e));
        
        for (let i = engine.bullets.length - 1; i >= 0; i--) {
            if (this.handleEnvironmentCollision(engine.bullets[i], true)) {
                engine.bullets.splice(i, 1);
            }
        }

        // 2. Run object interaction layers if gameplay is active
        if (!engine.isGameStarted || engine.isPaused || engine.gameOver) return;

        // Skip calculations if player is dead or game state is initializing
        if (activePlayer.health <= 0 || engine.isStartingNewGame) return;

        // Process combat/object colliders and mutate collections directly
        const col = this.handleCollisions(
            engine,
            activePlayer, 
            engine.bullets, 
            engine.enemies, 
            (e: Enemy) => {
                if ((engine as any).upgradeService) {
                    // FIXED: Explicitly pass down the resolved activePlayer instance here
                    (engine as any).upgradeService.processKillRewards(engine, e, activePlayer);
                }
            }
        );
        engine.bullets = col.bullets;
        engine.enemies = col.enemies;

        // 3. Keep player clamped inside the game simulation viewport canvas boundaries
        activePlayer.x = Math.max(activePlayer.radius, Math.min(engine.width - activePlayer.radius, activePlayer.x));
        activePlayer.y = Math.max(activePlayer.radius, Math.min(engine.height - activePlayer.radius, activePlayer.y));
    }

    public handleCollisions(
        engine: DiepGameEngineService,
        player: Player,
        bullets: Bullet[],
        enemies: Enemy[],
        onKillEnemy: (enemy: Enemy) => void
    ) {
        this.handleBulletVsBullet(bullets);

        // Lazily bridge wave manager telemetry backplane access via engine instantiation references
        if (engine.waveManager && !(engine.waveManager as any).diepStatsService) {
            (engine.waveManager as any).diepStatsService = this.diepStatsService;
        }

        bullets.forEach(bullet => {
            if (bullet.ownerType !== 'PLAYER' || bullet.health <= 0) return;
            enemies.forEach(enemy => {
                if (enemy.isGhost || enemy.health <= 0 || bullet.health <= 0) return;
                const dist = this.getDist(bullet, enemy);
                const combinedRadius = bullet.radius + enemy.radius;

                if (dist < combinedRadius) {
                    this.resolveHealthTrade(bullet, enemy, true);
                    
                    // Track that a player weapon projectile successfully hit a target
                    this.diepStatsService.recordShotHit();

                    if (enemy.onHit) enemy.onHit(enemies, this.spawner, bullet);
                    if (enemy.health <= 0) {
                        if (enemy.onDeath) enemy.onDeath(enemies, this.spawner, enemy, player);
                        
                        // Increment session counter tracker on the core engine instance safely
                        engine.sessionKills++;
                        
                        // Register telemetry matrix kill data (handles achievements dynamically downstream)
                        this.diepStatsService.recordKill(enemy.type, enemy, engine.sessionKills);
                        
                        onKillEnemy(enemy);
                    }
                    const angle = Math.atan2(bullet.y - enemy.y, bullet.x - enemy.x);
                    const overlap = combinedRadius - dist;
                    bullet.dx += Math.cos(angle) * overlap * 0.3; 
                    bullet.dy += Math.sin(angle) * overlap * 0.3;
                    enemy.vx -= Math.cos(angle) * overlap * 0.05; 
                    enemy.vy -= Math.sin(angle) * overlap * 0.05;
                }
            });
        });

        bullets.forEach(bullet => {
            if (bullet.ownerType !== 'ENEMY' || bullet.health <= 0) return;
            const dist = this.getDist(bullet, player);
            if (dist < bullet.radius + player.radius) {
                this.resolveHealthTrade(bullet, player, false);
                player.vx += bullet.dx * 0.01;
                player.vy += bullet.dy * 0.01;
            }
        });

        enemies.forEach(enemy => {
            if (enemy.isGhost || enemy.health <= 0) return;
            const dist = this.getDist(player, enemy);
            const combinedRadius = enemy.radius + player.radius;
            if (dist < combinedRadius) {
                this.resolveHealthTrade(player, enemy, true);
                if (enemy.health <= 0 && !enemy.isInvulnerable) {
                    if (enemy.onDeath) enemy.onDeath(enemies, this.spawner, enemy, player);
                    
                    // Increment session counter tracker on ram kill
                    engine.sessionKills++;
                    
                    // Register telemetry matrix kill data for ram kills
                    this.diepStatsService.recordKill(enemy.type, enemy.color || '', engine.sessionKills);
                    
                    onKillEnemy(enemy);
                }
                this.applyOverlapPush(player, enemy, dist, combinedRadius, 0.4);
            }
        });

        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const e1 = enemies[i]; const e2 = enemies[j];
                if (e1.health <= 0 || e2.health <= 0 || e1.isGhost || e2.isGhost) continue;
                const dist = this.getDist(e1, e2);
                const combinedRadius = e1.radius + e2.radius;
                if (dist < combinedRadius) {
                    this.applyOverlapPush(e1, e2, dist, combinedRadius, 0.25);
                }
            }
        }

        return {
            bullets: bullets.filter(b => b.health > 0),
            enemies: enemies.filter(e => e.health > 0 || e.isInvulnerable)
        };
    }

    public handleEnvironmentCollision(entity: any, isBullet: boolean = false): boolean {
        if (entity.isGhost) return false;

        const tileSize = this.arenaManager.tileSize;
        const margin = isBullet ? 2 : 0;
        const left = entity.x - entity.radius - margin;
        const right = entity.x + entity.radius + margin;
        const top = entity.y - entity.radius - margin;
        const bottom = entity.y + entity.radius + margin;

        const gridLeft = Math.floor(left / tileSize);
        const gridRight = Math.floor(right / tileSize);
        const gridTop = Math.floor(top / tileSize);
        const gridBottom = Math.floor(bottom / tileSize);

        for (let gy = gridTop; gy <= gridBottom; gy++) {
            for (let gx = gridLeft; gx <= gridRight; gx++) {
                const tile = this.arenaManager.getTileAt(gx * tileSize + 1, gy * tileSize + 1);
                if (!tile) continue;

                if (tile.type === TileType.HOLE && tile.transition > 0.8 && !entity.isFlying) {
                    const centerTile = this.arenaManager.getTileAt(entity.x, entity.y);
                    if (centerTile === tile) {
                        entity.health = 0;
                        return true;
                    }
                }

                const wallThreshold = isBullet ? 0.2 : 0.5;
                if (tile.type === TileType.WALL && tile.transition > wallThreshold) {
                    if (isBullet) {
                        entity.health = 0;
                        entity.dx = 0;
                        entity.dy = 0;
                        return true;
                    }

                    const tileCenterX = (gx * tileSize) + tileSize / 2;
                    const tileCenterY = (gy * tileSize) + tileSize / 2;
                    const diffX = entity.x - tileCenterX;
                    const diffY = entity.y - tileCenterY;
                    const overlapX = (tileSize / 2 + entity.radius) - Math.abs(diffX);
                    const overlapY = (tileSize / 2 + entity.radius) - Math.abs(diffY);

                    if (overlapX > 0 && overlapY > 0) {
                        if (overlapX < overlapY) {
                            entity.x += diffX > 0 ? overlapX : -overlapX;
                            entity.vx = 0;
                        } else {
                            entity.y += diffY > 0 ? overlapY : -overlapY;
                            entity.vy = 0;
                        }
                    }
                }
            }
        }
        return false;
    }

    private applyOverlapPush(a: any, b: any, dist: number, combinedRadius: number, strength: number) {
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const overlap = combinedRadius - dist;
        const weightA = b.radius / (a.radius + b.radius);
        const weightB = a.radius / (a.radius + b.radius);
        a.vx -= Math.cos(angle) * overlap * strength * weightA;
        a.vy -= Math.sin(angle) * overlap * strength * weightA;
        b.vx += Math.cos(angle) * overlap * strength * weightB;
        b.vy += Math.sin(angle) * overlap * strength * weightB;
    }

    private resolveHealthTrade(a: any, b: any, isPlayerSource: boolean = false) {
        const dmgToA = (b.damage || b.bodyDamage || 15);
        const dmgToB = (a.damage || a.bodyDamage || 15);
        
        // Track running cumulative damage dealt whenever the source object is a player weapon or player body
        if (isPlayerSource && !b.isInvulnerable) {
            const actualDamageApplied = Math.min(b.health, dmgToB);
            if (actualDamageApplied > 0) {
                this.diepStatsService.recordDamageDealt(actualDamageApplied);
            }
        }

        a.health -= dmgToA;
        if (!b.isInvulnerable) b.health -= dmgToB;
    }

    private handleBulletVsBullet(bullets: Bullet[]) {
        for (let i = 0; i < bullets.length; i++) {
            for (let j = i + 1; j < bullets.length; j++) {
                const b1 = bullets[i]; const b2 = bullets[j];
                if (b1.ownerType === b2.ownerType || b1.health <= 0 || b2.health <= 0) continue;
                if (this.getDist(b1, b2) < b1.radius + b2.radius) {
                    this.resolveHealthTrade(b1, b2, false);
                }
            }
        }
    }

    private getDist(obj1: any, obj2: any): number {
        return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
    }
}