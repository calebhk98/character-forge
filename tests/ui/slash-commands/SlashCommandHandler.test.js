/**
 * @file Tests for SlashCommandHandler — registers /forge and /forge-from-chat
 * with SillyTavern's slash command registry.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlashCommandHandler } from '../../../src/ui/slash-commands/SlashCommandHandler.js';

/** @returns {object} Fresh fake container with spy use cases. */
function makeContainer() {
    return {
        generateCharacter: { execute: vi.fn() },
        generateLorebook: { execute: vi.fn() },
        saveCharacter: { execute: vi.fn() },
        extractCharacterFromChat: { execute: vi.fn() },
        notifier: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
    };
}

/**
 * @param {Array<object>} [chat] - initial chat messages
 * @returns {object} Fake ST context with a chat array and registerSlashCommand spy.
 */
function makeStContext(chat = []) {
    return {
        registerSlashCommand: vi.fn(),
        chat,
    };
}

/** @type {object} */
let container;
/** @type {object} */
let stContext;
/** @type {SlashCommandHandler} */
let handler;

beforeEach(() => {
    container = makeContainer();
    stContext = makeStContext();
    handler = new SlashCommandHandler(container, stContext);
});

describe('SlashCommandHandler - registration', () => {
    it('should register /forge slash command', () => {
        handler.register();
        const names = stContext.registerSlashCommand.mock.calls.map(c => c[0]);
        expect(names).toContain('forge');
    });

    it('should register /forge-from-chat slash command', () => {
        handler.register();
        const names = stContext.registerSlashCommand.mock.calls.map(c => c[0]);
        expect(names).toContain('forge-from-chat');
    });

    it('should pass a callback, aliases array, and help string to each registration', () => {
        handler.register();
        for (const call of stContext.registerSlashCommand.mock.calls) {
            expect(typeof call[1]).toBe('function');
            expect(Array.isArray(call[2])).toBe(true);
            expect(typeof call[3]).toBe('string');
        }
    });

    it('should not throw when stContext is null', () => {
        const noCtxHandler = new SlashCommandHandler(container, null);
        expect(() => noCtxHandler.register()).not.toThrow();
    });

    it('should not throw when stContext lacks registerSlashCommand', () => {
        const noRegHandler = new SlashCommandHandler(container, {});
        expect(() => noRegHandler.register()).not.toThrow();
    });
});

describe('SlashCommandHandler - /forge command', () => {
    /** @returns {Function} The callback registered for /forge. */
    function getForgeCallback() {
        handler.register();
        return stContext.registerSlashCommand.mock.calls.find(c => c[0] === 'forge')[1];
    }

    it('should invoke generateCharacter with the description', async () => {
        const mockChar = { name: 'Detective', description: 'A grim sleuth' };
        container.generateCharacter.execute.mockResolvedValue(mockChar);
        container.generateLorebook.execute.mockResolvedValue({ entries: [] });
        container.saveCharacter.execute.mockResolvedValue('id-1');

        await getForgeCallback()({ value: 'A grizzled detective' });

        expect(container.generateCharacter.execute).toHaveBeenCalledWith(
            'A grizzled detective',
            expect.any(Object),
        );
    });

    it('should invoke generateLorebook then saveCharacter on success', async () => {
        const mockChar = { name: 'Detective', description: 'Grim' };
        const mockBook = { entries: [{ keys: ['hat'] }] };
        container.generateCharacter.execute.mockResolvedValue(mockChar);
        container.generateLorebook.execute.mockResolvedValue(mockBook);
        container.saveCharacter.execute.mockResolvedValue('id-2');

        await getForgeCallback()({ value: 'A grizzled detective' });

        expect(container.generateLorebook.execute).toHaveBeenCalled();
        expect(container.saveCharacter.execute).toHaveBeenCalledWith(mockChar, mockBook);
    });

    it('should notify error when description is empty', async () => {
        await getForgeCallback()({ value: '' });

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.generateCharacter.execute).not.toHaveBeenCalled();
    });

    it('should notify error when description is whitespace only', async () => {
        await getForgeCallback()({ value: '   ' });

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.generateCharacter.execute).not.toHaveBeenCalled();
    });

    it('should notify error when generateCharacter throws', async () => {
        container.generateCharacter.execute.mockRejectedValue(new Error('LLM down'));

        await getForgeCallback()({ value: 'A detective' });

        expect(container.notifier.error).toHaveBeenCalled();
    });
});

describe('SlashCommandHandler - /forge-from-chat command', () => {
    /** @returns {Function} The callback registered for /forge-from-chat. */
    function getFromChatCallback() {
        handler.register();
        return stContext.registerSlashCommand.mock.calls.find(c => c[0] === 'forge-from-chat')[1];
    }

    it('should invoke extractCharacterFromChat with name and chat history', async () => {
        const mockBook = { entries: [] };
        const mockChar = { name: 'Bob', description: 'A teacher' };
        stContext.chat = [{ is_user: false, mes: 'I am Bob.' }];
        container.extractCharacterFromChat.execute.mockResolvedValue('Bob is a passionate teacher.');
        container.generateCharacter.execute.mockResolvedValue(mockChar);
        container.generateLorebook.execute.mockResolvedValue(mockBook);
        container.saveCharacter.execute.mockResolvedValue('id-3');

        await getFromChatCallback()({ value: 'Bob' });

        expect(container.extractCharacterFromChat.execute).toHaveBeenCalledWith(
            'Bob',
            stContext.chat,
        );
    });

    it('should pass the extracted description to generateCharacter', async () => {
        const mockChar = { name: 'Bob', description: 'A teacher' };
        const mockBook = { entries: [] };
        stContext.chat = [{ is_user: false, mes: 'I am Bob.' }];
        container.extractCharacterFromChat.execute.mockResolvedValue('Bob is a passionate teacher.');
        container.generateCharacter.execute.mockResolvedValue(mockChar);
        container.generateLorebook.execute.mockResolvedValue(mockBook);
        container.saveCharacter.execute.mockResolvedValue('id-3a');

        await getFromChatCallback()({ value: 'Bob' });

        expect(container.generateCharacter.execute).toHaveBeenCalledWith(
            'Bob is a passionate teacher.',
            expect.any(Object),
        );
    });

    it('should invoke saveCharacter with the generated character', async () => {
        const mockChar = { name: 'Bob', description: 'A teacher' };
        const mockBook = { entries: [] };
        stContext.chat = [{ is_user: false, mes: 'I am Bob.' }];
        container.extractCharacterFromChat.execute.mockResolvedValue('Bob is a passionate teacher.');
        container.generateCharacter.execute.mockResolvedValue(mockChar);
        container.generateLorebook.execute.mockResolvedValue(mockBook);
        container.saveCharacter.execute.mockResolvedValue('id-4');

        await getFromChatCallback()({ value: 'Bob' });

        expect(container.saveCharacter.execute).toHaveBeenCalledWith(mockChar, mockBook);
    });

    it('should notify error when character name is empty', async () => {
        await getFromChatCallback()({ value: '' });

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.extractCharacterFromChat.execute).not.toHaveBeenCalled();
    });

    it('should notify error when extractCharacterFromChat throws', async () => {
        stContext.chat = [{ is_user: false, mes: 'I am Bob.' }];
        container.extractCharacterFromChat.execute.mockRejectedValue(new Error('parse error'));

        await getFromChatCallback()({ value: 'Bob' });

        expect(container.notifier.error).toHaveBeenCalled();
    });
});
