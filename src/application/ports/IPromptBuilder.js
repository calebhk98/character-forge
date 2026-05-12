/**
 * @file Abstract port for prompt building. Takes a description and
 * returns a structured GenerationRequest. Adapters in src/infrastructure/prompts/.
 */

/**
 * Abstract prompt builder. Subclass and implement build().
 * @abstract
 */
export class IPromptBuilder {
    /**
     * Build a generation request from a character description.
     *
     * @param {string} description
     * @param {object} [options]
     * @returns {import('../value-objects/GenerationRequest.js').GenerationRequest}
     */
    build(description, options = {}) {
        throw new Error('IPromptBuilder.build must be implemented by subclass');
    }
}
