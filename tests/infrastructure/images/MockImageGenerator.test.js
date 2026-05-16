/**
 * @file Tests for MockImageGenerator adapter.
 */

// @ts-check
import { describe, it, expect } from 'vitest';
import { MockImageGenerator } from '../../../src/infrastructure/images/MockImageGenerator.js';
import { IImageGenerator } from '../../../src/application/ports/IImageGenerator.js';

/** PNG signature bytes for validation. */
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

describe('MockImageGenerator', () => {
    it('should extend IImageGenerator', () => {
        expect(new MockImageGenerator()).toBeInstanceOf(IImageGenerator);
    });

    it('should report available by default', async () => {
        expect(await new MockImageGenerator().isAvailable()).toBe(true);
    });

    it('should report unavailable when configured', async () => {
        expect(await new MockImageGenerator({ available: false }).isAvailable()).toBe(false);
    });

    it('generatePortrait returns a Uint8Array', async () => {
        const result = await new MockImageGenerator().generatePortrait('a brave knight');
        expect(result).toBeInstanceOf(Uint8Array);
    });

    it('generatePortrait result starts with PNG signature', async () => {
        const result = await new MockImageGenerator().generatePortrait('test');
        expect(Array.from(result.slice(0, 8))).toEqual(PNG_SIGNATURE);
    });

    it('generateExpression returns a Uint8Array', async () => {
        const result = await new MockImageGenerator().generateExpression('a knight', 'happy');
        expect(result).toBeInstanceOf(Uint8Array);
    });

    it('generateExpression result starts with PNG signature', async () => {
        const result = await new MockImageGenerator().generateExpression('test', 'neutral');
        expect(Array.from(result.slice(0, 8))).toEqual(PNG_SIGNATURE);
    });

    it('generatePortrait throws when unavailable', async () => {
        const gen = new MockImageGenerator({ available: false });
        await expect(gen.generatePortrait('test')).rejects.toThrow();
    });

    it('generateExpression throws when unavailable', async () => {
        const gen = new MockImageGenerator({ available: false });
        await expect(gen.generateExpression('test', 'happy')).rejects.toThrow();
    });
});
