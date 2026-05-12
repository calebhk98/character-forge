/**
 * @file Abstract port for LLM text generation. Concrete adapters live in
 * src/infrastructure/llm/. Swap by editing the composition root.
 */

/**
 * @typedef {Object} GenerationRequest
 * @property {string} systemPrompt
 * @property {string} userPrompt
 * @property {number} [temperature]
 * @property {number} [maxTokens]
 */

/**
 * Abstract LLM provider. Subclass and implement generate().
 * @abstract
 */
export class ILlmProvider {
    /**
     * Generate text from a structured request.
     *
     * @param {GenerationRequest} request
     * @returns {Promise<string>}
     */
    async generate(request) {
        throw new Error('ILlmProvider.generate must be implemented by subclass');
    }
}
