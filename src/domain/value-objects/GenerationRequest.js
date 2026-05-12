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
     * @param {object} data - generation request data
     * @param {string} data.systemPrompt - system context/instructions for the LLM
     * @param {string} data.userPrompt - user message/prompt for the LLM
     * @param {number} [data.temperature] - sampling temperature (0.0-1.0)
     * @param {number} [data.maxTokens] - maximum tokens to generate
     */
    constructor(data) {
        this.systemPrompt = data.systemPrompt;
        this.userPrompt = data.userPrompt;
        this.temperature = data.temperature;
        this.maxTokens = data.maxTokens;
    }
}
