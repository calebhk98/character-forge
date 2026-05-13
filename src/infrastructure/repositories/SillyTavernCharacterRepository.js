/**
 * @file Adapter that saves character cards to SillyTavern's character storage.
 */

import { ICharacterRepository } from '../../application/ports/ICharacterRepository.js';

/**
 * Character repository using SillyTavern's storage.
 *
 * @augments ICharacterRepository
 */
export class SillyTavernCharacterRepository extends ICharacterRepository {
    /**
     * Construct with SillyTavern context.
     *
     * @param {object} stContext result of getContext()
     */
    constructor(stContext) {
        super();
        this.ctx = stContext;
    }

    /**
     * Save a character card to SillyTavern.
     *
     * @param {object} cardJson - Character Card V3 JSON
     * @returns {Promise<string>} character filename or identifier
     */
    async save(cardJson) {
        const characterName = cardJson.data?.name || 'UnnamedCharacter';
        const sanitizedName = characterName.replace(/[^a-zA-Z0-9_-]/g, '_');

        const response = await fetch('/api/characters/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardJson),
        });

        if (!response.ok) {
            throw new Error(`Failed to save character: ${response.statusText}`);
        }

        const result = await response.json();
        return result.filename || sanitizedName;
    }
}
