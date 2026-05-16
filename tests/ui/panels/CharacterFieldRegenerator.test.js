/**
 * @file Tests for CharacterFieldRegenerator - inline field-level regeneration controls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterFieldRegenerator } from '../../../src/ui/panels/CharacterFieldRegenerator.js';

/**
 * Build a minimal DOM element that mimics the preview panel structure.
 * Contains a #preview-content area with regen buttons, forms, and input fields
 * for the given fields.
 *
 * @param {string[]} [fields] - character field names to scaffold
 * @returns {HTMLElement} root panel element
 */
function buildElement(fields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example']) {
    const fieldInputIds = {
        name: 'edit-name',
        description: 'edit-description',
        personality: 'edit-personality',
        scenario: 'edit-scenario',
        first_mes: 'edit-first-mes',
        mes_example: 'edit-mes-example',
    };

    const root = document.createElement('div');

    // Create input fields outside preview-content (as the source maps them via element.querySelector)
    for (const field of fields) {
        const input = document.createElement('input');
        input.id = fieldInputIds[field];
        input.value = `original ${field}`;
        root.appendChild(input);
    }

    const content = document.createElement('div');
    content.id = 'preview-content';

    for (const field of fields) {
        // Regen trigger button
        const regenBtn = document.createElement('button');
        regenBtn.className = 'regen-btn';
        regenBtn.dataset.field = field;
        content.appendChild(regenBtn);

        // Inline form (hidden by default)
        const form = document.createElement('div');
        form.className = 'regen-form';
        form.dataset.field = field;
        form.style.display = 'none';

        const feedbackInput = document.createElement('input');
        feedbackInput.className = 'regen-feedback';
        feedbackInput.value = '';
        form.appendChild(feedbackInput);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'regen-cancel';
        cancelBtn.dataset.field = field;
        form.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'regen-confirm';
        confirmBtn.dataset.field = field;
        form.appendChild(confirmBtn);

        content.appendChild(form);
    }

    root.appendChild(content);
    document.body.appendChild(root);
    return root;
}

/**
 * Create a fake application container.
 *
 * @param {string} [refinedValue] - value that refineCharacterField resolves with
 * @returns {object} fake container
 */
function makeContainer(refinedValue = 'Refined value') {
    return {
        refineCharacterField: {
            execute: vi.fn().mockResolvedValue(refinedValue),
        },
        logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        notifier: { error: vi.fn(), success: vi.fn() },
    };
}

/**
 * Create a fake panel exposing currentDescription and draft.
 *
 * @param {object} [opts] - panel options
 * @param {string} [opts.currentDescription] - character description text
 * @param {object|null} [opts.draft] - draft character object
 * @returns {object} fake panel
 */
function makePanel({ currentDescription = 'A brave knight', draft = null } = {}) {
    return { currentDescription, draft };
}

describe('CharacterFieldRegenerator - showForm', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('sets display:block on the matching regen-form', () => {
        const element = buildElement(['name']);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());

        regenerator.showForm('name');

        const form = element.querySelector('.regen-form[data-field="name"]');
        expect(/** @type {HTMLElement} */ (form).style.display).toBe('block');
    });

    it('does not affect forms for other fields', () => {
        const element = buildElement(['name', 'description']);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());

        regenerator.showForm('name');

        const other = element.querySelector('.regen-form[data-field="description"]');
        expect(/** @type {HTMLElement} */ (other).style.display).toBe('none');
    });

    it('does nothing when the form element does not exist', () => {
        const element = buildElement([]);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());

        // Should not throw
        expect(() => regenerator.showForm('nonexistent')).not.toThrow();
    });

    it('does nothing when element is null', () => {
        const regenerator = new CharacterFieldRegenerator(null, makeContainer(), makePanel());

        expect(() => regenerator.showForm('name')).not.toThrow();
    });
});

describe('CharacterFieldRegenerator - hideForm', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('sets display:none on a previously visible regen-form', () => {
        const element = buildElement(['personality']);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());

        // Show first
        const form = /** @type {HTMLElement} */ (
            element.querySelector('.regen-form[data-field="personality"]')
        );
        form.style.display = 'block';

        regenerator.hideForm('personality');

        expect(form.style.display).toBe('none');
    });

    it('does nothing when the form element does not exist', () => {
        const element = buildElement([]);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());

        expect(() => regenerator.hideForm('nonexistent')).not.toThrow();
    });

    it('does nothing when element is null', () => {
        const regenerator = new CharacterFieldRegenerator(null, makeContainer(), makePanel());

        expect(() => regenerator.hideForm('personality')).not.toThrow();
    });
});

