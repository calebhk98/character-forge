/**
 * @file Use case: regenerate a single character field with optional feedback.
 * Accepts the original concept, the field to rewrite, its current value, and
 * optional user direction, then returns the rewritten field text as a plain string.
 */

/**
 * Regenerate one character field using optional user feedback.
 */
export class RefineCharacterField {
    /**
     * Construct the use case with its dependencies.
     *
     * @param {import('../ports/IPromptBuilder.js').IPromptBuilder} promptBuilder - builds refinement requests
     * @param {import('../ports/ILlmProvider.js').ILlmProvider} llmProvider - generates text from requests
     * @param {import('../ports/ILogger.js').ILogger} logger - diagnostic logging
     */
    constructor(promptBuilder, llmProvider, logger) {
        this.promptBuilder = promptBuilder;
        this.llmProvider = llmProvider;
        this.logger = logger;
    }

    /**
     * Execute the refinement.
     *
     * @param {string} description - original character concept
     * @param {string} fieldName - character property to rewrite (e.g. 'first_mes')
     * @param {string} currentValue - existing field text; may be empty for a blind retry
     * @param {string} [feedback] - optional user direction (empty string = blind retry)
     * @returns {Promise<string>} rewritten field text
     */
    async execute(description, fieldName, currentValue, feedback = '') {
        this.logger.debug('Refining character field', { fieldName, feedback });
        const request = this.promptBuilder.buildRefinementRequest(
            description, fieldName, currentValue, feedback,
        );
        const response = await this.llmProvider.generate(request);
        this.logger.info('Field refined successfully', { fieldName });
        return response.trim();
    }
}
