/**
 * @file Tests for CharacterGeneratorPanel customSystemPromptOverride behaviour.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

/**
 * Create mock character for testing.
 *
 * @returns {Character} mock character
 */
function createMockCharacter() {
    return new Character({
        name: 'Test Character',
        description: 'A test character',
        personality: 'Friendly',
        scenario: 'A test scenario',
        first_mes: 'Hello, I am a test character',
        mes_example: '<START>\n{{char}}: Hello\n{{user}}: Hi',
    });
}

/**
 * Create mock lorebook for testing.
 *
 * @returns {Lorebook} mock lorebook
 */
function createMockLorebook() {
    const mockEntry = new LorebookEntry({
        keys: ['test'],
        content: 'Test content',
    });
    return new Lorebook({
        name: 'Test Lorebook',
        description: 'A test lorebook',
        entries: [mockEntry],
    });
}

/**
 * Create a mock container with spied use cases and services.
 *
 * @returns {object} mock container
 */
function createMockContainer() {
    return {
        generateCharacter: {
            execute: vi.fn().mockResolvedValue(createMockCharacter()),
        },
        generateLorebook: {
            execute: vi.fn().mockResolvedValue(createMockLorebook()),
        },
        saveCharacter: {
            execute: vi.fn().mockResolvedValue('saved-id'),
        },
        logger: {
            info: vi.fn(),
            debug: vi.fn(),
            error: vi.fn(),
        },
        notifier: {
            success: vi.fn(),
            error: vi.fn(),
        },
    };
}

describe('CharacterGeneratorPanel - customSystemPrompt override', () => {
    let container;
    let targetElement;
    let panel;

    beforeEach(() => {
        container = createMockContainer();
        targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        panel = new CharacterGeneratorPanel(container);
    });

    /**
     * Non-empty override should be forwarded as customSystemPrompt option.
     */
    it('passes customSystemPrompt option from configStore to generateCharacter', async () => {
        const override = 'My custom override prompt';
        container.configStore = { get: vi.fn().mockReturnValue(override) };
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        expect(container.generateCharacter.execute).toHaveBeenCalledWith(
            'A mysterious wizard',
            expect.objectContaining({ customSystemPrompt: override }),
        );
    });

    /**
     * Empty override should not set customSystemPrompt on the options object.
     */
    it('omits customSystemPrompt option when override is empty', async () => {
        container.configStore = { get: vi.fn().mockReturnValue('') };
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        const callArgs = container.generateCharacter.execute.mock.calls[0];
        const opts = callArgs[1] || {};
        expect(opts.customSystemPrompt).toBeUndefined();
    });

    /**
     * When configStore is absent, generation still proceeds without error.
     */
    it('proceeds without error when configStore is absent', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        expect(container.generateCharacter.execute).toHaveBeenCalled();
    });
});
