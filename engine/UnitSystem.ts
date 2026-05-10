/**
 * UnitSystem - Unit Behavior Management System
 * 
 * This module provides a component-based behavior system for game units.
 * Currently, the GameEngine handles unit logic directly for simplicity.
 * These classes are preserved for future refactoring to a more modular
 * entity-component system (ECS) architecture.
 * 
 * @see GameEngine.ts for the current active implementation
 */

import { GameUnit, Faction, UnitType } from '../types';
import { SpatialGrid } from './SpatialGrid';
import { GATHERER_CARRY_AMOUNT } from '../constants';

/**
 * Abstract base class for unit behaviors.
 * Extend this to create custom unit AI patterns.
 */
export abstract class UnitBehavior {
  protected unit: GameUnit;
  protected spatialGrid: SpatialGrid;

  constructor(unit: GameUnit, spatialGrid: SpatialGrid) {
    this.unit = unit;
    this.spatialGrid = spatialGrid;
  }

  abstract update(deltaTime: number): void;
  abstract findTarget(): GameUnit | null;
  abstract performAction(target: GameUnit | null, deltaTime: number): void;

  getDistanceToTarget(target: GameUnit | null): number {
    if (!target) return 1000;
    return Math.abs(this.unit.position - target.position);
  }

  isInRange(target: GameUnit | null): boolean {
    if (!target) return false;
    return this.getDistanceToTarget(target) <= this.unit.range;
  }

  moveTowardsTarget(): void {
    if (this.unit.faction === Faction.BEES) {
      this.unit.position += this.unit.speed;
      if (this.unit.position > 100) this.unit.position = 100;
    } else {
      this.unit.position -= this.unit.speed;
      if (this.unit.position < 0) this.unit.position = 0;
    }
  }

  canAttack(): boolean {
    const now = Date.now();
    return now - this.unit.lastAttackTime >= this.unit.attackSpeed;
  }

  attack(_target: GameUnit): void {
    if (this.canAttack()) {
      this.unit.lastAttackTime = Date.now();
      this.unit.isAttacking = true;
      // Damage will be resolved by the combat system
    }
  }
}

export class GathererBehavior extends UnitBehavior {
  private centerLaneIndex: number;
  private resourcesCarried: number = 0;

  constructor(unit: GameUnit, spatialGrid: SpatialGrid, centerLaneIndex: number) {
    super(unit, spatialGrid);
    this.centerLaneIndex = centerLaneIndex;
  }

  update(_deltaTime: number): void {
    // Gatherers only work in the center lane
    if (this.unit.lane !== this.centerLaneIndex) return;

    if (this.unit.faction === Faction.BEES) {
      this.updateBeeGatherer();
    } else {
      this.updateAntGatherer();
    }
  }

  private updateBeeGatherer(): void {
    if (this.unit.isCarrying) {
      // Return to base (position 0)
      this.unit.position -= this.unit.speed;
      if (this.unit.position <= 0) {
        this.unit.position = 0;
        this.unit.isCarrying = false;
        this.resourcesCarried = 0;
      }
    } else {
      // Go to food (position 50)
      this.unit.position += this.unit.speed;
      if (this.unit.position >= 50) {
        this.unit.position = 50;
        this.unit.isCarrying = true;
        this.resourcesCarried = GATHERER_CARRY_AMOUNT;
      }
    }
  }

  private updateAntGatherer(): void {
    if (this.unit.isCarrying) {
      // Return to base (position 100)
      this.unit.position += this.unit.speed;
      if (this.unit.position >= 100) {
        this.unit.position = 100;
        this.unit.isCarrying = false;
        this.resourcesCarried = 0;
      }
    } else {
      // Go to food (position 50) from base (100)
      this.unit.position -= this.unit.speed;
      if (this.unit.position <= 50) {
        this.unit.position = 50;
        this.unit.isCarrying = true;
        this.resourcesCarried = GATHERER_CARRY_AMOUNT;
      }
    }
  }

  findTarget(): GameUnit | null {
    // Gatherers don't have combat targets
    return null;
  }

  performAction(_target: GameUnit | null, _deltaTime: number): void {
    // Gatherers don't perform combat actions
    this.unit.isAttacking = false;
  }

  getResourcesCarried(): number {
    return this.resourcesCarried;
  }
}

export class CombatBehavior extends UnitBehavior {
  private target: GameUnit | null = null;

  update(_deltaTime: number): void {
    // Find or update target
    this.target = this.findTarget();

    if (this.target && this.isInRange(this.target)) {
      this.performAction(this.target, _deltaTime);
    } else {
      this.moveTowardsTarget();
      this.unit.isAttacking = false;
    }
  }

  findTarget(): GameUnit | null {
    return this.spatialGrid.findTarget(this.unit);
  }

  performAction(target: GameUnit | null, _deltaTime: number): void {
    if (target && this.isInRange(target)) {
      this.attack(target);
    } else {
      this.unit.isAttacking = false;
    }
  }

  getCurrentTarget(): GameUnit | null {
    return this.target;
  }
}

