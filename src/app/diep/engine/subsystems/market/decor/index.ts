// src/app/diep/engine/subsystems/market/decor/index.ts
import { StructuralPillar } from './pillar.prop';
import { PowerCrystal } from './crystal.prop';
import { FloorVent } from './vent.prop';

export const REGISTERED_DECOR_BLUEPRINTS = [
  { classRef: StructuralPillar, type: 'PILLAR', weight: 4 },
  { classRef: PowerCrystal, type: 'CRYSTAL', weight: 2 },
  { classRef: FloorVent, type: 'VENT', weight: 3 }
];

export * from './decor.interface';