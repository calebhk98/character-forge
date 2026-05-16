/**
 * @file V3 spec validator. Validates a formatted card JSON object against the
 * Character Card V3 spec before it is persisted.
 */

import { ICardValidator } from '../../application/ports/ICardValidator.js';

const EXPECTED_SPEC = 'chara_card_v3';
const EXPECTED_SPEC_VERSION = '3.0';
const REQUIRED_DATA_FIELDS = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];

/**
 * Validates a card JSON object against the Character Card V3 spec.
 */
export class CardV3Validator extends ICardValidator {
    /**
     * Validate a formatted card JSON object against the V3 spec.
     * Collects all violations and throws a single descriptive error.
     *
     * @param {object} cardJson - formatted card JSON to validate
     * @returns {void}
     * @throws {Error} if any V3 spec violations are found
     */
    validate(cardJson) {
        const violations = [];

        this._checkSpec(cardJson, violations);
        this._checkSpecVersion(cardJson, violations);
        this._checkData(cardJson, violations);

        if (violations.length > 0) {
            throw new Error(`Card failed V3 spec validation:\n${violations.map(v => `  - ${v}`).join('\n')}`);
        }
    }

    /**
     * Check the spec field.
     *
     * @param {object} card - card JSON
     * @param {string[]} violations - violations array to append to
     * @returns {void}
     */
    _checkSpec(card, violations) {
        if (card.spec !== EXPECTED_SPEC) {
            violations.push(`spec must be "${EXPECTED_SPEC}", got "${card.spec}"`);
        }
    }

    /**
     * Check the spec_version field.
     *
     * @param {object} card - card JSON
     * @param {string[]} violations - violations array to append to
     * @returns {void}
     */
    _checkSpecVersion(card, violations) {
        if (card.spec_version !== EXPECTED_SPEC_VERSION) {
            violations.push(`spec_version must be "${EXPECTED_SPEC_VERSION}", got "${card.spec_version}"`);
        }
    }

    /**
     * Check the data object and all required fields within it.
     *
     * @param {object} card - card JSON
     * @param {string[]} violations - violations array to append to
     * @returns {void}
     */
    _checkData(card, violations) {
        if (!card.data || typeof card.data !== 'object') {
            violations.push('data must be an object');
            return;
        }

        for (const field of REQUIRED_DATA_FIELDS) {
            if (typeof card.data[field] !== 'string' || card.data[field].trim() === '') {
                violations.push(`data.${field} must be a non-empty string`);
            }
        }
    }
}
