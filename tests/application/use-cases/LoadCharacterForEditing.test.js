/**
 * @file Tests for LoadCharacterForEditing use case.
 */

import { describe, it, expect } from 'vitest';
import { LoadCharacterForEditing } from '../../../src/application/use-cases/LoadCharacterForEditing.js';
import { ICharacterRepository } from '../../../src/application/ports/ICharacterRepository.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';
import { CharacterDraft } from '../../../src/domain/value-objects/CharacterDraft.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

/** @type {object} minimal valid V3 card JSON */
const MINIMAL_CARD = {
    spec: 'chara_card_v3',
    data: {
        name: 'Alice',
        description: 'A wandering scholar.',
        personality: 'Curious and kind.',
        scenario: 'A dusty library.',
        first_mes: 'Hello, traveller.',
        mes_example: '<START>\nUser: Hi\nAlice: Hi back.',
    },
};

/** @type {object} card with a character_book (array entries) */
const CARD_WITH_LOREBOOK_ARRAY = {
    spec: 'chara_card_v3',
    data: {
        ...MINIMAL_CARD.data,
        character_book: {
            name: 'Alice Lore',
            entries: [
                { keys: ['alice', 'scholar'], content: 'Alice is an ancient scholar.', comment: 'Background' },
            ],
        },
    },
};

/** @type {object} card with a character_book using object-keyed entries (ST world info format) */
const CARD_WITH_LOREBOOK_OBJECT = {
    spec: 'chara_card_v3',
    data: {
        ...MINIMAL_CARD.data,
        character_book: {
            name: 'Alice Lore',
            entries: {
                '0': { keys: ['magic'], content: 'Magic is real.', comment: 'World lore' },
            },
        },
    },
};

/** @type {object} card with lorebook entries that have no valid keys or content */
const CARD_WITH_INVALID_ENTRIES = {
    spec: 'chara_card_v3',
    data: {
        ...MINIMAL_CARD.data,
        character_book: {
            entries: [
                { keys: [], content: 'No keys — should be skipped.' },
                { keys: ['valid'], content: '' },
                { keys: ['good'], content: 'This one is fine.' },
            ],
        },
    },
};

/**
 * Fake character repository returning a pre-set card JSON.
 *
 * @augments ICharacterRepository
 */
class FakeCharacterRepository extends ICharacterRepository {
    /**
     * Construct the fake repo.
     *
     * @param {object} cardJson - card to return from load()
     */
    constructor(cardJson) {
        super();
        this.cardJson = cardJson;
        this.lastAvatarUrl = null;
    }

    /**
     * Fake list — not used in these tests.
     *
     * @returns {Promise<Array<{name: string, avatarUrl: string}>>} empty
     */
    async list() {
        return [];
    }

    /**
     * Return the preset card JSON.
     *
     * @param {string} avatarUrl - avatar filename
     * @returns {Promise<object>} card JSON
     */
    async load(avatarUrl) {
        this.lastAvatarUrl = avatarUrl;
        return this.cardJson;
    }

    /**
     * Not used in these tests.
     *
     * @param {object} _cardJson - card
     * @returns {Promise<string>} filename
     */
    async save(_cardJson) {
        return 'saved.png';
    }
}

/**
 * Fake repository that throws on load.
 *
 * @augments ICharacterRepository
 */
class FailingCharacterRepository extends ICharacterRepository {
    /**
     * Not used.
     *
     * @returns {Promise<Array>} empty
     */
    async list() { return []; }

    /**
     * Always throw.
     *
     * @returns {Promise<never>} throws
     */
    async load() { throw new Error('Network failure'); }

    /**
     * Not used.
     *
     * @returns {Promise<string>} filename
     */
    async save() { return ''; }
}

/**
 * Fake logger.
 *
 * @augments ILogger
 */
class FakeLogger extends ILogger {
    /**
     * Log debug.
     *
     * @param {string} _m - message
     * @param {*} [_d] - data
     */
    debug(_m, _d) {}

