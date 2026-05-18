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
     * @param {number} [_options.entryCount] - target lorebook entries
     * @param {string} [_options.customSystemPrompt] - verbatim system prompt override
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

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a request to generate a shared lorebook for an ensemble of characters.
     *
     * @param {string} _groupDescription - description of the group or ensemble
     * @param {string[]} _characterNames - names of the characters in the ensemble
     * @param {object} [_options] - generation options
     * @param {number} [_options.entryCount] - target entry count
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildSharedLorebookRequest(_groupDescription, _characterNames, _options = {}) {
        throw new Error('IPromptBuilder.buildSharedLorebookRequest must be implemented by subclass');
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a request to decompose a group description into individual character descriptions.
     *
     * @param {string} _groupDescription - description of the group, ensemble, or family
     * @param {object} [_options] - decomposition options
     * @param {number} [_options.maxCharacters] - maximum number of characters to generate
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildGroupDecompositionRequest(_groupDescription, _options = {}) {
        throw new Error('IPromptBuilder.buildGroupDecompositionRequest must be implemented by subclass');
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a request to generate character metadata (name, creator notes).
     *
     * @param {string} _description - character concept in plain language
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildMetadataRequest(_description) {
        throw new Error('IPromptBuilder.buildMetadataRequest must be implemented by subclass');
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a request to generate character behavior (description, personality).
     *
     * @param {string} _description - character concept in plain language
     * @param {{ name: string }} _metadata - previously generated metadata
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildBehaviorRequest(_description, _metadata) {
        throw new Error('IPromptBuilder.buildBehaviorRequest must be implemented by subclass');
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a request to generate character scene (scenario, system prompt).
     *
     * @param {string} _description - character concept in plain language
     * @param {{ name: string, description: string, personality: string }} _behavior - previously generated behavior
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildSceneRequest(_description, _behavior) {
        throw new Error('IPromptBuilder.buildSceneRequest must be implemented by subclass');
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a request to generate character dialogue examples.
     *
     * @param {string} _description - character concept in plain language
     * @param {{ name: string, personality: string, first_mes: string }} _scene - previously generated scene data
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildDialogueRequest(_description, _scene) {
        throw new Error('IPromptBuilder.buildDialogueRequest must be implemented by subclass');
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Build a request to generate alternate greetings for a character.
     *
     * @param {string} _description - character concept in plain language
     * @param {{ name: string, first_mes: string, scenario: string }} _character - core character data so far
     * @returns {import('../../domain/value-objects/GenerationRequest.js').GenerationRequest} generation request
     */
    buildGreetingsRequest(_description, _character) {
        throw new Error('IPromptBuilder.buildGreetingsRequest must be implemented by subclass');
    }
}
