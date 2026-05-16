/**
 * @file Tests for CharacterGeneratorPanel temperature forwarding behaviour.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

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
    return new Lorebook({
        name: 'Test Lorebook',
        description: 'A test lorebook',
        entries: [
            new LorebookEntry({
                name: 'Test Entry',
                keys: ['test'],
                content: 'Test content',
                insertion_order: 0,
            }),
        ],
    });
}

/**
 * Create a minimal mock container without configStore.
 *
 * @returns {object} mock container
 */
function createMockContainer() {
    return {
        generateCharacter: { execute: vi.fn().mockResolvedValue(createMockCharacter()) },
        generateLorebook: { execute: vi.fn().mockResolvedValue(createMockLorebook()) },
        saveCharacter: { execute: vi.fn().mockResolvedValue('saved-id') },
        logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn() },
        notifier: { success: vi.fn(), error: vi.fn() },
    };
}

describe('CharacterGeneratorPanel - Temperature Forwarding', () => {
    let container;
    let targetElement;
    let panel;

    beforeEach(() => {
        container = createMockContainer();
        targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        panel = new CharacterGeneratorPanel(container);
    });

    it('uses 0.85 as default temperature when configStore is absent', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        expect(container.generateCharacter.execute).toHaveBeenCalledWith(
            'A mysterious wizard',
            expect.objectContaining({ temperature: 0.85 }),
        );
        expect(container.generateLorebook.execute).toHaveBeenCalledWith(
            'A mysterious wizard',
            expect.objectContaining({ temperature: 0.85 }),
        );
    });

    it('forwards generationTemperature from configStore to execute calls', async () => {
        container.configStore = {
            get: vi.fn().mockImplementation((key, defaultValue) => {
                if (key === 'generationTemperature') return 0.9;
                return defaultValue;
            }),
        };
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        expect(container.generateCharacter.execute).toHaveBeenCalledWith(
            'A mysterious wizard',
            expect.objectContaining({ temperature: 0.9 }),
        );
        expect(container.generateLorebook.execute).toHaveBeenCalledWith(
            'A mysterious wizard',
            expect.objectContaining({ temperature: 0.9 }),
        );
    });
});
