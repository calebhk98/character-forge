/**
 * @file Use case: generate lorebook entries for a character. Takes a
 * character description, generates keyword-triggered entries, and returns
 * a Lorebook entity.
 */

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
     * @param {string} _description - character concept in plain language
     * @param {object} [_options] - generation options
     * @returns {Promise<import('../../domain/entities/Lorebook.js').Lorebook>} generated lorebook entity
     */
    async execute(_description, _options = {}) {
        // TODO: implement
        throw new Error('GenerateLorebookForCharacter.execute not implemented');
    }
}
