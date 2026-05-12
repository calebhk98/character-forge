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
     * @returns {Promise<import('../../domain/entities/Lorebook.js').Lorebook>} generated lorebook
     */
    async execute(_description, _options = {}) {
        // TODO: implement
        throw new Error('GenerateLorebookForCharacter.execute not implemented');
    }
}
