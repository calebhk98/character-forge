/**
 * @file Abstract port for LLM text generation. Concrete adapters live in
 * src/infrastructure/llm/. Swap by editing the composition root.
 */

/**
 * @typedef {object} GenerationRequest
 * @property {string} systemPrompt - system context for the LLM
 * @property {string} userPrompt - user message/request
 * @property {number} [maxTokens] - max response length
 */

/**
 * Abstract LLM provider. Subclass and implement generate().
 *
 * @abstract
 */
export class ILlmProvider {
    /**
     * Generate text from a structured request.
     *
     * @param {GenerationRequest} _request - generation parameters
     * @returns {Promise<string>} generated text
     */
    async generate(_request) {
        throw new Error('ILlmProvider.generate must be implemented by subclass');
    }
}
