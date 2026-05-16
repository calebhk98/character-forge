/**
 * @file Tests for lorebookEntryCount forwarding in CharacterGeneratorPanel.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterGeneratorPanel } from '../../../src/ui/panels/CharacterGeneratorPanel.js';
import { Character } from '../../../src/domain/entities/Character.js';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';

/**
 * Build a minimal Character for use in stubs.
 *
 * @returns {Character} stub character
 */
function stubCharacter() {
    return new Character({
        name: 'Stub',
        description: 'desc',
        personality: 'p',
        scenario: 's',
        first_mes: 'hi',
        mes_example: 'ex',
    });
}

/**
 * Build a minimal Lorebook for use in stubs.
 *
 * @returns {Lorebook} stub lorebook
 */
function stubLorebook() {
    return new Lorebook({ name: 'L', entries: [] });
}

/**
 * Create a mock container with a configStore stub.
 *
 * @param {string} lorebookEntryCountValue - value returned by configStore.get
 * @returns {object} mock container
 */
function createContainer(lorebookEntryCountValue = 'auto') {
    return {
        generateCharacter: { execute: vi.fn().mockResolvedValue(stubCharacter()) },
        generateLorebook: { execute: vi.fn().mockResolvedValue(stubLorebook()) },
        saveCharacter: { execute: vi.fn().mockResolvedValue('id') },
        configStore: { get: vi.fn().mockReturnValue(lorebookEntryCountValue) },
        logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn() },
        notifier: { success: vi.fn(), error: vi.fn() },
    };
}

/**
 * Render the panel and trigger generate with a non-empty description.
 *
 * @param {CharacterGeneratorPanel} panel - panel to trigger
 * @param {HTMLElement} el - target element
 * @param {string} [description] - character description
 * @returns {Promise<void>}
 */
async function triggerGenerate(panel, el, description = 'A wizard') {
    panel.render(el);
    /** @type {HTMLTextAreaElement} */ (el.querySelector('#character-description')).value = description;
    await panel.onGenerateClick();
}

describe('CharacterGeneratorPanel - lorebookEntryCount forwarding', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    it('reads lorebookEntryCount from configStore with "auto" as fallback default', async () => {
        const container = createContainer('auto');
        const panel = new CharacterGeneratorPanel(container);

        await triggerGenerate(panel, el);

        expect(container.configStore.get).toHaveBeenCalledWith('lorebookEntryCount', 'auto');
    });

    it('passes entryCount as undefined when lorebookEntryCount is "auto"', async () => {
        const container = createContainer('auto');
        const panel = new CharacterGeneratorPanel(container);

        await triggerGenerate(panel, el, 'A mysterious wizard');

        expect(container.generateLorebook.execute).toHaveBeenCalledWith(
            'A mysterious wizard',
            { entryCount: undefined },
        );
    });

    it('passes parsed numeric entryCount when lorebookEntryCount is a numeric string', async () => {
        const container = createContainer('5');
        const panel = new CharacterGeneratorPanel(container);

        await triggerGenerate(panel, el, 'A mysterious wizard');

        expect(container.generateLorebook.execute).toHaveBeenCalledWith(
            'A mysterious wizard',
            { entryCount: 5 },
        );
    });
});
