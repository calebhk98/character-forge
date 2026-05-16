/**
 * @file Tests for RefineCharacterField use case.
 */

import { describe, it, expect } from 'vitest';
import { RefineCharacterField } from '../../../src/application/use-cases/RefineCharacterField.js';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';

/**
 * Fake prompt builder that records calls to buildRefinementRequest.
 *
 * @augments IPromptBuilder
 */
class FakePromptBuilder extends IPromptBuilder {
    /**
     * Construct the fake builder.
     */
    constructor() {
        super();
        this.lastRefinementArgs = null;
    }

    /**
     * Build a generation request.
     *
     * @param {string} description - character description
     * @param {object} [_options] - options
     * @returns {GenerationRequest} request
     */
    build(description, _options = {}) {
        return new GenerationRequest({ systemPrompt: 'build', userPrompt: description });
    }

    /**
     * Build a refinement request and record arguments.
     *
     * @param {string} description - original concept
     * @param {string} fieldName - field to rewrite
     * @param {string} currentValue - existing field text
     * @param {string} feedback - user feedback
     * @returns {GenerationRequest} request
     */
    buildRefinementRequest(description, fieldName, currentValue, feedback) {
        this.lastRefinementArgs = { description, fieldName, currentValue, feedback };
        return new GenerationRequest({
            systemPrompt: 'Rewrite one field',
            userPrompt: `Rewrite ${fieldName}: ${currentValue}`,
        });
    }
}

/**
 * Fake LLM provider returning a configurable string response.
 *
 * @augments ILlmProvider
 */
class FakeLlmProvider extends ILlmProvider {
    /**
     * Construct the fake provider.
     *
     * @param {string} [response] - text to return from generate
     */
    constructor(response = 'Refined field text') {
        super();
        this.response = response;
        this.lastRequest = null;
    }

    /**
     * Generate text from a request.
     *
     * @param {import('../../../src/domain/value-objects/GenerationRequest.js').GenerationRequest} request - generation request
     * @returns {Promise<string>} mocked response
     */
    async generate(request) {
        this.lastRequest = request;
        return this.response;
    }
}

/**
 * Fake logger that stores messages for assertions.
 *
 * @augments ILogger
 */
class FakeLogger extends ILogger {
    /**
     * Construct the fake logger.
     */
    constructor() {
        super();
        this.messages = [];
    }

    /**
     * Log debug.
     *
     * @param {string} m - message
     * @param {*} [d] - data
     */
    debug(m, d) { this.messages.push({ level: 'debug', message: m, data: d }); }

    /**
     * Log info.
     *
     * @param {string} m - message
     * @param {*} [d] - data
     */
    info(m, d) { this.messages.push({ level: 'info', message: m, data: d }); }

    /**
     * Log warn.
     *
     * @param {string} m - message
     * @param {*} [d] - data
     */
    warn(m, d) { this.messages.push({ level: 'warn', message: m, data: d }); }

    /**
     * Log error.
     *
     * @param {string} m - message
     * @param {*} [d] - data
     */
    error(m, d) { this.messages.push({ level: 'error', message: m, data: d }); }
}

describe('RefineCharacterField', () => {
    /**
     * Happy path: trimmed string returned.
     */
    it('should return the LLM response as a trimmed string', async () => {
        const useCase = new RefineCharacterField(
            new FakePromptBuilder(),
            new FakeLlmProvider('  Refined personality text  '),
            new FakeLogger(),
        );

        const result = await useCase.execute('A brave knight', 'personality', 'Old personality', '');

        expect(result).toBe('Refined personality text');
    });

    /**
     * All args forwarded to buildRefinementRequest.
     */
    it('should call buildRefinementRequest with all args', async () => {
        const promptBuilder = new FakePromptBuilder();
        const useCase = new RefineCharacterField(promptBuilder, new FakeLlmProvider(), new FakeLogger());

        await useCase.execute('A brave knight', 'personality', 'Old text', 'make it darker');

        expect(promptBuilder.lastRefinementArgs).toEqual({
            description: 'A brave knight',
            fieldName: 'personality',
            currentValue: 'Old text',
            feedback: 'make it darker',
        });
    });

    /**
     * Empty feedback still produces a valid result (blind retry).
     */
    it('should work with empty feedback for a blind retry', async () => {
        const promptBuilder = new FakePromptBuilder();
        const useCase = new RefineCharacterField(promptBuilder, new FakeLlmProvider('New value'), new FakeLogger());

        const result = await useCase.execute('A brave knight', 'name', 'Sir Lance', '');

        expect(result).toBe('New value');
        expect(promptBuilder.lastRefinementArgs.feedback).toBe('');
    });

    /**
     * LLM is called with the request produced by the prompt builder.
     */
    it('should call LLM with the request from buildRefinementRequest', async () => {
        const llmProvider = new FakeLlmProvider();
        const useCase = new RefineCharacterField(new FakePromptBuilder(), llmProvider, new FakeLogger());

        await useCase.execute('Concept', 'first_mes', 'Old intro', 'make it longer');

        expect(llmProvider.lastRequest.systemPrompt).toBe('Rewrite one field');
    });

    /**
     * LLM errors propagate to the caller.
     */
    it('should propagate LLM errors', async () => {
        const llmProvider = new FakeLlmProvider();
        llmProvider.generate = async () => { throw new Error('LLM failure'); };
        const useCase = new RefineCharacterField(new FakePromptBuilder(), llmProvider, new FakeLogger());

        await expect(useCase.execute('Concept', 'name', 'Old', '')).rejects.toThrow('LLM failure');
    });
});
