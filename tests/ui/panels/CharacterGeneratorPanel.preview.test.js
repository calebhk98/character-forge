/**
 * @file Tests for CharacterGeneratorPanel preview edit functionality.
 */

import { describe, it, expect, vi } from 'vitest';
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
        first_mes: 'Hello!',
        mes_example: 'How are you?',
    });
}

/**
 * Create mock lorebook with entries for testing.
 *
 * @returns {Lorebook} mock lorebook
 */
function createMockLorebook() {
    const entry1 = new LorebookEntry({
        name: 'Entry 1',
        keys: ['key1', 'key2'],
        content: 'Content 1',
        insertion_order: 0,
    });
    const entry2 = new LorebookEntry({
        name: 'Entry 2',
        keys: ['key3'],
        content: 'Content 2',
        insertion_order: 1,
    });

    return new Lorebook({
        name: 'Test Lorebook',
        description: 'A test lorebook',
        entries: [entry1, entry2],
    });
}

/**
 * Create a mock container with spied use cases.
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
        logger: {
            info: vi.fn(),
            error: vi.fn(),
        },
        notifier: {
            error: vi.fn(),
        },
    };
}

describe('CharacterGeneratorPanel - Character field editing', () => {
    it('should update character scenario when edited', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();
        panel.showPreview();

        const scenarioInput = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-scenario')
        );
        scenarioInput.value = 'Updated scenario';
        scenarioInput.dispatchEvent(new Event('change'));

        expect(panel.generatedCharacter.scenario).toBe('Updated scenario');

        targetElement.remove();
    });

    it('should update character first_mes when edited', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();
        panel.showPreview();

        const firstMesInput = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-first-mes')
        );
        firstMesInput.value = 'Updated first message';
        firstMesInput.dispatchEvent(new Event('change'));

        expect(panel.generatedCharacter.first_mes).toBe('Updated first message');

        targetElement.remove();
    });

    it('should update character mes_example when edited', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();
        panel.showPreview();

        const mesExampleInput = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-mes-example')
        );
        mesExampleInput.value = 'Updated example';
        mesExampleInput.dispatchEvent(new Event('change'));

        expect(panel.generatedCharacter.mes_example).toBe('Updated example');

        targetElement.remove();
    });
});

describe('CharacterGeneratorPanel - Lorebook entry editing', () => {
    it('should update lorebook entry name when edited', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();
        panel.showPreview();

        const entryNameInput = /** @type {HTMLInputElement} */ (
            targetElement.querySelector('#edit-entry-name-0')
        );
        entryNameInput.value = 'Updated Entry Name';
        entryNameInput.dispatchEvent(new Event('change'));

        expect(panel.generatedLorebook.entries[0].name).toBe('Updated Entry Name');

        targetElement.remove();
    });

    it('should update lorebook entry keys when edited', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();
        panel.showPreview();

        const entryKeysInput = /** @type {HTMLInputElement} */ (
            targetElement.querySelector('#edit-entry-keys-0')
        );
        entryKeysInput.value = 'key1, key2, key3';
        entryKeysInput.dispatchEvent(new Event('change'));

        expect(panel.generatedLorebook.entries[0].keys).toEqual(['key1', 'key2', 'key3']);

        targetElement.remove();
    });

    it('should handle comma-separated keys with whitespace', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();
        panel.showPreview();

        const entryKeysInput = /** @type {HTMLInputElement} */ (
            targetElement.querySelector('#edit-entry-keys-1')
        );
        entryKeysInput.value = ' key1 , key2 , key3 ';
        entryKeysInput.dispatchEvent(new Event('change'));

        expect(panel.generatedLorebook.entries[1].keys).toEqual(['key1', 'key2', 'key3']);

        targetElement.remove();
    });
});

describe('CharacterGeneratorPanel - Lorebook content and preview', () => {
    it('should update lorebook entry content when edited', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();
        panel.showPreview();

        const entryContentInput = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-entry-content-0')
        );
        entryContentInput.value = 'Updated content';
        entryContentInput.dispatchEvent(new Event('change'));

        expect(panel.generatedLorebook.entries[0].content).toBe('Updated content');

        targetElement.remove();
    });

    it('should handle showPreview gracefully when preview elements missing', () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.generatedCharacter = createMockCharacter();
        panel.generatedLorebook = createMockLorebook();

        // Remove the preview section to test the guard clause
        const previewSection = targetElement.querySelector('#preview-section');
        if (previewSection) {
            previewSection.remove();
        }

        // Should not throw, just return early
        expect(() => panel.showPreview()).not.toThrow();

        targetElement.remove();
    });
});
