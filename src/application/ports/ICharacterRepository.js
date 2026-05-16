/**
 * @file Abstract port for character persistence. Saves and loads formatted
 * cards to/from storage. Adapters in src/infrastructure/repositories/.
 */

/**
 * Abstract character repository. Subclass and implement all methods.
 *
 * @abstract
 */
export class ICharacterRepository {
    /**
     * Save a formatted character card to storage.
     * When pngBytes are provided the card JSON is embedded in those bytes;
     * otherwise the adapter must create a placeholder PNG as the carrier.
     *
     * @param {object} _cardJson - Character Card V3 JSON object
     * @param {Uint8Array} [_pngBytes] - optional portrait PNG to embed the JSON into
     * @returns {Promise<string>} identifier or path of saved card
     */
    async save(_cardJson, _pngBytes) {
        throw new Error('ICharacterRepository.save must be implemented by subclass');
    }

    /**
     * List all available character cards in storage.
     *
     * @returns {Promise<Array<{name: string, avatarUrl: string}>>} array of character stubs sorted by name
     */
    async list() {
        throw new Error('ICharacterRepository.list must be implemented by subclass');
    }

    /**
     * Load a full character card by its avatar URL or filename.
     *
     * @param {string} _avatarUrl - character avatar file identifier
     * @returns {Promise<object>} Character Card V3 JSON object
     */
    async load(_avatarUrl) {
        throw new Error('ICharacterRepository.load must be implemented by subclass');
    }
}
