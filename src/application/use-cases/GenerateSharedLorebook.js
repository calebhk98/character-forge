/**
 * @file Use case: generate a shared lorebook for an ensemble of characters.
 * Takes a group description and the names of all generated characters, calls
 * the LLM with a relationship-focused prompt, and returns a Lorebook entity
 * with a higher entry count than single-character lorebooks.
 */

import { Lorebook } from '../../domain/entities/Lorebook.js';
import { LorebookEntry } from '../../domain/entities/LorebookEntry.js';
import { repairJson } from '../../infrastructure/utils/JsonRepair.js';

/**
 * Generate a shared lorebook for a group or ensemble of characters.
 */
export class GenerateSharedLorebook {
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
     * @param {string[]} characterNames - names of all characters in the ensemble
     * @param {object} [options] - generation options
     * @param {number} [options.entryCount] - target lorebook entry count (default: 20)
     * @returns {Promise<import('../../domain/entities/Lorebook.js').Lorebook>} generated shared lorebook
     */
    async execute(groupDescription, characterNames, options = {}) {
        const entryCount = options.entryCount || 20;
        this.logger.debug('Generating shared lorebook', { groupDescription, characterNames, entryCount });

        try {
            const request = this.promptBuilder.buildSharedLorebookRequest(
                groupDescription, characterNames, { entryCount },
            );
            const response = await this.llmProvider.generate(request);

            const lorebookData = this.parseResponse(response);
            this.validateEntries(lorebookData);

            const entries = lorebookData.entries.map((entryData, index) => new LorebookEntry({
                keys: entryData.keys,
                content: entryData.content,
                name: entryData.name,
                comment: entryData.comment,
                priority: entryData.priority ?? 0,
                insertion_order: index,
            }));

            const lorebook = new Lorebook({
                name: lorebookData.name || `${groupDescription} — Shared Lorebook`,
                description: lorebookData.description || '',
                entries,
            });

            this.logger.info('Shared lorebook generated', { entryCount: lorebook.entries.length });
            return lorebook;
        } catch (error) {
            if (error.message.startsWith('Invalid lorebook entry')) {
                this.logger.warn('Shared lorebook validation failed', { error: error.message });
                throw new Error(`Shared lorebook data invalid: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Parse the LLM response, with JSON repair fallback.
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
                this.logger.error('Failed to parse shared lorebook response', { response });
                throw new Error('LLM returned invalid JSON for shared lorebook. Please try again.');
            }
            this.logger.info('Repaired malformed JSON for shared lorebook');
            return repaired;
        }
    }

    /**
     * Validate that the parsed object has a non-empty entries array.
     *
     * @private
     * @param {object} data - parsed lorebook data
     */
    validateEntries(data) {
        if (!data.entries || !Array.isArray(data.entries)) {
            this.logger.error('Shared lorebook response missing entries array', { data });
            throw new Error('LLM response must contain an entries array for shared lorebook.');
        }
    }
}
