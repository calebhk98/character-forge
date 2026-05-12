/**
 * @file Adapter that routes generation through SillyTavern's Connection
 * Manager. Uses whatever LLM the user has configured as active.
 */

import { ILlmProvider } from '../../application/ports/ILlmProvider.js';

/**
 * LLM provider that uses SillyTavern's own connection manager.
 *
 * @augments ILlmProvider
 */
export class SillyTavernLlmProvider extends ILlmProvider {
    /**
     * Construct with SillyTavern context.
     *
     * @param {object} stContext result of getContext()
     */
    constructor(stContext) {
        super();
        this.ctx = stContext;
    }

    /**
     * Generate text via SillyTavern's active connection.
     *
     * @param {import('../../application/ports/ILlmProvider.js').GenerationRequest} request
     * @param _request
     * @returns {Promise<string>}
     */
    async generate(_request) {
        // TODO: implement - call this.ctx.generateQuietPrompt or similar
        throw new Error('SillyTavernLlmProvider.generate not implemented');
    }
}
