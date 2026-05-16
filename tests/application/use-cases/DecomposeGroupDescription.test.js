/**
 * @file Tests for DecomposeGroupDescription use case.
 */

import { describe, it, expect } from 'vitest';
import { DecomposeGroupDescription } from '../../../src/application/use-cases/DecomposeGroupDescription.js';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';
import { IJsonRepair } from '../../../src/application/ports/IJsonRepair.js';
import { repairJson } from '../../../src/infrastructure/utils/JsonRepair.js';

/**
 * Fake JSON repair adapter for testing. Uses the real repair implementation
 * so JSON-repair tests exercise the actual repair logic.
 *
 * @augments IJsonRepair
 */
class FakeJsonRepair extends IJsonRepair {
    /**
     * Repair malformed JSON using the real utility.
     *
     * @param {string} input - raw LLM output
     * @returns {object|null} parsed object or null
     */
    repair(input) {
        return repairJson(input);
    }
}

/**
 * Fake prompt builder that records calls.
 *
 * @augments IPromptBuilder
 */
class FakePromptBuilder extends IPromptBuilder {
    /**
     * Construct the fake builder.
     */
    constructor() {
        super();
        this.lastGroupDescription = null;
        this.lastOptions = null;
    }

    /**
     * Stub build — not used by this use case.
     *
     * @param {string} description - description
     * @returns {GenerationRequest} request
     */
    build(description) {
        return new GenerationRequest({ systemPrompt: 'sys', userPrompt: description });
    }

    /**
     * Build a group decomposition request.
     *
     * @param {string} description - group description
     * @param {object} [options] - options
     * @returns {GenerationRequest} request
     */
    buildGroupDecompositionRequest(description, options = {}) {
        this.lastGroupDescription = description;
        this.lastOptions = options;
        return new GenerationRequest({
            systemPrompt: 'Decompose the group',
            userPrompt: `Group: ${description}`,
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
     * Construct the fake provider.
     *
     * @param {string} [responseJson] - JSON to return
     */
    constructor(responseJson = null) {
        super();
        this.responseJson = responseJson || JSON.stringify({
            characters: [
                'A gentle scientist and single father who raised three superpowered daughters',
                'Blossom — the leader, calm and analytical, with ice breath and laser eyes',
                'Bubbles — joyful and empathetic, can talk to animals and project sonic blasts',
                'Buttercup — the toughest fighter, stubborn and fierce, no special power but raw strength',
            ],
        });
        this.lastRequest = null;
    }

    /**
     * Return the mocked response.
     *
     * @param {import('../../../src/application/ports/ILlmProvider.js').GenerationRequest} request - request
     * @returns {Promise<string>} response
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
     * @param {string} message - message
     * @param {*} [data] - data
     */
    debug(message, data) { this.messages.push({ level: 'debug', message, data }); }

    /**
     * Log info message.
     *
     * @param {string} message - message
     * @param {*} [data] - data
     */
    info(message, data) { this.messages.push({ level: 'info', message, data }); }

    /**
     * Log warning message.
     *
     * @param {string} message - message
     * @param {*} [data] - data
     */
    warn(message, data) { this.messages.push({ level: 'warn', message, data }); }

    /**
     * Log error message.
     *
     * @param {string} message - message
     * @param {*} [data] - data
     */
    error(message, data) { this.messages.push({ level: 'error', message, data }); }
}

describe('DecomposeGroupDescription - happy path', () => {
    it('should return an array of character descriptions', async () => {
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        const result = await useCase.execute('A dad who raises 3 superpowered daughters');

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(4);
        expect(typeof result[0]).toBe('string');
        expect(result[0].length).toBeGreaterThan(0);
    });

    it('should call prompt builder with the group description', async () => {
        const promptBuilder = new FakePromptBuilder();
        const useCase = new DecomposeGroupDescription(promptBuilder, new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        await useCase.execute('A family of four adventurers');

        expect(promptBuilder.lastGroupDescription).toBe('A family of four adventurers');
    });

    it('should call the LLM with the request from the prompt builder', async () => {
        const llmProvider = new FakeLlmProvider();
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), llmProvider, new FakeLogger(), new FakeJsonRepair());
        await useCase.execute('A family of four adventurers');

        expect(llmProvider.lastRequest).toBeDefined();
        expect(llmProvider.lastRequest.systemPrompt).toBe('Decompose the group');
    });

    it('should pass options to the prompt builder', async () => {
        const promptBuilder = new FakePromptBuilder();
        const useCase = new DecomposeGroupDescription(promptBuilder, new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        const options = { maxCharacters: 5 };
        await useCase.execute('A team', options);

        expect(promptBuilder.lastOptions).toEqual(options);
    });
});

describe('DecomposeGroupDescription - error handling', () => {
    it('should throw when LLM returns non-array characters field', async () => {
        const llmProvider = new FakeLlmProvider(JSON.stringify({ characters: 'not an array' }));
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), llmProvider, new FakeLogger(), new FakeJsonRepair());

        await expect(useCase.execute('A family')).rejects.toThrow();
    });

    it('should throw when LLM returns empty characters array', async () => {
        const llmProvider = new FakeLlmProvider(JSON.stringify({ characters: [] }));
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), llmProvider, new FakeLogger(), new FakeJsonRepair());

        await expect(useCase.execute('A family')).rejects.toThrow();
    });

    it('should throw when LLM returns invalid JSON', async () => {
        const llmProvider = new FakeLlmProvider('this is not json at all!!!');
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), llmProvider, new FakeLogger(), new FakeJsonRepair());

        await expect(useCase.execute('A family')).rejects.toThrow();
    });

    it('should throw when all entries are filtered out', async () => {
        const llmProvider = new FakeLlmProvider(JSON.stringify({ characters: [null, 42, ''] }));
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), llmProvider, new FakeLogger(), new FakeJsonRepair());

        await expect(useCase.execute('A group')).rejects.toThrow();
    });
});

describe('DecomposeGroupDescription - JSON repair', () => {
    it('should repair malformed JSON with markdown code fences', async () => {
        const malformedJson = `\`\`\`json\n${JSON.stringify({ characters: ['Char A', 'Char B'] })}\n\`\`\``;
        const llmProvider = new FakeLlmProvider(malformedJson);
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), llmProvider, new FakeLogger(), new FakeJsonRepair());
        const result = await useCase.execute('A duo');

        expect(result).toEqual(['Char A', 'Char B']);
    });

    it('should filter out non-string and empty entries from the characters array', async () => {
        const llmProvider = new FakeLlmProvider(
            JSON.stringify({ characters: ['Valid character', null, 42, 'Another valid', ''] }),
        );
        const useCase = new DecomposeGroupDescription(new FakePromptBuilder(), llmProvider, new FakeLogger(), new FakeJsonRepair());
        const result = await useCase.execute('A mixed group');

        expect(result).toEqual(['Valid character', 'Another valid']);
    });
});
