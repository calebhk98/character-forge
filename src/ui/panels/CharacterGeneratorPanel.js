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
        if (generateBtn) generateBtn.addEventListener('click', () => this.onGenerateClick());
        const saveBtn = this.element?.querySelector('#save-button');
        if (saveBtn) saveBtn.addEventListener('click', () => this.onSaveClick());
        const editBtn = this.element?.querySelector('#edit-button');
        if (editBtn) editBtn.addEventListener('click', () => this.onEditClick());
    }

    /**
     * Handle the generate button click. Shows skeleton preview immediately,
     * then populates fields progressively as each generation step completes.
     *
     * @returns {Promise<void>}
     */
    async onGenerateClick() {
        if (this.isGenerating) return;
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
        const generateBtn = /** @type {HTMLButtonElement} */ (
            this.element?.querySelector('#generate-button')
        );
        if (generateBtn) generateBtn.disabled = true;
        this.showSkeletonPreview();
        try {
            this.container?.logger?.info('Starting character generation', { descriptionLength: description.length });
            const customSystemPrompt = this.container.configStore?.get('customSystemPromptOverride', '') || undefined;
            const options = customSystemPrompt ? { customSystemPrompt } : {};
            const character = await this.container.generateCharacter.execute(
                description, options, (step, data) => this._fillProgressFields(step, data),
            );
            const rawCount = this.container.configStore?.get('lorebookEntryCount', 'auto');
            const entryCount = rawCount === 'auto' ? undefined : parseInt(rawCount, 10);
            const lorebook = await this.container.generateLorebook.execute(description, { entryCount });
            this.draft = new CharacterDraft({ character, lorebook });
            this.container?.logger?.info('Generation complete');
            this._rebuildLorebookSection();
            this.setLorebookEntryValues();
            this._enablePreviewActions();
            const autoSaveCheckbox = /** @type {HTMLInputElement} */ (
                this.element?.querySelector('#auto-save-checkbox')
            );
            if (autoSaveCheckbox?.checked) await this.onSaveClick();
            this.clearStatus();
        } catch (error) {
            this.container?.logger?.error('Generation failed', { error: error.message });
            this.container?.notifier?.error(`Generation failed: ${error.message}`);
            this.showStatus(`Generation failed: ${error.message}`, 'error');
        } finally {
            this.isGenerating = false;
            if (generateBtn) generateBtn.disabled = false;
        }
    }

    /**
     * Show an empty skeleton preview before any LLM awaits. Hides inputs,
     * renders blank fields, disables actions, attaches listeners.
     */
    showSkeletonPreview() {
        const previewSection = /** @type {HTMLElement} */ (this.element?.querySelector('#preview-section'));
        const previewContent = /** @type {HTMLElement} */ (this.element?.querySelector('#preview-content'));
        if (!previewSection || !previewContent) return;
        this.hideInputSections();
        const skeleton = {
            name: '', description: '', personality: '', scenario: '',
            first_mes: '', mes_example: '', creator_notes: '', tags: [],
            talkativeness: '', alternate_greetings: ['', '', ''],
        };
        previewContent.innerHTML = new CharacterPreviewBuilder().buildPreviewHtml(
            /** @type {any} */ (skeleton), null,
        );
        previewSection.style.display = 'block';
        CharacterPreviewBuilder.attachStatsListeners(previewContent);
        this._disablePreviewActions();
        this.attachPreviewEditListeners();
        new CharacterFieldRegenerator(this.element, this.container, this).attach();
    }

    /**
     * Fill preview fields as each generation step completes.
     * Called via the onProgress callback from GenerateCharacterFromDescription.
     *
     * @param {string} step - step name: 'metadata'|'behavior'|'scene'|'dialogue'|'greetings'
     * @param {object} data - step result data
     */
    _fillProgressFields(step, data) {
        const fill = (id, value) => {
            const el = /** @type {HTMLInputElement|HTMLTextAreaElement|null} */ (
                this.element?.querySelector(id)
            );
            if (el) el.value = value ?? '';
        };
        if (step === 'metadata') {
            fill('#edit-name', data.name);
            fill('#edit-creator-notes', data.creator_notes);
            fill('#edit-tags', Array.isArray(data.tags) ? data.tags.join(', ') : '');
        } else if (step === 'behavior') {
            fill('#edit-description', data.description);
            fill('#edit-personality', data.personality);
        } else if (step === 'scene') {
            fill('#edit-scenario', data.scenario);
            fill('#edit-first-mes', data.first_mes);
        } else if (step === 'dialogue') {
            fill('#edit-mes-example', data.mes_example);
        } else if (step === 'greetings') {
            this._fillGreetingsStep(data, fill);
        }
        const pc = /** @type {HTMLElement} */ (this.element?.querySelector('#preview-content'));
        if (pc) CharacterPreviewBuilder.attachStatsListeners(pc);
    }

    /**
     * Fill alternate greetings step fields, rebuilding the greetings HTML section.
     *
     * @param {object} data - step data with alternate_greetings array
     * @param {Function} fill - helper to set an input value by selector
     */
    _fillGreetingsStep(data, fill) {
        const greetings = data.alternate_greetings ?? [];
        const section = this.element?.querySelector('.preview-alternate-greetings');
        if (section) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = new CharacterPreviewBuilder().buildAlternateGreetingsHtml(
                /** @type {any} */ ({ alternate_greetings: greetings }),
            );
            section.replaceWith(wrapper.firstElementChild);
            this.attachPreviewEditListeners();
        }
        for (let i = 0; i < greetings.length; i++) fill('#edit-alt-greeting-' + i, greetings[i] ?? '');
    }

    /**
     * Rebuild lorebook section after lorebook generation, replacing the
     * skeleton placeholder and re-attaching change listeners.
     */
    _rebuildLorebookSection() {
        const section = this.element?.querySelector('.preview-lorebook');
        if (!section || !this.draft?.lorebook) return;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = new CharacterPreviewBuilder().buildLorebookHtml(this.draft.lorebook);
        section.replaceWith(wrapper.firstElementChild);
        this.attachPreviewEditListeners();
    }

    /**
     * Disable save and edit buttons during progressive generation.
     */
    _disablePreviewActions() {
        const saveBtn = /** @type {HTMLButtonElement} */ (this.element?.querySelector('#save-button'));
        const editBtn = /** @type {HTMLButtonElement} */ (this.element?.querySelector('#edit-button'));
        if (saveBtn) saveBtn.disabled = true;
        if (editBtn) editBtn.disabled = true;
    }

    /**
     * Enable save and edit buttons once generation is complete.
     */
    _enablePreviewActions() {
        const saveBtn = /** @type {HTMLButtonElement} */ (this.element?.querySelector('#save-button'));
        const editBtn = /** @type {HTMLButtonElement} */ (this.element?.querySelector('#edit-button'));
        if (saveBtn) saveBtn.disabled = false;
        if (editBtn) editBtn.disabled = false;
    }

    /**
     * Show the preview section with generated character and lorebook.
     * Used when loading an existing character for editing.
     */
    showPreview() {
        const previewSection = /** @type {HTMLElement} */ (this.element?.querySelector('#preview-section'));
        const previewContent = /** @type {HTMLElement} */ (this.element?.querySelector('#preview-content'));
        if (!previewSection || !previewContent) return;
        this.hideInputSections();
        previewContent.innerHTML = new CharacterPreviewBuilder().buildPreviewHtml(
            this.draft.character, this.draft.lorebook,
        );
        previewSection.style.display = 'block';
        this.clearStatus();
        this.setCharacterFieldValues();
        this.setLorebookEntryValues();
        CharacterPreviewBuilder.attachStatsListeners(previewContent);
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
     * Set character editable field values from the current draft.
     */
    setCharacterFieldValues() {
        const fields = [
            { id: '#edit-name', prop: 'name' },
            { id: '#edit-description', prop: 'description' },
            { id: '#edit-personality', prop: 'personality' },
            { id: '#edit-scenario', prop: 'scenario' },
            { id: '#edit-first-mes', prop: 'first_mes' },
            { id: '#edit-mes-example', prop: 'mes_example' },
            { id: '#edit-creator-notes', prop: 'creator_notes' },
            { id: '#edit-tags', prop: 'tags', transform: (v) => (Array.isArray(v) ? v.join(', ') : (v || '')) },
        ];
        for (const field of fields) {
            const input = /** @type {HTMLInputElement|HTMLTextAreaElement} */ (
                this.element?.querySelector(field.id)
            );
            if (input) {
                input.value = field.transform
                    ? field.transform(this.draft.character[field.prop])
                    : this.draft.character[field.prop];
            }
        }
        const greetings = this.draft?.character?.alternate_greetings ?? [];
        for (let i = 0; i < greetings.length; i++) {
            const ta = /** @type {HTMLTextAreaElement} */ (
                this.element?.querySelector('#edit-alt-greeting-' + i)
            );
            if (ta) ta.value = greetings[i];
        }
    }

    /**
     * Set lorebook entry editable field values from the current draft.
     */
    setLorebookEntryValues() {
        if (!this.draft?.lorebook?.entries?.length) return;
        for (let i = 0; i < this.draft.lorebook.entries.length; i++) {
            const entry = this.draft.lorebook.entries[i];
            const nameInput = /** @type {HTMLInputElement} */ (this.element?.querySelector('#edit-entry-name-' + i));
            if (nameInput) nameInput.value = entry.name || '';
            const keysInput = /** @type {HTMLInputElement} */ (this.element?.querySelector('#edit-entry-keys-' + i));
            if (keysInput) keysInput.value = entry.keys.join(', ');
            const contentInput = /** @type {HTMLTextAreaElement} */ (this.element?.querySelector('#edit-entry-content-' + i));
            if (contentInput) contentInput.value = entry.content;
        }
    }

    /**
     * Attach listeners to editable preview fields to track draft changes.
     */
    attachPreviewEditListeners() {
        const charFields = [
            { id: '#edit-name', prop: 'name' },
            { id: '#edit-description', prop: 'description' },
            { id: '#edit-personality', prop: 'personality' },
            { id: '#edit-scenario', prop: 'scenario' },
            { id: '#edit-first-mes', prop: 'first_mes' },
            { id: '#edit-mes-example', prop: 'mes_example' },
            { id: '#edit-creator-notes', prop: 'creator_notes' },
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
                if (this.draft?.lorebook?.entries[idx]) this.draft.lorebook.entries[idx].name = target.value;
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
                if (this.draft?.lorebook?.entries[idx]) this.draft.lorebook.entries[idx].content = target.value;
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
        const tagsEl = this.element?.querySelector('#edit-tags');
        if (tagsEl) {
            tagsEl.addEventListener('change', (e) => {
                const value = /** @type {HTMLInputElement} */ (e.target).value;
                this.draft.character.tags = value.split(',').map((t) => t.trim()).filter(Boolean);
            });
        }
    }

    /**
     * Hide the preview section and show input again.
     */
    hidePreview() {
        const previewSection = /** @type {HTMLElement} */ (this.element?.querySelector('#preview-section'));
        const inputSection = /** @type {HTMLElement} */ (this.element?.querySelector('.input-section'));
        const controlsSection = /** @type {HTMLElement} */ (this.element?.querySelector('.controls-section'));
        if (previewSection) previewSection.style.display = 'none';
        if (inputSection) inputSection.style.display = 'block';
        if (controlsSection) controlsSection.style.display = 'block';
    }

    /**
     * Handle the edit button click. Goes back to input section.
     */
    onEditClick() {
        this.hidePreview();
        this.draft = null;
    }

    /**
     * Load a CharacterDraft into the preview/edit flow.
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
        const saveBtn = /** @type {HTMLButtonElement} */ (this.element?.querySelector('#save-button'));
        if (saveBtn) saveBtn.disabled = true;
        try {
            this.container?.logger?.info('Saving character', { name: this.draft.character.name });
            await this.container.saveCharacter.execute(this.draft.character, this.draft.lorebook);
            this.container?.logger?.info('Character saved successfully');
            this.container?.notifier?.success('Character saved to SillyTavern');
            this.showStatus('Character saved to SillyTavern', 'success');
            startImageGeneration(this.container, this.draft.character, this.draft.lorebook);
            this.draft = null;
            this.hidePreview();
            const textarea = /** @type {HTMLTextAreaElement} */ (
                this.element?.querySelector('#character-description')
            );
            if (textarea) textarea.value = '';
        } catch (error) {
            this.container?.logger?.error('Save failed', { error: error.message });
            this.container?.notifier?.error(`Save failed: ${error.message}`);
            this.showStatus(`Save failed: ${error.message}`, 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    /**
     * Show a persistent status message in the status section.
     *
     * @param {string} message - text to display
     * @param {'error'|'success'|'info'} [type] - visual style
     */
    showStatus(message, type = 'info') {
        const section = /** @type {HTMLElement} */ (this.element?.querySelector('#status-section'));
        if (!section) return;
        section.innerHTML = '';
        const msg = document.createElement('div');
        msg.className = 'status-message status-' + type;
        msg.textContent = message;
        section.appendChild(msg);
    }

    /**
     * Clear the status section.
     */
    clearStatus() {
        const section = /** @type {HTMLElement} */ (this.element?.querySelector('#status-section'));
        if (section) section.innerHTML = '';
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
