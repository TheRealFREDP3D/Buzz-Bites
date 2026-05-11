import { GameState, Faction, UnitType, GameUnit, GamePhase } from '../types';
import { BEE_UNITS, ANT_UNITS, LANE_COUNT, UPGRADE_STAT_INCREASE, GATHERER_CARRY_AMOUNT } from '../constants';
import { SpatialGrid } from './SpatialGrid';

export interface GameEngineConfig {
  aiSpawnChance: number;
  aiEconomyPriority: number;
  aiDefensePriority: number;
  aiSpecialUnitChance: number;
  aiEliteUnitChance: number;
  aiSoldierUnitChance: number;
  defensiveStackingBonus: number;
  maxDefensiveBonus: number;
  stackingProximityThreshold: number;
}

export const DEFAULT_ENGINE_CONFIG: GameEngineConfig = {
  aiSpawnChance: 0.05,
  aiEconomyPriority: 0.6,
  aiDefensePriority: 0.7,
  aiSpecialUnitChance: 0.1,
  aiEliteUnitChance: 0.25,
  aiSoldierUnitChance: 0.6,
  defensiveStackingBonus: 0.10,
  maxDefensiveBonus: 0.50,
  stackingProximityThreshold: 3
};

export class GameEngine {
  private config: GameEngineConfig;
  private spatialGrid: SpatialGrid;

  constructor(config: GameEngineConfig = DEFAULT_ENGINE_CONFIG) {
    this.config = config;
    this.spatialGrid = new SpatialGrid(config.stackingProximityThreshold);
  }

  reset(): void {
    this.spatialGrid = new SpatialGrid(this.config.stackingProximityThreshold);
  }

  update(currentState: GameState, _deltaTime: number): GameState {
    const { 
      beeResources, antResources, 
      beeBaseHealth, antBaseHealth, 
      units, 
      gameActive,
      lastCommentaryTime
    } = currentState;

    if (!gameActive) return currentState;

    const now = Date.now();
    const baseDamageAccumulator = { bee: 0, ant: 0 };
    const nextUnits: GameUnit[] = [];
    const centerLaneIndex = Math.floor(LANE_COUNT / 2);

    // 1. Resource Generation (Passive + Unit based)
    let beeIncome = 0.05;
    let antIncome = 0.05;
    
    // 2. Process Units
    units.forEach(unit => {
      let nextUnit = { ...unit };
      
      // Passive Resource Generation (Workers)
      if (unit.faction === Faction.BEES) beeIncome += unit.gatherRate;
      else antIncome += unit.gatherRate;

      // === GATHERER LOGIC ===
      if (unit.type === UnitType.GATHERER) {
        const gathererResult = this.processGatherer(nextUnit, unit.faction, centerLaneIndex, beeResources, antResources, nextUnits);
        beeIncome += gathererResult.beeResourcesDelta;
        antIncome += gathererResult.antResourcesDelta;
        nextUnits.push(gathererResult.updatedUnit);
        return; // Skip combat logic for gatherers
      }

      // === COMBAT UNIT LOGIC ===
      this.processCombatUnit(nextUnit, now, baseDamageAccumulator, nextUnits);
    });

    // 3. Update Spatial Grid for O(1) queries
    this.spatialGrid.updateGrid(nextUnits);
    
    // 4. Resolve Combat Damage
    const unitsAfterDamage = this.resolveCombatDamage(nextUnits, now);
    
    // 5. Cleanup Dead Units & Update Bases
    const { livingUnits, totalBeeDamage, totalAntDamage } = this.cleanupDeadUnits(unitsAfterDamage, baseDamageAccumulator.bee, baseDamageAccumulator.ant);
    
    // 6. Update Spatial Grid with living units
    this.spatialGrid.updateGrid(livingUnits);

    // 7. AI Spawning Logic
    const { updatedUnits, updatedAntResources, triggerEvent } = this.processAISpawning(
      livingUnits, 
      antResources, 
      centerLaneIndex, 
      now, 
      lastCommentaryTime
    );

    // 8. Win Condition
    const { gameActive: newGameActive, winner: newWinner } = this.checkWinCondition(
      beeBaseHealth - totalAntDamage,
      antBaseHealth - totalBeeDamage
    );

    let newGamePhase: GamePhase = 'playing';
    if (newWinner === Faction.BEES) newGamePhase = 'level_victory';
    else if (newWinner === Faction.ANTS) newGamePhase = 'game_over';

    return {
      ...currentState,
      beeResources: beeResources + beeIncome,
      antResources: updatedAntResources + antIncome,
      beeBaseHealth: Math.max(0, beeBaseHealth - totalAntDamage),
      antBaseHealth: Math.max(0, antBaseHealth - totalBeeDamage),
      units: updatedUnits,
      gameActive: newGameActive,
      winner: newWinner,
      gamePhase: newGamePhase,
      triggerCommentaryForEvent: triggerEvent || currentState.triggerCommentaryForEvent,
      lastCommentaryTime: triggerEvent ? now : lastCommentaryTime
    };
  }

