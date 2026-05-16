/**
 * @file Character generator UI panel. Renders input field, generation
 * button, and result preview. Delegates business logic to use cases
 * through dependency injection.
 */

import { CharacterFieldRegenerator } from './CharacterFieldRegenerator.js';
import { CharacterPreviewBuilder } from './CharacterPreviewBuilder.js';
import { CharacterLoaderPanel } from './CharacterLoaderPanel.js';
import { startImageGeneration } from './CharacterImageGenTrigger.js';
import { CharacterDraft } from '../../domain/value-objects/CharacterDraft.js';
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
        this.draft = null;
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
        new CharacterLoaderPanel(panel, this.container, this).attach();
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

            const customSystemPrompt = this.container.configStore?.get('customSystemPromptOverride', '') || undefined;
            const character = await this.container.generateCharacter.execute(description, ...(customSystemPrompt ? [{ customSystemPrompt }] : []));

            const rawCount = this.container.configStore?.get('lorebookEntryCount', 'auto');
            const entryCount = rawCount === 'auto' ? undefined : parseInt(rawCount, 10);
            const lorebook = await this.container.generateLorebook.execute(description, { entryCount });
            this.draft = new CharacterDraft({ character, lorebook });

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

        const builder = new CharacterPreviewBuilder();
        previewContent.innerHTML = builder.buildPreviewHtml(
            this.draft.character, this.draft.lorebook,
        );
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
                input.value = this.draft.character[field.prop];
            }
        }

        const greetings = this.draft?.character?.alternate_greetings ?? [];
        for (let i = 0; i < greetings.length; i++) {
            const ta = /** @type {HTMLTextAreaElement} */ (
                this.element?.querySelector(`#edit-alt-greeting-${i}`)
            );
            if (ta) {
                ta.value = greetings[i];
            }
        }
    }

    /**
     * Set values for lorebook entry editable fields.
     */
    setLorebookEntryValues() {
        if (!this.draft?.lorebook?.entries?.length) {
            return;
        }

        for (let i = 0; i < this.draft.lorebook.entries.length; i++) {
            const entry = this.draft.lorebook.entries[i];
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
                    this.draft.character[prop] = /** @type {HTMLInputElement} */ (e.target).value;
                });
            }
        }

        this.element?.querySelectorAll('.edit-entry-name').forEach((input) => {
            input.addEventListener('change', (e) => {
                const target = /** @type {HTMLInputElement} */ (e.target);
                const idx = parseInt(target.dataset.index, 10);
                if (this.draft?.lorebook?.entries[idx]) {
                    this.draft.lorebook.entries[idx].name = target.value;
                }
            });
        });

        this.element?.querySelectorAll('.edit-entry-keys').forEach((input) => {
            input.addEventListener('change', (e) => {
                const target = /** @type {HTMLInputElement} */ (e.target);
                const idx = parseInt(target.dataset.index, 10);
                if (this.draft?.lorebook?.entries[idx]) {
                    this.draft.lorebook.entries[idx].keys = target.value
                        .split(',').map((k) => k.trim()).filter((k) => k.length > 0);
                }
            });
        });

        this.element?.querySelectorAll('.edit-entry-content').forEach((input) => {
            input.addEventListener('change', (e) => {
                const target = /** @type {HTMLTextAreaElement} */ (e.target);
                const idx = parseInt(target.dataset.index, 10);
                if (this.draft?.lorebook?.entries[idx]) {
                    this.draft.lorebook.entries[idx].content = target.value;
                }
            });
        });

        this.element?.querySelectorAll('.edit-alt-greeting').forEach((input) => {
            input.addEventListener('change', (e) => {
                const target = /** @type {HTMLTextAreaElement} */ (e.target);
                const idx = parseInt(target.dataset.index, 10);
                if (this.draft?.character?.alternate_greetings) {
                    this.draft.character.alternate_greetings[idx] = target.value;
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
        this.draft = null;
    }

    /**
     * Load a CharacterDraft (from an existing card) into the preview/edit flow.
     * Uses the character's description as the AI refinement context so that
     * field-level regeneration has meaningful context for tweaks.
     *
     * @param {import('../../domain/value-objects/CharacterDraft.js').CharacterDraft} draft - loaded draft
     */
    loadCharacterDraft(draft) {
        this.draft = draft;
        this.currentDescription = draft.character.description;
        this.showPreview();
    }

    /**
     * Handle the save button click. Calls the save use case, then fires
     * background image generation without awaiting it.
     *
     * @returns {Promise<void>}
     */
    async onSaveClick() {
        if (!this.draft) {
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
            this.container?.logger?.info('Saving character', { name: this.draft.character.name });

            await this.container.saveCharacter.execute(this.draft.character, this.draft.lorebook);

            this.container?.logger?.info('Character saved successfully');
            this.container?.notifier?.success('Character saved to SillyTavern');
            this.showStatus('Character saved to SillyTavern', 'success');

            // Fire background image generation; does not block the save path.
            startImageGeneration(this.container, this.draft.character, this.draft.lorebook);

            // Reset the panel
            this.draft = null;
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
