import { describe, it, expect } from 'vitest';
import { gameReducer, initialGameState, GameStateActions } from '../engine/GameStateReducer';
import { Faction, UnitType } from '../types';
import { BASE_HEALTH } from '../constants';

describe('GameStateReducer — level progression', () => {

  // ─── ADVANCE_LEVEL ────────────────────────────────────────────────────────

  describe('ADVANCE_LEVEL', () => {
    it('increments currentLevel by 1', () => {
      const state = { ...initialGameState, currentLevel: 3 };
      const next = gameReducer(state, GameStateActions.advanceLevel());
      expect(next.currentLevel).toBe(4);
    });

    it('sets units to []', () => {
      // Build a state that has some units present
      const stateWithUnits = {
        ...initialGameState,
        units: [
          {
            instanceId: 'bee_worker_1',
            faction: Faction.BEES,
            type: UnitType.WORKER,
            id: 'bee_worker',
            name: 'Pollen Puffer',
            cost: 5,
            baseUpgradeCost: 30,
            hp: 30,
            attack: 2,
            speed: 0.3,
            range: 5,
            gatherRate: 0.05,
            attackSpeed: 1000,
            description: 'Generates resources passively.',
            emoji: '🐝',
            lane: 0,
            position: 50,
            currentHp: 30,
            lastAttackTime: 0,
            isAttacking: false,
            isCarrying: false,
          },
        ],
      };
      const next = gameReducer(stateWithUnits, GameStateActions.advanceLevel());
      expect(next.units).toEqual([]);
    });

    it('sets beeBaseHealth to BASE_HEALTH', () => {
      const state = { ...initialGameState, beeBaseHealth: 10 };
      const next = gameReducer(state, GameStateActions.advanceLevel());
      expect(next.beeBaseHealth).toBe(BASE_HEALTH);
    });

    it('sets antBaseHealth to BASE_HEALTH', () => {
      const state = { ...initialGameState, antBaseHealth: 5 };
      const next = gameReducer(state, GameStateActions.advanceLevel());
      expect(next.antBaseHealth).toBe(BASE_HEALTH);
    });

    it('resets beeResources to initialGameState value', () => {
      const state = { ...initialGameState, beeResources: 999 };
      const next = gameReducer(state, GameStateActions.advanceLevel());
      expect(next.beeResources).toBe(initialGameState.beeResources);
    });

    it('resets antResources to initialGameState value', () => {
      const state = { ...initialGameState, antResources: 999 };
      const next = gameReducer(state, GameStateActions.advanceLevel());
      expect(next.antResources).toBe(initialGameState.antResources);
    });

    it('preserves unitLevels from the previous state', () => {
      const customUnitLevels: Record<UnitType, number> = {
        [UnitType.WORKER]: 3,
        [UnitType.GATHERER]: 2,
        [UnitType.SOLDIER]: 5,
        [UnitType.ELITE]: 4,
        [UnitType.SPECIAL]: 1,
      };
      const state = { ...initialGameState, unitLevels: customUnitLevels };
      const next = gameReducer(state, GameStateActions.advanceLevel());
      expect(next.unitLevels).toEqual(customUnitLevels);
    });

    it('sets gamePhase to "level_victory"', () => {
      const next = gameReducer(initialGameState, GameStateActions.advanceLevel());
      expect(next.gamePhase).toBe('level_victory');
    });
  });

  // ─── START_NEXT_LEVEL ─────────────────────────────────────────────────────

  describe('START_NEXT_LEVEL', () => {
    it('sets gamePhase to "playing"', () => {
      const state = { ...initialGameState, gamePhase: 'level_victory' as const, gameActive: false };
      const next = gameReducer(state, GameStateActions.startNextLevel());
      expect(next.gamePhase).toBe('playing');
    });

    it('sets gameActive to true', () => {
      const state = { ...initialGameState, gamePhase: 'level_victory' as const, gameActive: false };
      const next = gameReducer(state, GameStateActions.startNextLevel());
      expect(next.gameActive).toBe(true);
    });
  });

  // ─── RESTART_GAME ─────────────────────────────────────────────────────────

  describe('RESTART_GAME', () => {
    it('resets currentLevel to 1', () => {
      const state = { ...initialGameState, currentLevel: 7 };
      const next = gameReducer(state, GameStateActions.restartGame());
      expect(next.currentLevel).toBe(1);
    });
  });

  // ─── END_GAME ─────────────────────────────────────────────────────────────

  describe('END_GAME', () => {
    it('sets gamePhase to "level_victory" when Bees win', () => {
      const next = gameReducer(initialGameState, GameStateActions.endGame(Faction.BEES));
      expect(next.gamePhase).toBe('level_victory');
    });

    it('sets gamePhase to "game_over" when Ants win', () => {
      const next = gameReducer(initialGameState, GameStateActions.endGame(Faction.ANTS));
      expect(next.gamePhase).toBe('game_over');
    });
  });
});
