/**
 * @file Entry point and composition root for Character Forge. Registers
 * the extension with SillyTavern, wires up the DI container, and hooks
 * into ST's lifecycle. Only file that imports from both ui/ and
 * infrastructure/.
 */

// @ts-check

import { CharacterGeneratorPanel } from './src/ui/panels/CharacterGeneratorPanel.js';
import { SettingsPanel } from './src/ui/panels/SettingsPanel.js';
import { buildContainer } from './src/composition/Container.js';
import { ExtensionSettingsConfigStore } from './src/infrastructure/config/ExtensionSettingsConfigStore.js';

const MODULE_NAME = 'character-forge';

/**
 * Extension entry point. Self-executes when ST injects the module script tag.
 * ST exposes its API exclusively via the `SillyTavern` global (set on globalThis
 * in script.js); there is no bare `getContext` global.
 *
 * @returns {Promise<void>}
 */
async function setup() {
    // ST puts exactly one thing on globalThis: the SillyTavern namespace object
    // (see public/script.js: `globalThis.SillyTavern = { libs, getContext }`).
    // There is no bare `getContext` global — calling it directly throws ReferenceError.
    // @ts-ignore - SillyTavern global is injected at runtime
    const stContext = globalThis.SillyTavern?.getContext?.();
    if (!stContext) {
        console.warn('[Character Forge] SillyTavern context not available, using defaults');
    }

    const configStore = new ExtensionSettingsConfigStore(MODULE_NAME, stContext);

    const userConfig = {
        llmProvider: configStore.get('llmProvider', 'silly-tavern'),
        cardFormat: configStore.get('cardFormat', 'v3'),
        promptTemplate: configStore.get('promptTemplate', 'default'),
        lorebookEntryCount: configStore.get('lorebookEntryCount', 'auto'),
        generationTemperature: configStore.get('generationTemperature', 0.85),
        autoSaveOnGenerate: configStore.get('autoSaveOnGenerate', false),
        customSystemPromptOverride: configStore.get('customSystemPromptOverride', ''),
    };

    const container = buildContainer(userConfig, stContext);

    const modal = createModal();
    const generatorPanel = new CharacterGeneratorPanel(container);
    generatorPanel.render(modal.content);
    modal.closeBtn.addEventListener('click', () => hideModal(modal.overlay));
    modal.overlay.addEventListener('click', (e) => {
        if (e.target === modal.overlay) {
            hideModal(modal.overlay);
        }
    });

    // ST's extension settings drawer is #extensions_settings2 (defined in
    // public/index.html). Appending here is where every extension's settings UI
    // belongs — it's what the "Extensions" panel in the sidebar renders.
    // The generator panel is too large for the settings drawer, so it lives in a
    // modal overlay and is opened via a button appended at the top of this section.
    const settingsRoot = document.getElementById('extensions_settings2');
    if (settingsRoot) {
        const settingsWrapper = document.createElement('div');
        settingsWrapper.id = 'character-forge-settings-container';
        settingsWrapper.className = 'character-forge-settings-section';

        const launchBtn = document.createElement('button');
        launchBtn.className = 'btn btn-primary character-forge-launch-btn';
        launchBtn.textContent = 'Open Character Forge';
        launchBtn.addEventListener('click', () => showModal(modal.overlay));

        settingsWrapper.appendChild(launchBtn);
        settingsRoot.appendChild(settingsWrapper);

        const settingsPanel = new SettingsPanel(container);
        settingsPanel.render(settingsWrapper);
    }

    console.log('[Character Forge] Extension loaded');
}

/**
 * Create the full-screen modal overlay that houses the generator panel.
 *
 * @returns {{ overlay: HTMLElement, content: HTMLElement, closeBtn: HTMLElement }} modal parts
 */
function createModal() {
    const overlay = document.createElement('div');
    overlay.id = 'character-forge-modal-overlay';
    overlay.className = 'character-forge-modal-overlay';
    overlay.style.display = 'none';

    const dialog = document.createElement('div');
    dialog.className = 'character-forge-modal-dialog';

    const header = document.createElement('div');
    header.className = 'character-forge-modal-header';

    const title = document.createElement('span');
    title.className = 'character-forge-modal-title';
    title.textContent = 'Character Forge';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'character-forge-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close Character Forge');

    header.appendChild(title);
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.className = 'character-forge-modal-content';

    dialog.appendChild(header);
    dialog.appendChild(content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    return { overlay, content, closeBtn };
}

/**
 * Show the modal overlay.
 *
 * @param {HTMLElement} overlay the overlay element to show
 */
function showModal(overlay) {
    overlay.style.display = 'flex';
}

/**
 * Hide the modal overlay.
 *
 * @param {HTMLElement} overlay the overlay element to hide
 */
function hideModal(overlay) {
    overlay.style.display = 'none';
}

// ST loads extensions by injecting a <script type="module"> tag pointing at the
// js field from manifest.json (see extensions.js: addExtensionScript). The module
// runs its top-level code on load — there is no separate "activate" callback unless
// hooks are declared in the manifest. The SillyTavern global being present is the
// reliable signal that we're running inside ST rather than in a test runner.
if (globalThis.SillyTavern) {
    setup().catch(err => {
        console.error('[Character Forge] Setup error:', err);
    });
}
