/**
 * @file Tests for GenerateCharacterFromDescription use case.
 */

import { describe, it, expect } from 'vitest';
import { GenerateCharacterFromDescription } from '../../../src/application/use-cases/GenerateCharacterFromDescription.js';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';
import { Character } from '../../../src/domain/entities/Character.js';

/**
 * Fake prompt builder for testing.
 *
 * @extends IPromptBuilder
 */
class FakePromptBuilder extends IPromptBuilder {
    /**
     * Construct the fake builder.
     */
    constructor() {
        super();
        this.lastDescription = null;
        this.lastOptions = null;
    }

    /**
     * Build a generation request from description.
     *
     * @param {string} description - character description
     * @param {object} [options] - generation options
     * @returns {GenerationRequest} generation request
     */
    build(description, options = {}) {
        this.lastDescription = description;
        this.lastOptions = options;
        return new GenerationRequest({
            systemPrompt: 'Generate a character',
            userPrompt: `Create character: ${description}`,
            temperature: 0.8,
        });
    }
}

/**
 * Fake LLM provider for testing.
 *
 * @extends ILlmProvider
 */
class FakeLlmProvider extends ILlmProvider {
    /**
     * Construct the fake provider.
     *
     * @param {string} [responseJson] - JSON to return
     */
    constructor(responseJson = null) {
        super();
        this.responseJson = responseJson || JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            personality: 'Cheerful',
            scenario: 'In a test world',
            first_mes: 'Hello from test!',
            mes_example: 'This is a test message.',
        });
        this.lastRequest = null;
    }

    /**
     * Generate text by returning the mocked response.
     *
     * @param {import('../../../src/application/ports/ILlmProvider.js').GenerationRequest} request - generation request
     * @returns {Promise<string>} mocked JSON response
     */
    async generate(request) {
        this.lastRequest = request;
        return this.responseJson;
    }
}

/**
 * Fake logger for testing.
 *
 * @extends ILogger
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
     * Log debug message.
     *
     * @param {string} message - debug message
     * @param {*} [data] - optional data
     * @returns {void}
     */
    debug(message, data) {
        this.messages.push({ level: 'debug', message, data });
    }

    /**
     * Log info message.
     *
     * @param {string} message - info message
     * @param {*} [data] - optional data
     * @returns {void}
     */
    info(message, data) {
        this.messages.push({ level: 'info', message, data });
    }

    /**
     * Log warning message.
     *
     * @param {string} message - warning message
     * @param {*} [data] - optional data
     * @returns {void}
     */
    warn(message, data) {
        this.messages.push({ level: 'warn', message, data });
    }

    /**
     * Log error message.
     *
     * @param {string} message - error message
     * @param {*} [data] - optional data
     * @returns {void}
     */
    error(message, data) {
        this.messages.push({ level: 'error', message, data });
    }
}

describe('GenerateCharacterFromDescription', () => {
    /**
     * Test happy path generation.
     */
    it('should generate a character from description', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger);
        const character = await useCase.execute('A brave knight');

        expect(character).toBeInstanceOf(Character);
        expect(character.name).toBe('TestCharacter');
        expect(character.description).toBe('A test character');
        expect(character.personality).toBe('Cheerful');
        expect(character.scenario).toBe('In a test world');
        expect(character.first_mes).toBe('Hello from test!');
        expect(character.mes_example).toBe('This is a test message.');
    });

    /**
     * Test error handling for invalid JSON.
     */
    it('should throw when LLM returns invalid JSON', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider('{ invalid json }');
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger);

        await expect(useCase.execute('A brave knight')).rejects.toThrow();
    });

    /**
     * Test error handling for missing required fields.
     */
    it('should throw when LLM response missing required fields', async () => {
        const promptBuilder = new FakePromptBuilder();
        const invalidResponse = JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            // missing personality, scenario, first_mes, mes_example
        });
        const llmProvider = new FakeLlmProvider(invalidResponse);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger);

        await expect(useCase.execute('A brave knight')).rejects.toThrow();
    });

    /**
     * Test that prompt builder is called with correct arguments.
     */
    it('should call prompt builder with description and options', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger);
        const options = { temperature: 0.7 };
        await useCase.execute('A brave knight', options);

        expect(promptBuilder.lastDescription).toBe('A brave knight');
        expect(promptBuilder.lastOptions).toEqual(options);
    });

    /**
     * Test that LLM provider is called with request from prompt builder.
     */
    it('should call LLM provider with request from prompt builder', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger);
        await useCase.execute('A brave knight');

        expect(llmProvider.lastRequest).toBeDefined();
        expect(llmProvider.lastRequest.systemPrompt).toBe('Generate a character');
        expect(llmProvider.lastRequest.userPrompt).toContain('A brave knight');
    });
});