describe('CharacterFieldRegenerator - attach (event delegation)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('shows the form when a regen-btn inside #preview-content is clicked', () => {
        const element = buildElement(['scenario']);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());
        regenerator.attach();

        /** @type {HTMLElement} */ (
            element.querySelector('.regen-btn[data-field="scenario"]')
        ).click();

        const form = /** @type {HTMLElement} */ (
            element.querySelector('.regen-form[data-field="scenario"]')
        );
        expect(form.style.display).toBe('block');
    });

    it('hides the form when a regen-cancel inside #preview-content is clicked', () => {
        const element = buildElement(['first_mes']);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());
        regenerator.attach();

        // Open first
        /** @type {HTMLElement} */ (
            element.querySelector('.regen-btn[data-field="first_mes"]')
        ).click();

        /** @type {HTMLElement} */ (
            element.querySelector('.regen-cancel[data-field="first_mes"]')
        ).click();

        const form = /** @type {HTMLElement} */ (
            element.querySelector('.regen-form[data-field="first_mes"]')
        );
        expect(form.style.display).toBe('none');
    });

    it('does nothing when #preview-content does not exist', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        const regenerator = new CharacterFieldRegenerator(element, makeContainer(), makePanel());

        // Should not throw
        expect(() => regenerator.attach()).not.toThrow();
    });

    it('does nothing when element is null', () => {
        const regenerator = new CharacterFieldRegenerator(null, makeContainer(), makePanel());

        expect(() => regenerator.attach()).not.toThrow();
    });
});

describe('CharacterFieldRegenerator - onRegenConfirm (execute args)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('calls refineCharacterField.execute with description, field, current value, and feedback', async () => {
        const container = makeContainer('New name');
        const panel = makePanel({ currentDescription: 'A wise wizard' });
        const element = buildElement(['name']);
        const regenerator = new CharacterFieldRegenerator(element, container, panel);

        // Set a feedback value
        /** @type {HTMLInputElement} */ (
            element.querySelector('.regen-form[data-field="name"] .regen-feedback')
        ).value = 'make it shorter';

        // Set an existing field value
        /** @type {HTMLInputElement} */ (element.querySelector('#edit-name')).value = 'Aldric';

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="name"]')
        );

        await regenerator.onRegenConfirm(btn);

        expect(container.refineCharacterField.execute).toHaveBeenCalledWith(
            'A wise wizard', 'name', 'Aldric', 'make it shorter',
        );
    });

    it('updates the corresponding input element value after successful refinement', async () => {
        const container = makeContainer('Refined description text');
        const element = buildElement(['description']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="description"]')
        );
        await regenerator.onRegenConfirm(btn);

        const input = /** @type {HTMLInputElement} */ (element.querySelector('#edit-description'));
        expect(input.value).toBe('Refined description text');
    });

    it('updates draft.character[field] after successful refinement', async () => {
        const container = makeContainer('Updated personality');
        const draft = { character: { personality: 'Grumpy' } };
        const panel = makePanel({ draft });
        const element = buildElement(['personality']);
        const regenerator = new CharacterFieldRegenerator(element, container, panel);

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="personality"]')
        );
        await regenerator.onRegenConfirm(btn);

        expect(draft.character.personality).toBe('Updated personality');
    });

    it('hides the form after successful refinement', async () => {
        const container = makeContainer('New scenario');
        const element = buildElement(['scenario']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        // Make the form visible first
        /** @type {HTMLElement} */ (
            element.querySelector('.regen-form[data-field="scenario"]')
        ).style.display = 'block';

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="scenario"]')
        );
        await regenerator.onRegenConfirm(btn);

        const form = /** @type {HTMLElement} */ (
            element.querySelector('.regen-form[data-field="scenario"]')
        );
        expect(form.style.display).toBe('none');
    });

    it('re-enables the confirm button after successful refinement', async () => {
        const container = makeContainer('Hello!');
        const element = buildElement(['first_mes']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="first_mes"]')
        );
        await regenerator.onRegenConfirm(btn);

        expect(btn.disabled).toBe(false);
    });
});

