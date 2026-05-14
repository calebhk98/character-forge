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

    // ST's extension settings drawer is #extensions_settings2 (defined in
    // public/index.html). Each extension appends an inline_drawer section here,
    // which is the standard ST pattern for collapsible extension panels.
    const settingsRoot = document.getElementById('extensions_settings2');
    if (settingsRoot) {
        const drawer = buildInlineDrawer(container);
        settingsRoot.appendChild(drawer);
    }

    console.log('[Character Forge] Extension loaded');
}

/**
 * Build a collapsible inline-drawer section following ST's extension panel
 * convention. The drawer contains both the settings panel and the generator
 * panel so the entire extension lives in one collapsible entry alongside all
 * other installed extensions.
 *
 * @param {object} container - wired DI container
 * @returns {HTMLElement} the drawer root element
 */
function buildInlineDrawer(container) {
    const drawer = document.createElement('div');
    drawer.id = 'character-forge-extension-drawer';
    drawer.className = 'inline_drawer';

    const toggle = document.createElement('div');
    toggle.className = 'inline_drawer_toggle inline_drawer_header';
    toggle.innerHTML = `
        <b>Character Forge</b>
        <div class="inline_drawer_icon fa-solid fa-circle-chevron-down"></div>
    `;

    const content = document.createElement('div');
    content.className = 'inline_drawer_content';
    content.style.display = 'none';

    toggle.addEventListener('click', () => {
        const isOpen = content.style.display !== 'none';
        content.style.display = isOpen ? 'none' : 'block';
        const icon = toggle.querySelector('.inline_drawer_icon');
        if (icon) {
            icon.className = isOpen
                ? 'inline_drawer_icon fa-solid fa-circle-chevron-down'
                : 'inline_drawer_icon fa-solid fa-circle-chevron-up';
        }
    });

    const settingsPanel = new SettingsPanel(container);
    settingsPanel.render(content);

    const generatorPanel = new CharacterGeneratorPanel(container);
    generatorPanel.render(content);

    drawer.appendChild(toggle);
    drawer.appendChild(content);

    return drawer;
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
