/**
 * @file Tests for CharacterGeneratorPanel component.
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
        first_mes: 'Hello!',
        mes_example: 'How are you?',
    });
}

/**
 * Create mock lorebook for testing.
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

/**
 * Set up test environment with container, target element, and panel.
 *
 * @returns {{container: object, targetElement: HTMLElement, panel: CharacterGeneratorPanel}} test setup objects
 */
function setupTest() {
    const container = createMockContainer();
    const targetElement = document.createElement('div');
    document.body.appendChild(targetElement);
    const panel = new CharacterGeneratorPanel(container);
    return { container, targetElement, panel };
}

/**
 * Generate a character in the panel and verify preview is shown.
 *
 * @param {object} param0 test state
 * @param {CharacterGeneratorPanel} param0.panel panel instance
 * @param {HTMLElement} param0.targetElement target DOM element
 * @returns {Promise<void>}
 */
async function generateAndShowPreview({ panel, targetElement }) {
    panel.render(targetElement);
    const textarea = /** @type {HTMLTextAreaElement} */ (
        targetElement.querySelector('#character-description')
    );
    textarea.value = 'A mysterious wizard';
    await panel.onGenerateClick();
}

describe('CharacterGeneratorPanel - Rendering', () => {
    let container;
    let targetElement;
    let panel;

    beforeEach(() => {
        container = createMockContainer();
        targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        panel = new CharacterGeneratorPanel(container);
    });

    it('renders panel without errors', () => {
        panel.render(targetElement);
        const panelElement = targetElement.querySelector('#character-forge-panel');
        expect(panelElement).toBeTruthy();
        expect(panelElement.querySelector('h2').textContent).toContain('Character Forge');
    });

    it('renders textarea for character description', () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        expect(textarea).toBeTruthy();
        expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders generate button', () => {
        panel.render(targetElement);
        const button = targetElement.querySelector('#generate-button');
        expect(button).toBeTruthy();
        expect(button.textContent).toContain('Generate');
    });

    it('renders preview section hidden initially', () => {
        panel.render(targetElement);
        const previewSection = targetElement.querySelector('#preview-section');
        expect(previewSection.style.display).toBe('none');
    });
});

describe('CharacterGeneratorPanel - Generation', () => {
    let container;
    let targetElement;
    let panel;

    beforeEach(() => {
        container = createMockContainer();
        targetElement = document.createElement('div');
        document.body.appendChild(targetElement);
        panel = new CharacterGeneratorPanel(container);
    });

    it('disables generate button while generating', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        const button = targetElement.querySelector('#generate-button');

        textarea.value = 'Test character';

        container.generateCharacter.execute.mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 100)),
        );

        const generatePromise = panel.onGenerateClick();
        expect(button.disabled).toBe(true);
        await generatePromise;
    });

    it('calls generate use cases on button click', async () => {
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

    it('shows error toast if no description provided', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = '';

        await panel.onGenerateClick();

        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.generateCharacter.execute).not.toHaveBeenCalled();
    });

    it('shows preview after successful generation', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await panel.onGenerateClick();

        const previewSection = targetElement.querySelector('#preview-section');
        expect(previewSection.style.display).not.toBe('none');
    });

    it('auto-saves when checkbox is checked', async () => {
        panel.render(targetElement);
        const textarea = targetElement.querySelector('#character-description');
        const autoSaveCheckbox = targetElement.querySelector('#auto-save-checkbox');

        autoSaveCheckbox.checked = true;
        textarea.value = 'A mysterious wizard';

        const saveSpy = vi.spyOn(panel, 'onSaveClick');

        await panel.onGenerateClick();

        expect(saveSpy).toHaveBeenCalled();
    });
});

