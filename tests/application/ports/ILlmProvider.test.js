/**
 * @file Tests for ILlmProvider port contract.
 */

import { describe, it, expect } from 'vitest';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';

describe('ILlmProvider (port)', () => {
    it('should throw on base class generate()', async () => {
        const provider = new ILlmProvider();
        const request = { systemPrompt: 'test', userPrompt: 'test' };
        await expect(provider.generate(request)).rejects.toThrow('ILlmProvider.generate must be implemented by subclass');
    });
});
