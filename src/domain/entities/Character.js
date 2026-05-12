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
     * @param {object} data - character data object
     * @param {string} data.name - character name
     * @param {string} data.description - character background and description
     * @param {string} data.personality - character personality traits
     * @param {string} data.scenario - scenario or context for the character
     * @param {string} data.first_mes - character's first message
     * @param {string} data.mes_example - example dialogue messages
     * @param {string} [data.creator_notes] - optional creator notes
     * @param {string} [data.system_prompt] - optional system prompt
     * @param {string} [data.post_history_instructions] - optional post-history instructions
     */
    constructor(data) {
        // TODO: validate required fields
        Object.assign(this, data);
    }
}
