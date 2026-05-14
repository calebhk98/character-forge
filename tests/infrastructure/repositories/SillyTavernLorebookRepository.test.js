/**
 * @file Tests for SillyTavernLorebookRepository adapter.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';
import { SillyTavernLorebookRepository } from '../../../src/infrastructure/repositories/SillyTavernLorebookRepository.js';
import { ILorebookRepository } from '../../../src/application/ports/ILorebookRepository.js';

/**
 * Create a mock context with getRequestHeaders.
 *
 * @returns {object} mock context
 */
function mockContext() {
    return {
        getRequestHeaders: vi.fn().mockReturnValue({
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-token',
        }),
    };
}

describe('SillyTavernLorebookRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should extend ILorebookRepository', () => {
        const repo = new SillyTavernLorebookRepository(mockContext());
        expect(repo).toBeInstanceOf(ILorebookRepository);
    });

    it('should accept SillyTavern context in constructor', () => {
        const ctx = mockContext();
        const repo = new SillyTavernLorebookRepository(ctx);
        expect(repo.ctx).toBe(ctx);
    });

    it('should POST to /api/worldinfo/edit with JSON body', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true }),
        });

        const ctx = mockContext();
        const repo = new SillyTavernLorebookRepository(ctx);
        const entry = new LorebookEntry({ keys: ['test'], content: 'Test content' });
        const lorebook = new Lorebook({ name: 'Test Lorebook', entries: [entry] });

        await repo.save(lorebook);

        expect(globalThis.fetch).toHaveBeenCalledWith('/api/worldinfo/edit', expect.objectContaining({
            method: 'POST',
        }));

        const body = JSON.parse(/** @type {any} */ (globalThis.fetch).mock.calls[0][1].body);
        expect(body.name).toBe('Test Lorebook');
        expect(body.data.entries['0'].key).toEqual(['test']);
        expect(body.data.entries['0'].content).toBe('Test content');
    });

    it('should include CSRF token from getRequestHeaders', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

        const ctx = mockContext();
        const repo = new SillyTavernLorebookRepository(ctx);
        const lorebook = new Lorebook({ name: 'Test Lorebook' });

        await repo.save(lorebook);

        expect(ctx.getRequestHeaders).toHaveBeenCalled();
        const headers = /** @type {any} */ (globalThis.fetch).mock.calls[0][1].headers;
        expect(headers['X-CSRF-Token']).toBe('test-token');
    });

    it('should return the lorebook name as identifier', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

        const repo = new SillyTavernLorebookRepository(mockContext());
        const lorebook = new Lorebook({ name: 'My Lorebook' });

        const result = await repo.save(lorebook);

        expect(result).toBe('My Lorebook');
    });

    it('should fall back to "Generated Lorebook" when name is absent', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

        const repo = new SillyTavernLorebookRepository(mockContext());
        const lorebook = new Lorebook({});

        const result = await repo.save(lorebook);

        expect(result).toBe('Generated Lorebook');
    });

    it('should throw error on failed save', async () => {
        // @ts-ignore - mocking fetch globally
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            statusText: 'Internal Server Error',
        });

        const repo = new SillyTavernLorebookRepository(mockContext());
        const lorebook = new Lorebook({ name: 'Test Lorebook' });

        await expect(repo.save(lorebook)).rejects.toThrow('Failed to save lorebook');
    });
});
