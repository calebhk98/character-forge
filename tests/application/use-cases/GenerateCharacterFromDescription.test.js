/**
 * @file Tests for GenerateCharacterFromDescription use case (five-step pipeline).
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

// Standard step responses for a typical happy-path test
const META = JSON.stringify({ name: 'TestChar', creator_notes: 'A test.', tags: ['test'], talkativeness: '0.5' });
const BEHAVIOR = JSON.stringify({ description: 'A test character.', personality: 'Cheerful.' });
const SCENE = JSON.stringify({ scenario: 'In a test world.', first_mes: 'Hello from test!' });
const DIALOGUE = '<START>\n{{char}}: *waves* "Hello!"\n{{user}}: Hi there.\n{{char}}: *smiles* "Nice to meet you."';
const GREETINGS = JSON.stringify(['Greeting one.', 'Greeting two.', 'Greeting three.']);

/**
 * Fake JSON repair adapter for testing. Uses the real repair implementation.
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
 * LLM provider that returns queued responses in order.
 *
 * @augments ILlmProvider
 */
class QueuedLlmProvider extends ILlmProvider {
    /**
     * Construct the provider with a list of responses.
     *
     * @param {string[]} responses - responses to return in order
     */
    constructor(responses) {
        super();
        this.responses = [...responses];
        this.calls = [];
    }

    /**
     * Return the next queued response.
     *
     * @param {GenerationRequest} request - generation request
     * @returns {Promise<string>} next response
     */
    async generate(request) {
        this.calls.push(request);
        if (this.responses.length === 0) throw new Error('No more responses queued');
        return this.responses.shift();
    }
}

/**
 * Fake prompt builder implementing all IPromptBuilder methods.
 *
 * @augments IPromptBuilder
 */
class FakePromptBuilder extends IPromptBuilder {
    /**
     * Construct the fake builder.
     */
    constructor() {
        super();
        this.calls = [];
    }

    /**
     * Build a basic generation request.
     *
     * @param {string} description - character description
     * @param {object} [options] - generation options
     * @returns {GenerationRequest} generation request
     */
    build(description, options = {}) {
        this.calls.push({ method: 'build', description, options });
        return new GenerationRequest({ systemPrompt: 'sys', userPrompt: `build:${description}` });
    }

    /**
     * Build a refinement request.
     *
     * @param {string} description - description
     * @param {string} fieldName - field name
     * @param {string} currentValue - current value
     * @param {string} [feedback] - feedback
     * @returns {GenerationRequest} request
     */
    buildRefinementRequest(description, fieldName, currentValue, feedback = '') {
        this.calls.push({ method: 'buildRefinementRequest', description, fieldName, currentValue, feedback });
        return new GenerationRequest({ systemPrompt: 'sys', userPrompt: `refine:${fieldName}` });
    }

    /**
     * Build a shared lorebook request.
     *
     * @param {string} groupDescription - group description
     * @param {string[]} characterNames - character names
     * @param {object} [options] - options
     * @returns {GenerationRequest} request
     */
    buildSharedLorebookRequest(groupDescription, characterNames, options = {}) {
        this.calls.push({ method: 'buildSharedLorebookRequest', groupDescription, characterNames, options });
        return new GenerationRequest({ systemPrompt: 'sys', userPrompt: `shared:${groupDescription}` });
    }

    /**
     * Build a group decomposition request.
     *
     * @param {string} groupDescription - group description
     * @param {object} [options] - options
     * @returns {GenerationRequest} request
     */
    buildGroupDecompositionRequest(groupDescription, options = {}) {
        this.calls.push({ method: 'buildGroupDecompositionRequest', groupDescription, options });
        return new GenerationRequest({ systemPrompt: 'sys', userPrompt: `decompose:${groupDescription}` });
    }

