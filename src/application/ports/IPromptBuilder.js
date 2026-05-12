/**
 * @file Abstract port for prompt building. Takes a description and
 * returns a structured GenerationRequest. Adapters in src/infrastructure/prompts/.
 */

/**
 * Abstract prompt builder. Subclass and implement build().
 *
 * @abstract
 */
export class IPromptBuilder {
    /**
     * Build a generation request from a character description.
     *
     * @param {string} _description - character concept in plain language
     * @param {object} [_options] - generation options
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    build(_description, _options = {}) {
        throw new Error('IPromptBuilder.build must be implemented by subclass');
    }
}
