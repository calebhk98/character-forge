/**
 * @file Tests for CardV3Validator — validates formatted card JSON against the
 * Character Card V3 spec before saving.
 */

import { describe, it, expect } from 'vitest';
import { CardV3Validator } from '../../../src/infrastructure/validators/CardV3Validator.js';

/**
 * Build a minimal valid V3 card JSON fixture.
 *
 * @returns {object} valid V3 card
 */
function validCard() {
    return {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
            name: 'TestChar',
            description: 'A description',
            personality: 'Friendly',
            scenario: 'A scenario',
            first_mes: 'Hello!',
            mes_example: 'Hi!',
        },
    };
}

describe('CardV3Validator - valid card', () => {
    it('should pass for a valid V3 card', () => {
        const validator = new CardV3Validator();

        expect(() => validator.validate(validCard())).not.toThrow();
    });

    it('should not throw for extra optional fields in data', () => {
        const validator = new CardV3Validator();
        const card = {
            ...validCard(),
            data: { ...validCard().data, creator_notes: 'notes', system_prompt: '', character_book: { entries: [] } },
        };

        expect(() => validator.validate(card)).not.toThrow();
    });
});

describe('CardV3Validator - spec field', () => {
    it('should throw for wrong spec value', () => {
        const validator = new CardV3Validator();

        expect(() => validator.validate({ ...validCard(), spec: 'chara_card_v2' })).toThrow('spec must be "chara_card_v3"');
    });

    it('should throw for missing spec field', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard() };
        delete card.spec;

        expect(() => validator.validate(card)).toThrow('spec must be "chara_card_v3"');
    });
});

describe('CardV3Validator - spec_version field', () => {
    it('should throw for wrong spec_version', () => {
        const validator = new CardV3Validator();

        expect(() => validator.validate({ ...validCard(), spec_version: '2.0' })).toThrow('spec_version must be "3.0"');
    });

    it('should throw for missing spec_version field', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard() };
        delete card.spec_version;

        expect(() => validator.validate(card)).toThrow('spec_version must be "3.0"');
    });
});

describe('CardV3Validator - data field', () => {
    it('should throw when data is missing', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard() };
        delete card.data;

        expect(() => validator.validate(card)).toThrow('data must be an object');
    });

    it('should throw when data is not an object', () => {
        const validator = new CardV3Validator();

        expect(() => validator.validate({ ...validCard(), data: 'invalid' })).toThrow('data must be an object');
    });

    it('should throw for an empty required data field', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard(), data: { ...validCard().data, name: '' } };

        expect(() => validator.validate(card)).toThrow('data.name must be a non-empty string');
    });

    it('should throw for a whitespace-only required data field', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard(), data: { ...validCard().data, description: '   ' } };

        expect(() => validator.validate(card)).toThrow('data.description must be a non-empty string');
    });

    it('should throw listing all missing required data fields', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard(), data: {} };

        let caught;
        try {
            validator.validate(card);
        } catch (e) {
            caught = e;
        }

        expect(caught).toBeDefined();
        ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'].forEach(field => {
            expect(caught.message).toContain(`data.${field}`);
        });
    });
});

describe('CardV3Validator - violation collection', () => {
    it('should collect all violations into a single error', () => {
        const validator = new CardV3Validator();
        const card = {
            spec: 'wrong_spec',
            spec_version: 'wrong_version',
            data: { name: '', description: 'ok', personality: 'ok', scenario: 'ok', first_mes: 'ok', mes_example: 'ok' },
        };

        let caught;
        try {
            validator.validate(card);
        } catch (e) {
            caught = e;
        }

        expect(caught).toBeDefined();
        expect(caught.message).toContain('spec must be');
        expect(caught.message).toContain('spec_version must be');
        expect(caught.message).toContain('data.name must be a non-empty string');
    });
});
