import { describe, it, expect, beforeEach } from 'vitest';
import { FacetManager } from '../../../src/manager/facet-manager.js';
import { FacetManagerTransaction } from '../../../src/manager/facet-manager-transaction.js';
import { Facet } from '../../../src/core/facet.js';

describe('FacetManagerTransaction', () => {
  let manager;
  let mockSubsystem;

  beforeEach(() => {
    mockSubsystem = {
      name: 'test-subsystem',
      ctx: { debug: false }
    };
    manager = new FacetManager(mockSubsystem);
  });

  describe('transaction lifecycle', () => {
    it('should begin and commit transaction', async () => {
      const transaction = new FacetManagerTransaction(manager, mockSubsystem);
      transaction.beginTransaction();
      
      const facet = new Facet('database', { attach: true });
      await manager.add('database', facet, { init: false });
      transaction.trackAddition('database');

      transaction.commit();

      const found = manager.find('database');
      expect(found).toBe(facet);
    });

    it('should rollback transaction', async () => {
      const transaction = new FacetManagerTransaction(manager, mockSubsystem);
      transaction.beginTransaction();
      
      const facet = new Facet('database', { attach: true });
      await manager.add('database', facet, { init: false });
      transaction.trackAddition('database');

      await transaction.rollback();

      const found = manager.find('database');
      expect(found).toBeUndefined();
    });
  });

  describe('nested transactions', () => {
    it('should support nested transactions', async () => {
      const transaction1 = new FacetManagerTransaction(manager, mockSubsystem);
      transaction1.beginTransaction();
      
      const facet1 = new Facet('database', { attach: true });
      await manager.add('database', facet1, { init: false });
      transaction1.trackAddition('database');

      const transaction2 = new FacetManagerTransaction(manager, mockSubsystem);
      transaction2.beginTransaction();
      
      const facet2 = new Facet('cache', { attach: true });
      await manager.add('cache', facet2, { init: false });
      transaction2.trackAddition('cache');

      transaction2.commit();
      transaction1.commit();

      expect(manager.find('database')).toBe(facet1);
      expect(manager.find('cache')).toBe(facet2);
    });
  });
});

