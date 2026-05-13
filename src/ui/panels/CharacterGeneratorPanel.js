/**
 * @file Character generator UI panel. Renders input field, generation
 * button, and result preview. Delegates business logic to use cases
 * through dependency injection.
 */

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
        const generateBtn = /** @type {HTMLButtonElement} */ (
            this.element?.querySelector('#generate-button')
        );
        if (generateBtn) {
            generateBtn.disabled = true;
        }

        try {
            this.container?.logger?.info('Starting character generation', { descriptionLength: description.length });

            // Generate character
            const character = await this.container.generateCharacter.execute(description);
            this.generatedCharacter = character;

            // Generate lorebook
            const lorebook = await this.container.generateLorebook.execute(description);
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
        } finally {
            this.isGenerating = false;
            if (generateBtn) {
                generateBtn.disabled = false;
            }
        }
    }

    /**
     * Show the preview section with generated character and lorebook.
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

        const inputSection = /** @type {HTMLElement} */ (
            this.element?.querySelector('.input-section')
        );
        const controlsSection = /** @type {HTMLElement} */ (
            this.element?.querySelector('.controls-section')
        );

        if (inputSection) {
            inputSection.style.display = 'none';
        }
        if (controlsSection) {
            controlsSection.style.display = 'none';
        }

        // Render character fields
        const characterHtml = `
            <div class="preview-character">
                <h4>${this.escapeHtml(this.generatedCharacter.name)}</h4>
                <div class="preview-field">
                    <strong>Description:</strong>
                    <p>${this.escapeHtml(this.generatedCharacter.description)}</p>
                </div>
                <div class="preview-field">
                    <strong>Personality:</strong>
                    <p>${this.escapeHtml(this.generatedCharacter.personality)}</p>
                </div>
                <div class="preview-field">
                    <strong>Scenario:</strong>
                    <p>${this.escapeHtml(this.generatedCharacter.scenario)}</p>
                </div>
                <div class="preview-field">
                    <strong>First Message:</strong>
                    <p>${this.escapeHtml(this.generatedCharacter.first_mes)}</p>
                </div>
                <div class="preview-field">
                    <strong>Example Dialogue:</strong>
                    <p>${this.escapeHtml(this.generatedCharacter.mes_example)}</p>
                </div>
            </div>
        `;

        // Render lorebook entries
        let lorebookHtml = '<div class="preview-lorebook"><h4>Lorebook Entries</h4>';
        if (this.generatedLorebook && this.generatedLorebook.entries.length > 0) {
            lorebookHtml += '<ul class="lorebook-entries">';
            for (const entry of this.generatedLorebook.entries) {
                lorebookHtml += `
                    <li class="lorebook-entry">
                        <strong>${this.escapeHtml(entry.name || 'Untitled')}</strong>
                        <p><em>Keys: ${this.escapeHtml(entry.keys.join(', '))}</em></p>
                        <p>${this.escapeHtml(entry.content)}</p>
                    </li>
                `;
            }
            lorebookHtml += '</ul>';
        } else {
            lorebookHtml += '<p>No entries generated</p>';
        }
        lorebookHtml += '</div>';

        previewContent.innerHTML = characterHtml + lorebookHtml;
        previewSection.style.display = 'block';
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
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
            }
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
