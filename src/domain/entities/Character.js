/**
 * @file Character domain entity. Represents a complete character with all
 * required fields for a Character Card V3 document. Pure data, no I/O.
 */

/**
 * Validate the alternate_greetings field and append errors to the errors array.
 *
 * @param {unknown} value - value to validate
 * @param {string[]} errors - errors array to append to
 * @returns {void}
 */
function validateAlternateGreetings(value, errors) {
    if (!Array.isArray(value)) {
        errors.push('alternate_greetings must be an array');
        return;
    }
    for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== 'string') {
            errors.push(`alternate_greetings[${i}] must be a string`);
        } else if (value[i].trim().length === 0) {
            errors.push(`alternate_greetings[${i}] cannot be empty`);
        }
    }
}

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

    /** @type {string[]} alternate opening messages */
    alternate_greetings;

    /** @type {string[]} opening messages used only in group chats */
    group_only_greetings;

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
     * @param {string[]} [data.alternate_greetings] - optional alternate opening messages
     * @param {string[]} [data.group_only_greetings] - optional group-chat-specific opening messages
     */
    constructor(data) {
        const required = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];
        const errors = [];

        for (const field of required) {
            if (!data[field]) {
                errors.push(`${field} is required`);
            } else if (typeof data[field] !== 'string') {
                errors.push(`${field} must be a string`);
            } else if (data[field].trim().length === 0) {
                errors.push(`${field} cannot be empty`);
            }
        }

        if (data.alternate_greetings !== undefined) {
            validateAlternateGreetings(data.alternate_greetings, errors);
        }

        if (data.group_only_greetings !== undefined) {
            validateAlternateGreetings(data.group_only_greetings, errors);
        }

        if (errors.length > 0) {
            throw new Error(`Invalid character data: ${errors.join('; ')}`);
        }

        Object.assign(this, data);
        this.alternate_greetings = data.alternate_greetings ?? [];
        this.group_only_greetings = data.group_only_greetings ?? [];
    }
}
