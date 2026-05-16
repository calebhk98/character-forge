/**
 * @file Tests for ExtractCharacterFromChat use case.
 */

import { describe, it, expect } from 'vitest';
import { ExtractCharacterFromChat } from '../../../src/application/use-cases/ExtractCharacterFromChat.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';
import { Character } from '../../../src/domain/entities/Character.js';

/** @type {object} Minimal valid character JSON fields. */
const VALID_CHARACTER = {
    name: 'Bob',
    description: 'A passionate history teacher who secretly plays guitar',
    personality: 'Enthusiastic, knowledgeable, secretly artistic',
    scenario: 'College classroom setting',
    first_mes: 'Good morning, class. Today we explore the Renaissance.',
    mes_example: '',
};

/**
 * Fake LLM provider that returns a fixed response.
 *
 * @augments ILlmProvider
 */
class FakeLlmProvider extends ILlmProvider {
    /**
     * Construct the fake provider.
     *
     * @param {string} [responseJson] - JSON string to return from generate
     */
    constructor(responseJson = JSON.stringify(VALID_CHARACTER)) {
        super();
        this.responseJson = responseJson;
        this.lastRequest = null;
    }

    /**
     * Return the fixed mock response.
     *
     * @param {import('../../../src/application/ports/ILlmProvider.js').GenerationRequest} request - generation request
     * @returns {Promise<string>} mock response
     */
    async generate(request) {
        this.lastRequest = request;
        return this.responseJson;
    }
}

/**
 * Fake logger that records messages for assertion.
 *
 * @augments ILogger
 */
class FakeLogger extends ILogger {
    /** Construct with empty message log. */
    constructor() {
        super();
        this.messages = [];
    }

    /**
     * @param {string} m - message
     * @param {*} [data] - optional data
     */
    debug(m, data) { this.messages.push({ level: 'debug', m, data }); }

    /**
     * @param {string} m - message
     * @param {*} [data] - optional data
     */
    info(m, data) { this.messages.push({ level: 'info', m, data }); }

    /**
     * @param {string} m - message
     * @param {*} [data] - optional data
     */
    warn(m, data) { this.messages.push({ level: 'warn', m, data }); }

    /**
     * @param {string} m - message
     * @param {*} [data] - optional data
     */
    error(m, data) { this.messages.push({ level: 'error', m, data }); }
}

/** @type {Array<{is_user: boolean, mes: string}>} Sample chat messages. */
const SAMPLE_MESSAGES = [
    { is_user: false, mes: 'Good morning, class. I am Professor Bob, your history teacher.' },
    { is_user: true, mes: 'Hi Professor Bob! Will we have homework today?' },
    { is_user: false, mes: 'I\'m afraid so. But first, let me tell you about the Renaissance.' },
];

describe('ExtractCharacterFromChat - happy path', () => {
    it('should return a Character entity for a named character in the chat', async () => {
        const llm = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new ExtractCharacterFromChat(llm, logger);

        const character = await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(character).toBeInstanceOf(Character);
        expect(character.name).toBe('Bob');
    });

    it('should include the character name in the prompt', async () => {
        const llm = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new ExtractCharacterFromChat(llm, logger);

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.userPrompt).toContain('Bob');
    });

    it('should include the chat transcript in the prompt', async () => {
        const llm = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new ExtractCharacterFromChat(llm, logger);

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.userPrompt).toContain('Professor Bob, your history teacher');
    });

    it('should format user and AI turns distinctly in the transcript', async () => {
        const llm = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new ExtractCharacterFromChat(llm, logger);

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.userPrompt).toContain('User:');
        expect(llm.lastRequest.userPrompt).toContain('AI:');
    });

    it('should include a system prompt in the generation request', async () => {
        const llm = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new ExtractCharacterFromChat(llm, logger);

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.systemPrompt).toBeTruthy();
        expect(llm.lastRequest.systemPrompt.length).toBeGreaterThan(10);
    });

    it('should log debug on start and info on success', async () => {
        const llm = new FakeLlmProvider();
        const logger = new FakeLogger();
        const useCase = new ExtractCharacterFromChat(llm, logger);

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(logger.messages.some(m => m.level === 'debug')).toBe(true);
        expect(logger.messages.some(m => m.level === 'info')).toBe(true);
    });
});

describe('ExtractCharacterFromChat - validation', () => {
    it('should throw when character name is empty', async () => {
        const useCase = new ExtractCharacterFromChat(new FakeLlmProvider(), new FakeLogger());
        await expect(useCase.execute('', SAMPLE_MESSAGES)).rejects.toThrow('Character name is required');
    });

    it('should throw when character name is whitespace only', async () => {
        const useCase = new ExtractCharacterFromChat(new FakeLlmProvider(), new FakeLogger());
        await expect(useCase.execute('   ', SAMPLE_MESSAGES)).rejects.toThrow('Character name is required');
    });

    it('should throw when chat messages array is empty', async () => {
        const useCase = new ExtractCharacterFromChat(new FakeLlmProvider(), new FakeLogger());
        await expect(useCase.execute('Bob', [])).rejects.toThrow('Chat history is empty');
    });

    it('should throw when chat messages is null', async () => {
        const useCase = new ExtractCharacterFromChat(new FakeLlmProvider(), new FakeLogger());
        await expect(useCase.execute('Bob', null)).rejects.toThrow('Chat history is empty');
    });
});

describe('ExtractCharacterFromChat - JSON repair', () => {
    it('should repair markdown-fenced JSON in LLM response', async () => {
        const fenced = `\`\`\`json\n${JSON.stringify(VALID_CHARACTER)}\n\`\`\``;
        const llm = new FakeLlmProvider(fenced);
        const useCase = new ExtractCharacterFromChat(llm, new FakeLogger());

        const character = await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(character.name).toBe('Bob');
    });

    it('should throw when LLM returns completely unparseable text', async () => {
        const llm = new FakeLlmProvider('Sorry, I cannot do that.');
        const useCase = new ExtractCharacterFromChat(llm, new FakeLogger());

        await expect(useCase.execute('Bob', SAMPLE_MESSAGES)).rejects.toThrow();
    });
});
