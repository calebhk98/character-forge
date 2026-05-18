/**
 * @file Tests for CardV3Formatter adapter.
 */

import { describe, it, expect } from 'vitest';
import { CardV3Formatter } from '../../../src/infrastructure/formatters/CardV3Formatter.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

/**
 * Helper: create a basic character for tests.
 *
 * @returns {Character} basic character
 */
function createBasicCharacter() {
    return new Character({
        name: 'Aria',
        description: 'A mysterious mage',
        personality: 'Curious and witty',
        scenario: 'In a magical tower',
        first_mes: 'Welcome, traveler.',
        mes_example: 'How can I assist you?',
    });
}

/**
 * Helper: create a character with optional fields.
 *
 * @returns {Character} character with optional fields
 */
function createCharacterWithOptionals() {
    return new Character({
        name: 'Aria',
        description: 'A mysterious mage',
        personality: 'Curious and witty',
        scenario: 'In a magical tower',
        first_mes: 'Welcome, traveler.',
        mes_example: 'How can I assist you?',
        creator_notes: 'Created by user',
        system_prompt: 'You are a mage',
        post_history_instructions: 'Remember the context',
    });
}

/**
 * Helper: create a lorebook with entries.
 *
 * @returns {Lorebook} lorebook with sample entries
 */
function createLoreBook() {
    return new Lorebook({
        name: 'World Info',
        description: 'Background knowledge',
        scan_depth: 3,
        token_budget: 500,
        recursive_scanning: true,
        entries: [
            new LorebookEntry({
                keys: ['magic', 'spell'],
                content: 'Magic is the art of manipulation',
                name: 'Magic Entry',
                priority: 1,
            }),
            new LorebookEntry({
                keys: ['tower'],
                content: 'The tower stands tall',
            }),
        ],
    });
}

describe('CardV3Formatter', () => {
    it('should produce valid V3 structure from Character', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter());

        expect(result.spec).toBe('chara_card_v3');
        expect(result.spec_version).toBe('3.0');
        expect(result.data.name).toBe('Aria');
    });

    it('should include V3 required fields in data', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter());
        const { data } = result;

        expect(data).toHaveProperty('alternate_greetings');
        expect(data).toHaveProperty('tags');
        expect(data).toHaveProperty('extensions');
        expect(data).toHaveProperty('character_book');
    });

    it('should include optional character fields when present', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createCharacterWithOptionals());

        expect(result.data.creator_notes).toBe('Created by user');
        expect(result.data.system_prompt).toBe('You are a mage');
        expect(result.data.post_history_instructions).toBe('Remember the context');
    });

    it('should embed lorebook with entries in character_book', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter(), createLoreBook());

        expect(result.data.character_book.name).toBe('World Info');
        expect(result.data.character_book.entries).toHaveLength(2);
    });

    it('should handle empty lorebook gracefully', () => {
        const formatter = new CardV3Formatter();
        const lorebook = new Lorebook();
        const result = formatter.format(createBasicCharacter(), lorebook);

        expect(result.data.character_book.entries).toEqual([]);
    });

    it('should create default lorebook when none provided', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter());

        expect(result.data.character_book.entries).toEqual([]);
    });

    it('should include alternate_greetings from character in output', () => {
        const character = new Character({
            name: 'Aria',
            description: 'A mysterious mage',
            personality: 'Curious and witty',
            scenario: 'In a magical tower',
            first_mes: 'Welcome, traveler.',
            mes_example: 'How can I assist you?',
            alternate_greetings: ['A warm greeting.', 'A cold welcome.', 'A mysterious nod.'],
        });
        const formatter = new CardV3Formatter();
        const result = formatter.format(character);

        expect(result.data.alternate_greetings).toEqual([
            'A warm greeting.',
            'A cold welcome.',
            'A mysterious nod.',
        ]);
    });

    it('should output empty alternate_greetings when character has none', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter());

        expect(result.data.alternate_greetings).toEqual([]);
    });

});

describe('CardV3Formatter - tags', () => {
    it('should emit tags from character when tags are provided', () => {
        const character = new Character({
            name: 'Aria',
            description: 'A mysterious mage',
            personality: 'Curious and witty',
            scenario: 'In a magical tower',
            first_mes: 'Welcome, traveler.',
            mes_example: 'How can I assist you?',
            tags: ['fantasy', 'mage', 'female'],
        });
        const formatter = new CardV3Formatter();
        const result = formatter.format(character);

        expect(result.data.tags).toEqual(['fantasy', 'mage', 'female']);
    });

    it('should output empty tags when character has none', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter());

        expect(result.data.tags).toEqual([]);
    });
});

