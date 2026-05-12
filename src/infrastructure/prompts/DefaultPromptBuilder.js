/**
 * @file Default prompt builder. Assembles system + user prompts for
 * character and lorebook generation. This is the project's single source
 * of truth for prompt engineering. Update with care—snapshot tests will
 * flag regressions.
 */

import { IPromptBuilder } from '../../application/ports/IPromptBuilder.js';
import { GenerationRequest } from '../../domain/value-objects/GenerationRequest.js';

/**
 * Default prompt builder. Constructs structured requests for character generation.
 * @extends IPromptBuilder
 */
export class DefaultPromptBuilder extends IPromptBuilder {
    /**
     * Construct the builder.
     */
    constructor() {
        super();
    }

    /**
     * Build a generation request from a character description.
     *
     * @param {string} description
     * @param {object} [options]
     * @param {number} [options.entryCount] target lorebook entries
     * @param {number} [options.temperature] LLM temperature
     * @returns {GenerationRequest}
     */
    build(description, options = {}) {
        // TODO: implement - assemble system prompt and user prompt
        throw new Error('DefaultPromptBuilder.build not implemented');
    }
}
