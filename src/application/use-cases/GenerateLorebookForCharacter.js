/**
 * @file Use case: generate lorebook entries for a character. Takes a
 * character description, generates keyword-triggered entries, and returns
 * a Lorebook entity.
 */

import { Lorebook } from '../../domain/entities/Lorebook.js';
import { LorebookEntry } from '../../domain/entities/LorebookEntry.js';

/**
 * Generate a lorebook for a character.
 */
export class GenerateLorebookForCharacter {
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
     * @param {string} description - character concept in plain language
     * @param {object} [options] - generation options
     * @returns {Promise<import('../../domain/entities/Lorebook.js').Lorebook>} generated lorebook entity
     */
    async execute(description, options = {}) {
        this.logger.debug('Generating lorebook for character', { description });

        const request = this.promptBuilder.build(description, { ...options, entryCount: options.entryCount || 10 });
        const response = await this.llmProvider.generate(request);

        let lorebookData;
        try {
            lorebookData = JSON.parse(response);
        } catch (error) {
            this.logger.error('Failed to parse LLM response as JSON', { response, error: error.message });
            throw new Error('LLM response is not valid JSON');
        }

        if (!lorebookData.entries || !Array.isArray(lorebookData.entries)) {
            this.logger.error('LLM response missing entries array', { lorebookData });
            throw new Error('LLM response must contain an entries array');
        }

        const entries = lorebookData.entries.map((entryData, index) => {
            return new LorebookEntry({
                keys: entryData.keys,
                content: entryData.content,
                name: entryData.name,
                comment: entryData.comment,
                priority: entryData.priority ?? 0,
                insertion_order: index,
            });
        });

        const lorebook = new Lorebook({
            name: lorebookData.name || 'Character Lorebook',
            description: lorebookData.description || '',
            entries,
        });

        this.logger.info('Lorebook generated successfully', { entryCount: lorebook.entries.length });

        return lorebook;
    }
}