export class UnitSystem {
  private spatialGrid: SpatialGrid;
  private unitBehaviors: Map<string, UnitBehavior> = new Map();
  private centerLaneIndex: number;

  constructor(centerLaneIndex: number) {
    this.centerLaneIndex = centerLaneIndex;
    this.spatialGrid = new SpatialGrid();
  }

  updateUnits(units: GameUnit[], deltaTime: number): GameUnit[] {
    // Update spatial grid
    this.spatialGrid.updateGrid(units);

    // Update each unit
    units.forEach(unit => {
      let behavior = this.unitBehaviors.get(unit.instanceId);
      
      if (!behavior) {
        // Create behavior for new unit
        behavior = this.createBehaviorForUnit(unit);
        this.unitBehaviors.set(unit.instanceId, behavior);
      }

      behavior.update(deltaTime);
    });

    // Clean up behaviors for dead units
    const aliveUnitIds = new Set(units.map(u => u.instanceId));
    for (const [unitId, behavior] of this.unitBehaviors) {
      if (!aliveUnitIds.has(unitId)) {
        this.unitBehaviors.delete(unitId);
      }
    }

    return units;
  }

  private createBehaviorForUnit(unit: GameUnit): UnitBehavior {
    if (unit.type === UnitType.GATHERER) {
      return new GathererBehavior(unit, this.spatialGrid, this.centerLaneIndex);
    } else {
      return new CombatBehavior(unit, this.spatialGrid);
    }
  }

  resolveCombat(units: GameUnit[]): GameUnit[] {
    const unitsAfterDamage = units.map(u => ({...u}));
    const now = Date.now();

    unitsAfterDamage.forEach(attacker => {
      if (attacker.type === UnitType.GATHERER) return;

      if (attacker.isAttacking && now - attacker.lastAttackTime < 50) {
        const behavior = this.unitBehaviors.get(attacker.instanceId) as CombatBehavior;
        if (!behavior) return;

        const target = behavior.getCurrentTarget();
        if (target && this.isInRange(attacker, target)) {
          const damage = this.calculateDamage(attacker, target);
          target.currentHp -= damage;
        }
      }
    });

    return unitsAfterDamage;
  }

  private isInRange(attacker: GameUnit, target: GameUnit): boolean {
    return Math.abs(target.position - attacker.position) <= attacker.range;
  }

  private calculateDamage(attacker: GameUnit, target: GameUnit): number {
    // Base damage
    let damage = attacker.attack;

    // Apply defensive stacking bonus
    const nearbyAllies = this.spatialGrid.findNearbyAllies(target);
    const reductionPercent = Math.min(nearbyAllies.length * 0.10, 0.50);
    const damageMultiplier = 1 - reductionPercent;

    return damage * damageMultiplier;
  }

  getResourcesFromGatherers(units: GameUnit[]): { beeResources: number; antResources: number } {
    let beeResources = 0;
    let antResources = 0;

    units.forEach(unit => {
      if (unit.type === UnitType.GATHERER && unit.isCarrying) {
        const behavior = this.unitBehaviors.get(unit.instanceId) as GathererBehavior;
        if (behavior) {
          const resources = behavior.getResourcesCarried();
          
          // Check if gatherer is at base to deposit resources
          const atBase = (unit.faction === Faction.BEES && unit.position <= 0) ||
                        (unit.faction === Faction.ANTS && unit.position >= 100);
          
          if (atBase) {
            if (unit.faction === Faction.BEES) {
              beeResources += resources;
            } else {
              antResources += resources;
            }
          }
        }
      }
    });

    return { beeResources, antResources };
  }

  getPassiveResourceGeneration(units: GameUnit[]): { beeIncome: number; antIncome: number } {
    let beeIncome = 0.05; // Base generation
    let antIncome = 0.05;

    units.forEach(unit => {
      if (unit.type === UnitType.WORKER) {
        if (unit.faction === Faction.BEES) {
          beeIncome += unit.gatherRate;
        } else {
          antIncome += unit.gatherRate;
        }
      }
    });

    return { beeIncome, antIncome };
  }

  getSpatialGrid(): SpatialGrid {
    return this.spatialGrid;
  }

  // Utility methods for AI and game logic
  getUnitCountByTypeAndFaction(unitType: UnitType, faction: Faction, units: GameUnit[]): number {
    return units.filter(u => u.type === unitType && u.faction === faction).length;
  }

  getUnitsByFaction(faction: Faction, units: GameUnit[]): GameUnit[] {
    return units.filter(u => u.faction === faction);
  }

  cleanupDeadUnits(units: GameUnit[]): { livingUnits: GameUnit[]; deadUnits: GameUnit[] } {
    const livingUnits: GameUnit[] = [];
    const deadUnits: GameUnit[] = [];

    units.forEach(unit => {
      if (unit.currentHp > 0) {
        livingUnits.push(unit);
      } else {
        deadUnits.push(unit);
      }
    });

    return { livingUnits, deadUnits };
  }
}
