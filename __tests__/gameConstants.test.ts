import { describe, it, expect } from 'vitest';
import {
  GAME_CONFIG,
  CENTER_LANE_INDEX,
  validateLane,
  validatePosition,
  isCenterLane,
  isResourceLane,
  isCombatLane,
  getCombatLanes,
  calculateUpgradeCost,
  calculateStatMultiplier,
  calculateDefensiveBonus,
  calculateDamageMultiplier,
  validateUnitPlacement,
} from '../utils/gameConstants';

describe('Game Constants', () => {
  describe('GAME_CONFIG', () => {
    it('should have valid tick rate', () => {
      expect(GAME_CONFIG.GAME_TICK_MS).toBe(50);
    });

    it('should have 7 lanes', () => {
      expect(GAME_CONFIG.LANE_COUNT).toBe(7);
    });

    it('should have 200 base health', () => {
      expect(GAME_CONFIG.BASE_HEALTH).toBe(200);
    });
  });

  describe('CENTER_LANE_INDEX', () => {
    it('should be the middle lane (index 3 for 7 lanes)', () => {
      expect(CENTER_LANE_INDEX).toBe(3);
    });
  });

  describe('validateLane', () => {
    it('should return true for valid lanes', () => {
      expect(validateLane(0)).toBe(true);
      expect(validateLane(3)).toBe(true);
      expect(validateLane(6)).toBe(true);
    });

    it('should return false for invalid lanes', () => {
      expect(validateLane(-1)).toBe(false);
      expect(validateLane(7)).toBe(false);
      expect(validateLane(100)).toBe(false);
    });
  });

  describe('validatePosition', () => {
    it('should return true for valid positions', () => {
      expect(validatePosition(0)).toBe(true);
      expect(validatePosition(50)).toBe(true);
      expect(validatePosition(100)).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(validatePosition(-1)).toBe(false);
      expect(validatePosition(101)).toBe(false);
    });
  });

  describe('lane type checks', () => {
    it('should identify center lane correctly', () => {
      expect(isCenterLane(3)).toBe(true);
      expect(isCenterLane(0)).toBe(false);
      expect(isCenterLane(6)).toBe(false);
    });

    it('should identify resource lane as center lane', () => {
      expect(isResourceLane(3)).toBe(true);
      expect(isResourceLane(0)).toBe(false);
    });

    it('should identify combat lanes correctly', () => {
      expect(isCombatLane(0)).toBe(true);
      expect(isCombatLane(1)).toBe(true);
      expect(isCombatLane(3)).toBe(false); // center lane
      expect(isCombatLane(6)).toBe(true);
    });

    it('should return all combat lanes', () => {
      const combatLanes = getCombatLanes();
      expect(combatLanes).toEqual([0, 1, 2, 4, 5, 6]);
      expect(combatLanes).not.toContain(3); // center lane
    });
  });

  describe('calculateUpgradeCost', () => {
    it('should return base cost at level 1', () => {
      expect(calculateUpgradeCost(100, 1)).toBe(100);
    });

    it('should apply 1.5x multiplier at level 2', () => {
      expect(calculateUpgradeCost(100, 2)).toBe(150);
    });

    it('should compound multiplier at higher levels', () => {
      expect(calculateUpgradeCost(100, 3)).toBe(225);
    });
  });

  describe('calculateStatMultiplier', () => {
    it('should return 1 at level 1', () => {
      expect(calculateStatMultiplier(1)).toBe(1);
    });

    it('should apply 50% bonus at level 2', () => {
      expect(calculateStatMultiplier(2)).toBe(1.5);
    });

    it('should compound at level 3', () => {
      expect(calculateStatMultiplier(3)).toBeCloseTo(2.25, 2);
    });
  });

  describe('calculateDefensiveBonus', () => {
    it('should return 0 with no allies', () => {
      expect(calculateDefensiveBonus(0)).toBe(0);
    });

    it('should return 10% per ally', () => {
      expect(calculateDefensiveBonus(1)).toBe(0.1);
      expect(calculateDefensiveBonus(2)).toBe(0.2);
    });

    it('should cap at 50%', () => {
      expect(calculateDefensiveBonus(5)).toBe(0.5);
      expect(calculateDefensiveBonus(10)).toBe(0.5);
    });
  });

  describe('calculateDamageMultiplier', () => {
    it('should return 1 with no allies (no reduction)', () => {
      expect(calculateDamageMultiplier(0)).toBe(1);
    });

    it('should reduce damage based on allies', () => {
      expect(calculateDamageMultiplier(1)).toBe(0.9);
      expect(calculateDamageMultiplier(5)).toBe(0.5);
    });
  });

  describe('validateUnitPlacement', () => {
    it('should allow gatherers only in center lane', () => {
      expect(validateUnitPlacement('GATHERER', 3).valid).toBe(true);
      expect(validateUnitPlacement('GATHERER', 0).valid).toBe(false);
      expect(validateUnitPlacement('GATHERER', 0).reason).toContain('Resource Corridor');
    });

    it('should block combat units from center lane', () => {
      expect(validateUnitPlacement('SOLDIER', 0).valid).toBe(true);
      expect(validateUnitPlacement('SOLDIER', 3).valid).toBe(false);
      expect(validateUnitPlacement('SOLDIER', 3).reason).toContain('Resource Corridor');
    });

    it('should reject invalid lane numbers', () => {
      expect(validateUnitPlacement('SOLDIER', -1).valid).toBe(false);
      expect(validateUnitPlacement('SOLDIER', 100).valid).toBe(false);
    });
  });
});
