/**
 * @file Use case: generate a character from a natural-language description.
 * Takes a description, builds a prompt, calls the LLM, parses the response,
 * and returns a Character entity.
 */

import { Character } from '../../domain/entities/Character.js';
import { repairJson } from '../../infrastructure/utils/JsonRepair.js';

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

        try {
            const request = this.promptBuilder.build(description, options);
            const response = await this.llmProvider.generate(request);

            let characterData;
            try {
                characterData = JSON.parse(response);
            } catch (error) {
                this.logger.debug('Direct JSON parse failed, attempting repair', { error: error.message });
                characterData = repairJson(response);
                if (!characterData) {
                    this.logger.error('Failed to parse or repair LLM response', { response, error: error.message });
                    throw new Error('LLM returned invalid JSON and repair failed. Please try again.');
                }
                this.logger.info('Successfully repaired malformed JSON');
            }

            const character = new Character(characterData);
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