describe('CharacterGeneratorPanel - Preview', () => {
    let setup;

    beforeEach(() => {
        setup = setupTest();
    });

    it('displays character name in preview editable input', async () => {
        await generateAndShowPreview(setup);
        const nameInput = setup.targetElement.querySelector('#edit-name');
        expect(nameInput.value).toBe('Test Character');
    });

    it('displays character fields in editable form', async () => {
        await generateAndShowPreview(setup);
        const preview = setup.targetElement.querySelector('.preview-character');
        expect(preview.textContent).toContain('Description');
        expect(preview.textContent).toContain('Personality');
        expect(preview.textContent).toContain('Scenario');
        expect(preview.textContent).toContain('First Message');
        expect(preview.textContent).toContain('Example Dialogue');

        const descriptionInput = setup.targetElement.querySelector('#edit-description');
        const personalityInput = setup.targetElement.querySelector('#edit-personality');
        expect(descriptionInput.value).toBe('A test character');
        expect(personalityInput.value).toBe('Friendly');
    });

    it('displays lorebook entries in editable form', async () => {
        await generateAndShowPreview(setup);
        const nameInput = setup.targetElement.querySelector('#edit-entry-name-0');
        const keysInput = setup.targetElement.querySelector('#edit-entry-keys-0');
        const contentInput = setup.targetElement.querySelector('#edit-entry-content-0');

        expect(nameInput.value).toBe('Test Entry');
        expect(keysInput.value).toBe('test, entry');
        expect(contentInput.value).toBe('Test content');
    });

    it('hides input section when preview is shown', async () => {
        setup.panel.render(setup.targetElement);
        const inputSection = setup.targetElement.querySelector('.input-section');
        const textarea = setup.targetElement.querySelector('#character-description');
        textarea.value = 'A mysterious wizard';

        await setup.panel.onGenerateClick();

        expect(inputSection.style.display).toBe('none');
    });

    it('safely handles HTML in character preview inputs', async () => {
        setup.container.generateCharacter.execute.mockResolvedValue(
            new Character({
                name: '<script>alert("xss")</script>',
                description: '<img src=x onerror="alert(1)">',
                personality: 'test',
                scenario: 'test',
                first_mes: 'test',
                mes_example: 'test',
            }),
        );

        await generateAndShowPreview(setup);

        const nameInput = setup.targetElement.querySelector('#edit-name');
        const descriptionInput = setup.targetElement.querySelector('#edit-description');

        // Input elements safely handle potentially malicious content as plain text
        expect(nameInput.value).toBe('<script>alert("xss")</script>');
        expect(descriptionInput.value).toBe('<img src=x onerror="alert(1)">');
        // Ensure no actual script tags are in the DOM
        expect(setup.targetElement.innerHTML).not.toContain('<script>');
    });

    it('handles empty lorebook gracefully', async () => {
        setup.container.generateLorebook.execute.mockResolvedValue(
            new Lorebook({ name: 'Empty', entries: [] }),
        );

        await generateAndShowPreview(setup);

        const lorebook = setup.targetElement.querySelector('.preview-lorebook');
        expect(lorebook.textContent).toContain('No entries generated');
    });
});

