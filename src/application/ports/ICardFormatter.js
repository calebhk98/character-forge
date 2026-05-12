/**
 * @file Abstract port for card formatting. Converts domain Character
 * to Character Card V3 JSON. Adapters in src/infrastructure/formatters/.
 */

/**
 * Abstract card formatter. Subclass and implement format().
 * @abstract
 */
export class ICardFormatter {
    /**
     * Format a character and its lorebook to a card JSON structure.
     *
     * @param {import('../../domain/entities/Character.js').Character} character
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} [lorebook]
     * @returns {Object}
     */
    format(character, lorebook) {
        throw new Error('ICardFormatter.format must be implemented by subclass');
    }
}
