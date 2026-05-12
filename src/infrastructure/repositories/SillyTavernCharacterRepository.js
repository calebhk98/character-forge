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
     * @param {object} _cardJson - Character Card V3 JSON
     * @returns {Promise<string>} character filename or identifier
     */
    async save(_cardJson) {
        // TODO: implement - write cardJson to ST's character storage
        throw new Error('SillyTavernCharacterRepository.save not implemented');
    }
}
