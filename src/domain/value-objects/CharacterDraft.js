/**
 * @file CharacterDraft value object. Represents an in-progress character
 * before it's saved to storage. Immutable.
 */

/**
 * A draft character awaiting user review and save. Contains a Character
 * and its embedded Lorebook, ready to be formatted and persisted.
 */
export class CharacterDraft {
    /**
     * Construct a CharacterDraft.
     *
     * @param {object} data - draft data object
     * @param {import('../entities/Character.js').Character} data.character - the character entity
     * @param {import('../entities/Lorebook.js').Lorebook} [data.lorebook] - optional embedded lorebook
     */
    constructor(data) {
        this.character = data.character;
        this.lorebook = data.lorebook;
    }
}
