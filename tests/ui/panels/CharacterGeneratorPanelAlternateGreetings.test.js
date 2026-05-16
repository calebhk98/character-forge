/**
 * @file Tests for alternate greetings preview and editing in CharacterGeneratorPanel.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

/**
 * Create a mock character with alternate greetings.
 *
 * @returns {Character} character with three alternate greetings
 */
function createMockCharacterWithAlternateGreetings() {
    return new Character({
        name: 'Test Character',
        description: 'A test character',
        personality: 'Friendly',
        scenario: 'A test scenario',
        first_mes: 'Hello!',
        mes_example: 'How are you?',
        alternate_greetings: ['A casual greeting.', 'A tense encounter.', 'A group-chat opener.'],
    });
}

/**
 * Create a mock character without alternate greetings.
 *
 * @returns {Character} character with empty alternate_greetings
 */
function createMockCharacterWithoutAlternateGreetings() {
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
 * Create a mock lorebook for tests.
 *
 * @returns {Lorebook} lorebook with one entry
 */
function createMockLorebook() {
    return new Lorebook({
        name: 'Test Lorebook',
        entries: [new LorebookEntry({ keys: ['test'], content: 'Test content' })],
    });
}

/**
 * Create a mock DI container with spied use cases.
 *
 * @param {Character} character - character the generate use case resolves with
 * @returns {object} mock container
 */
function createMockContainer(character) {
    return {
        generateCharacter: { execute: vi.fn().mockResolvedValue(character) },
        generateLorebook: { execute: vi.fn().mockResolvedValue(createMockLorebook()) },
        saveCharacter: { execute: vi.fn().mockResolvedValue('saved-id') },
        logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn() },
        notifier: { success: vi.fn(), error: vi.fn() },
    };
}

/**
 * Render the panel, type a description, and trigger generation.
 *
 * @param {CharacterGeneratorPanel} panel - panel instance
 * @param {HTMLElement} targetElement - mount target
 * @returns {Promise<void>}
 */
async function generateAndShowPreview(panel, targetElement) {
    panel.render(targetElement);
    const textarea = /** @type {HTMLTextAreaElement} */ (
        targetElement.querySelector('#character-description')
    );
    textarea.value = 'A mysterious wizard';
    await panel.onGenerateClick();
}

describe('CharacterGeneratorPanel - Alternate Greetings', () => {
    let targetElement;

    beforeEach(() => {
        targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
    });

    it('displays alternate greetings section in preview', async () => {
        const panel = new CharacterGeneratorPanel(
            createMockContainer(createMockCharacterWithAlternateGreetings()),
        );
        await generateAndShowPreview(panel, targetElement);

        const section = targetElement.querySelector('.preview-alternate-greetings');
        expect(section).toBeTruthy();
    });

    it('displays each alternate greeting in an editable textarea', async () => {
        const panel = new CharacterGeneratorPanel(
            createMockContainer(createMockCharacterWithAlternateGreetings()),
        );
        await generateAndShowPreview(panel, targetElement);

        const ta0 = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-alt-greeting-0')
        );
        const ta1 = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-alt-greeting-1')
        );
        const ta2 = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-alt-greeting-2')
        );

        expect(ta0.value).toBe('A casual greeting.');
        expect(ta1.value).toBe('A tense encounter.');
        expect(ta2.value).toBe('A group-chat opener.');
    });

    it('allows editing an alternate greeting and updates the character model', async () => {
        const panel = new CharacterGeneratorPanel(
            createMockContainer(createMockCharacterWithAlternateGreetings()),
        );
        await generateAndShowPreview(panel, targetElement);

        const ta0 = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-alt-greeting-0')
        );
        ta0.value = 'Edited greeting.';
        ta0.dispatchEvent(new Event('change'));

        expect(panel.draft.character.alternate_greetings[0]).toBe('Edited greeting.');
    });

    it('shows a fallback message when character has no alternate greetings', async () => {
        const panel = new CharacterGeneratorPanel(
            createMockContainer(createMockCharacterWithoutAlternateGreetings()),
        );
        await generateAndShowPreview(panel, targetElement);

        const section = targetElement.querySelector('.preview-alternate-greetings');
        expect(section).toBeTruthy();
        expect(section.textContent).toContain('No alternate greetings generated');
    });
});
