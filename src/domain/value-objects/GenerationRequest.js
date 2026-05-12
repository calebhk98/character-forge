/**
 * @file GenerationRequest value object. Passed to ILlmProvider.generate()
 * to request structured text output. Immutable.
 */

/**
 * A request for the LLM to generate text with given prompts and parameters.
 */
export class GenerationRequest {
    /**
     * Construct a GenerationRequest.
     *
     * @param {object} data
     * @param {string} data.systemPrompt
     * @param {string} data.userPrompt
     * @param {number} [data.temperature]
     * @param {number} [data.maxTokens]
     */
    constructor(data) {
        this.systemPrompt = data.systemPrompt;
        this.userPrompt = data.userPrompt;
        this.temperature = data.temperature;
        this.maxTokens = data.maxTokens;
    }
}
