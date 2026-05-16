/**
 * @file Abstract port for character persistence. Saves formatted
 * cards to storage. Adapters in src/infrastructure/repositories/.
 */

/**
 * Abstract character repository. Subclass and implement save().
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
}
