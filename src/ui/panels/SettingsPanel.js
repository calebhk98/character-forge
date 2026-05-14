/**
 * @file Settings panel component. Renders configuration UI for extension
 * options and persists changes to the config store.
 */

/**
 * Settings panel for configuring Character Forge options.
 */
export class SettingsPanel {
    /**
     * Construct the panel with its dependencies.
     *
     * @param {object} container application container with wired services
     */
    constructor(container) {
        this.container = container;
        this.element = null;
    }

    /**
     * Render the settings panel into a DOM element.
     *
     * @param {HTMLElement} targetElement - element to render into
     */
    render(targetElement) {
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.className = 'character-forge-settings-panel';
        panel.innerHTML = `
            <div class="settings-header">
                <h3>Character Forge Settings</h3>
            </div>
            <div class="settings-form">
                <div class="setting-group">
                    <label for="prompt-template-select">Prompt Template</label>
                    <select id="prompt-template-select" class="prompt-template-select">
                        <option value="default">Default</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label for="lorebook-entry-count-select">Lorebook Entry Count</label>
                    <select id="lorebook-entry-count-select" class="lorebook-entry-count-select">
                        <option value="auto">Auto (AI decides)</option>
                        <option value="5">5</option>
                        <option value="8">8</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label for="generation-temperature-slider">
                        Generation Temperature
                        <span id="temperature-value-display">0.85</span>
                    </label>
                    <input
                        id="generation-temperature-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value="0.85"
                        class="generation-temperature-slider"
                        />
                </div>
                <div class="setting-group">
                    <label>
                        <input
                            id="auto-save-checkbox"
                            type="checkbox"
                            class="auto-save-checkbox"
                            />
                        Skip review, save directly
                    </label>
                </div>
                <div class="setting-group">
                    <label for="custom-system-prompt-textarea">
                        Custom System Prompt Override (Advanced)
                    </label>
                    <textarea
                        id="custom-system-prompt-textarea"
                        class="custom-system-prompt-textarea"
                        placeholder="Leave empty to use default system prompt"
                        rows="4"></textarea>
                </div>
            </div>
        `;
        targetElement.appendChild(panel);
        this.element = panel;
        this.loadSettings();
        this.attachEventListeners();
    }

    /**
     * Load settings values from config store and populate UI.
     */
    loadSettings() {
        const promptTemplateSelect = /** @type {HTMLSelectElement} */ (
            this.element?.querySelector('#prompt-template-select')
        );
        if (promptTemplateSelect) {
            const value = this.container?.configStore?.get('promptTemplate', 'default');
            promptTemplateSelect.value = value;
        }

        const lorebookSelect = /** @type {HTMLSelectElement} */ (
            this.element?.querySelector('#lorebook-entry-count-select')
        );
        if (lorebookSelect) {
            const value = this.container?.configStore?.get('lorebookEntryCount', 'auto');
            lorebookSelect.value = value;
        }

        const tempSlider = /** @type {HTMLInputElement} */ (
            this.element?.querySelector('#generation-temperature-slider')
        );
        if (tempSlider) {
            const value = this.container?.configStore?.get('generationTemperature', 0.85);
            tempSlider.value = value;
            this.updateTemperatureDisplay(value);
        }

        const autoSaveCheckbox = /** @type {HTMLInputElement} */ (
            this.element?.querySelector('#auto-save-checkbox')
        );
        if (autoSaveCheckbox) {
            const value = this.container?.configStore?.get('autoSaveOnGenerate', false);
            autoSaveCheckbox.checked = value;
        }

        const customPromptTextarea = /** @type {HTMLTextAreaElement} */ (
            this.element?.querySelector('#custom-system-prompt-textarea')
        );
        if (customPromptTextarea) {
            const value = this.container?.configStore?.get('customSystemPromptOverride', '');
            customPromptTextarea.value = value;
        }
    }

    /**
     * Update the temperature display value.
     *
     * @param {number|string} value temperature value
     */
    updateTemperatureDisplay(value) {
        const display = this.element?.querySelector('#temperature-value-display');
        if (display) {
            const numValue = parseFloat(/** @type {string} */ (value));
            display.textContent = numValue.toFixed(2);
        }
    }

    /**
     * Attach event listeners to settings controls.
     */
    attachEventListeners() {
        const promptTemplateSelect = /** @type {HTMLSelectElement} */ (
            this.element?.querySelector('#prompt-template-select')
        );
        if (promptTemplateSelect) {
            promptTemplateSelect.addEventListener('change', () => {
                this.saveSetting('promptTemplate', promptTemplateSelect.value);
            });
        }

        const lorebookSelect = /** @type {HTMLSelectElement} */ (
            this.element?.querySelector('#lorebook-entry-count-select')
        );
        if (lorebookSelect) {
            lorebookSelect.addEventListener('change', () => {
                this.saveSetting('lorebookEntryCount', lorebookSelect.value);
            });
        }

        const tempSlider = /** @type {HTMLInputElement} */ (
            this.element?.querySelector('#generation-temperature-slider')
        );
        if (tempSlider) {
            tempSlider.addEventListener('change', () => {
                const value = parseFloat(tempSlider.value);
                this.updateTemperatureDisplay(value);
                this.saveSetting('generationTemperature', value);
            });
        }

        const autoSaveCheckbox = /** @type {HTMLInputElement} */ (
            this.element?.querySelector('#auto-save-checkbox')
        );
        if (autoSaveCheckbox) {
            autoSaveCheckbox.addEventListener('change', () => {
                this.saveSetting('autoSaveOnGenerate', autoSaveCheckbox.checked);
            });
        }

        const customPromptTextarea = /** @type {HTMLTextAreaElement} */ (
            this.element?.querySelector('#custom-system-prompt-textarea')
        );
        if (customPromptTextarea) {
            customPromptTextarea.addEventListener('change', () => {
                this.saveSetting('customSystemPromptOverride', customPromptTextarea.value);
            });
        }
    }

    /**
     * Save a setting to the config store.
     *
     * @param {string} key setting key
     * @param {*} value setting value
     */
    saveSetting(key, value) {
        const configStore = this.container?.configStore;
        if (!configStore) {
            return;
        }
        configStore.set(key, value).catch(error => {
            this.container?.notifier?.error(`Failed to save setting: ${error.message}`);
        });
    }
}
