/**
 * @file Tests for SillyTavernCharacterRepository adapter.
 */

// @ts-check
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SillyTavernCharacterRepository } from '../../../src/infrastructure/repositories/SillyTavernCharacterRepository.js';
import { ICharacterRepository } from '../../../src/application/ports/ICharacterRepository.js';

/**
 * Create mock card with given name.
 *
 * @param {string} [name] - character name
 * @returns {object} card JSON
 */
function mockCard(name) {
    return {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: name ? { name } : {},
    };
}

/**
 * Create successful mock response.
 *
 * @param {string} [filename] - response filename
 * @returns {object} mock response
 */
function mockSuccessResponse(filename) {
    return {
        ok: true,
        json: vi.fn().mockResolvedValue(filename ? { filename } : {}),
    };
}

describe('SillyTavernCharacterRepository', () => {
    let mockContext;

    beforeEach(() => {
        mockContext = {};
        /** @type {any} */ (globalThis).fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should extend ICharacterRepository', () => {
        const repository = new SillyTavernCharacterRepository(mockContext);
        expect(repository).toBeInstanceOf(ICharacterRepository);
    });

    it('should POST to /api/characters/import', async () => {
        const card = mockCard('TestCharacter');
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockSuccessResponse('test.json'));

        const repository = new SillyTavernCharacterRepository(mockContext);
        const result = await repository.save(card);

        expect(/** @type {any} */ (globalThis).fetch).toHaveBeenCalledWith(
            '/api/characters/import',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(card),
            },
        );

        expect(result).toBe('test.json');
    });

    it('should sanitize character name if no filename in response', async () => {
        const card = mockCard('My Test-Character!@#');
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockSuccessResponse());

        const repository = new SillyTavernCharacterRepository(mockContext);
        const result = await repository.save(card);

        expect(result).toBe('My_Test-Character___');
    });

    it('should use default name when character has no name', async () => {
        const card = mockCard();
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockSuccessResponse());

        const repository = new SillyTavernCharacterRepository(mockContext);
        const result = await repository.save(card);

        expect(result).toBe('UnnamedCharacter');
    });

    it('should throw error if fetch response not ok', async () => {
        const card = mockCard('TestCharacter');
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: false,
            statusText: 'Internal Server Error',
        });

        const repository = new SillyTavernCharacterRepository(mockContext);

        await expect(repository.save(card)).rejects.toThrow(
            'Failed to save character: Internal Server Error',
        );
    });

    it('should propagate network errors', async () => {
        const card = mockCard('TestCharacter');
        const networkError = new Error('Network request failed');
        /** @type {any} */ (globalThis).fetch.mockRejectedValue(networkError);

        const repository = new SillyTavernCharacterRepository(mockContext);

        await expect(repository.save(card)).rejects.toBe(networkError);
    });

    it('should set Content-Type header correctly', async () => {
        const card = mockCard('Test');
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockSuccessResponse('test.json'));

        const repository = new SillyTavernCharacterRepository(mockContext);
        await repository.save(card);

        const callArgs = /** @type {any} */ (globalThis).fetch.mock.calls[0];
        expect(callArgs[1].headers['Content-Type']).toBe('application/json');
    });
});
