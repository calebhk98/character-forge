/**
 * @file Tests for CharacterGeneratorPanel field-level regeneration controls.
 */

import { describe, it, expect, vi } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';
import { CharacterDraft } from '../../../src/domain/value-objects/CharacterDraft.js';
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
            new LorebookEntry({ name: 'E1', keys: ['k1'], content: 'C1', insertion_order: 0 }),
        ],
    });
}

/**
 * Create a mock container including refineCharacterField.
 *
 * @param {string} [refinedValue] - value returned by refineCharacterField
 * @returns {object} mock container
 */
function createMockContainer(refinedValue = 'Refined output') {
    return {
        generateCharacter: { execute: vi.fn().mockResolvedValue(createMockCharacter()) },
        generateLorebook: { execute: vi.fn().mockResolvedValue(createMockLorebook()) },
        refineCharacterField: { execute: vi.fn().mockResolvedValue(refinedValue) },
        logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        notifier: { error: vi.fn(), success: vi.fn() },
    };
}

describe('CharacterGeneratorPanel - regenerate button presence', () => {
    /**
     * Regenerate button rendered for each character field.
     */
    it('should render a regenerate button for each character field', () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.draft = new CharacterDraft({ character: createMockCharacter(), lorebook: createMockLorebook() });
        panel.showPreview();

        const regenBtns = targetElement.querySelectorAll('.regen-btn');
        expect(regenBtns.length).toBe(6);

        targetElement.remove();
    });
});

describe('CharacterGeneratorPanel - regenerate form visibility', () => {
    /**
     * Clicking a regenerate button reveals the feedback form.
     */
    it('should show the regen form when the regenerate button is clicked', () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.draft = new CharacterDraft({ character: createMockCharacter(), lorebook: createMockLorebook() });
        panel.showPreview();

        /** @type {HTMLButtonElement} */ (
            targetElement.querySelector('.regen-btn[data-field="personality"]')
        ).click();

        const form = targetElement.querySelector('.regen-form[data-field="personality"]');
        expect(/** @type {HTMLElement} */ (form).style.display).toBe('block');

        targetElement.remove();
    });

    /**
     * Clicking cancel hides the feedback form.
     */
    it('should hide the regen form when cancel is clicked', () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);

        panel.render(targetElement);
        panel.draft = new CharacterDraft({ character: createMockCharacter(), lorebook: createMockLorebook() });
        panel.showPreview();

        /** @type {HTMLElement} */ (targetElement.querySelector('.regen-btn[data-field="name"]')).click();
        /** @type {HTMLElement} */ (targetElement.querySelector('.regen-cancel[data-field="name"]')).click();

        const form = targetElement.querySelector('.regen-form[data-field="name"]');
        expect(/** @type {HTMLElement} */ (form).style.display).toBe('none');

        targetElement.remove();
    });
});

describe('CharacterGeneratorPanel - regenerate field confirm', () => {
    /**
     * Clicking confirm calls refineCharacterField and updates the field value.
     */
    it('should call refineCharacterField and update the field on confirm', async () => {
        const container = createMockContainer('Rewritten first message');
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);
        panel.currentDescription = 'A brave knight';

        panel.render(targetElement);
        panel.draft = new CharacterDraft({ character: createMockCharacter(), lorebook: createMockLorebook() });
        panel.showPreview();

        /** @type {HTMLButtonElement} */ (
            targetElement.querySelector('.regen-confirm[data-field="first_mes"]')
        ).click();

        const input = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#edit-first-mes')
        );
        await vi.waitFor(() => {
            expect(input.value).toBe('Rewritten first message');
        });

        expect(container.refineCharacterField.execute).toHaveBeenCalled();
        expect(panel.draft.character.first_mes).toBe('Rewritten first message');

        targetElement.remove();
    });
});

describe('CharacterGeneratorPanel - currentDescription tracking', () => {
    /**
     * Panel stores currentDescription when generation is triggered.
     */
    it('should store currentDescription when generation is triggered', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);
        panel.render(targetElement);

        const textarea = /** @type {HTMLTextAreaElement} */ (
            targetElement.querySelector('#character-description')
        );
        textarea.value = 'Father of three superheroes';
        await panel.onGenerateClick();

        expect(panel.currentDescription).toBe('Father of three superheroes');

        targetElement.remove();
    });
});
