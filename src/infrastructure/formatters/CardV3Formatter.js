/**
 * @file Adapter that formats Character entities to Character Card V3 JSON.
 * Per spec: chara_card_v3, spec_version 3.0.
 */

import { ICardFormatter } from '../../application/ports/ICardFormatter.js';

/**
 * Formatter for Character Card V3 spec.
 * @extends ICardFormatter
 */
export class CardV3Formatter extends ICardFormatter {
    /**
     * Format a character and lorebook to V3 JSON.
     *
     * @param {import('../../domain/entities/Character.js').Character} character
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} [lorebook]
     * @returns {Object} Character Card V3 JSON object
     */
    format(character, lorebook) {
        // TODO: implement - assemble V3 spec structure
        throw new Error('CardV3Formatter.format not implemented');
    }
}
