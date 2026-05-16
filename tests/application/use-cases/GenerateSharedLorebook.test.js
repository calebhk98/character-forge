/**
 * @file Tests for GenerateSharedLorebook use case.
 */

import { describe, it, expect } from 'vitest';
import { GenerateSharedLorebook } from '../../../src/application/use-cases/GenerateSharedLorebook.js';
import { IPromptBuilder } from '../../../src/application/ports/IPromptBuilder.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';
import { GenerationRequest } from '../../../src/domain/value-objects/GenerationRequest.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
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
        this.lastGroupDescription = null;
        this.lastCharacterNames = null;
        this.lastOptions = null;
    }

    /**
     * Stub build — not used by this use case.
     *
     * @param {string} desc - description
     * @returns {GenerationRequest} request
     */
    build(desc) {
        return new GenerationRequest({ systemPrompt: 'sys', userPrompt: desc });
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
        this.lastGroupDescription = groupDescription;
        this.lastCharacterNames = characterNames;
        this.lastOptions = options;
        return new GenerationRequest({
            systemPrompt: 'Generate shared lorebook',
            userPrompt: `Group: ${groupDescription}, chars: ${characterNames.join(', ')}`,
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
            name: 'Team Lorebook',
            entries: [
                { keys: ['team', 'group'], content: 'The team shares a common history.', name: 'Team Bond' },
                { keys: ['base', 'headquarters'], content: 'Their base of operations.', name: 'HQ' },
                {
                    keys: ['Alice', 'Bob'],
                    content: 'Alice and Bob are rivals-turned-allies.',
                    name: 'Alice-Bob Dynamic',
                },
            ],
        });
        this.lastRequest = null;
    }

    /**
     * Return the mocked response.
     *
     * @param {GenerationRequest} request - request
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
     * @param {string} m - message
     * @param {*} [d] - data
     */
    debug(m, d) { this.messages.push({ level: 'debug', m, d }); }

    /**
     * @param {string} m - message
     * @param {*} [d] - data
     */
    info(m, d) { this.messages.push({ level: 'info', m, d }); }

    /**
     * @param {string} m - message
     * @param {*} [d] - data
     */
    warn(m, d) { this.messages.push({ level: 'warn', m, d }); }

    /**
     * @param {string} m - message
     * @param {*} [d] - data
     */
    error(m, d) { this.messages.push({ level: 'error', m, d }); }
}

describe('GenerateSharedLorebook - happy path', () => {
    it('should return a Lorebook entity', async () => {
        const useCase = new GenerateSharedLorebook(new FakePromptBuilder(), new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        const result = await useCase.execute('A team of heroes', ['Alice', 'Bob', 'Carol']);
        expect(result).toBeInstanceOf(Lorebook);
    });

    it('should call buildSharedLorebookRequest with group description and character names', async () => {
        const promptBuilder = new FakePromptBuilder();
        const useCase = new GenerateSharedLorebook(promptBuilder, new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        await useCase.execute('A family of four', ['Dad', 'Blossom', 'Bubbles', 'Buttercup']);

        expect(promptBuilder.lastGroupDescription).toBe('A family of four');
        expect(promptBuilder.lastCharacterNames).toEqual(['Dad', 'Blossom', 'Bubbles', 'Buttercup']);
    });

    it('should include entries from the LLM response', async () => {
        const useCase = new GenerateSharedLorebook(new FakePromptBuilder(), new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        const lorebook = await useCase.execute('A team', ['A', 'B']);
        expect(lorebook.entries.length).toBe(3);
    });

    it('should use a higher default entry count than single-character lorebooks', async () => {
        const promptBuilder = new FakePromptBuilder();
        const useCase = new GenerateSharedLorebook(promptBuilder, new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        await useCase.execute('A team', ['A', 'B']);
        expect(promptBuilder.lastOptions.entryCount).toBeGreaterThan(10);
    });

    it('should name the lorebook after the group when LLM provides a name', async () => {
        const useCase = new GenerateSharedLorebook(new FakePromptBuilder(), new FakeLlmProvider(), new FakeLogger(), new FakeJsonRepair());
        const lorebook = await useCase.execute('A team', ['A', 'B']);
        expect(lorebook.name).toBe('Team Lorebook');
    });
});

describe('GenerateSharedLorebook - error handling', () => {
    it('should throw when LLM returns invalid JSON', async () => {
        const useCase = new GenerateSharedLorebook(
            new FakePromptBuilder(), new FakeLlmProvider('not json'), new FakeLogger(), new FakeJsonRepair(),
        );
        await expect(useCase.execute('A team', ['A'])).rejects.toThrow();
    });

    it('should throw when LLM response has no entries array', async () => {
        const useCase = new GenerateSharedLorebook(
            new FakePromptBuilder(), new FakeLlmProvider(JSON.stringify({ name: 'Lorebook' })), new FakeLogger(), new FakeJsonRepair(),
        );
        await expect(useCase.execute('A team', ['A'])).rejects.toThrow();
    });

    it('should repair markdown-wrapped JSON', async () => {
        const json = `\`\`\`json\n${JSON.stringify({ entries: [{ keys: ['x'], content: 'Content here.' }] })}\n\`\`\``;
        const useCase = new GenerateSharedLorebook(
            new FakePromptBuilder(), new FakeLlmProvider(json), new FakeLogger(), new FakeJsonRepair(),
        );
        const result = await useCase.execute('A team', ['A']);
        expect(result.entries.length).toBe(1);
    });
});