describe('CharacterFieldRegenerator - onRegenConfirm (feedback and draft)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('passes empty string as feedback when the feedback input is blank', async () => {
        const container = makeContainer('ok');
        const element = buildElement(['name']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        // Leave feedback blank (default is '')
        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="name"]')
        );
        await regenerator.onRegenConfirm(btn);

        const callArgs = container.refineCharacterField.execute.mock.calls[0];
        expect(callArgs[3]).toBe('');
    });

    it('trims whitespace from feedback before passing it', async () => {
        const container = makeContainer('ok');
        const element = buildElement(['name']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        /** @type {HTMLInputElement} */ (
            element.querySelector('.regen-form[data-field="name"] .regen-feedback')
        ).value = '  make it epic  ';

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="name"]')
        );
        await regenerator.onRegenConfirm(btn);

        const callArgs = container.refineCharacterField.execute.mock.calls[0];
        expect(callArgs[3]).toBe('make it epic');
    });

    it('does not throw when draft is null or draft.character is missing', async () => {
        for (const draft of [null, {}]) {
            const container = makeContainer('Refined');
            const panel = makePanel({ draft });
            const element = buildElement(['name']);
            const regenerator = new CharacterFieldRegenerator(element, container, panel);
            const btn = /** @type {HTMLButtonElement} */ (
                element.querySelector('.regen-confirm[data-field="name"]')
            );
            await expect(regenerator.onRegenConfirm(btn)).resolves.toBeUndefined();
        }
    });
});

describe('CharacterFieldRegenerator - onRegenConfirm (failure)', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('calls logger.error when refineCharacterField throws', async () => {
        const container = makeContainer();
        container.refineCharacterField.execute = vi.fn().mockRejectedValue(new Error('LLM timeout'));
        const element = buildElement(['description']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="description"]')
        );
        await regenerator.onRegenConfirm(btn);

        expect(container.logger.error).toHaveBeenCalledWith(
            'Field refinement failed',
            expect.objectContaining({ error: 'LLM timeout' }),
        );
    });

    it('calls notifier.error with a message including the error text when refinement fails', async () => {
        const container = makeContainer();
        container.refineCharacterField.execute = vi.fn().mockRejectedValue(new Error('Network error'));
        const element = buildElement(['personality']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="personality"]')
        );
        await regenerator.onRegenConfirm(btn);

        expect(container.notifier.error).toHaveBeenCalledWith(
            expect.stringContaining('Network error'),
        );
    });

    it('re-enables the confirm button after a failed refinement', async () => {
        const container = makeContainer();
        container.refineCharacterField.execute = vi.fn().mockRejectedValue(new Error('fail'));
        const element = buildElement(['scenario']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="scenario"]')
        );
        await regenerator.onRegenConfirm(btn);

        expect(btn.disabled).toBe(false);
    });

    it('does not update the input value when refinement fails', async () => {
        const container = makeContainer();
        container.refineCharacterField.execute = vi.fn().mockRejectedValue(new Error('fail'));
        const element = buildElement(['name']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());

        /** @type {HTMLInputElement} */ (element.querySelector('#edit-name')).value = 'Original Name';

        const btn = /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="name"]')
        );
        await regenerator.onRegenConfirm(btn);

        const input = /** @type {HTMLInputElement} */ (element.querySelector('#edit-name'));
        expect(input.value).toBe('Original Name');
    });
});

// ---------------------------------------------------------------------------
// attach – confirm click triggers onRegenConfirm via delegation
// ---------------------------------------------------------------------------

describe('CharacterFieldRegenerator - attach confirm click integration', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('calls refineCharacterField when a regen-confirm button inside #preview-content is clicked', async () => {
        const container = makeContainer('New mes_example');
        const element = buildElement(['mes_example']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());
        regenerator.attach();

        /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="mes_example"]')
        ).click();

        await vi.waitFor(() => {
            expect(container.refineCharacterField.execute).toHaveBeenCalled();
        });
    });

    it('updates the input value after confirm is clicked via event delegation', async () => {
        const container = makeContainer('Delegated refined value');
        const element = buildElement(['first_mes']);
        const regenerator = new CharacterFieldRegenerator(element, container, makePanel());
        regenerator.attach();

        /** @type {HTMLButtonElement} */ (
            element.querySelector('.regen-confirm[data-field="first_mes"]')
        ).click();

        const input = /** @type {HTMLInputElement} */ (element.querySelector('#edit-first-mes'));
        await vi.waitFor(() => {
            expect(input.value).toBe('Delegated refined value');
        });
    });
});
