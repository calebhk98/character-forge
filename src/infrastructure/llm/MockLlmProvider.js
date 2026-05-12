/**
 * @file Adapter that returns canned responses for testing and demo purposes.
 */

import { ILlmProvider } from '../../application/ports/ILlmProvider.js';

/**
 * Mock LLM provider that returns preset responses.
 * @extends ILlmProvider
 */
export class MockLlmProvider extends ILlmProvider {
    /**
     * Construct with mock response data.
     *
     * @param {object} mockResponses map of prompt patterns to canned responses
     */
    constructor(mockResponses = {}) {
        super();
        this.mockResponses = mockResponses;
    }

    /**
     * Return a mock response based on the request.
     *
     * @param {import('../../application/ports/ILlmProvider.js').GenerationRequest} request
     * @returns {Promise<string>}
     */
    async generate(request) {
        // TODO: implement - return mocked JSON for testing
        throw new Error('MockLlmProvider.generate not implemented');
    }
}
