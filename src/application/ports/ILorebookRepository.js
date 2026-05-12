/**
 * @file Abstract port for lorebook persistence. Saves lorebooks to storage.
 * Adapters in src/infrastructure/repositories/.
 */

/**
 * Abstract lorebook repository. Subclass and implement save().
 *
 * @abstract
 */
export class ILorebookRepository {
    /**
     * Save a lorebook to storage.
     *
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} _lorebook - lorebook to save
     * @returns {Promise<string>} identifier or path of saved lorebook
     */
    async save(_lorebook) {
        throw new Error('ILorebookRepository.save must be implemented by subclass');
    }
}