  private processGatherer(
    unit: GameUnit, 
    faction: Faction, 
    _centerLaneIndex: number, 
    _beeResources: number, 
    _antResources: number, 
    _nextUnits: GameUnit[]
  ): { updatedUnit: GameUnit; beeResourcesDelta: number; antResourcesDelta: number } {
    let beeResourcesDelta = 0;
    let antResourcesDelta = 0;
    
    // Gatherers only work in the center lane
    if (faction === Faction.BEES) {
      if (unit.isCarrying) {
        // Return to base
        unit.position -= unit.speed;
        if (unit.position <= 0) {
          unit.position = 0;
          // Deposit resources before clearing carrying flag
          beeResourcesDelta += GATHERER_CARRY_AMOUNT;
          unit.isCarrying = false;
        }
      } else {
        // Go to food
        unit.position += unit.speed;
        if (unit.position >= 50) {
          unit.position = 50;
          unit.isCarrying = true; // Picked up food
        }
      }
    } else {
      // ANTS (Sugar Scout) Logic
      if (unit.isCarrying) {
        // Return to base (100)
        unit.position += unit.speed;
        if (unit.position >= 100) {
          unit.position = 100;
          // Deposit resources before clearing carrying flag
          antResourcesDelta += GATHERER_CARRY_AMOUNT;
          unit.isCarrying = false;
        }
      } else {
        // Go to food (50) from base (100)
        unit.position -= unit.speed;
        if (unit.position <= 50) {
          unit.position = 50;
          unit.isCarrying = true; // Picked up food
        }
      }
    }
    
    return { updatedUnit: unit, beeResourcesDelta, antResourcesDelta };
  }

  private processCombatUnit(
    unit: GameUnit, 
    now: number, 
    baseDamageAccumulator: { bee: number; ant: number },
    nextUnits: GameUnit[]
  ): void {
    // Find Targets using Spatial Grid for O(1) performance
    const enemies = this.spatialGrid.findEnemies(unit);

    let target: GameUnit | null = this.spatialGrid.findTarget(unit);
    let distanceToTarget = 1000;

    if (unit.faction === Faction.BEES) {
      const enemiesAhead = enemies.filter(e => e.position >= unit.position);
      if (enemiesAhead.length > 0) {
        target = enemiesAhead.reduce((prev, curr) => prev.position < curr.position ? prev : curr);
        distanceToTarget = target.position - unit.position;
      } else {
        distanceToTarget = 100 - unit.position;
      }
    } else {
      const enemiesAhead = enemies.filter(e => e.position <= unit.position);
      if (enemiesAhead.length > 0) {
        target = enemiesAhead.reduce((prev, curr) => prev.position > curr.position ? prev : curr);
        distanceToTarget = unit.position - target.position;
      } else {
        distanceToTarget = unit.position;
      }
    }

    // Action Logic
    if (distanceToTarget <= unit.range) {
      unit.isAttacking = true;
      if (now - unit.lastAttackTime >= unit.attackSpeed) {
        unit.lastAttackTime = now;
        if (!target) {
          if (unit.faction === Faction.BEES) baseDamageAccumulator.bee += unit.attack;
          else baseDamageAccumulator.ant += unit.attack;
        }
      }
    } else {
      unit.isAttacking = false;
      if (unit.faction === Faction.BEES) {
         unit.position += unit.speed;
         if (unit.position > 100) unit.position = 100;
      } else {
         unit.position -= unit.speed;
         if (unit.position < 0) unit.position = 0;
      }
    }
    
    nextUnits.push(unit);
  }

