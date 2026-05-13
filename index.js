/**
 * @file Entry point and composition root for Character Forge. Registers
 * the extension with SillyTavern, wires up the DI container, and hooks
 * into ST's lifecycle events. Only file that imports from both ui/ and
 * infrastructure/.
 */

// @ts-check

import { CharacterGeneratorPanel } from './src/ui/panels/CharacterGeneratorPanel.js';
import { buildContainer } from './src/composition/Container.js';

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

    // Build application container
    const container = buildContainer({
        llmProvider: 'silly-tavern',
        cardFormat: 'v3',
    }, stContext);

    // Get or create the extension panel container
    const panelContainer = document.getElementById('character-forge-container')
        || createPanelContainer();

    // Create and render the panel
    const panel = new CharacterGeneratorPanel(container);
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
