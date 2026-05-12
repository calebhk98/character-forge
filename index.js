/**
 * @file Entry point and composition root for Character Forge. Registers
 * the extension with SillyTavern, wires up the DI container, and hooks
 * into ST's lifecycle events. Only file that imports from both ui/ and
 * infrastructure/.
 */

// @ts-check

/**
 * Extension entry point. Called by SillyTavern on extension load.
 * The name is part of SillyTavern's extension API contract.
 */
async function setup() {
    // TODO: implement - register extension, set up event listeners
    throw new Error('Character Forge extension setup not implemented');
}

// Register the extension with SillyTavern
// @ts-ignore - getContext is injected by SillyTavern at runtime
if (typeof getContext !== 'undefined') {
    setup().catch(err => {
        console.error('[Character Forge] Setup error:', err);
    });
}