  private resolveCombatDamage(units: GameUnit[], now: number): GameUnit[] {
    const unitsAfterDamage = units.map(u => ({...u}));
    
    unitsAfterDamage.forEach(attacker => {
       if (attacker.type === UnitType.GATHERER) return; // Gatherers don't attack

       if (attacker.isAttacking && now - attacker.lastAttackTime < 50) {
          const enemies = unitsAfterDamage.filter(u => 
            u.lane === attacker.lane && 
            u.faction !== attacker.faction
          );
          
          let target: GameUnit | undefined;
          if (attacker.faction === Faction.BEES) {
             target = enemies.filter(e => e.position >= attacker.position)
                             .sort((a,b) => a.position - b.position)[0];
          } else {
             target = enemies.filter(e => e.position <= attacker.position)
                             .sort((a,b) => b.position - a.position)[0];
          }

          if (target && Math.abs(target.position - attacker.position) <= attacker.range) {
             // --- DEFENSIVE STACKING BONUS ---
             const nearbyAllies = this.spatialGrid.findNearbyAllies(target).length;

             const reductionPercent = Math.min(nearbyAllies * this.config.defensiveStackingBonus, this.config.maxDefensiveBonus);
             const damageMultiplier = 1 - reductionPercent;

             target.currentHp -= (attacker.attack * damageMultiplier);
          }
       }
    });

    return unitsAfterDamage;
  }

  private cleanupDeadUnits(units: GameUnit[], beeBaseDamage: number, antBaseDamage: number): {
    livingUnits: GameUnit[];
    totalBeeDamage: number;
    totalAntDamage: number;
  } {
    const livingUnits: GameUnit[] = [];
    units.forEach(u => {
      if (u.currentHp > 0) {
        livingUnits.push(u);
      }
    });

    return {
      livingUnits,
      totalBeeDamage: beeBaseDamage,
      totalAntDamage: antBaseDamage
    };
  }

