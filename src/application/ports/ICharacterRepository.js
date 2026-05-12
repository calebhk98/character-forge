/**
 * @file Abstract port for character persistence. Saves formatted
 * cards to storage. Adapters in src/infrastructure/repositories/.
 */

/**
 * Abstract character repository. Subclass and implement save().
 * @abstract
 */
export class ICharacterRepository {
    /**
     * Save a formatted character card to storage.
     *
     * @param {Object} cardJson Character Card V3 JSON object
     * @param {string} [cardJson.data.name]
     * @returns {Promise<string>} identifier or path of saved card
     */
    async save(cardJson) {
        throw new Error('ICharacterRepository.save must be implemented by subclass');
    }
}
