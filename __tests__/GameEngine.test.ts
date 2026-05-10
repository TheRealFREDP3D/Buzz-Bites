import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine, DEFAULT_ENGINE_CONFIG } from '../engine/GameEngine';
import { initialGameState } from '../engine/GameStateReducer';
import { Faction, UnitType, GameState } from '../types';

describe('GameEngine', () => {
  let engine: GameEngine;
  let initialState: GameState;

  beforeEach(() => {
    engine = new GameEngine(DEFAULT_ENGINE_CONFIG);
    initialState = { ...initialGameState };
  });

  describe('initialization', () => {
    it('should create a game engine with default config', () => {
      expect(engine).toBeDefined();
    });

    it('should reset to initial state', () => {
      engine.reset();
      // Engine should be ready for new game
      expect(engine).toBeDefined();
    });
  });

  describe('update', () => {
    it('should not change state when game is not active', () => {
      const inactiveState = { ...initialState, gameActive: false };
      const result = engine.update(inactiveState, 50);
      expect(result).toEqual(inactiveState);
    });

    it('should generate passive resources each tick', () => {
      const result = engine.update(initialState, 50);
      expect(result.beeResources).toBeGreaterThan(initialState.beeResources);
      expect(result.antResources).toBeGreaterThan(initialState.antResources);
    });
  });

  describe('spawnUnit', () => {
    it('should create a bee unit at position 0', () => {
      const unitLevels = initialState.unitLevels;
      const unit = engine.spawnUnit(Faction.BEES, UnitType.SOLDIER, 1, 0, unitLevels);
      
      expect(unit.faction).toBe(Faction.BEES);
      expect(unit.type).toBe(UnitType.SOLDIER);
      expect(unit.lane).toBe(1);
      expect(unit.position).toBe(0);
      expect(unit.currentHp).toBe(unit.hp);
    });

    it('should create an ant unit at position 100', () => {
      const unitLevels = initialState.unitLevels;
      const unit = engine.spawnUnit(Faction.ANTS, UnitType.SOLDIER, 1, 100, unitLevels);
      
      expect(unit.faction).toBe(Faction.ANTS);
      expect(unit.position).toBe(100);
    });

    it('should apply level multiplier to unit stats', () => {
      const unitLevels = { ...initialState.unitLevels, [UnitType.SOLDIER]: 2 };
      const unit = engine.spawnUnit(Faction.BEES, UnitType.SOLDIER, 1, 0, unitLevels);
      
      // At level 2, stats should be 50% higher
      const baseUnit = engine.spawnUnit(Faction.BEES, UnitType.SOLDIER, 1, 0, initialState.unitLevels);
      expect(unit.hp).toBeGreaterThan(baseUnit.hp);
      expect(unit.attack).toBeGreaterThan(baseUnit.attack);
    });
  });

  describe('win conditions', () => {
    it('should declare ANTS winner when bee base health reaches 0', () => {
      const lowHealthState = { ...initialState, beeBaseHealth: 1 };
      // Simulate ant attacking bee base
      const stateWithAnt = {
        ...lowHealthState,
        units: [{
          ...engine.spawnUnit(Faction.ANTS, UnitType.SOLDIER, 1, 5, initialState.unitLevels),
          position: 5, // In range of base
          isAttacking: true,
          lastAttackTime: Date.now() - 1000,
        }]
      };

      const result = engine.update(stateWithAnt, 50);
      
      // Should trigger win condition when health drops to 0
      expect(result.beeBaseHealth).toBeLessThanOrEqual(0);
      expect(result.gameActive).toBe(false);
      expect(result.winner).toBe(Faction.ANTS);
    });

    it('should declare BEES winner when ant base health reaches 0', () => {
      const lowHealthState = { ...initialState, antBaseHealth: 1 };
      // Simulate bee attacking ant base
      const stateWithBee = {
        ...lowHealthState,
        units: [{
          ...engine.spawnUnit(Faction.BEES, UnitType.SOLDIER, 1, 95, initialState.unitLevels),
          position: 95, // In range of base
          isAttacking: true,
          lastAttackTime: Date.now() - 1000,
        }]
      };

      const result = engine.update(stateWithBee, 50);
      
      // Should trigger win condition when health drops to 0
      expect(result.antBaseHealth).toBeLessThanOrEqual(0);
      expect(result.gameActive).toBe(false);
      expect(result.winner).toBe(Faction.BEES);
    });
  });
});

describe('SpatialGrid', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(DEFAULT_ENGINE_CONFIG);
  });

  it('should correctly filter units by lane', () => {
    const unitLevels = initialGameState.unitLevels;
    const unit1 = engine.spawnUnit(Faction.BEES, UnitType.SOLDIER, 0, 0, unitLevels);
    const unit2 = engine.spawnUnit(Faction.BEES, UnitType.SOLDIER, 1, 0, unitLevels);
    
    expect(unit1.lane).toBe(0);
    expect(unit2.lane).toBe(1);
  });
});
