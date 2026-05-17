/**
 * @file Use case: generate a character from a natural-language description.
 * Takes a description, builds a prompt, calls the LLM, parses the response,
 * and returns a Character entity.
 */

import { Character } from '../../domain/entities/Character.js';

const STRING_EXTRACT_KEYS = ['content', 'text', 'message', 'greeting'];

/**
 * Coerce a single value to a string, trying common object field names first.
 *
 * @param {unknown} value - value to coerce
 * @returns {string} string representation
 */
function coerceToString(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        for (const key of STRING_EXTRACT_KEYS) {
            if (typeof value[key] === 'string') return value[key];
        }
        return JSON.stringify(value);
    }
    return String(value);
}

/**
 * Normalise an array-of-strings field from raw LLM output, filtering nulls and
 * converting non-string elements to strings.
 *
 * @param {unknown} value - raw field value
 * @returns {string[]|undefined} normalised array, or undefined when value is undefined
 */
function normaliseStringArray(value) {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) return value;
    return value
        .filter(item => item !== null && item !== undefined)
        .map(coerceToString);
}

/**
 * Normalise raw LLM character data before domain construction.
 * Converts non-string mes_example and non-string array elements that the LLM
 * occasionally returns despite explicit prompt instructions.
 *
 * @param {object} data - raw parsed LLM character data
 * @returns {object} normalised data safe to pass to the Character constructor
 */
function normaliseCharacterData(data) {
    if (!data || typeof data !== 'object') return data;

    const result = { ...data };

    if (typeof result.mes_example !== 'string') {
        if (Array.isArray(result.mes_example)) {
            result.mes_example = result.mes_example.map(coerceToString).join('\n\n');
        } else if (result.mes_example !== undefined) {
            result.mes_example = coerceToString(result.mes_example);
        }
    }

    const arrayFields = ['alternate_greetings', 'group_only_greetings'];
    for (const field of arrayFields) {
        const normalised = normaliseStringArray(result[field]);
        if (normalised !== undefined) result[field] = normalised;
    }

    return result;
}

/**
 * Generate a character from a text description.
 */
export class GenerateCharacterFromDescription {
    /**
     * Construct the use case with its dependencies.
     *
     * @param {import('../ports/IPromptBuilder.js').IPromptBuilder} promptBuilder - port for building generation requests
     * @param {import('../ports/ILlmProvider.js').ILlmProvider} llmProvider - port for LLM text generation
     * @param {import('../ports/ILogger.js').ILogger} logger - port for diagnostic logging
     * @param {import('../ports/IJsonRepair.js').IJsonRepair} jsonRepair - port for JSON repair
     */
    constructor(promptBuilder, llmProvider, logger, jsonRepair) {
        this.promptBuilder = promptBuilder;
        this.llmProvider = llmProvider;
        this.logger = logger;
        this.jsonRepair = jsonRepair;
    }

    /**
     * Execute the use case.
     *
     * @param {string} description - character concept in plain language
     * @param {object} [options] - generation options
     * @returns {Promise<import('../../domain/entities/Character.js').Character>} generated character entity
     */
    async execute(description, options = {}) {
        this.logger.debug('Generating character from description', { description });

        try {
            const request = this.promptBuilder.build(description, options);
            const response = await this.llmProvider.generate(request);

            let characterData;
            try {
                characterData = JSON.parse(response);
            } catch (parseError) {
                this.logger.debug('Direct JSON parse failed, attempting repair', { error: parseError.message, responsePreview: response?.slice(0, 300) });
                characterData = this.jsonRepair.parseOrRepair(response, 'character generation');
                this.logger.info('Successfully repaired malformed JSON');
            }

            const character = new Character(normaliseCharacterData(characterData));
            this.logger.info('Character generated successfully', { name: character.name });

            return character;
        } catch (error) {
            if (error.message.startsWith('Invalid character data')) {
                this.logger.warn('Character validation failed', { error: error.message });
                throw new Error(`Character data invalid: ${error.message}`);
            }
            throw error;
        }
    }
}
