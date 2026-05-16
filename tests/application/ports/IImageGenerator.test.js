/**
 * @file Tests for IImageGenerator port contract.
 */

import { describe, it, expect } from 'vitest';
import { IImageGenerator } from '../../../src/application/ports/IImageGenerator.js';

describe('IImageGenerator (port)', () => {
    it('should throw on base class isAvailable()', async () => {
        const gen = new IImageGenerator();
        await expect(gen.isAvailable()).rejects.toThrow('IImageGenerator.isAvailable must be implemented by subclass');
    });

    it('should throw on base class generatePortrait()', async () => {
        const gen = new IImageGenerator();
        await expect(gen.generatePortrait('a wizard')).rejects.toThrow('IImageGenerator.generatePortrait must be implemented by subclass');
    });

    it('should throw on base class generateExpression()', async () => {
        const gen = new IImageGenerator();
        await expect(gen.generateExpression('a wizard', 'happy')).rejects.toThrow('IImageGenerator.generateExpression must be implemented by subclass');
    });
});
