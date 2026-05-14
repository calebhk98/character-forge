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
     * Save a character card to SillyTavern via the /api/characters/import endpoint.
     *
     * ST's import endpoint uses multer for file uploads (.single('avatar')),
     * so the card JSON must be sent as multipart FormData under the 'avatar' field
     * with file_type='json'. The X-CSRF-Token from getRequestHeaders() is required.
     *
     * @param {object} cardJson - Character Card V3 JSON
     * @returns {Promise<string>} character filename
     */
    async save(cardJson) {
        const characterName = cardJson.data?.name || 'UnnamedCharacter';
        const sanitizedName = characterName.replace(/[^a-zA-Z0-9_-]/g, '_');

        const blob = new Blob([JSON.stringify(cardJson)], { type: 'application/json' });
        const formData = new FormData();
        formData.append('avatar', blob, `${sanitizedName}.json`);
        formData.append('file_type', 'json');

        // omitContentType=true: browser sets Content-Type with boundary for FormData
        const headers = this.ctx?.getRequestHeaders?.({ omitContentType: true }) ?? {};

        const response = await fetch('/api/characters/import', {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to save character: ${response.statusText}`);
        }

        const result = await response.json();
        return result.file_name || sanitizedName;
    }
}
