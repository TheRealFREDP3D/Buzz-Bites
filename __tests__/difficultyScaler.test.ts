import { describe, it, expect } from 'vitest';
import { difficultyScaler } from '../engine/difficultyScaler';
import { DEFAULT_ENGINE_CONFIG } from '../engine/GameEngine';

describe('difficultyScaler', () => {
  describe('level 1 — base config', () => {
    it('returns aiSpawnChance equal to DEFAULT_ENGINE_CONFIG', () => {
      const config = difficultyScaler(1);
      expect(config.aiSpawnChance).toBe(DEFAULT_ENGINE_CONFIG.aiSpawnChance);
    });

    it('returns aiEconomyPriority equal to DEFAULT_ENGINE_CONFIG', () => {
      const config = difficultyScaler(1);
      expect(config.aiEconomyPriority).toBe(DEFAULT_ENGINE_CONFIG.aiEconomyPriority);
    });

    it('returns aiEliteUnitChance equal to DEFAULT_ENGINE_CONFIG', () => {
      const config = difficultyScaler(1);
      expect(config.aiEliteUnitChance).toBe(DEFAULT_ENGINE_CONFIG.aiEliteUnitChance);
    });

    it('returns aiSpecialUnitChance equal to DEFAULT_ENGINE_CONFIG', () => {
      const config = difficultyScaler(1);
      expect(config.aiSpecialUnitChance).toBe(DEFAULT_ENGINE_CONFIG.aiSpecialUnitChance);
    });
  });

  describe('level 2 — one step above base', () => {
    it('increments aiSpawnChance by 0.01', () => {
      const config = difficultyScaler(2);
      expect(config.aiSpawnChance).toBeCloseTo(DEFAULT_ENGINE_CONFIG.aiSpawnChance + 0.01);
    });

    it('increments aiEconomyPriority by 0.05', () => {
      const config = difficultyScaler(2);
      expect(config.aiEconomyPriority).toBeCloseTo(DEFAULT_ENGINE_CONFIG.aiEconomyPriority + 0.05);
    });

    it('increments aiEliteUnitChance by 0.03', () => {
      const config = difficultyScaler(2);
      expect(config.aiEliteUnitChance).toBeCloseTo(DEFAULT_ENGINE_CONFIG.aiEliteUnitChance + 0.03);
    });

    it('increments aiSpecialUnitChance by 0.02', () => {
      const config = difficultyScaler(2);
      expect(config.aiSpecialUnitChance).toBeCloseTo(DEFAULT_ENGINE_CONFIG.aiSpecialUnitChance + 0.02);
    });
  });

  describe('level 1000 — clamped to maximums', () => {
    it('clamps aiSpawnChance to 0.25', () => {
      const config = difficultyScaler(1000);
      expect(config.aiSpawnChance).toBe(0.25);
    });

    it('clamps aiEconomyPriority to 0.95', () => {
      const config = difficultyScaler(1000);
      expect(config.aiEconomyPriority).toBe(0.95);
    });

    it('clamps aiEliteUnitChance to 0.70', () => {
      const config = difficultyScaler(1000);
      expect(config.aiEliteUnitChance).toBe(0.70);
    });

    it('clamps aiSpecialUnitChance to 0.50', () => {
      const config = difficultyScaler(1000);
      expect(config.aiSpecialUnitChance).toBe(0.50);
    });
  });

  describe('all four scaled fields are present and finite', () => {
    it('aiSpawnChance is a finite number', () => {
      const config = difficultyScaler(5);
      expect(typeof config.aiSpawnChance).toBe('number');
      expect(isFinite(config.aiSpawnChance)).toBe(true);
    });

    it('aiEconomyPriority is a finite number', () => {
      const config = difficultyScaler(5);
      expect(typeof config.aiEconomyPriority).toBe('number');
      expect(isFinite(config.aiEconomyPriority)).toBe(true);
    });

    it('aiEliteUnitChance is a finite number', () => {
      const config = difficultyScaler(5);
      expect(typeof config.aiEliteUnitChance).toBe('number');
      expect(isFinite(config.aiEliteUnitChance)).toBe(true);
    });

    it('aiSpecialUnitChance is a finite number', () => {
      const config = difficultyScaler(5);
      expect(typeof config.aiSpecialUnitChance).toBe('number');
      expect(isFinite(config.aiSpecialUnitChance)).toBe(true);
    });
  });
});
