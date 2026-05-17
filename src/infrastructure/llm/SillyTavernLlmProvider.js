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
     * Construct with the generateRaw function exported from SillyTavern's script.js.
     *
     * generateRaw is a named export from script.js, not a property of the object
     * returned by getContext(). It is injected here so the adapter stays testable
     * without a real ST environment.
     *
     * @param {Function} generateRaw - SillyTavern's generateRaw export
     */
    constructor(generateRaw) {
        super();
        this._generateRaw = generateRaw;
    }

    /**
     * Generate text via SillyTavern's active connection.
     *
     * Delegates to generateRaw(prompt, api, instructOverride, quietToConsole,
     * systemPrompt, responseLength) — SillyTavern's positional-argument API.
     * api=undefined uses the currently active connection.
     * quietToConsole=true suppresses output to the chat window.
     *
     * @param {import('../../application/ports/ILlmProvider.js').GenerationRequest} request - generation parameters
     * @returns {Promise<string>} generated text response
     */
    async generate(request) {
        if (typeof this._generateRaw !== 'function') {
            throw new Error('generateRaw is not available — ensure a connection is configured in SillyTavern');
        }

        return await this._generateRaw(
            request.userPrompt,
            undefined,
            false,
            true,
            request.systemPrompt || '',
            request.maxTokens || 0,
        );
    }
}
