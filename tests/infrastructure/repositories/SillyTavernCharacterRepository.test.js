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

describe('SillyTavernCharacterRepository - save()', () => {
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

        const { createPlaceholderPng } = await import('../../../src/infrastructure/utils/PngChunkWriter.js');
        const pngBytes = createPlaceholderPng();

        const result = await new SillyTavernCharacterRepository(mockContext()).save(mockCard('Test'), pngBytes);
        expect(result).toBe('portrait.png');

        const avatarBlob = lastFetchOptions().body.get('avatar');
        expect(avatarBlob.type).toBe('image/png');
    });
});

describe('SillyTavernCharacterRepository - list()', () => {
    beforeEach(() => { /** @type {any} */ (globalThis).fetch = vi.fn(); });
    afterEach(() => { vi.restoreAllMocks(); });

    it('should POST to /api/characters/all and return sorted stubs', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([
                { name: 'Zara', avatar: 'Zara.png' },
                { name: 'Alice', avatar: 'Alice.png' },
            ]),
        });

        const result = await new SillyTavernCharacterRepository(mockContext()).list();

        const [url, opts] = /** @type {any} */ (globalThis).fetch.mock.calls[0];
        expect(url).toBe('/api/characters/all');
        expect(opts.method).toBe('POST');
        expect(JSON.parse(opts.body)).toEqual({ reset_cache: false });

        expect(result).toEqual([
            { name: 'Alice', avatarUrl: 'Alice.png' },
            { name: 'Zara', avatarUrl: 'Zara.png' },
        ]);
    });

    it('should return an empty array when no characters exist', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([]),
        });

        const result = await new SillyTavernCharacterRepository(mockContext()).list();
        expect(result).toEqual([]);
    });

    it('should include CSRF token in list request headers', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue([]),
        });
        const ctx = mockContext();
        await new SillyTavernCharacterRepository(ctx).list();

        expect(lastFetchOptions().headers['X-CSRF-Token']).toBe('test-token');
    });

    it('should throw when list response is not ok', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({ ok: false, statusText: 'Forbidden' });
        await expect(
            new SillyTavernCharacterRepository(mockContext()).list(),
        ).rejects.toThrow('Failed to list characters: Forbidden');
    });

    it('should propagate network errors on list', async () => {
        const err = new Error('Network request failed');
        /** @type {any} */ (globalThis).fetch.mockRejectedValue(err);
        await expect(
            new SillyTavernCharacterRepository(mockContext()).list(),
        ).rejects.toBe(err);
    });
});

describe('SillyTavernCharacterRepository - load()', () => {
    beforeEach(() => { /** @type {any} */ (globalThis).fetch = vi.fn(); });
    afterEach(() => { vi.restoreAllMocks(); });

    it('should GET /api/characters?avatar_url=<encoded> and return parsed JSON', async () => {
        const card = mockCard('Alice');
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(card),
        });

        const result = await new SillyTavernCharacterRepository(mockContext()).load('Alice.png');

        const [url, opts] = /** @type {any} */ (globalThis).fetch.mock.calls[0];
        expect(url).toBe('/api/characters?avatar_url=Alice.png');
        expect(opts.method).toBe('GET');
        expect(result).toEqual(card);
    });

    it('should percent-encode special characters in avatar_url', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(mockCard('My Char')),
        });

        await new SillyTavernCharacterRepository(mockContext()).load('My Char.png');

        const [url] = /** @type {any} */ (globalThis).fetch.mock.calls[0];
        expect(url).toBe('/api/characters?avatar_url=My%20Char.png');
    });

    it('should include CSRF token in load request headers', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(mockCard('Alice')),
        });
        const ctx = mockContext();
        await new SillyTavernCharacterRepository(ctx).load('Alice.png');

        expect(lastFetchOptions().headers['X-CSRF-Token']).toBe('test-token');
    });

    it('should throw when load response is 404', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });
        await expect(
            new SillyTavernCharacterRepository(mockContext()).load('missing.png'),
        ).rejects.toThrow('Failed to load character: Not Found');
    });

    it('should propagate malformed JSON error from response', async () => {
        const parseError = new SyntaxError('Unexpected token < in JSON');
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockRejectedValue(parseError),
        });
        await expect(
            new SillyTavernCharacterRepository(mockContext()).load('broken.png'),
        ).rejects.toBe(parseError);
    });

    it('should propagate network errors on load', async () => {
        const err = new Error('Network request failed');
        /** @type {any} */ (globalThis).fetch.mockRejectedValue(err);
        await expect(
            new SillyTavernCharacterRepository(mockContext()).load('Alice.png'),
        ).rejects.toBe(err);
    });

    it('should work with no context on load (empty headers)', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(mockCard('Alice')),
        });
        await new SillyTavernCharacterRepository(null).load('Alice.png');
        expect(lastFetchOptions().headers).toEqual({});
    });
});

describe('SillyTavernCharacterRepository - save() header handling', () => {
    beforeEach(() => { /** @type {any} */ (globalThis).fetch = vi.fn(); });
    afterEach(() => { vi.restoreAllMocks(); });

    it('should strip Content-Type even when getRequestHeaders returns it (older ST versions)', async () => {
        /** @type {any} */ (globalThis).fetch.mockResolvedValue(mockOkResponse('t.png'));
        const ctx = {
            getRequestHeaders: vi.fn().mockReturnValue({
                'Content-Type': 'application/json',
                'X-CSRF-Token': 'test-token',
            }),
        };
        await new SillyTavernCharacterRepository(ctx).save(mockCard('Test'));

        expect(lastFetchOptions().headers['Content-Type']).toBeUndefined();
        expect(lastFetchOptions().headers['X-CSRF-Token']).toBe('test-token');
    });
});