    /**
     * Build metadata request.
     *
     * @param {string} description - description
     * @returns {GenerationRequest} request
     */
    buildMetadataRequest(description) {
        this.calls.push({ method: 'buildMetadataRequest', description });
        return new GenerationRequest({ systemPrompt: 'meta-sys', userPrompt: `meta:${description}` });
    }

    /**
     * Build behavior request.
     *
     * @param {string} description - description
     * @param {object} context - context
     * @returns {GenerationRequest} request
     */
    buildBehaviorRequest(description, context) {
        this.calls.push({ method: 'buildBehaviorRequest', description, context });
        return new GenerationRequest({ systemPrompt: 'behavior-sys', userPrompt: `behavior:${description}` });
    }

    /**
     * Build scene request.
     *
     * @param {string} description - description
     * @param {object} context - context
     * @returns {GenerationRequest} request
     */
    buildSceneRequest(description, context) {
        this.calls.push({ method: 'buildSceneRequest', description, context });
        return new GenerationRequest({ systemPrompt: 'scene-sys', userPrompt: `scene:${description}` });
    }

    /**
     * Build dialogue request.
     *
     * @param {string} description - description
     * @param {object} context - context
     * @returns {GenerationRequest} request
     */
    buildDialogueRequest(description, context) {
        this.calls.push({ method: 'buildDialogueRequest', description, context });
        return new GenerationRequest({ systemPrompt: 'dialogue-sys', userPrompt: `dialogue:${description}` });
    }

