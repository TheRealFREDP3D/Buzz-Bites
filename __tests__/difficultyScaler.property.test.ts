/**
 * Property-based tests for difficultyScaler
 * Feature: multi-level-progression
 *
 * Note: Properties 4 and 5 (reducer level transitions) will be appended to this
 * file in task 4.7. Keep imports and describe blocks structured for easy extension.
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { difficultyScaler } from '../engine/difficultyScaler';

describe('difficultyScaler — property-based tests', () => {
  /**
   * Property 1: Difficulty parameters are monotonically non-decreasing
   * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7, 6.2
   */
  it('Property 1: difficulty parameters are monotonically non-decreasing', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), (n) => {
        const a = difficultyScaler(n);
        const b = difficultyScaler(n + 1);
        return (
          b.aiSpawnChance >= a.aiSpawnChance &&
          b.aiEconomyPriority >= a.aiEconomyPriority &&
          b.aiEliteUnitChance >= a.aiEliteUnitChance &&
          b.aiSpecialUnitChance >= a.aiSpecialUnitChance
        );
      }),
      { numRuns: 25 }
    );
  });

  /**
   * Property 2: All difficulty fields are finite and within defined bounds
   * Validates: Requirements 3.6, 6.1
   */
  it('Property 2: all difficulty fields are finite and within defined bounds', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (n) => {
        const cfg = difficultyScaler(n);
        return (
          isFinite(cfg.aiSpawnChance)       && cfg.aiSpawnChance       <= 0.25 &&
          isFinite(cfg.aiEconomyPriority)   && cfg.aiEconomyPriority   <= 0.95 &&
          isFinite(cfg.aiEliteUnitChance)   && cfg.aiEliteUnitChance   <= 0.70 &&
          isFinite(cfg.aiSpecialUnitChance) && cfg.aiSpecialUnitChance <= 0.50
        );
      }),
      { numRuns: 25 }
    );
  });

  /**
   * Property 3: difficultyScaler is a pure function
   * Validates: Requirements 6.3
   */
  it('Property 3: difficultyScaler is a pure function', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (n) => {
        return JSON.stringify(difficultyScaler(n)) === JSON.stringify(difficultyScaler(n));
      }),
      { numRuns: 25 }
    );
  });
});

// ---------------------------------------------------------------------------
// Reducer level-transition properties (task 4.7)
// ---------------------------------------------------------------------------

import { gameReducer, initialGameState } from '../engine/GameStateReducer';
import { BASE_HEALTH } from '../constants';
import { UnitType, Faction } from '../types';

describe('gameReducer — level transition property-based tests', () => {
  /**
   * Property 4: Battlefield is fully reset on level advance
   * Validates: Requirements 2.2
   */
  it('Property 4: battlefield is fully reset on level advance', () => {
    // Arbitrary unit: only the fields that GameUnit requires
    const arbitraryUnit = fc.record({
      instanceId: fc.string(),
      id: fc.string(),
      type: fc.constantFrom(...Object.values(UnitType)),
      name: fc.string(),
      cost: fc.integer({ min: 0, max: 1000 }),
      baseUpgradeCost: fc.integer({ min: 0, max: 1000 }),
      attack: fc.integer({ min: 0, max: 1000 }),
      hp: fc.integer({ min: 1, max: 10000 }),
      speed: fc.float({ min: 0, max: 2 }),
      range: fc.integer({ min: 0, max: 100 }),
      gatherRate: fc.float({ min: 0, max: 1 }),
      attackSpeed: fc.integer({ min: 0, max: 5000 }),
      description: fc.string(),
      emoji: fc.string(),
      faction: fc.constantFrom(Faction.BEES, Faction.ANTS),
      lane: fc.integer({ min: 0, max: 4 }),
      position: fc.integer({ min: 0, max: 100 }),
      currentHp: fc.integer({ min: 0, max: 10000 }),
      lastAttackTime: fc.integer({ min: 0, max: 1000000 }),
      isAttacking: fc.boolean(),
      isCarrying: fc.boolean(),
    });

    const arbitraryGameState = fc.record({
      units: fc.array(arbitraryUnit),
      beeBaseHealth: fc.integer({ min: 0, max: 1000 }),
      antBaseHealth: fc.integer({ min: 0, max: 1000 }),
    }).map(({ units, beeBaseHealth, antBaseHealth }) => ({
      ...initialGameState,
      units,
      beeBaseHealth,
      antBaseHealth,
    }));

    fc.assert(
      fc.property(arbitraryGameState, (state) => {
        const next = gameReducer(state, { type: 'ADVANCE_LEVEL' });
        return (
          next.units.length === 0 &&
          next.beeBaseHealth === BASE_HEALTH &&
          next.antBaseHealth === BASE_HEALTH
        );
      }),
      { numRuns: 25 }
    );
  });

  /**
   * Property 5: Player progression is preserved across level transitions
   * Validates: Requirements 2.3
   */
  it('Property 5: player progression is preserved across level transitions', () => {
    const arbitraryUnitLevels = fc.record({
      [UnitType.WORKER]: fc.integer({ min: 1, max: 10 }),
      [UnitType.GATHERER]: fc.integer({ min: 1, max: 10 }),
      [UnitType.SOLDIER]: fc.integer({ min: 1, max: 10 }),
      [UnitType.ELITE]: fc.integer({ min: 1, max: 10 }),
      [UnitType.SPECIAL]: fc.integer({ min: 1, max: 10 }),
    });

    fc.assert(
      fc.property(arbitraryUnitLevels, (unitLevels) => {
        const state = { ...initialGameState, unitLevels };
        const next = gameReducer(state, { type: 'ADVANCE_LEVEL' });
        return JSON.stringify(next.unitLevels) === JSON.stringify(unitLevels);
      }),
      { numRuns: 25 }
    );
  });
});
