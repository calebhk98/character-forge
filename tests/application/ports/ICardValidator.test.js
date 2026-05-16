/**
 * @file Tests for ICardValidator abstract port.
 */

import { describe, it, expect } from 'vitest';
import { ICardValidator } from '../../../src/application/ports/ICardValidator.js';

describe('ICardValidator', () => {
    it('should throw when validate is called on base class', () => {
        const validator = new ICardValidator();

        expect(() => validator.validate({})).toThrow('ICardValidator.validate must be implemented by subclass');
    });
});