  private processAISpawning(
    livingUnits: GameUnit[], 
    antResources: number, 
    centerLaneIndex: number, 
    now: number, 
    lastCommentaryTime: number
  ): { updatedUnits: GameUnit[]; updatedAntResources: number; triggerEvent?: string } {
    if (Math.random() >= this.config.aiSpawnChance) {
      return { updatedUnits: livingUnits, updatedAntResources: antResources };
    }

    const canBuyWorker = antResources >= ANT_UNITS.WORKER.cost;
    const canBuySoldier = antResources >= ANT_UNITS.SOLDIER.cost;
    const canBuyElite = antResources >= ANT_UNITS.ELITE.cost;
    const canBuySpecial = antResources >= ANT_UNITS.SPECIAL.cost;
    const canBuyGatherer = antResources >= ANT_UNITS.GATHERER.cost;

    // Count existing units
    const antGatherers = livingUnits.filter(u => u.faction === Faction.ANTS && u.type === UnitType.GATHERER).length;

    // AI Strategy
    const needsEconomy = antGatherers === 0 || (antResources < 50 && antGatherers < 3);
    let triggerEvent: string | undefined = undefined;
    let updatedAntResources = antResources;

    if (needsEconomy && canBuyGatherer && Math.random() < this.config.aiEconomyPriority) {
      updatedAntResources -= ANT_UNITS.GATHERER.cost;
      livingUnits.push({
         ...ANT_UNITS.GATHERER,
         instanceId: `ant_g_${now}_${Math.random()}`,
         faction: Faction.ANTS,
         lane: centerLaneIndex,
         position: 100,
         currentHp: ANT_UNITS.GATHERER.hp,
         lastAttackTime: 0,
         isAttacking: false,
         isCarrying: false
      });
    } else if (canBuyWorker || canBuySoldier || canBuySpecial || canBuyElite) {
      // Combat Logic - AVOID CENTER LANE
      const combatLanes = Array.from({ length: LANE_COUNT }, (_, i) => i).filter(i => i !== centerLaneIndex);
      let laneToSpawn = combatLanes[Math.floor(Math.random() * combatLanes.length)];
      
      // Smart Defense: Find lane with most Bee progress
      let dangerousLane = -1;
      let maxDanger = -1;
      
      for(let l of combatLanes) {
         const beesInLane = livingUnits.filter(u => u.lane === l && u.faction === Faction.BEES);
         if (beesInLane.length > 0) {
            const closestBee = Math.max(...beesInLane.map(u => u.position));
            if (closestBee > maxDanger) {
               maxDanger = closestBee;
               dangerousLane = l;
            }
         }
      }

      // Defense priority
      if (dangerousLane !== -1 && Math.random() < this.config.aiDefensePriority) laneToSpawn = dangerousLane;

      // Unit Selection Weighting
      let unitTypeToSpawn = UnitType.WORKER;
      
      if (canBuySpecial && Math.random() < this.config.aiSpecialUnitChance) unitTypeToSpawn = UnitType.SPECIAL;
      else if (canBuyElite && Math.random() < this.config.aiEliteUnitChance) unitTypeToSpawn = UnitType.ELITE;
      else if (canBuySoldier && Math.random() < this.config.aiSoldierUnitChance) unitTypeToSpawn = UnitType.SOLDIER;
      
      const unitStats = ANT_UNITS[unitTypeToSpawn];
      
      if (updatedAntResources >= unitStats.cost) {
         updatedAntResources -= unitStats.cost;
         livingUnits.push({
            ...unitStats,
            instanceId: `ant_${now}_${Math.random()}`,
            faction: Faction.ANTS,
            lane: laneToSpawn,
            position: 100,
            currentHp: unitStats.hp, 
            lastAttackTime: 0,
            isAttacking: false,
            isCarrying: false
         });

         const timeSinceLast = now - lastCommentaryTime;
         if (unitTypeToSpawn === UnitType.SPECIAL && timeSinceLast > 6000) {
           triggerEvent = "The Ants have deployed a heavy tank!";
         } else if (unitTypeToSpawn === UnitType.ELITE && timeSinceLast > 8000) {
           triggerEvent = "Watch out for the Drill Sergeant!";
         }
      }
    }

    return { updatedUnits: livingUnits, updatedAntResources, triggerEvent };
  }

  private checkWinCondition(beeBaseHealth: number, antBaseHealth: number): {
    gameActive: boolean;
    winner: Faction | null;
  } {
    let gameActive = true;
    let winner: Faction | null = null;

    if (beeBaseHealth <= 0) {
      gameActive = false;
      winner = Faction.ANTS;
    } else if (antBaseHealth <= 0) {
      gameActive = false;
      winner = Faction.BEES;
    }

    return { gameActive, winner };
  }

  spawnUnit(
    faction: Faction, 
    unitType: UnitType, 
    lane: number, 
    position: number, 
    unitLevels: Record<UnitType, number>
  ): GameUnit {
    const unitStats = faction === Faction.BEES ? BEE_UNITS[unitType] : ANT_UNITS[unitType];
    const level = unitLevels[unitType];
    const statMultiplier = Math.pow(1 + UPGRADE_STAT_INCREASE, level - 1);

    return {
      ...unitStats,
      instanceId: `${faction.toLowerCase()}_${unitType.toLowerCase()}_${Date.now()}_${Math.random()}`,
      faction,
      lane,
      position,
      hp: unitStats.hp * statMultiplier,
      currentHp: unitStats.hp * statMultiplier,
      attack: unitStats.attack * statMultiplier,
      lastAttackTime: 0,
      isAttacking: false,
      isCarrying: false
    };
  }

  upgradeUnitStats(unit: GameUnit, level: number): GameUnit {
    const multiplier = Math.pow(1 + UPGRADE_STAT_INCREASE, level - 1);
    const newHp = unit.hp * multiplier;
    
    return {
      ...unit,
      hp: newHp,
      currentHp: unit.currentHp * multiplier,
      attack: unit.attack * multiplier
    };
  }
}
