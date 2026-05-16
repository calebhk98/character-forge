/**
 * @file Tests that CharacterGeneratorPanel uses CharacterDraft to hold
 * generated state instead of separate generatedCharacter / generatedLorebook fields.
 */

import { describe, it, expect, vi } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';
import { CharacterDraft } from '../../../src/domain/value-objects/CharacterDraft.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

/**
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
 * @returns {Lorebook} mock lorebook
 */
function createMockLorebook() {
    return new Lorebook({
        name: 'Test Lorebook',
        entries: [new LorebookEntry({ name: 'E1', keys: ['k1'], content: 'C1', insertion_order: 0 })],
    });
}

/**
 * @returns {object} mock container
 */
function createMockContainer() {
    return {
        generateCharacter: { execute: vi.fn().mockResolvedValue(createMockCharacter()) },
        generateLorebook: { execute: vi.fn().mockResolvedValue(createMockLorebook()) },
        saveCharacter: { execute: vi.fn().mockResolvedValue('saved-id') },
        logger: { info: vi.fn(), error: vi.fn() },
        notifier: { success: vi.fn(), error: vi.fn() },
    };
}

/**
 * Render a panel into a fresh div, type a description, and trigger generation.
 *
 * @param {object} container - mock container
 * @returns {Promise<{panel: CharacterGeneratorPanel, targetElement: HTMLElement}>} panel and its mounted element
 */
async function setupAndGenerate(container) {
    const targetElement = document.createElement('div');
    document.body.appendChild(targetElement);
    const panel = new CharacterGeneratorPanel(container);
    panel.render(targetElement);
    const textarea = /** @type {HTMLTextAreaElement} */ (
        targetElement.querySelector('#character-description')
    );
    textarea.value = 'A mysterious wizard';
    await panel.onGenerateClick();
    return { panel, targetElement };
}

describe('CharacterGeneratorPanel - CharacterDraft initial state', () => {
    it('initialises draft to null', () => {
        const panel = new CharacterGeneratorPanel({});
        expect(panel.draft).toBeNull();
    });
});

describe('CharacterGeneratorPanel - CharacterDraft after generation', () => {
    it('sets draft to a CharacterDraft instance', async () => {
        const { panel, targetElement } = await setupAndGenerate(createMockContainer());
        expect(panel.draft).toBeInstanceOf(CharacterDraft);
        targetElement.remove();
    });

    it('draft.character is a Character instance with correct name', async () => {
        const { panel, targetElement } = await setupAndGenerate(createMockContainer());
        expect(panel.draft.character).toBeInstanceOf(Character);
        expect(panel.draft.character.name).toBe('Test Character');
        targetElement.remove();
    });

    it('draft.lorebook is a Lorebook instance with correct name', async () => {
        const { panel, targetElement } = await setupAndGenerate(createMockContainer());
        expect(panel.draft.lorebook).toBeInstanceOf(Lorebook);
        expect(panel.draft.lorebook.name).toBe('Test Lorebook');
        targetElement.remove();
    });
});

describe('CharacterGeneratorPanel - CharacterDraft reset', () => {
    it('resets draft to null after save', async () => {
        const { panel, targetElement } = await setupAndGenerate(createMockContainer());
        await panel.onSaveClick();
        expect(panel.draft).toBeNull();
        targetElement.remove();
    });

    it('resets draft to null after edit click', async () => {
        const { panel, targetElement } = await setupAndGenerate(createMockContainer());
        /** @type {HTMLButtonElement} */ (targetElement.querySelector('#edit-button')).click();
        expect(panel.draft).toBeNull();
        targetElement.remove();
    });

    it('shows error when save attempted with no draft', async () => {
        const container = createMockContainer();
        const targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        const panel = new CharacterGeneratorPanel(container);
        panel.render(targetElement);

        await panel.onSaveClick();

        expect(container.notifier.error).toHaveBeenCalledWith('No character to save');
        expect(container.saveCharacter.execute).not.toHaveBeenCalled();
        targetElement.remove();
    });
});