describe('CharacterGeneratorPanel - Save and Edit', () => {
    let setup;

    beforeEach(() => {
        setup = setupTest();
    });

    it('calls save use case when save button clicked', async () => {
        await generateAndShowPreview(setup);
        await setup.panel.onSaveClick();

        expect(setup.container.saveCharacter.execute).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Test Character' }),
            expect.objectContaining({ name: 'Test Lorebook' }),
        );
    });

    it('shows success notification after save', async () => {
        await generateAndShowPreview(setup);
        await setup.panel.onSaveClick();

        expect(setup.container.notifier.success).toHaveBeenCalled();
    });

    it('resets form after save', async () => {
        await generateAndShowPreview(setup);
        const textarea = setup.targetElement.querySelector('#character-description');
        await setup.panel.onSaveClick();

        expect(textarea.value).toBe('');
        expect(setup.panel.generatedCharacter).toBeNull();
        expect(setup.panel.generatedLorebook).toBeNull();
    });

    it('shows input section after save', async () => {
        await generateAndShowPreview(setup);
        const inputSection = setup.targetElement.querySelector('.input-section');
        await setup.panel.onSaveClick();

        expect(inputSection.style.display).not.toBe('none');
    });

    it('disables save button while saving', async () => {
        await generateAndShowPreview(setup);
        const saveBtn = setup.targetElement.querySelector('#save-button');
        setup.container.saveCharacter.execute.mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 100)),
        );

        const savePromise = setup.panel.onSaveClick();
        expect(saveBtn.disabled).toBe(true);
        await savePromise;
    });

    it('shows input section when edit button clicked', async () => {
        await generateAndShowPreview(setup);
        const editBtn = setup.targetElement.querySelector('#edit-button');
        editBtn.click();

        const inputSection = setup.targetElement.querySelector('.input-section');
        expect(inputSection.style.display).not.toBe('none');
    });

    it('clears generated data when edit clicked', async () => {
        await generateAndShowPreview(setup);
        expect(setup.panel.generatedCharacter).toBeTruthy();

        const editBtn = setup.targetElement.querySelector('#edit-button');
        editBtn.click();

        expect(setup.panel.generatedCharacter).toBeNull();
        expect(setup.panel.generatedLorebook).toBeNull();
    });
});

describe('CharacterGeneratorPanel - Editable Preview', () => {
    let setup;

    beforeEach(() => {
        setup = setupTest();
    });

    it('allows editing character name in preview', async () => {
        await generateAndShowPreview(setup);

        const nameInput = setup.targetElement.querySelector('#edit-name');
        nameInput.value = 'Modified Name';
        nameInput.dispatchEvent(new Event('change'));

        expect(setup.panel.generatedCharacter.name).toBe('Modified Name');
    });

    it('allows editing character description in preview', async () => {
        await generateAndShowPreview(setup);

        const descInput = setup.targetElement.querySelector('#edit-description');
        descInput.value = 'Modified description';
        descInput.dispatchEvent(new Event('change'));

        expect(setup.panel.generatedCharacter.description).toBe('Modified description');
    });

    it('allows editing character personality in preview', async () => {
        await generateAndShowPreview(setup);

        const perInput = setup.targetElement.querySelector('#edit-personality');
        perInput.value = 'Modified personality';
        perInput.dispatchEvent(new Event('change'));

        expect(setup.panel.generatedCharacter.personality).toBe('Modified personality');
    });

    it('allows editing lorebook entry content', async () => {
        await generateAndShowPreview(setup);

        const contentInput = setup.targetElement.querySelector('#edit-entry-content-0');
        contentInput.value = 'Modified entry content';
        contentInput.dispatchEvent(new Event('change'));

        expect(setup.panel.generatedLorebook.entries[0].content).toBe('Modified entry content');
    });

    it('allows editing lorebook entry keys', async () => {
        await generateAndShowPreview(setup);

        const keysInput = setup.targetElement.querySelector('#edit-entry-keys-0');
        keysInput.value = 'newkey1, newkey2, newkey3';
        keysInput.dispatchEvent(new Event('change'));

        expect(setup.panel.generatedLorebook.entries[0].keys).toEqual(['newkey1', 'newkey2', 'newkey3']);
    });

    it('saves edited character when save button clicked', async () => {
        await generateAndShowPreview(setup);

        const nameInput = setup.targetElement.querySelector('#edit-name');
        nameInput.value = 'New Name';
        nameInput.dispatchEvent(new Event('change'));

        await setup.panel.onSaveClick();

        expect(setup.container.saveCharacter.execute).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'New Name' }),
            expect.anything(),
        );
    });

    it('saves edited lorebook when save button clicked', async () => {
        await generateAndShowPreview(setup);

        const contentInput = setup.targetElement.querySelector('#edit-entry-content-0');
        contentInput.value = 'Edited content';
        contentInput.dispatchEvent(new Event('change'));

        await setup.panel.onSaveClick();

        const savedLorebook = setup.container.saveCharacter.execute.mock.calls[0][1];
        expect(savedLorebook.entries[0].content).toBe('Edited content');
    });
});
