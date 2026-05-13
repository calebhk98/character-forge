/**
 * @file Tests for SillyTavernLorebookRepository adapter.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';
import { SillyTavernLorebookRepository } from '../../../src/infrastructure/repositories/SillyTavernLorebookRepository.js';
import { ILorebookRepository } from '../../../src/application/ports/ILorebookRepository.js';

describe('SillyTavernLorebookRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

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

    it('should save lorebook and return identifier', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'test-lorebook-id', name: 'Test Lorebook' }),
        });

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

        const result = await repo.save(lorebook);

        expect(globalThis.fetch).toHaveBeenCalledWith('/api/worldinfo/import', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }));
        expect(result).toBe('test-lorebook-id');
    });

    it('should throw error on failed save', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Internal Server Error',
        });

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

        await expect(repo.save(lorebook)).rejects.toThrow('Failed to save lorebook');
    });

    it('should return fallback identifier if response lacks id', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        const mockContext = {};
        const repo = new SillyTavernLorebookRepository(mockContext);
        const lorebook = new Lorebook({
            name: 'Test Lorebook',
        });

        const result = await repo.save(lorebook);

        expect(result).toBe('Test Lorebook');
    });
});