    /**
     * Build greetings request.
     *
     * @param {string} description - description
     * @param {object} context - context
     * @param {object} [options] - options
     * @returns {GenerationRequest} request
     */
    buildGreetingsRequest(description, context, options = {}) {
        this.calls.push({ method: 'buildGreetingsRequest', description, context, options });
        return new GenerationRequest({ systemPrompt: 'greetings-sys', userPrompt: `greetings:${description}` });
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
     * @returns {void}
     */
    debug(message, data) { this.messages.push({ level: 'debug', message, data }); }

    /**
     * Log info message.
     *
     * @param {string} message - message
     * @param {*} [data] - data
     * @returns {void}
     */
    info(message, data) { this.messages.push({ level: 'info', message, data }); }

    /**
     * Log warn message.
     *
     * @param {string} message - message
     * @param {*} [data] - data
     * @returns {void}
     */
    warn(message, data) { this.messages.push({ level: 'warn', message, data }); }

    /**
     * Log error message.
     *
     * @param {string} message - message
     * @param {*} [data] - data
     * @returns {void}
     */
    error(message, data) { this.messages.push({ level: 'error', message, data }); }
}

/**
 * Build a standard use case with queued responses.
 *
 * @param {string[]} responses - queued LLM responses
 * @returns {{ useCase: GenerateCharacterFromDescription, llm: QueuedLlmProvider, logger: FakeLogger, promptBuilder: FakePromptBuilder }}
 */
function buildUseCase(responses) {
    const promptBuilder = new FakePromptBuilder();
    const llm = new QueuedLlmProvider(responses);
    const logger = new FakeLogger();
    const jsonRepair = new FakeJsonRepair();
    const useCase = new GenerateCharacterFromDescription(promptBuilder, llm, logger, jsonRepair);
    return { useCase, llm, logger, promptBuilder };
}

describe('GenerateCharacterFromDescription - Happy Path', () => {
    it('should return a Character with all fields assembled from 5 steps', async () => {
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        const character = await useCase.execute('A brave knight');

        expect(character).toBeInstanceOf(Character);
        expect(character.name).toBe('TestChar');
        expect(character.description).toBe('A test character.');
        expect(character.personality).toBe('Cheerful.');
        expect(character.scenario).toBe('In a test world.');
        expect(character.first_mes).toBe('Hello from test!');
        expect(typeof character.mes_example).toBe('string');
        expect(character.alternate_greetings).toEqual(['Greeting one.', 'Greeting two.', 'Greeting three.']);
        expect(character.tags).toEqual(['test']);
        expect(character.talkativeness).toBe('0.5');
    });

    it('should make exactly 5 LLM calls in order', async () => {
        const { useCase, llm } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        await useCase.execute('A brave knight');

        expect(llm.calls).toHaveLength(5);
    });

    it('should call the correct prompt builder methods', async () => {
        const { useCase, promptBuilder } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        await useCase.execute('A brave knight');

        const methods = promptBuilder.calls.map((c) => c.method);
        expect(methods).toEqual([
            'buildMetadataRequest',
            'buildBehaviorRequest',
            'buildSceneRequest',
            'buildDialogueRequest',
            'buildGreetingsRequest',
        ]);
    });
});

describe('GenerateCharacterFromDescription - onProgress callback', () => {
    it('should call onProgress 5 times with correct step names', async () => {
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        const steps = [];
        await useCase.execute('A brave knight', {}, (step, data) => steps.push({ step, data }));

        expect(steps).toHaveLength(5);
        expect(steps[0].step).toBe('metadata');
        expect(steps[1].step).toBe('behavior');
        expect(steps[2].step).toBe('scene');
        expect(steps[3].step).toBe('dialogue');
        expect(steps[4].step).toBe('greetings');
    });

    it('should pass correct data to onProgress for each step', async () => {
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        const steps = [];
        await useCase.execute('A brave knight', {}, (step, data) => steps.push({ step, data }));

        expect(steps[0].data.name).toBe('TestChar');
        expect(steps[1].data.description).toBe('A test character.');
        expect(steps[2].data.scenario).toBe('In a test world.');
        expect(steps[3].data.mes_example).toBeDefined();
        expect(steps[4].data.alternate_greetings).toHaveLength(3);
    });
});

describe('GenerateCharacterFromDescription - repairMesExample', () => {
    it('should replace "START\\n" with "<START>\\n"', async () => {
        const rawDialogue = 'START\n{{char}}: *waves* "Hello!"';
        const { useCase } = buildUseCase([
            META, BEHAVIOR, SCENE, rawDialogue, GREETINGS,
        ]);
        const character = await useCase.execute('A brave knight');
        expect(character.mes_example).toContain('<START>');
        expect(character.mes_example).not.toMatch(/^START\b/m);
    });

    it('should replace "SillyTavern System:" with "{{char}}:"', async () => {
        const rawDialogue = '<START>\nSillyTavern System: "Hello!"\n{{user}}: Hi.';
        const { useCase } = buildUseCase([
            META, BEHAVIOR, SCENE, rawDialogue, GREETINGS,
        ]);
        const character = await useCase.execute('A brave knight');
        expect(character.mes_example).toContain('{{char}}:');
        expect(character.mes_example).not.toContain('SillyTavern System:');
    });

    it('should replace character name with {{char}} at line start', async () => {
        const rawDialogue = '<START>\nTestChar: *waves* "Hello!"';
        const { useCase } = buildUseCase([
            META, BEHAVIOR, SCENE, rawDialogue, GREETINGS,
        ]);
        const character = await useCase.execute('A brave knight');
        expect(character.mes_example).toContain('{{char}}:');
        expect(character.mes_example).not.toMatch(/^TestChar:/m);
    });
});

describe('GenerateCharacterFromDescription - Error handling', () => {
    it('should throw when step 1 metadata missing "name" field', async () => {
        const badMeta = JSON.stringify({ creator_notes: 'A test.', tags: [], talkativeness: '0.5' });
        const { useCase } = buildUseCase([badMeta]);
        await expect(useCase.execute('A brave knight')).rejects.toThrow('metadata');
    });

    it('should throw when step 2 behavior missing "description" field', async () => {
        const badBehavior = JSON.stringify({ personality: 'Cheerful.' });
        const { useCase } = buildUseCase([META, badBehavior]);
        await expect(useCase.execute('A brave knight')).rejects.toThrow('behavior');
    });

    it('should throw when step 2 behavior missing "personality" field', async () => {
        const badBehavior = JSON.stringify({ description: 'A test character.' });
        const { useCase } = buildUseCase([META, badBehavior]);
        await expect(useCase.execute('A brave knight')).rejects.toThrow('behavior');
    });

    it('should throw when step 3 scene missing "scenario" field', async () => {
        const badScene = JSON.stringify({ first_mes: 'Hello!' });
        const { useCase } = buildUseCase([META, BEHAVIOR, badScene]);
        await expect(useCase.execute('A brave knight')).rejects.toThrow('scene');
    });

    it('should throw when step 3 scene missing "first_mes" field', async () => {
        const badScene = JSON.stringify({ scenario: 'In a test world.' });
        const { useCase } = buildUseCase([META, BEHAVIOR, badScene]);
        await expect(useCase.execute('A brave knight')).rejects.toThrow('scene');
    });
});

describe('GenerateCharacterFromDescription - JSON Repair', () => {
    it('should repair malformed JSON in step 1 using jsonRepair', async () => {
        const malformedMeta = '```json\n{"name": "TestChar", "creator_notes": "A test.", "tags": ["test"], "talkativeness": "0.5"}\n```';
        const { useCase } = buildUseCase([malformedMeta, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        const character = await useCase.execute('A brave knight');
        expect(character.name).toBe('TestChar');
    });
});

describe('GenerateCharacterFromDescription - Field defaults', () => {
    it('should default tags to [] when LLM omits them', async () => {
        const metaNoTags = JSON.stringify({ name: 'TestChar', creator_notes: 'A test.', talkativeness: '0.5' });
        const { useCase } = buildUseCase([metaNoTags, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        const character = await useCase.execute('A brave knight');
        expect(character.tags).toEqual([]);
    });

    it('should parse alternate_greetings from a JSON array response', async () => {
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        const character = await useCase.execute('A brave knight');
        expect(character.alternate_greetings).toEqual(['Greeting one.', 'Greeting two.', 'Greeting three.']);
    });

    it('should parse alternate_greetings from {alternate_greetings: [...]} object fallback', async () => {
        const wrappedGreetings = JSON.stringify({
            alternate_greetings: ['Greeting one.', 'Greeting two.', 'Greeting three.'],
        });
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, wrappedGreetings]);
        const character = await useCase.execute('A brave knight');
        expect(character.alternate_greetings).toEqual(['Greeting one.', 'Greeting two.', 'Greeting three.']);
    });

    it('should set creator_notes on the character', async () => {
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, GREETINGS]);
        const character = await useCase.execute('A brave knight');
        expect(character.creator_notes).toBe('A test.');
    });

    it('should return empty alternate_greetings and continue when LLM returns unparseable greetings', async () => {
        const badGreetings = 'This is not JSON at all, just some prose text.';
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, badGreetings]);
        const character = await useCase.execute('A brave knight');
        expect(character.alternate_greetings).toEqual([]);
    });

    it('should log a warning when greetings parsing fails', async () => {
        const badGreetings = 'This is not JSON at all, just some prose text.';
        const { useCase, logger } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, badGreetings]);
        await useCase.execute('A brave knight');
        const warnMessages = logger.messages.filter((m) => m.level === 'warn');
        expect(warnMessages.length).toBeGreaterThan(0);
    });

    it('should still fire the greetings onProgress callback with empty array when parsing fails', async () => {
        const badGreetings = 'This is not JSON at all, just some prose text.';
        const { useCase } = buildUseCase([META, BEHAVIOR, SCENE, DIALOGUE, badGreetings]);
        const steps = [];
        await useCase.execute('A brave knight', {}, (step, data) => steps.push({ step, data }));
        const greetingsStep = steps.find((s) => s.step === 'greetings');
        expect(greetingsStep).toBeDefined();
        expect(greetingsStep.data.alternate_greetings).toEqual([]);
    });
});
