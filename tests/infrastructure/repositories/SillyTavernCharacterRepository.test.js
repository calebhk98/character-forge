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
    return { spec: 'chara_card_v3', spec_version: '3.0', data: name ? { name } : {} };
}

/**
 * Create a mock context with getRequestHeaders.
 *
 * @returns {object} mock context
 */
function mockContext() {
    return { getRequestHeaders: vi.fn().mockReturnValue({ 'X-CSRF-Token': 'test-token' }) };
}

/**
 * Return a mock fetch success response.
 *
 * @param {string} [file_name] - response file_name field
 * @returns {object} fetch response mock
 */
function mockOkResponse(file_name) {
    return { ok: true, json: vi.fn().mockResolvedValue(file_name ? { file_name } : {}) };
}

/**
 * Return the options object from the first fetch call.
 *
 * @returns {object} fetch options
 */
function lastFetchOptions() {
    return /** @type {any} */ (globalThis.fetch).mock.calls[0][1];
}

describe('SillyTavernCharacterRepository', () => {
    beforeEach(() => { /** @type {any} */ (globalThis).fetch = vi.fn(); });
    afterEach(() => { vi.restoreAllMocks(); });

    it('should extend ICharacterRepository', () => {
        expect(new SillyTavernCharacterRepository(mockContext())).toBeInstanceOf(ICharacterRepository);
    });

    it('should POST to /api/characters/import with FormData', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse('test.png'));
        await new SillyTavernCharacterRepository(mockContext()).save(mockCard('Test'));

        const [url, opts] = /** @type {any} */ (globalThis).fetch.mock.calls[0];
        expect(url).toBe('/api/characters/import');
        expect(opts.method).toBe('POST');
        expect(opts.body).toBeInstanceOf(FormData);
        expect(opts.body.get('file_type')).toBe('png');
        expect(opts.body.has('avatar')).toBe(true);
    });

    it('should upload a PNG blob (not JSON)', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse('test.png'));
        await new SillyTavernCharacterRepository(mockContext()).save(mockCard('Test'));

        const avatarBlob = lastFetchOptions().body.get('avatar');
        expect(avatarBlob.type).toBe('image/png');
    });

    it('should include CSRF token from getRequestHeaders', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse('t.png'));
        const ctx = mockContext();
        await new SillyTavernCharacterRepository(ctx).save(mockCard('Test'));

        expect(ctx.getRequestHeaders).toHaveBeenCalledWith({ omitContentType: true });
        expect(lastFetchOptions().headers['X-CSRF-Token']).toBe('test-token');
    });

    it('should return file_name from response', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse('TestCharacter.png'));
        const result = await new SillyTavernCharacterRepository(mockContext()).save(mockCard('Test'));
        expect(result).toBe('TestCharacter.png');
    });

    it('should fall back to sanitized name when response lacks file_name', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse());
        const result = await new SillyTavernCharacterRepository(mockContext()).save(mockCard('My Test!@#'));
        expect(result).toBe('My_Test___');
    });

    it('should use UnnamedCharacter when card has no name', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse());
        const result = await new SillyTavernCharacterRepository(mockContext()).save(mockCard());
        expect(result).toBe('UnnamedCharacter');
    });

    it('should throw error if response not ok', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({ ok: false, statusText: 'Server Error' });
        await expect(
            new SillyTavernCharacterRepository(mockContext()).save(mockCard('Test')),
        ).rejects.toThrow('Failed to save character: Server Error');
    });

    it('should propagate network errors', async () => {
        const err = new Error('Network request failed');
        /** @type {any} */ (globalThis).fetch.mockRejectedValue(err);
        await expect(
            new SillyTavernCharacterRepository(mockContext()).save(mockCard('Test')),
        ).rejects.toBe(err);
    });

    it('should work with no context (empty headers)', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse('t.png'));
        await new SillyTavernCharacterRepository(null).save(mockCard('Test'));
        expect(lastFetchOptions().headers).toEqual({});
    });

    it('should use provided pngBytes as the image carrier', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse('portrait.png'));

        // Provide a valid placeholder PNG so embedJsonInPng can parse it
        const { createPlaceholderPng } = await import('../../../src/infrastructure/utils/PngChunkWriter.js');
        const pngBytes = createPlaceholderPng();

        const result = await new SillyTavernCharacterRepository(mockContext()).save(mockCard('Test'), pngBytes);
        expect(result).toBe('portrait.png');

        const avatarBlob = lastFetchOptions().body.get('avatar');
        expect(avatarBlob.type).toBe('image/png');
    });
});
