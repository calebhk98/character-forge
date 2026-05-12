/**
 * @file Character domain entity. Represents a complete character with all
 * required fields for a Character Card V3 document. Pure data, no I/O.
 */

/**
 * A complete character with all V3 card fields.
 */
export class Character {
    /** @type {string} character name */
    name;

    /** @type {string} character background and description */
    description;

    /** @type {string} character personality traits */
    personality;

    /** @type {string} scenario or context for the character */
    scenario;

    /** @type {string} character's first message */
    first_mes;

    /** @type {string} example dialogue messages */
    mes_example;

    /** @type {string|undefined} optional creator notes */
    creator_notes;

    /** @type {string|undefined} optional system prompt */
    system_prompt;

    /** @type {string|undefined} optional post-history instructions */
    post_history_instructions;

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
        const required = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Character.${field} is required`);
            }
        }
        Object.assign(this, data);
    }
}
