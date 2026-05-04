import { GameUnit, Faction } from '../types';
import { LANE_COUNT } from '../constants';

export interface SpatialQuery {
  lane?: number;
  faction?: Faction;
  minPosition?: number;
  maxPosition?: number;
  excludeUnitId?: string;
}

export class SpatialGrid {
  // Grid organized by lane for O(1) lane-based lookups
  private laneGrids: Map<number, GameUnit[]> = new Map();
  private positionThreshold: number;

  constructor(positionThreshold: number = 3) {
    this.positionThreshold = positionThreshold;
    this.initializeGrids();
  }

  private initializeGrids(): void {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      this.laneGrids.set(lane, []);
    }
  }

  updateGrid(units: GameUnit[]): void {
    // Clear existing grids
    this.initializeGrids();
    
    // Populate grids
    units.forEach(unit => {
      const laneUnits = this.laneGrids.get(unit.lane);
      if (laneUnits) {
        laneUnits.push(unit);
      }
    });

    // Sort each lane by position for efficient range queries
    this.laneGrids.forEach(laneUnits => {
      laneUnits.sort((a, b) => a.position - b.position);
    });
  }

  getUnitsInLane(lane: number): GameUnit[] {
    return this.laneGrids.get(lane) || [];
  }

  query(query: SpatialQuery): GameUnit[] {
    let units: GameUnit[] = [];

    if (query.lane !== undefined) {
      units = this.getUnitsInLane(query.lane);
    } else {
      // Search all lanes if no specific lane requested
      for (let lane = 0; lane < LANE_COUNT; lane++) {
        units.push(...this.getUnitsInLane(lane));
      }
    }

    // Apply filters
    if (query.faction !== undefined) {
      units = units.filter(unit => unit.faction === query.faction);
    }

    if (query.minPosition !== undefined) {
      units = units.filter(unit => unit.position >= query.minPosition!);
    }

    if (query.maxPosition !== undefined) {
      units = units.filter(unit => unit.position <= query.maxPosition!);
    }

    if (query.excludeUnitId !== undefined) {
      units = units.filter(unit => unit.instanceId !== query.excludeUnitId);
    }

    return units;
  }

  findEnemies(unit: GameUnit): GameUnit[] {
    return this.query({
      lane: unit.lane,
      minPosition: unit.faction === Faction.BEES ? unit.position : 0,
      maxPosition: unit.faction === Faction.BEES ? 100 : unit.position,
      excludeUnitId: unit.instanceId
    }).filter(u => u.faction !== unit.faction && u.currentHp > 0);
  }

  findTarget(unit: GameUnit): GameUnit | null {
    const enemies = this.findEnemies(unit);
    
    if (enemies.length === 0) return null;

    if (unit.faction === Faction.BEES) {
      // Bees target closest enemy ahead
      const enemiesAhead = enemies.filter(e => e.position >= unit.position);
      if (enemiesAhead.length > 0) {
        return enemiesAhead.reduce((prev, curr) => prev.position < curr.position ? prev : curr);
      }
    } else {
      // Ants target closest enemy behind
      const enemiesBehind = enemies.filter(e => e.position <= unit.position);
      if (enemiesBehind.length > 0) {
        return enemiesBehind.reduce((prev, curr) => prev.position > curr.position ? prev : curr);
      }
    }

    return null;
  }

  findNearbyAllies(unit: GameUnit): GameUnit[] {
    return this.query({
      lane: unit.lane,
      excludeUnitId: unit.instanceId
    }).filter(ally => 
      ally.faction === unit.faction &&
      ally.type === unit.type &&
      Math.abs(ally.position - unit.position) < this.positionThreshold
    );
  }

  getUnitsByFaction(faction: Faction): GameUnit[] {
    return this.query({ faction });
  }

  getUnitsByType(unitType: string): GameUnit[] {
    const units: GameUnit[] = [];
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      units.push(...this.getUnitsInLane(lane).filter(u => u.type === unitType));
    }
    return units;
  }

  getUnitCount(lane: number, faction?: Faction): number {
    const laneUnits = this.getUnitsInLane(lane);
    return faction ? laneUnits.filter(u => u.faction === faction).length : laneUnits.length;
  }

  getFurthestUnit(lane: number, faction: Faction): GameUnit | null {
    const units = this.getUnitsInLane(lane).filter(u => u.faction === faction);
    if (units.length === 0) return null;

    return faction === Faction.BEES 
      ? units.reduce((prev, curr) => prev.position > curr.position ? prev : curr)
      : units.reduce((prev, curr) => prev.position < curr.position ? prev : curr);
  }

  getDangerousLaneForFaction(targetFaction: Faction): number {
    let maxDanger = -1;
    let dangerousLane = -1;

    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const enemyUnits = this.getUnitsInLane(lane).filter(u => u.faction !== targetFaction);
      if (enemyUnits.length > 0) {
        const furthestEnemy = targetFaction === Faction.BEES 
          ? Math.max(...enemyUnits.map(u => u.position))
          : Math.min(...enemyUnits.map(u => u.position));
        
        if (furthestEnemy > maxDanger) {
          maxDanger = furthestEnemy;
          dangerousLane = lane;
        }
      }
    }

    return dangerousLane;
  }

  // Performance monitoring
  getGridStats(): { totalUnits: number; unitsPerLane: number[] } {
    const unitsPerLane: number[] = [];
    let totalUnits = 0;

    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const count = this.getUnitsInLane(lane).length;
      unitsPerLane.push(count);
      totalUnits += count;
    }

    return { totalUnits, unitsPerLane };
  }
}