describe('CardV3Formatter (snapshots)', () => {
    it('should produce valid V3 structure snapshot', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter());

        expect(result).toMatchSnapshot();
    });

    it('should produce valid V3 structure with lorebook snapshot', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter(), createLoreBook());

        expect(result).toMatchSnapshot();
    });

    it('should produce valid V3 structure with optional fields snapshot', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createCharacterWithOptionals());

        expect(result).toMatchSnapshot();
    });
});

describe('CardV3Formatter - group_only_greetings', () => {
    it('should output empty group_only_greetings when character has none', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(createBasicCharacter());
        expect(result.data.group_only_greetings).toEqual([]);
    });

    it('should include group_only_greetings from character when present', () => {
        const character = new Character({
            name: 'Aria',
            description: 'A mysterious mage',
            personality: 'Curious and witty',
            scenario: 'In a magical tower',
            first_mes: 'Welcome, traveler.',
            mes_example: 'How can I assist you?',
            group_only_greetings: ['Greetings to the whole party!'],
        });
        const formatter = new CardV3Formatter();
        const result = formatter.format(character);
        expect(result.data.group_only_greetings).toEqual(['Greetings to the whole party!']);
    });
});

describe('CardV3Formatter - null/undefined optional field fallbacks', () => {
    /**
     * Helper: create a minimal character-like plain object bypassing
     * the Character constructor so fields can be null/undefined,
     * exercising the ?? fallback branches in format().
     *
     * @param {object} overrides - field overrides to apply
     * @returns {object} plain character-like object
     */
    function makePlainCharacter(overrides = {}) {
        return {
            name: 'Aria',
            description: 'A mysterious mage',
            personality: 'Curious and witty',
            scenario: 'In a magical tower',
            first_mes: 'Welcome, traveler.',
            mes_example: 'How can I assist you?',
            creator_notes: undefined,
            system_prompt: undefined,
            post_history_instructions: undefined,
            alternate_greetings: undefined,
            group_only_greetings: undefined,
            ...overrides,
        };
    }

    it('should fall back to [] when alternate_greetings is undefined', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ alternate_greetings: undefined }));
        expect(result.data.alternate_greetings).toEqual([]);
    });

    it('should fall back to [] when alternate_greetings is null', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ alternate_greetings: null }));
        expect(result.data.alternate_greetings).toEqual([]);
    });

    it('should fall back to [] when group_only_greetings is undefined', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ group_only_greetings: undefined }));
        expect(result.data.group_only_greetings).toEqual([]);
    });

    it('should fall back to [] when group_only_greetings is null', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ group_only_greetings: null }));
        expect(result.data.group_only_greetings).toEqual([]);
    });

    it('should use provided alternate_greetings array when not null/undefined', () => {
        const formatter = new CardV3Formatter();
        const greetings = ['Hello!', 'Greetings!'];
        const result = formatter.format(makePlainCharacter({ alternate_greetings: greetings }));
        expect(result.data.alternate_greetings).toEqual(greetings);
    });

    it('should use provided group_only_greetings array when not null/undefined', () => {
        const formatter = new CardV3Formatter();
        const greetings = ['Welcome, party!'];
        const result = formatter.format(makePlainCharacter({ group_only_greetings: greetings }));
        expect(result.data.group_only_greetings).toEqual(greetings);
    });

    it('should fall back to [] when tags is undefined', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ tags: undefined }));
        expect(result.data.tags).toEqual([]);
    });

    it('should fall back to [] when tags is null', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ tags: null }));
        expect(result.data.tags).toEqual([]);
    });

    it('should emit tags from character when present', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ tags: ['fantasy', 'mage'] }));
        expect(result.data.tags).toEqual(['fantasy', 'mage']);
    });

    it('should include talkativeness in extensions', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter());
        expect(result.data.extensions).toHaveProperty('talkativeness');
        expect(result.data.extensions.talkativeness).toBe('0.5'); // default
    });

    it('should use character talkativeness when provided', () => {
        const formatter = new CardV3Formatter();
        const result = formatter.format(makePlainCharacter({ talkativeness: '0.8' }));
        expect(result.data.extensions.talkativeness).toBe('0.8');
    });
});
