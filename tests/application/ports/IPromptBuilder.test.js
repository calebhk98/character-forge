/**
 * @file Tests for IPromptBuilder port contract.
 */

import { describe, it, expect } from 'vitest';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';

describe('IPromptBuilder (port)', () => {
    it('should throw on base class build()', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.build('test description')).toThrow('IPromptBuilder.build must be implemented by subclass');
    });

    it('should throw on base class build() with options', () => {
        const builder = new IPromptBuilder();
        expect(() => builder.build('test description', { temperature: 0.8 })).toThrow('IPromptBuilder.build must be implemented by subclass');
    });
});
