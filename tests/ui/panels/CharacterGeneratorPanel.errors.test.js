/**
 * @file Error handling tests for CharacterGeneratorPanel component.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';
import { vi } from 'vitest';

/**
 * Create a mock character for testing.
 *
 * @returns {Character} mock character
 */
function createMockCharacter() {
    return new Character({
        name: 'Test Character',
        description: 'A test character',
        personality: 'Friendly',
        scenario: 'A test scenario',
        first_mes: 'Hello!',
        mes_example: 'How are you?',
    });
}

/**
 * Create a mock lorebook for testing.
 *
 * @returns {Lorebook} mock lorebook
 */
function createMockLorebook() {
    const mockEntry = new LorebookEntry({
        name: 'Test Entry',
        keys: ['test', 'entry'],
        content: 'Test content',
        insertion_order: 0,
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

describe('CharacterGeneratorPanel - Error Handling', () => {
    let container;
    let targetElement;
    let panel;

    beforeEach(() => {
        container = createMockContainer();
        targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        panel = new CharacterGeneratorPanel(container);
    });

    it('shows error notification on generation failure', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        container.generateCharacter.execute.mockRejectedValue(
            new Error('Generation failed'),
        );

        await panel.onGenerateClick();

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.logger.error).toHaveBeenCalled();
    });

    it('shows error notification on save failure', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        container.saveCharacter.execute.mockRejectedValue(
            new Error('Save failed'),
        );

        await panel.onSaveClick();

        expect(container.notifier.error).toHaveBeenCalledWith(expect.stringContaining('Save failed'));
        expect(container.logger.error).toHaveBeenCalledWith('Save failed', expect.any(Object));
    });

    it('re-enables save button after save failure', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        const saveBtn = targetElement.querySelector('#save-button');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        container.saveCharacter.execute.mockRejectedValue(
            new Error('Save failed'),
        );

        await panel.onSaveClick();

        expect(saveBtn.disabled).toBe(false);
    });

    it('shows error when trying to save without a generated character', async () => {
        panel.render(targetElement);

        // Call save without generating a character first
        await panel.onSaveClick();

        expect(container.notifier.error).toHaveBeenCalledWith('No character to save');
        expect(container.saveCharacter.execute).not.toHaveBeenCalled();
    });

    it('prevents concurrent generation when already generating', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        // Set the panel as already generating
        panel.isGenerating = true;

        // Call onGenerateClick while generating
        await panel.onGenerateClick();

        // Should not call execute while already generating
        expect(container.generateCharacter.execute).not.toHaveBeenCalled();
    });
});
