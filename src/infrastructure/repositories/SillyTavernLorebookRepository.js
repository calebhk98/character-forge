/**
 * @file Adapter that saves lorebooks (world info) to SillyTavern's storage.
 */

import { ILorebookRepository } from '../../application/ports/ILorebookRepository.js';

/**
 * Lorebook repository using SillyTavern's storage.
 *
 * @augments ILorebookRepository
 */
export class SillyTavernLorebookRepository extends ILorebookRepository {
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
     * Save a lorebook to SillyTavern.
     *
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} _lorebook - lorebook to save
     * @returns {Promise<string>} lorebook identifier
     */
    async save(_lorebook) {
        // TODO: implement - write lorebook entries to ST's world info storage
        throw new Error('SillyTavernLorebookRepository.save not implemented');
    }
}
