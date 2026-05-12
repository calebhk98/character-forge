/**
 * @file Entry point and composition root for Character Forge. Registers
 * the extension with SillyTavern, wires up the DI container, and hooks
 * into ST's lifecycle events. Only file that imports from both ui/ and
 * infrastructure/.
 */

// @ts-check

import { CharacterGeneratorPanel } from './src/ui/panels/CharacterGeneratorPanel.js';

/**
 * Extension entry point. Called by SillyTavern on extension load.
 * The name is part of SillyTavern's extension API contract.
 */
async function setup() {
    // Get or create the extension panel container
    const panelContainer = document.getElementById('character-forge-panel')
        || createPanelContainer();

    // Create and render the panel
    const panel = new CharacterGeneratorPanel(null);
    panel.render(panelContainer);

    console.log('[Character Forge] Extension loaded and panel rendered');
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

// Register the extension with SillyTavern
// @ts-ignore - getContext is injected by SillyTavern at runtime
if (typeof getContext !== 'undefined') {
    setup().catch(err => {
        console.error('[Character Forge] Setup error:', err);
    });
}
