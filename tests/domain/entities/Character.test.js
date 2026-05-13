/**
 * @file Tests for Character domain entity.
 */

import { describe, it, expect } from 'vitest';
import { Character } from '../../../src/domain/entities/Character.js';

/**
 * Helper to create valid character data.
 *
 * @returns {object} valid character data
 */
function validCharacterData() {
    return {
        name: 'Alice',
        description: 'A curious character',
        personality: 'Friendly and inquisitive',
        scenario: 'In a fantasy world',
        first_mes: 'Hello there!',
        mes_example: 'That sounds interesting.',
    };
}

describe('Character - construction', () => {
    it('should construct with required fields', () => {
        const data = validCharacterData();
        const character = new Character(data);
        expect(character.name).toBe('Alice');
        expect(character.description).toBe('A curious character');
        expect(character.personality).toBe('Friendly and inquisitive');
        expect(character.scenario).toBe('In a fantasy world');
        expect(character.first_mes).toBe('Hello there!');
        expect(character.mes_example).toBe('That sounds interesting.');
    });

    it('should allow optional fields to be undefined', () => {
        const data = validCharacterData();
        const character = new Character(data);
        expect(character.creator_notes).toBeUndefined();
        expect(character.system_prompt).toBeUndefined();
        expect(character.post_history_instructions).toBeUndefined();
    });

    it('should accept optional fields when provided', () => {
        const data = {
            ...validCharacterData(),
            creator_notes: 'Created for testing',
            system_prompt: 'Be helpful',
            post_history_instructions: 'Follow context',
        };
        const character = new Character(data);
        expect(character.creator_notes).toBe('Created for testing');
        expect(character.system_prompt).toBe('Be helpful');
        expect(character.post_history_instructions).toBe('Follow context');
    });
});

describe('Character - validation', () => {
    it('should throw when name is missing', () => {
        const data = validCharacterData();
        delete data.name;
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when description is missing', () => {
        const data = validCharacterData();
        delete data.description;
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when personality is missing', () => {
        const data = validCharacterData();
        delete data.personality;
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when scenario is missing', () => {
        const data = validCharacterData();
        delete data.scenario;
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when first_mes is missing', () => {
        const data = validCharacterData();
        delete data.first_mes;
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when mes_example is missing', () => {
        const data = validCharacterData();
        delete data.mes_example;
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when a required field is not a string', () => {
        const data = validCharacterData();
        data.name = 123;
        // @ts-expect-error intentionally passing invalid type
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when a required field is empty', () => {
        const data = validCharacterData();
        data.personality = '';
        expect(() => new Character(data)).toThrow();
    });

    it('should throw when a required field is whitespace-only', () => {
        const data = validCharacterData();
        data.description = '   ';
        expect(() => new Character(data)).toThrow();
    });
});