    /**
     * Log info.
     *
     * @param {string} _m - message
     * @param {*} [_d] - data
     */
    info(_m, _d) {}

    /**
     * Log warn.
     *
     * @param {string} _m - message
     * @param {*} [_d] - data
     */
    warn(_m, _d) {}

    /**
     * Log error.
     *
     * @param {string} _m - message
     * @param {*} [_d] - data
     */
    error(_m, _d) {}
}

describe('LoadCharacterForEditing', () => {
    it('should return a CharacterDraft', async () => {
        const useCase = new LoadCharacterForEditing(new FakeCharacterRepository(MINIMAL_CARD), new FakeLogger());
        const draft = await useCase.execute('Alice.png');
        expect(draft).toBeInstanceOf(CharacterDraft);
    });

    it('should parse the character entity from card data', async () => {
        const useCase = new LoadCharacterForEditing(new FakeCharacterRepository(MINIMAL_CARD), new FakeLogger());
        const draft = await useCase.execute('Alice.png');
        expect(draft.character).toBeInstanceOf(Character);
        expect(draft.character.name).toBe('Alice');
        expect(draft.character.description).toBe('A wandering scholar.');
    });

    it('should forward the avatarUrl to charRepository.load', async () => {
        const repo = new FakeCharacterRepository(MINIMAL_CARD);
        const useCase = new LoadCharacterForEditing(repo, new FakeLogger());
        await useCase.execute('Alice.png');
        expect(repo.lastAvatarUrl).toBe('Alice.png');
    });

    it('should return a Lorebook even when no character_book', async () => {
        const useCase = new LoadCharacterForEditing(new FakeCharacterRepository(MINIMAL_CARD), new FakeLogger());
        const draft = await useCase.execute('Alice.png');
        expect(draft.lorebook).toBeInstanceOf(Lorebook);
        expect(draft.lorebook.entries).toHaveLength(0);
    });

    it('should parse lorebook entries from array-format character_book', async () => {
        const useCase = new LoadCharacterForEditing(new FakeCharacterRepository(CARD_WITH_LOREBOOK_ARRAY), new FakeLogger());
        const draft = await useCase.execute('Alice.png');
        expect(draft.lorebook.entries).toHaveLength(1);
        expect(draft.lorebook.entries[0].keys).toContain('alice');
        expect(draft.lorebook.entries[0].content).toBe('Alice is an ancient scholar.');
    });

    it('should parse lorebook entries from object-keyed character_book (ST format)', async () => {
        const useCase = new LoadCharacterForEditing(new FakeCharacterRepository(CARD_WITH_LOREBOOK_OBJECT), new FakeLogger());
        const draft = await useCase.execute('Alice.png');
        expect(draft.lorebook.entries).toHaveLength(1);
        expect(draft.lorebook.entries[0].keys).toContain('magic');
    });

    it('should skip lorebook entries with no valid keys or empty content', async () => {
        const useCase = new LoadCharacterForEditing(new FakeCharacterRepository(CARD_WITH_INVALID_ENTRIES), new FakeLogger());
        const draft = await useCase.execute('Alice.png');
        expect(draft.lorebook.entries).toHaveLength(1);
        expect(draft.lorebook.entries[0].keys).toContain('good');
    });

    it('should propagate repository load errors to the caller', async () => {
        const useCase = new LoadCharacterForEditing(new FailingCharacterRepository(), new FakeLogger());
        await expect(useCase.execute('Alice.png')).rejects.toThrow('Network failure');
    });

    it('should handle cards that return data at the root level (not nested in .data)', async () => {
        const flatCard = { ...MINIMAL_CARD.data };
        const useCase = new LoadCharacterForEditing(new FakeCharacterRepository(flatCard), new FakeLogger());
        const draft = await useCase.execute('Alice.png');
        expect(draft.character.name).toBe('Alice');
    });
});
