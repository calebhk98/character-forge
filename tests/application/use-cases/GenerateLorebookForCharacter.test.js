/**
 * @file Tests for GenerateLorebookForCharacter use case.
 */

import { describe, it, expect } from 'vitest';
import { GenerateLorebookForCharacter } from '../../../src/application/use-cases/GenerateLorebookForCharacter.js';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

/**
 * Fake prompt builder for testing.
 *
 * @augments IPromptBuilder
 */
class FakePromptBuilder extends IPromptBuilder {
    /**
     * Construct the fake prompt builder.
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
            systemPrompt: 'Generate a lorebook',
            userPrompt: `Create lorebook for: ${description}`,
            temperature: 0.8,
        });
    }
}

/**
 * Fake LLM provider for testing.
 *
 * @augments ILlmProvider
 */
class FakeLlmProvider extends ILlmProvider {
    /**
     * Construct the fake LLM provider.
     *
     * @param {string} [responseJson] - JSON response to return
     */
    constructor(responseJson = null) {
        super();
        this.responseJson = responseJson || JSON.stringify({
            entries: [
                { keys: ['kingdom', 'realm'], content: 'The kingdom is a large place', name: 'Kingdom' },
                { keys: ['magic', 'spell'], content: 'Magic is forbidden', name: 'Magic System' },
                { keys: ['dragon'], content: 'A dragon guards the treasure', name: 'Dragon' },
            ],
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

describe('GenerateLorebookForCharacter - Core Functionality', () => {
    /**
     * Test happy path generation.
     */
    it('should generate a lorebook from description', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        const lorebook = await useCase.execute('A brave knight');
        expect(lorebook).toBeInstanceOf(Lorebook);
        expect(lorebook.entries).toHaveLength(3);
        expect(lorebook.entries[0]).toBeInstanceOf(LorebookEntry);
        expect(lorebook.entries[0].keys).toEqual(['kingdom', 'realm']);
    });

    /**
     * Test invalid JSON error handling.
     */
    it('should throw when LLM returns invalid JSON', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider('{ invalid }');
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        await expect(useCase.execute('A brave knight')).rejects.toThrow();
    });

    /**
     * Test missing entries field error handling.
     */
    it('should throw when response missing entries field', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider(JSON.stringify({ name: 'Lorebook' }));
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        await expect(useCase.execute('A brave knight')).rejects.toThrow();
    });

    /**
     * Test configurable entry count option.
     */
    it('should pass options to prompt builder and support entryCount', async () => {
        const twoEntriesResponse = JSON.stringify({
            entries: [
                { keys: ['a'], content: 'First' },
                { keys: ['b'], content: 'Second' },
            ],
        });
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider(twoEntriesResponse);
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        const options = { entryCount: 2 };
        const lorebook = await useCase.execute('A knight', options);
        expect(promptBuilder.lastDescription).toBe('A knight');
        expect(promptBuilder.lastOptions).toEqual(options);
        expect(lorebook.entries).toHaveLength(2);
    });

    /**
     * Test orchestration: prompt -> LLM -> parse -> Lorebook.
     */
    it('should orchestrate building prompt, calling LLM, and creating entries', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        await useCase.execute('A brave knight');
        expect(promptBuilder.lastDescription).toBe('A brave knight');
        expect(llmProvider.lastRequest).toBeDefined();
        expect(llmProvider.lastRequest.systemPrompt).toContain('lorebook');
    });
});

describe('GenerateLorebookForCharacter - JSON Repair', () => {
    /**
     * Test JSON repair for malformed markdown-wrapped JSON.
     */
    it('should repair malformed JSON with markdown code blocks', async () => {
        const promptBuilder = new FakePromptBuilder();
        const malformedJson = `\`\`\`json
{
    "entries": [
        { "keys": ["kingdom"], "content": "Test kingdom", "name": "Kingdom" },
    ]
}
\`\`\``;
        const llmProvider = new FakeLlmProvider(malformedJson);
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        const lorebook = await useCase.execute('A brave knight');
        expect(lorebook).toBeInstanceOf(Lorebook);
        expect(lorebook.entries).toHaveLength(1);
    });

    /**
     * Test JSON repair for trailing commas.
     */
    it('should repair JSON with trailing commas', async () => {
        const promptBuilder = new FakePromptBuilder();
        const jsonWithTrailingCommas = JSON.stringify({
            entries: [
                { keys: ['kingdom'], content: 'Test kingdom', name: 'Kingdom' },
            ],
        }).replace(/]/, ',]');
        const llmProvider = new FakeLlmProvider(jsonWithTrailingCommas);
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        const lorebook = await useCase.execute('A brave knight');
        expect(lorebook).toBeInstanceOf(Lorebook);
        expect(lorebook.entries).toHaveLength(1);
    });
});

describe('GenerateLorebookForCharacter - Error Handling', () => {
    /**
     * Test validation error with invalid entries.
     */
    it('should throw and log when entries fail validation', async () => {
        const promptBuilder = new FakePromptBuilder();
        const invalidEntriesJson = JSON.stringify({
            entries: [
                { keys: [], content: 'Missing keys' },
            ],
        });
        const llmProvider = new FakeLlmProvider(invalidEntriesJson);
        const logger = new FakeLogger();
        const useCase = new GenerateLorebookForCharacter(promptBuilder, llmProvider, logger);
        await expect(useCase.execute('A brave knight')).rejects.toThrow('Lorebook data invalid');
        const warnMessage = logger.messages.find((m) => m.level === 'warn');
        expect(warnMessage).toBeDefined();
        expect(warnMessage.message).toBe('Lorebook validation failed');
    });
});
