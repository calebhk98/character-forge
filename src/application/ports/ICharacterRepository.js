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
     *
     * @param {object} _cardJson - Character Card V3 JSON object
     * @returns {Promise<string>} identifier or path of saved card
     */
    async save(_cardJson) {
        throw new Error('ICharacterRepository.save must be implemented by subclass');
    }
}
