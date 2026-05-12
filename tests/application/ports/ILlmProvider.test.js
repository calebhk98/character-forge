/**
 * @file Tests for ILlmProvider port contract.
 */

import { describe, it, expect } from 'vitest';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';

describe('ILlmProvider (port)', () => {
    it('should throw on base class generate()', async () => {
        // TODO: verify that calling the base class method throws
        const provider = new ILlmProvider();
        await expect(() => provider.generate({ systemPrompt: '', userPrompt: '' }))
            .rejects
            .toThrow();
    });
});
