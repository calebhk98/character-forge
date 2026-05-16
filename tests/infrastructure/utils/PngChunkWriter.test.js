/**
 * @file Tests for PngChunkWriter utility — PNG tEXt chunk embedding.
 */

// @ts-check
import { describe, it, expect } from 'vitest';
import { embedJsonInPng, createPlaceholderPng } from '../../../src/infrastructure/utils/PngChunkWriter.js';

/** PNG file signature bytes. */
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** IEND chunk bytes (length=0, type="IEND", known CRC). */
const IEND_CHUNK = [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];

/**
 * Search for a byte subsequence inside a Uint8Array.
 *
 * @param {Uint8Array} haystack - bytes to search
 * @param {number[]} needle - sequence to find
 * @returns {boolean} true if found
 */
function containsSequence(haystack, needle) {
    outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                continue outer;
            }
        }
        return true;
    }
    return false;
}

/**
 * Locate the start of ccv3 chunk data and read the embedded base64 JSON.
 *
 * @param {Uint8Array} png - result of embedJsonInPng
 * @returns {object|null} parsed JSON or null if not found
 */
function extractCcv3Json(png) {
    // "ccv3\0" bytes: 99 99 118 51 0
    const keyword = [99, 99, 118, 51, 0];
    for (let i = 8; i <= png.length - keyword.length; i++) {
        let match = true;
        for (let j = 0; j < keyword.length; j++) {
            if (png[i + j] !== keyword[j]) { match = false; break; }
        }
        if (!match) continue;

        // The chunk data length is 8 bytes before this position (4 len + 4 "tEXt")
        const lenOffset = i - 8;
        const dataLen = (png[lenOffset] << 24 | png[lenOffset + 1] << 16 |
            png[lenOffset + 2] << 8 | png[lenOffset + 3]) >>> 0;
        const b64Start = i + keyword.length;
        const b64Len = dataLen - keyword.length;
        const b64Str = String.fromCharCode(...png.slice(b64Start, b64Start + b64Len));
        return JSON.parse(new TextDecoder().decode(
            Uint8Array.from(atob(b64Str), c => c.charCodeAt(0)),
        ));
    }
    return null;
}

describe('createPlaceholderPng', () => {
    it('returns a Uint8Array', () => {
        expect(createPlaceholderPng()).toBeInstanceOf(Uint8Array);
    });

    it('starts with PNG signature', () => {
        const png = createPlaceholderPng();
        expect(Array.from(png.slice(0, 8))).toEqual(PNG_SIGNATURE);
    });

    it('ends with IEND chunk', () => {
        const png = createPlaceholderPng();
        expect(Array.from(png.slice(-12))).toEqual(IEND_CHUNK);
    });

    it('has a non-trivial length (at least IHDR + IDAT + IEND)', () => {
        expect(createPlaceholderPng().length).toBeGreaterThan(30);
    });
});

describe('embedJsonInPng', () => {
    it('returns a Uint8Array', () => {
        const result = embedJsonInPng(createPlaceholderPng(), {});
        expect(result).toBeInstanceOf(Uint8Array);
    });

    it('throws when input does not start with PNG signature', () => {
        const notPng = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        expect(() => embedJsonInPng(notPng, {})).toThrow(/invalid png/i);
    });

    it('result starts with PNG signature', () => {
        const result = embedJsonInPng(createPlaceholderPng(), {});
        expect(Array.from(result.slice(0, 8))).toEqual(PNG_SIGNATURE);
    });

    it('result ends with IEND chunk', () => {
        const result = embedJsonInPng(createPlaceholderPng(), {});
        expect(Array.from(result.slice(-12))).toEqual(IEND_CHUNK);
    });

    it('result is larger than input (new chunks were inserted)', () => {
        const original = createPlaceholderPng();
        const result = embedJsonInPng(original, { spec: 'chara_card_v3' });
        expect(result.length).toBeGreaterThan(original.length);
    });

    it('embeds ccv3 keyword in a tEXt chunk', () => {
        const result = embedJsonInPng(createPlaceholderPng(), { spec: 'chara_card_v3' });
        // "ccv3\0" as bytes: 99 99 118 51 0
        expect(containsSequence(result, [99, 99, 118, 51, 0])).toBe(true);
    });

    it('embeds chara keyword in a tEXt chunk', () => {
        const result = embedJsonInPng(createPlaceholderPng(), { spec: 'chara_card_v3' });
        // "chara\0" as bytes: 99 104 97 114 97 0
        expect(containsSequence(result, [99, 104, 97, 114, 97, 0])).toBe(true);
    });

    it('embeds tEXt chunk type bytes', () => {
        const result = embedJsonInPng(createPlaceholderPng(), {});
        // "tEXt" as bytes: 116 69 88 116
        expect(containsSequence(result, [116, 69, 88, 116])).toBe(true);
    });

    it('round-trips card JSON through ccv3 chunk', () => {
        const card = { spec: 'chara_card_v3', data: { name: 'Alice', description: 'A test' } };
        const result = embedJsonInPng(createPlaceholderPng(), card);
        expect(extractCcv3Json(result)).toEqual(card);
    });
});
