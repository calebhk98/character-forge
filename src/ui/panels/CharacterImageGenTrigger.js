/**
 * @file Helper that fires background image generation after a character card
 * is saved. Kept separate from CharacterGeneratorPanel to respect the 500-line
 * file limit while providing a testable unit for the background task trigger.
 */

/**
 * Fire background image generation for a saved character without blocking the
 * calling code. Uses the notifier for lightweight progress feedback and
 * silently absorbs all errors (the card is already saved at this point).
 *
 * @param {object} container - application container with wired services
 * @param {object} character - the saved character
 * @param {object|null} lorebook - the saved lorebook (may be null)
 */
export function startImageGeneration(container, character, lorebook) {
    if (!container?.generateCharacterImages || !character) {
        return;
    }
    container?.notifier?.info('Generating avatar in background…');
    container.generateCharacterImages.execute(character, lorebook)
        .catch((err) => container?.logger?.error('Background image generation failed', { error: err.message }));
}
