/**
 * @file Tests for SillyTavernLorebookRepository adapter.
 */

import { describe, it, expect } from 'vitest';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';
import { SillyTavernLorebookRepository } from '../../../src/infrastructure/repositories/SillyTavernLorebookRepository.js';
import { ILorebookRepository } from '../../../src/application/ports/ILorebookRepository.js';

describe('SillyTavernLorebookRepository', () => {
    it('should extend ILorebookRepository', () => {
        const mockContext = {};
        const repo = new SillyTavernLorebookRepository(mockContext);
        expect(repo).toBeInstanceOf(ILorebookRepository);
    });

    it('should accept SillyTavern context in constructor', () => {
        const mockContext = { getWorldEntries: () => [] };
        const repo = new SillyTavernLorebookRepository(mockContext);
        expect(repo.ctx).toBe(mockContext);
    });

    it('should throw not implemented error on save', async () => {
        const mockContext = {};
        const repo = new SillyTavernLorebookRepository(mockContext);
        const entry = new LorebookEntry({
            keys: ['test'],
            content: 'Test content',
        });
        const lorebook = new Lorebook({
            name: 'Test Lorebook',
            entries: [entry],
        });

        await expect(repo.save(lorebook)).rejects.toThrow('not implemented');
    });
});
