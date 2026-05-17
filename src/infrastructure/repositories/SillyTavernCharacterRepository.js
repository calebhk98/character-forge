/**
 * @file Adapter that saves character cards to SillyTavern's character storage.
 * Cards are saved as PNG files with V3 (and V2 compatibility) JSON embedded
 * in tEXt chunks, which is the community standard format for Character Card V3.
 */

import { ICharacterRepository } from '../../application/ports/ICharacterRepository.js';
import { embedJsonInPng, createPlaceholderPng } from '../utils/PngChunkWriter.js';

/**
 * Character repository using SillyTavern's storage.
 * Uploads a PNG file (with embedded card JSON) to /api/characters/import.
 *
 * @augments ICharacterRepository
 */
export class SillyTavernCharacterRepository extends ICharacterRepository {
    /**
     * Construct with SillyTavern context.
     *
     * @param {object} stContext - result of getContext()
     */
    constructor(stContext) {
        super();
        this.ctx = stContext;
    }

    /**
     * Save a character card to SillyTavern via the /api/characters/import endpoint.
     * The card JSON is embedded into a PNG file (placeholder when no portrait is
     * provided) and uploaded as multipart FormData under the 'avatar' field.
     *
     * ST's import endpoint uses multer (.single('avatar')), so the PNG must be
     * sent as multipart FormData. The X-CSRF-Token from getRequestHeaders() is
     * required. omitContentType=true lets the browser set the Content-Type with
     * the correct multipart boundary string.
     *
     * @param {object} cardJson - Character Card V3 JSON
     * @param {Uint8Array} [pngBytes] - optional portrait PNG; placeholder used when absent
     * @returns {Promise<string>} character filename returned by SillyTavern
     */
    async save(cardJson, pngBytes) {
        const characterName = cardJson.data?.name || 'UnnamedCharacter';
        const sanitizedName = characterName.replace(/[^a-zA-Z0-9_-]/g, '_');

        const sourceImage = pngBytes ?? createPlaceholderPng();
        const cardPng = embedJsonInPng(sourceImage, cardJson);

        // new Uint8Array(arrayLike) produces Uint8Array<ArrayBuffer>, satisfying Blob's type constraints
        const blob = new Blob([new Uint8Array(cardPng)], { type: 'image/png' });
        const formData = new FormData();
        formData.append('avatar', blob, `${sanitizedName}.png`);
        formData.append('file_type', 'png');

        // Older ST versions ignore omitContentType and always return Content-Type:
        // application/json. Stripping it lets the browser set the correct
        // multipart/form-data boundary; without this multer can't parse the body.
        const headers = { ...(this.ctx?.getRequestHeaders?.({ omitContentType: true }) ?? {}) };
        delete headers['Content-Type'];

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

    /**
     * List all character cards available in SillyTavern.
     *
     * Calls POST /api/characters/all which returns an array of character
     * metadata objects. Each object contains at minimum `name` and `avatar`
     * (the filename used as the avatar URL identifier).
     *
     * @returns {Promise<Array<{name: string, avatarUrl: string}>>} character stubs sorted by name
     */
    async list() {
        const headers = this.ctx?.getRequestHeaders?.() ?? {};
        const response = await fetch('/api/characters/all', {
            method: 'POST',
            headers,
            body: JSON.stringify({ reset_cache: false }),
        });

        if (!response.ok) {
            throw new Error(`Failed to list characters: ${response.statusText}`);
        }

        const characters = await response.json();
        return characters
            .map((c) => ({ name: c.name, avatarUrl: c.avatar }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Load a full character card from SillyTavern by avatar filename.
     *
     * Calls GET /api/characters?avatar_url=<filename> which returns the
     * parsed Character Card V3 JSON extracted from the PNG's tEXt chunk.
     *
     * @param {string} avatarUrl - character avatar filename (e.g. 'Alice.png')
     * @returns {Promise<object>} Character Card V3 JSON object
     */
    async load(avatarUrl) {
        const headers = this.ctx?.getRequestHeaders?.() ?? {};
        const url = `/api/characters?avatar_url=${encodeURIComponent(avatarUrl)}`;
        const response = await fetch(url, { method: 'GET', headers });

        if (!response.ok) {
            throw new Error(`Failed to load character: ${response.statusText}`);
        }

        return response.json();
    }
}
