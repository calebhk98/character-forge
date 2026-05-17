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
 * Fake prompt builder for testing.
 *
 * @augments IPromptBuilder
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

describe('GenerateCharacterFromDescription - Core Functionality', () => {
    /**
     * Test happy path generation.
     */
    it('should generate a character from description', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
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

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());

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
        });
        const llmProvider = new FakeLlmProvider(invalidResponse);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());

        await expect(useCase.execute('A brave knight')).rejects.toThrow();
    });

    /**
     * Test that prompt builder is called with correct arguments.
     */
    it('should call prompt builder with description and options', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const options = { entryCount: 5 };
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

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        await useCase.execute('A brave knight');

        expect(llmProvider.lastRequest).toBeDefined();
        expect(llmProvider.lastRequest.systemPrompt).toBe('Generate a character');
        expect(llmProvider.lastRequest.userPrompt).toContain('A brave knight');
    });
});

describe('GenerateCharacterFromDescription - alternate_greetings', () => {
    it('should pass through alternate_greetings from LLM response', async () => {
        const promptBuilder = new FakePromptBuilder();
        const responseWithAlternates = JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            personality: 'Cheerful',
            scenario: 'In a test world',
            first_mes: 'Hello from test!',
            mes_example: 'This is a test message.',
            alternate_greetings: ['Alternate one.', 'Alternate two.', 'Alternate three.'],
        });
        const llmProvider = new FakeLlmProvider(responseWithAlternates);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(character.alternate_greetings).toEqual([
            'Alternate one.',
            'Alternate two.',
            'Alternate three.',
        ]);
    });

    it('should default alternate_greetings to empty array when LLM omits the field', async () => {
        const promptBuilder = new FakePromptBuilder();
        const llmProvider = new FakeLlmProvider();
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(character.alternate_greetings).toEqual([]);
    });
});

describe('GenerateCharacterFromDescription - LLM Output Normalisation', () => {
    it('should join mes_example array of strings into a single string', async () => {
        const promptBuilder = new FakePromptBuilder();
        const responseWithArrayMesExample = JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            personality: 'Cheerful',
            scenario: 'In a test world',
            first_mes: 'Hello from test!',
            mes_example: [
                '<START>\n{{char}}: Hello!\n{{user}}: Hi.\n{{char}}: Nice to meet you.',
                '<START>\n{{char}}: How are you?\n{{user}}: Fine.\n{{char}}: Great.',
            ],
        });
        const llmProvider = new FakeLlmProvider(responseWithArrayMesExample);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(typeof character.mes_example).toBe('string');
        expect(character.mes_example).toContain('<START>');
    });

    it('should filter null and undefined elements from alternate_greetings', async () => {
        const promptBuilder = new FakePromptBuilder();
        const responseWithNullGreeting = JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            personality: 'Cheerful',
            scenario: 'In a test world',
            first_mes: 'Hello from test!',
            mes_example: 'This is a test message.',
            alternate_greetings: ['Valid greeting one.', null, 'Valid greeting two.'],
        });
        const llmProvider = new FakeLlmProvider(responseWithNullGreeting);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(character.alternate_greetings).toEqual(['Valid greeting one.', 'Valid greeting two.']);
    });

    it('should extract string from object element in alternate_greetings using common keys', async () => {
        const promptBuilder = new FakePromptBuilder();
        const responseWithObjectGreeting = JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            personality: 'Cheerful',
            scenario: 'In a test world',
            first_mes: 'Hello from test!',
            mes_example: 'This is a test message.',
            alternate_greetings: [
                'Normal greeting.',
                { content: 'Extracted from content key.' },
                'Another normal greeting.',
            ],
        });
        const llmProvider = new FakeLlmProvider(responseWithObjectGreeting);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(character.alternate_greetings[1]).toBe('Extracted from content key.');
    });

    it('should handle mes_example as non-string non-array by converting to string', async () => {
        const promptBuilder = new FakePromptBuilder();
        const responseWithObjectMesExample = JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            personality: 'Cheerful',
            scenario: 'In a test world',
            first_mes: 'Hello from test!',
            mes_example: { text: 'Example exchange text.' },
        });
        const llmProvider = new FakeLlmProvider(responseWithObjectMesExample);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(typeof character.mes_example).toBe('string');
        expect(character.mes_example.length).toBeGreaterThan(0);
    });
});

describe('GenerateCharacterFromDescription - JSON Repair', () => {
    /**
     * Test JSON repair for malformed markdown-wrapped JSON.
     */
    it('should repair malformed JSON with markdown code blocks', async () => {
        const promptBuilder = new FakePromptBuilder();
        const malformedJson = `\`\`\`json
{
    "name": "TestCharacter",
    "description": "A test character",
    "personality": "Cheerful",
    "scenario": "In a test world",
    "first_mes": "Hello from test!",
    "mes_example": "This is a test message.",
}
\`\`\``;
        const llmProvider = new FakeLlmProvider(malformedJson);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(character).toBeInstanceOf(Character);
        expect(character.name).toBe('TestCharacter');
    });

    /**
     * Test JSON repair for trailing commas.
     */
    it('should repair JSON with trailing commas', async () => {
        const promptBuilder = new FakePromptBuilder();
        const jsonWithTrailingCommas = JSON.stringify({
            name: 'TestCharacter',
            description: 'A test character',
            personality: 'Cheerful',
            scenario: 'In a test world',
            first_mes: 'Hello from test!',
            mes_example: 'This is a test message.',
        }).replace(/}$/, ',}');
        const llmProvider = new FakeLlmProvider(jsonWithTrailingCommas);
        const logger = new FakeLogger();

        const useCase = new GenerateCharacterFromDescription(promptBuilder, llmProvider, logger, new FakeJsonRepair());
        const character = await useCase.execute('A brave knight');

        expect(character).toBeInstanceOf(Character);
        expect(character.name).toBe('TestCharacter');
    });
});
