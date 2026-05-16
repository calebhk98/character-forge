/**
 * @file Use case: decompose a group or ensemble description into individual
 * character descriptions. Takes a single group concept, calls the LLM to
 * identify each member, and returns an array of standalone character
 * description strings ready to pass to GenerateCharacterFromDescription.
 */

import { repairJson } from '../../infrastructure/utils/JsonRepair.js';

/**
 * Decompose a group description into individual character descriptions.
 */
export class DecomposeGroupDescription {
    /**
     * Construct the use case with its dependencies.
     *
     * @param {import('../ports/IPromptBuilder.js').IPromptBuilder} promptBuilder - port for building generation requests
     * @param {import('../ports/ILlmProvider.js').ILlmProvider} llmProvider - port for LLM text generation
     * @param {import('../ports/ILogger.js').ILogger} logger - port for diagnostic logging
     */
    constructor(promptBuilder, llmProvider, logger) {
        this.promptBuilder = promptBuilder;
        this.llmProvider = llmProvider;
        this.logger = logger;
    }

    /**
     * Execute the use case.
     *
     * @param {string} groupDescription - group or ensemble concept in plain language
     * @param {object} [options] - decomposition options
     * @param {number} [options.maxCharacters] - maximum number of characters to return
     * @returns {Promise<string[]>} array of individual character descriptions
     */
    async execute(groupDescription, options = {}) {
        this.logger.debug('Decomposing group description', { groupDescription });

        const request = this.promptBuilder.buildGroupDecompositionRequest(groupDescription, options);
        const response = await this.llmProvider.generate(request);

        const parsed = this.parseResponse(response);
        const characters = this.extractCharacters(parsed);

        this.logger.info('Group decomposed successfully', { count: characters.length });
        return characters;
    }

    /**
     * Parse the LLM response string to a JSON object, repairing if needed.
     *
     * @private
     * @param {string} response - raw LLM response
     * @returns {object} parsed JSON object
     */
    parseResponse(response) {
        try {
            return JSON.parse(response);
        } catch {
            const repaired = repairJson(response);
            if (!repaired) {
                this.logger.error('Failed to parse group decomposition response', { response });
                throw new Error('LLM returned invalid JSON for group decomposition. Please try again.');
            }
            this.logger.info('Repaired malformed JSON from group decomposition');
            return repaired;
        }
    }

    /**
     * Extract and validate the characters array from the parsed response.
     *
     * @private
     * @param {object} parsed - parsed JSON object from LLM
     * @returns {string[]} array of non-empty character description strings
     */
    extractCharacters(parsed) {
        if (!Array.isArray(parsed.characters)) {
            throw new Error('LLM response missing "characters" array for group decomposition.');
        }

        const valid = parsed.characters.filter(
            (entry) => typeof entry === 'string' && entry.trim().length > 0,
        );

        if (valid.length === 0) {
            throw new Error('LLM returned no valid character descriptions for group decomposition.');
        }

        return valid;
    }
}
