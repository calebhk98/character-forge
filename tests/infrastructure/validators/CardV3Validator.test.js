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

describe('CardV3Validator', () => {
    it('should pass for a valid V3 card', () => {
        const validator = new CardV3Validator();

        expect(() => validator.validate(validCard())).not.toThrow();
    });

    it('should throw for wrong spec value', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard(), spec: 'chara_card_v2' };

        expect(() => validator.validate(card)).toThrow('spec must be "chara_card_v3"');
    });

    it('should throw for missing spec field', () => {
        const validator = new CardV3Validator();
        const { spec: _, ...card } = validCard();

        expect(() => validator.validate(card)).toThrow('spec must be "chara_card_v3"');
    });

    it('should throw for wrong spec_version', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard(), spec_version: '2.0' };

        expect(() => validator.validate(card)).toThrow('spec_version must be "3.0"');
    });

    it('should throw for missing spec_version field', () => {
        const validator = new CardV3Validator();
        const { spec_version: _, ...card } = validCard();

        expect(() => validator.validate(card)).toThrow('spec_version must be "3.0"');
    });

    it('should throw when data is missing', () => {
        const validator = new CardV3Validator();
        const { data: _, ...card } = validCard();

        expect(() => validator.validate(card)).toThrow('data must be an object');
    });

    it('should throw when data is not an object', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard(), data: 'invalid' };

        expect(() => validator.validate(card)).toThrow('data must be an object');
    });

    it('should throw for each missing required data field', () => {
        const validator = new CardV3Validator();
        const card = { ...validCard(), data: {} };

        let caught;
        try {
            validator.validate(card);
        } catch (e) {
            caught = e;
        }

        expect(caught).toBeDefined();
        expect(caught.message).toContain('data.name');
        expect(caught.message).toContain('data.description');
        expect(caught.message).toContain('data.personality');
        expect(caught.message).toContain('data.scenario');
        expect(caught.message).toContain('data.first_mes');
        expect(caught.message).toContain('data.mes_example');
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

    it('should not throw for extra fields in data beyond the required set', () => {
        const validator = new CardV3Validator();
        const card = {
            ...validCard(),
            data: {
                ...validCard().data,
                creator_notes: 'some notes',
                system_prompt: '',
                character_book: { entries: [] },
            },
        };

        expect(() => validator.validate(card)).not.toThrow();
    });
});
