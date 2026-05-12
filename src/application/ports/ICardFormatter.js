/**
 * @file Abstract port for card formatting. Converts domain Character
 * to Character Card V3 JSON. Adapters in src/infrastructure/formatters/.
 */

/**
 * Abstract card formatter. Subclass and implement format().
 *
 * @abstract
 */
export class ICardFormatter {
    /**
     * Format a character and its lorebook to a card JSON structure.
     *
     * @param {import('../../domain/entities/Character.js').Character} _character - character to format
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} [_lorebook] - lorebook to embed
     * @returns {object} formatted card JSON object
     */
    format(_character, _lorebook) {
        throw new Error('ICardFormatter.format must be implemented by subclass');
    }
}
