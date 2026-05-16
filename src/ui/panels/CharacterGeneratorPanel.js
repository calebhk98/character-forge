/**
 * @file Character generator UI panel. Renders input field, generation
 * button, and result preview. Delegates business logic to use cases
 * through dependency injection.
 */

import { CharacterFieldRegenerator } from './CharacterFieldRegenerator.js';

/**
 * Character generator panel component.
 */
export class CharacterGeneratorPanel {
    /**
     * Construct the panel with its dependencies.
     *
     * @param {object} container application container with wired services
     */
    constructor(container) {
        this.container = container;
        this.element = null;
        this.generatedCharacter = null;
        this.generatedLorebook = null;
        this.isGenerating = false;
        this.currentDescription = null;
    }

    /**
     * Render the panel into a DOM element.
     *
     * @param {HTMLElement} targetElement - element to render into
     */
    render(targetElement) {
        const panel = document.createElement('div');
        panel.id = 'character-forge-panel';
        panel.className = 'character-forge-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h2>Character Forge</h2>
                <p class="subtitle">AI-assisted character generator</p>
            </div>
            <div class="panel-section input-section">
                <label for="character-description">Character Concept</label>
                <textarea
                    id="character-description"
                    class="character-description-input"
                    placeholder="Describe your character in plain language. Example: A widowed father of three young girls who is secretly training them to be superheroes."
                    rows="4"></textarea>
            </div>
            <div class="panel-section controls-section">
                <button id="generate-button" class="btn btn-primary">Generate</button>
                <div class="controls-options">
                    <label>
                        <input type="checkbox" id="auto-save-checkbox" />
                        Skip review, save directly
                    </label>
                </div>
            </div>
            <div class="panel-section preview-section" id="preview-section" style="display: none;">
                <h3>Preview</h3>
                <div class="preview-content" id="preview-content">
                    <!-- Character preview will render here -->
                </div>
                <div class="preview-actions">
                    <button id="edit-button" class="btn btn-secondary">Edit</button>
                    <button id="save-button" class="btn btn-primary">Save to SillyTavern</button>
                </div>
            </div>
            <div class="panel-section status-section" id="status-section">
                <!-- Status messages appear here -->
            </div>
        `;
        targetElement.appendChild(panel);
        this.element = panel;
        this.attachEventListeners();
    }

    /**
     * Attach event listeners to rendered elements.
     */
    attachEventListeners() {
        const generateBtn = this.element?.querySelector('#generate-button');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.onGenerateClick());
        }

        const saveBtn = this.element?.querySelector('#save-button');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.onSaveClick());
        }

        const editBtn = this.element?.querySelector('#edit-button');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.onEditClick());
        }
    }

    /**
     * Handle the generate button click. Calls use cases to generate character
     * and lorebook, then shows preview or saves based on auto-save setting.
     *
     * @returns {Promise<void>}
     */
    async onGenerateClick() {
        if (this.isGenerating) {
            return;
        }

        const textarea = /** @type {HTMLTextAreaElement} */ (
            this.element?.querySelector('#character-description')
        );
        const description = textarea?.value.trim();

        if (!description) {
            this.container?.notifier?.error('Please enter a character description');
            return;
        }

        this.isGenerating = true;
        this.currentDescription = description;
        this.clearStatus();
        const generateBtn = /** @type {HTMLButtonElement} */ (
            this.element?.querySelector('#generate-button')
        );
        if (generateBtn) {
            generateBtn.disabled = true;
        }

        try {
            this.container?.logger?.info('Starting character generation', { descriptionLength: description.length });

            const temperature = this.container.configStore?.get('generationTemperature', 0.85) ?? 0.85;

            // Generate character
            const character = await this.container.generateCharacter.execute(description, { temperature });
            this.generatedCharacter = character;

            // Generate lorebook
            const lorebook = await this.container.generateLorebook.execute(description, { temperature });
            this.generatedLorebook = lorebook;

            this.container?.logger?.info('Generation complete');

            // Check auto-save setting
            const autoSaveCheckbox = /** @type {HTMLInputElement} */ (
                this.element?.querySelector('#auto-save-checkbox')
            );
            if (autoSaveCheckbox?.checked) {
                await this.onSaveClick();
            } else {
                this.showPreview();
            }
        } catch (error) {
            this.container?.logger?.error('Generation failed', { error: error.message });
            this.container?.notifier?.error(`Generation failed: ${error.message}`);
            this.showStatus(`Generation failed: ${error.message}`, 'error');
        } finally {
            this.isGenerating = false;
            if (generateBtn) {
                generateBtn.disabled = false;
            }
        }
    }

    /**
     * Show the preview section with generated character and lorebook.
     * Renders fields as editable inputs.
     */
    showPreview() {
        const previewSection = /** @type {HTMLElement} */ (
            this.element?.querySelector('#preview-section')
        );
        const previewContent = /** @type {HTMLElement} */ (
            this.element?.querySelector('#preview-content')
        );

        if (!previewSection || !previewContent) {
            return;
        }

        this.hideInputSections();

        const html = this.buildPreviewHtml();
        previewContent.innerHTML = html;
        previewSection.style.display = 'block';

        this.setCharacterFieldValues();
        this.setLorebookEntryValues();
        this.attachPreviewEditListeners();
        new CharacterFieldRegenerator(this.element, this.container, this).attach();
    }

    /**
     * Hide input and controls sections.
     */
    hideInputSections() {
        const inputSection = /** @type {HTMLElement} */ (this.element?.querySelector('.input-section'));
        const controlsSection = /** @type {HTMLElement} */ (this.element?.querySelector('.controls-section'));
        if (inputSection) inputSection.style.display = 'none';
        if (controlsSection) controlsSection.style.display = 'none';
    }

    /**
     * Build preview form HTML.
     *
     * @returns {string} HTML string
     */
    buildPreviewHtml() {
        const fields = [
            this.buildFieldHtml('edit-name', 'Name', 'name', true),
            this.buildFieldHtml('edit-description', 'Description', 'description', false, 4),
            this.buildFieldHtml('edit-personality', 'Personality', 'personality', false, 3),
            this.buildFieldHtml('edit-scenario', 'Scenario', 'scenario', false, 3),
            this.buildFieldHtml('edit-first-mes', 'First Message', 'first_mes', false, 2),
            this.buildFieldHtml('edit-mes-example', 'Example Dialogue', 'mes_example', false, 3),
        ].join('');
        return `<div class="preview-character">${fields}</div>` + this.buildLorebookHtml();
    }

    /**
     * Build HTML for a single preview field with an inline ↺ regenerate control.
     *
     * @param {string} id - element id for the input or textarea
     * @param {string} label - visible field label text
     * @param {string} fieldName - character property key used in data-field attributes
     * @param {boolean} [isInput] - render as text input when true; textarea otherwise
     * @param {number} [rows] - textarea row count; ignored when isInput is true
     * @returns {string} HTML string for the field row
     */
    buildFieldHtml(id, label, fieldName, isInput = false, rows = 3) {
        const ctl = isInput ? `<input type="text" id="${id}" class="edit-input"/>` : `<textarea id="${id}" class="edit-textarea" rows="${rows}"></textarea>`;
        const regenForm = `<div class="regen-form" data-field="${fieldName}" style="display:none"><input class="regen-feedback" placeholder="What to change (optional)..."/><button class="regen-confirm" data-field="${fieldName}">Rewrite</button><button class="regen-cancel" data-field="${fieldName}">×</button></div>`;
        return `<div class="preview-field"><label for="${id}"><strong>${label}:</strong></label><button class="regen-btn" data-field="${fieldName}">↺</button>${regenForm}${ctl}</div>`;
    }

    /**
     * Build HTML for editable lorebook entries.
     *
     * @returns {string} HTML string
     */
    buildLorebookHtml() {
        let html = '<div class="preview-lorebook"><h4>Lorebook Entries</h4>';
        if (!this.generatedLorebook?.entries?.length) {
            html += '<p>No entries generated</p>';
        } else {
            html += '<div class="lorebook-entries">';
            for (let i = 0; i < this.generatedLorebook.entries.length; i++) {
                html += `
                    <div class="lorebook-entry" data-index="${i}">
                        <label for="edit-entry-name-${i}"><strong>Name:</strong></label>
                        <input type="text" id="edit-entry-name-${i}" class="edit-input edit-entry-name" data-index="${i}" />
                        <label for="edit-entry-keys-${i}"><strong>Keys (comma-separated):</strong></label>
                        <input type="text" id="edit-entry-keys-${i}" class="edit-input edit-entry-keys" data-index="${i}" />
                        <label for="edit-entry-content-${i}"><strong>Content:</strong></label>
                        <textarea id="edit-entry-content-${i}" class="edit-textarea edit-entry-content" data-index="${i}" rows="3"></textarea>
                    </div>
                `;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    /**
     * Set values for character editable fields.
     */
    setCharacterFieldValues() {
        const fields = [
            { id: '#edit-name', prop: 'name' },
            { id: '#edit-description', prop: 'description' },
            { id: '#edit-personality', prop: 'personality' },
            { id: '#edit-scenario', prop: 'scenario' },
            { id: '#edit-first-mes', prop: 'first_mes' },
            { id: '#edit-mes-example', prop: 'mes_example' },
        ];

        for (const field of fields) {
            const input = /** @type {HTMLInputElement|HTMLTextAreaElement} */ (
                this.element?.querySelector(field.id)
            );
            if (input) {
                input.value = this.generatedCharacter[field.prop];
            }
        }
    }

    /**
     * Set values for lorebook entry editable fields.
     */
    setLorebookEntryValues() {
        if (!this.generatedLorebook?.entries?.length) {
            return;
        }

        for (let i = 0; i < this.generatedLorebook.entries.length; i++) {
            const entry = this.generatedLorebook.entries[i];
            const nameInput = /** @type {HTMLInputElement} */ (
                this.element?.querySelector(`#edit-entry-name-${i}`)
            );
            if (nameInput) {
                nameInput.value = entry.name || '';
            }

