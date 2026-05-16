/**
 * @file Tests for ExtractCharacterFromChat use case.
 */

import { describe, it, expect } from 'vitest';
import { ExtractCharacterFromChat } from '../../../src/application/use-cases/ExtractCharacterFromChat.js';
import { ILlmProvider } from '../../../src/application/ports/ILlmProvider.js';
import { ILogger } from '../../../src/application/ports/ILogger.js';

const SAMPLE_DESCRIPTION = 'Bob is a passionate history teacher in his mid-forties ' +
    'who secretly plays guitar on weekends.';

/**
 * Fake LLM provider that returns a fixed prose description.
 *
 * @augments ILlmProvider
 */
class FakeLlmProvider extends ILlmProvider {
    /**
     * Construct the fake provider.
     *
     * @param {string} [response] - text to return from generate
     */
    constructor(response = SAMPLE_DESCRIPTION) {
        super();
        this.response = response;
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
        return this.response;
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
    it('should return a prose description string', async () => {
        const useCase = new ExtractCharacterFromChat(new FakeLlmProvider(), new FakeLogger());

        const result = await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should return the LLM response directly without parsing', async () => {
        const useCase = new ExtractCharacterFromChat(new FakeLlmProvider(), new FakeLogger());

        const result = await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(result).toBe(SAMPLE_DESCRIPTION);
    });

    it('should include the character name in the prompt', async () => {
        const llm = new FakeLlmProvider();
        const useCase = new ExtractCharacterFromChat(llm, new FakeLogger());

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.userPrompt).toContain('Bob');
    });

    it('should include the chat transcript in the prompt', async () => {
        const llm = new FakeLlmProvider();
        const useCase = new ExtractCharacterFromChat(llm, new FakeLogger());

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.userPrompt).toContain('Professor Bob, your history teacher');
    });

    it('should format user and AI turns distinctly in the transcript', async () => {
        const llm = new FakeLlmProvider();
        const useCase = new ExtractCharacterFromChat(llm, new FakeLogger());

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.userPrompt).toContain('User:');
        expect(llm.lastRequest.userPrompt).toContain('AI:');
    });

    it('should include a system prompt in the generation request', async () => {
        const llm = new FakeLlmProvider();
        const useCase = new ExtractCharacterFromChat(llm, new FakeLogger());

        await useCase.execute('Bob', SAMPLE_MESSAGES);

        expect(llm.lastRequest.systemPrompt).toBeTruthy();
        expect(llm.lastRequest.systemPrompt.length).toBeGreaterThan(10);
    });

    it('should log debug on start and info on success', async () => {
        const logger = new FakeLogger();
        const useCase = new ExtractCharacterFromChat(new FakeLlmProvider(), logger);

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
