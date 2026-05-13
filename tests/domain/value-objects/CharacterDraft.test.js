/**
 * @file Tests for CharacterDraft value object.
 */

import { describe, it, expect } from 'vitest';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';
import { CharacterDraft } from '../../../src/domain/value-objects/CharacterDraft.js';

describe('CharacterDraft', () => {
    const createValidCharacter = () => new Character({
        name: 'Test Character',
        description: 'A test character',
        personality: 'Friendly',
        scenario: 'A fantasy world',
        first_mes: 'Hello!',
        mes_example: 'How are you?',
    });

    it('should construct with a character only', () => {
        const character = createValidCharacter();
        const draft = new CharacterDraft({ character });
        expect(draft.character).toBe(character);
        expect(draft.lorebook).toBeUndefined();
    });

    it('should construct with character and lorebook', () => {
        const character = createValidCharacter();
        const entry = new LorebookEntry({
            keys: ['magic'],
            content: 'Magic exists in this world',
        });
        const lorebook = new Lorebook({ entries: [entry] });
        const draft = new CharacterDraft({ character, lorebook });
        expect(draft.character).toBe(character);
        expect(draft.lorebook).toBe(lorebook);
    });

    it('should preserve character data immutably', () => {
        const character = createValidCharacter();
        const draft = new CharacterDraft({ character });
        expect(draft.character.name).toBe('Test Character');
        expect(draft.character.personality).toBe('Friendly');
    });

    it('should preserve lorebook data immutably', () => {
        const character = createValidCharacter();
        const entry = new LorebookEntry({
            keys: ['test'],
            content: 'Test content',
            name: 'Test Entry',
        });
        const lorebook = new Lorebook({ entries: [entry] });
        const draft = new CharacterDraft({ character, lorebook });
        expect(draft.lorebook.entries[0].name).toBe('Test Entry');
        expect(draft.lorebook.entries[0].content).toBe('Test content');
    });
});
