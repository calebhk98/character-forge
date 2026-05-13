/**
 * @file Entry point and composition root for Character Forge. Registers
 * the extension with SillyTavern, wires up the DI container, and hooks
 * into ST's lifecycle events. Only file that imports from both ui/ and
 * infrastructure/.
 */

// @ts-check

import { CharacterGeneratorPanel } from './src/ui/panels/CharacterGeneratorPanel.js';
import { SettingsPanel } from './src/ui/panels/SettingsPanel.js';
import { buildContainer } from './src/composition/Container.js';
import { ExtensionSettingsConfigStore } from './src/infrastructure/config/ExtensionSettingsConfigStore.js';

/**
 * Extension entry point. Called by SillyTavern on extension load.
 * The name is part of SillyTavern's extension API contract.
 */
async function setup() {
    // @ts-ignore - getContext is injected by SillyTavern at runtime
    // eslint-disable-next-line no-undef
    const stContext = getContext?.();
    if (!stContext) {
        console.warn('[Character Forge] SillyTavern context not available, using defaults');
    }

    // Create config store to load persisted settings
    const configStore = new ExtensionSettingsConfigStore('character-forge', stContext);

    // Load user config with defaults
    const userConfig = {
        llmProvider: configStore.get('llmProvider', 'silly-tavern'),
        cardFormat: configStore.get('cardFormat', 'v3'),
        promptTemplate: configStore.get('promptTemplate', 'default'),
        lorebookEntryCount: configStore.get('lorebookEntryCount', 'auto'),
        generationTemperature: configStore.get('generationTemperature', 0.85),
        autoSaveOnGenerate: configStore.get('autoSaveOnGenerate', false),
        customSystemPromptOverride: configStore.get('customSystemPromptOverride', ''),
    };

    // Build application container with config
    const container = buildContainer(userConfig, stContext);

    // Get or create the extension panel container
    const panelContainer = document.getElementById('character-forge-container')
        || createPanelContainer();

    // Create and render the panels
    const generatorPanel = new CharacterGeneratorPanel(container);
    generatorPanel.render(panelContainer);

    const settingsPanel = new SettingsPanel(container);
    const settingsPanelContainer = document.getElementById('character-forge-settings-container')
        || createSettingsPanelContainer();
    settingsPanel.render(settingsPanelContainer);

    console.log('[Character Forge] Extension loaded with panels rendered');
}

/**
 * Create the panel container element if it doesn't exist.
 *
 * @returns {HTMLElement} the created container
 */
function createPanelContainer() {
    const container = document.createElement('div');
    container.id = 'character-forge-container';
    container.className = 'character-forge-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Create the settings panel container element if it doesn't exist.
 *
 * @returns {HTMLElement} the created container
 */
function createSettingsPanelContainer() {
    const container = document.createElement('div');
    container.id = 'character-forge-settings-container';
    container.className = 'character-forge-settings-container';
    document.body.appendChild(container);
    return container;
}

// Register the extension with SillyTavern
// @ts-ignore - getContext is injected by SillyTavern at runtime
if (typeof getContext !== 'undefined') {
    setup().catch(err => {
        console.error('[Character Forge] Setup error:', err);
    });
}
