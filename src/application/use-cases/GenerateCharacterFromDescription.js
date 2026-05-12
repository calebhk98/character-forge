/**
 * @file Use case: generate a character from a natural-language description.
 * Takes a description, builds a prompt, calls the LLM, parses the response,
 * and returns a Character entity.
 */

import { Character } from '../../domain/entities/Character.js';

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
     * @returns {Promise<import('../../domain/entities/Character.js').Character>} generated character entity
     */
    async execute(description, options = {}) {
        this.logger.debug('Generating character from description', { description });

        const request = this.promptBuilder.build(description, options);
        const response = await this.llmProvider.generate(request);

        let characterData;
        try {
            characterData = JSON.parse(response);
        } catch (error) {
            this.logger.error('Failed to parse LLM response as JSON', { response, error: error.message });
            throw new Error('LLM response is not valid JSON');
        }

        const character = new Character(characterData);
        this.logger.info('Character generated successfully', { name: character.name });

        return character;
    }
}
