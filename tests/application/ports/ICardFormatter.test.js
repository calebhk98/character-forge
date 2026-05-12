/**
 * @file Tests for ICardFormatter port contract.
 */

import { describe, it, expect } from 'vitest';
import { ICardFormatter } from '../../../src/application/ports/ICardFormatter.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

describe('ICardFormatter (port)', () => {
    it('should throw on base class format()', () => {
        const formatter = new ICardFormatter();
        const character = new Character({
            name: 'test',
            description: 'test desc',
            personality: 'test personality',
            scenario: 'test scenario',
            first_mes: 'hello',
            mes_example: 'test example',
        });
        expect(() => formatter.format(character)).toThrow('ICardFormatter.format must be implemented by subclass');
    });

    it('should throw on base class format() with lorebook', () => {
        const formatter = new ICardFormatter();
        const character = new Character({
            name: 'test',
            description: 'test desc',
            personality: 'test personality',
            scenario: 'test scenario',
            first_mes: 'hello',
            mes_example: 'test example',
        });
        const lorebook = new Lorebook({ name: 'test lorebook' });
        expect(() => formatter.format(character, lorebook)).toThrow('ICardFormatter.format must be implemented by subclass');
    });
});
