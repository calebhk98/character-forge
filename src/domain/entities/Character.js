/**
 * @file Character domain entity. Represents a complete character with all
 * required fields for a Character Card V3 document. Pure data, no I/O.
 */

/**
 * A complete character with all V3 card fields.
 */
export class Character {
    /**
     * Construct a Character from raw data. Validates required fields.
     *
     * @param {object} data
     * @param {string} data.name
     * @param {string} data.description
     * @param {string} data.personality
     * @param {string} data.scenario
     * @param {string} data.first_mes
     * @param {string} data.mes_example
     * @param {string} [data.creator_notes]
     * @param {string} [data.system_prompt]
     * @param {string} [data.post_history_instructions]
     */
    constructor(data) {
        // TODO: validate required fields
        Object.assign(this, data);
    }
}