            const keysInput = /** @type {HTMLInputElement} */ (
                this.element?.querySelector(`#edit-entry-keys-${i}`)
            );
            if (keysInput) {
                keysInput.value = entry.keys.join(', ');
            }

            const contentInput = /** @type {HTMLTextAreaElement} */ (
                this.element?.querySelector(`#edit-entry-content-${i}`)
            );
            if (contentInput) {
                contentInput.value = entry.content;
            }
        }
    }

    /**
     * Attach listeners to editable preview fields to track changes.
     */
    attachPreviewEditListeners() {
        const charFields = [
            { id: '#edit-name', prop: 'name' },
            { id: '#edit-description', prop: 'description' },
            { id: '#edit-personality', prop: 'personality' },
            { id: '#edit-scenario', prop: 'scenario' },
            { id: '#edit-first-mes', prop: 'first_mes' },
            { id: '#edit-mes-example', prop: 'mes_example' },
        ];
        for (const { id, prop } of charFields) {
            const el = this.element?.querySelector(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    this.generatedCharacter[prop] = /** @type {HTMLInputElement} */ (e.target).value;
                });
            }
        }

        this.element?.querySelectorAll('.edit-entry-name').forEach((input) => {
            input.addEventListener('change', (e) => {
                const target = /** @type {HTMLInputElement} */ (e.target);
                const idx = parseInt(target.dataset.index, 10);
                if (this.generatedLorebook?.entries[idx]) {
                    this.generatedLorebook.entries[idx].name = target.value;
                }
            });
        });

        this.element?.querySelectorAll('.edit-entry-keys').forEach((input) => {
            input.addEventListener('change', (e) => {
                const target = /** @type {HTMLInputElement} */ (e.target);
                const idx = parseInt(target.dataset.index, 10);
                if (this.generatedLorebook?.entries[idx]) {
                    this.generatedLorebook.entries[idx].keys = target.value
                        .split(',').map((k) => k.trim()).filter((k) => k.length > 0);
                }
            });
        });

        this.element?.querySelectorAll('.edit-entry-content').forEach((input) => {
            input.addEventListener('change', (e) => {
                const target = /** @type {HTMLTextAreaElement} */ (e.target);
                const idx = parseInt(target.dataset.index, 10);
                if (this.generatedLorebook?.entries[idx]) {
                    this.generatedLorebook.entries[idx].content = target.value;
                }
            });
        });
    }

    /**
     * Hide the preview section and show input again.
     */
    hidePreview() {
        const previewSection = /** @type {HTMLElement} */ (
            this.element?.querySelector('#preview-section')
        );
        const inputSection = /** @type {HTMLElement} */ (
            this.element?.querySelector('.input-section')
        );
        const controlsSection = /** @type {HTMLElement} */ (
            this.element?.querySelector('.controls-section')
        );

        if (previewSection) {
            previewSection.style.display = 'none';
        }
        if (inputSection) {
            inputSection.style.display = 'block';
        }
        if (controlsSection) {
            controlsSection.style.display = 'block';
        }
    }

    /**
     * Handle the edit button click. Goes back to input section.
     */
    onEditClick() {
        this.hidePreview();
        this.generatedCharacter = null;
        this.generatedLorebook = null;
    }

    /**
     * Handle the save button click. Calls the save use case.
     *
     * @returns {Promise<void>}
     */
    async onSaveClick() {
        if (!this.generatedCharacter) {
            this.container?.notifier?.error('No character to save');
            return;
        }

        const saveBtn = /** @type {HTMLButtonElement} */ (
            this.element?.querySelector('#save-button')
        );
        if (saveBtn) {
            saveBtn.disabled = true;
        }

        try {
            this.container?.logger?.info('Saving character', { name: this.generatedCharacter.name });

            await this.container.saveCharacter.execute(this.generatedCharacter, this.generatedLorebook);

            this.container?.logger?.info('Character saved successfully');
            this.container?.notifier?.success('Character saved to SillyTavern');
            this.showStatus('Character saved to SillyTavern', 'success');

            // Reset the panel
            this.generatedCharacter = null;
            this.generatedLorebook = null;
            this.hidePreview();
            const textarea = /** @type {HTMLTextAreaElement} */ (
                this.element?.querySelector('#character-description')
            );
            if (textarea) {
                textarea.value = '';
            }
        } catch (error) {
            this.container?.logger?.error('Save failed', { error: error.message });
            this.container?.notifier?.error(`Save failed: ${error.message}`);
            this.showStatus(`Save failed: ${error.message}`, 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
            }
        }
    }

    /**
     * Show a persistent status message in the status section.
     *
     * @param {string} message - text to display
     * @param {'error'|'success'|'info'} [type] - visual style
     */
    showStatus(message, type = 'info') {
        const section = /** @type {HTMLElement} */ (
            this.element?.querySelector('#status-section')
        );
        if (!section) {
            return;
        }
        section.innerHTML = '';
        const msg = document.createElement('div');
        msg.className = `status-message status-${type}`;
        msg.textContent = message;
        section.appendChild(msg);
    }

    /**
     * Clear the status section.
     */
    clearStatus() {
        const section = /** @type {HTMLElement} */ (
            this.element?.querySelector('#status-section')
        );
        if (section) {
            section.innerHTML = '';
        }
    }

    /**
     * Escape HTML special characters to prevent XSS.
     *
     * @param {string} text - text to escape
     * @returns {string} escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
