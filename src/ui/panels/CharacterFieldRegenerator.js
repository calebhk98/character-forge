/**
 * @file Handles ↺ field-level regeneration controls in the character preview panel.
 * Uses event delegation on the preview content area to intercept clicks on
 * regenerate buttons, reveal feedback forms, and trigger the RefineCharacterField
 * use case without modifying CharacterGeneratorPanel's core flow.
 */

/**
 * Attaches and manages regenerate controls for individual character fields.
 */
export class CharacterFieldRegenerator {
    /**
     * Construct the regenerator.
     *
     * @param {HTMLElement} element - panel root element
     * @param {object} container - application container with wired services
     * @param {object} panel - panel instance exposing draft and currentDescription
     */
    constructor(element, container, panel) {
        this.element = element;
        this.container = container;
        this.panel = panel;
    }

    /**
     * Attach an event-delegated click handler to the preview content area.
     */
    attach() {
        const content = this.element?.querySelector('#preview-content');
        content?.addEventListener('click', (e) => {
            const target = /** @type {HTMLElement} */ (e.target);
            if (target.classList.contains('regen-btn')) {
                this.showForm(target.dataset.field);
            } else if (target.classList.contains('regen-cancel')) {
                this.hideForm(target.dataset.field);
            } else if (target.classList.contains('regen-confirm')) {
                this.onRegenConfirm(/** @type {HTMLButtonElement} */ (target)).catch(() => {});
            }
        });
    }

    /**
     * Show the inline feedback form for the given field.
     *
     * @param {string} field - character property name (data-field value)
     */
    showForm(field) {
        const form = this.element?.querySelector(`.regen-form[data-field="${field}"]`);
        if (form) {
            /** @type {HTMLElement} */ (form).style.display = 'block';
        }
    }

    /**
     * Hide the inline feedback form for the given field.
     *
     * @param {string} field - character property name (data-field value)
     */
    hideForm(field) {
        const form = this.element?.querySelector(`.regen-form[data-field="${field}"]`);
        if (form) {
            /** @type {HTMLElement} */ (form).style.display = 'none';
        }
    }

    /**
     * Handle a confirm-click: call refineCharacterField and update the preview.
     *
     * @param {HTMLButtonElement} btn - confirm button carrying data-field
     * @returns {Promise<void>}
     */
    async onRegenConfirm(btn) {
        const field = btn.dataset.field;
        const form = this.element?.querySelector(`.regen-form[data-field="${field}"]`);
        const feedbackEl = form?.querySelector('.regen-feedback');
        const feedback = /** @type {HTMLInputElement} */ (feedbackEl)?.value?.trim() || '';
        const fieldInputMap = {
            name: '#edit-name',
            description: '#edit-description',
            personality: '#edit-personality',
            scenario: '#edit-scenario',
            first_mes: '#edit-first-mes',
            mes_example: '#edit-mes-example',
        };
        const input = /** @type {HTMLInputElement|HTMLTextAreaElement} */ (
            this.element?.querySelector(fieldInputMap[field])
        );
        btn.disabled = true;
        try {
            const refined = await this.container.refineCharacterField.execute(
                this.panel.currentDescription, field, input?.value || '', feedback,
            );
            if (input) {
                input.value = refined;
            }
            if (this.panel.draft?.character) {
                this.panel.draft.character[field] = refined;
            }
            this.hideForm(field);
        } catch (error) {
            this.container?.logger?.error('Field refinement failed', { error: error.message });
            this.container?.notifier?.error(`Refinement failed: ${error.message}`);
        } finally {
            btn.disabled = false;
        }
    }
}
