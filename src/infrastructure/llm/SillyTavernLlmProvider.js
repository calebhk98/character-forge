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
     * @param {object} stContext - result of getContext()
     */
    constructor(stContext) {
        super();
        this.ctx = stContext;
    }

    /**
     * Generate text via SillyTavern's active connection.
     *
     * Uses generateRaw (exposed on the context from st-context.js) because it
     * accepts a systemPrompt parameter. generateQuietPrompt does not support
     * per-call system prompts. Temperature is controlled by ST's global
     * settings and cannot be overridden per-call through this API.
     *
     * @param {import('../../application/ports/ILlmProvider.js').GenerationRequest} request - generation parameters
     * @returns {Promise<string>} generated text response
     */
    async generate(request) {
        // ST may expose generateRaw on the context object or as a window global
        // depending on version; try both before giving up.
        const generateRaw = this.ctx?.generateRaw ?? globalThis.generateRaw;
        if (typeof generateRaw !== 'function') {
            throw new Error('generateRaw is not available — ensure a connection is configured in SillyTavern');
        }

        const response = await generateRaw({
            prompt: request.userPrompt,
            systemPrompt: request.systemPrompt || '',
            responseLength: request.maxTokens,
        });

        return response;
    }
}
