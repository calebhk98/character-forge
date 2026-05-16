/**
 * @file Tests for SillyTavernImageGenerator adapter.
 */

// @ts-check
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SillyTavernImageGenerator } from '../../../src/infrastructure/images/SillyTavernImageGenerator.js';
import { IImageGenerator } from '../../../src/application/ports/IImageGenerator.js';

/** Minimal PNG data URL (1x1 grey pixel). */
const MOCK_IMAGE_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Create a mock fetch response that returns a small ArrayBuffer.
 *
 * @returns {object} mock fetch response
 */
function mockFetchResponse() {
    return {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    };
}

beforeEach(() => {
    vi.stubGlobal('generatePicture', undefined);
    /** @type {any} */ (globalThis).fetch = vi.fn().mockResolvedValue(mockFetchResponse());
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('SillyTavernImageGenerator', () => {
    it('should extend IImageGenerator', () => {
        expect(new SillyTavernImageGenerator({})).toBeInstanceOf(IImageGenerator);
    });
});

describe('SillyTavernImageGenerator.isAvailable()', () => {
    it('returns false when generatePicture is not a function', async () => {
        vi.stubGlobal('generatePicture', undefined);
        expect(await new SillyTavernImageGenerator({}).isAvailable()).toBe(false);
    });

    it('returns true when generatePicture is a function', async () => {
        vi.stubGlobal('generatePicture', vi.fn());
        expect(await new SillyTavernImageGenerator({}).isAvailable()).toBe(true);
    });
});

describe('SillyTavernImageGenerator.generatePortrait()', () => {
    it('calls globalThis.generatePicture with a string prompt', async () => {
        const mockGenerate = vi.fn().mockResolvedValue(MOCK_IMAGE_URL);
        vi.stubGlobal('generatePicture', mockGenerate);

        await new SillyTavernImageGenerator({}).generatePortrait('a brave knight');

        expect(mockGenerate).toHaveBeenCalled();
        expect(typeof mockGenerate.mock.calls[0][0]).toBe('string');
    });

    it('returns Uint8Array from fetched image', async () => {
        vi.stubGlobal('generatePicture', vi.fn().mockResolvedValue(MOCK_IMAGE_URL));
        const pngBytes = new Uint8Array([1, 2, 3, 4]);
        /** @type {any} */ (globalThis).fetch = vi.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(pngBytes.buffer),
        });

        const result = await new SillyTavernImageGenerator({}).generatePortrait('test');
        expect(result).toBeInstanceOf(Uint8Array);
    });

    it('throws when generatePicture is not available', async () => {
        vi.stubGlobal('generatePicture', undefined);
        await expect(new SillyTavernImageGenerator({}).generatePortrait('test')).rejects.toThrow();
    });

    it('propagates errors from generatePicture', async () => {
        vi.stubGlobal('generatePicture', vi.fn().mockRejectedValue(new Error('SD offline')));
        await expect(new SillyTavernImageGenerator({}).generatePortrait('test')).rejects.toThrow('SD offline');
    });
});

describe('SillyTavernImageGenerator.generateExpression()', () => {
    it('calls globalThis.generatePicture with a prompt containing the emotion', async () => {
        const mockGenerate = vi.fn().mockResolvedValue(MOCK_IMAGE_URL);
        vi.stubGlobal('generatePicture', mockGenerate);

        await new SillyTavernImageGenerator({}).generateExpression('a knight', 'happy');

        expect(mockGenerate).toHaveBeenCalled();
        const prompt = mockGenerate.mock.calls[0][0];
        expect(typeof prompt).toBe('string');
        expect(prompt.toLowerCase()).toContain('happy');
    });

    it('returns Uint8Array', async () => {
        vi.stubGlobal('generatePicture', vi.fn().mockResolvedValue(MOCK_IMAGE_URL));
        const result = await new SillyTavernImageGenerator({}).generateExpression('a knight', 'neutral');
        expect(result).toBeInstanceOf(Uint8Array);
    });
});
