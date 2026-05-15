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
    // eslint-disable-next-line jsdoc/require-returns-check
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

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a refinement request for a single character field.
     *
     * @param {string} _description - original character concept
     * @param {string} _fieldName - character property to rewrite
     * @param {string} _currentValue - existing field text
     * @param {string} [_feedback] - optional user direction for the rewrite
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildRefinementRequest(_description, _fieldName, _currentValue, _feedback = '') {
        throw new Error('IPromptBuilder.buildRefinementRequest must be implemented by subclass');
    }
}
