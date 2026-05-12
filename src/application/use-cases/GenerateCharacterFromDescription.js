/**
 * @file Use case: generate a character from a natural-language description.
 * Takes a description, builds a prompt, calls the LLM, parses the response,
 * and returns a Character entity.
 */

/**
 * Generate a character from a text description.
 */
export class GenerateCharacterFromDescription {
    /**
     * Construct the use case with its dependencies.
     *
     * @param {import('../ports/IPromptBuilder.js').IPromptBuilder} promptBuilder
     * @param {import('../ports/ILlmProvider.js').ILlmProvider} llmProvider
     * @param {import('../ports/ILogger.js').ILogger} logger
     */
    constructor(promptBuilder, llmProvider, logger) {
        this.promptBuilder = promptBuilder;
        this.llmProvider = llmProvider;
        this.logger = logger;
    }

    /**
     * Execute the use case.
     *
     * @param {string} _description - character concept
     * @param {object} [_options] - generation options
     * @returns {Promise<import('../../domain/entities/Character.js').Character>} generated character
     */
    async execute(_description, _options = {}) {
        // TODO: implement
        throw new Error('GenerateCharacterFromDescription.execute not implemented');
    }
}
