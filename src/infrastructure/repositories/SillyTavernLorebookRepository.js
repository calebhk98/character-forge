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
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} lorebook - lorebook to save
     * @returns {Promise<string>} lorebook identifier
     */
    async save(lorebook) {
        const worldInfoData = {
            name: lorebook.name || 'Generated Lorebook',
            description: lorebook.description,
            entries: (lorebook.entries || []).map((entry) => ({
                key: entry.keys || [],
                content: entry.content,
                name: entry.name,
                comment: entry.comment,
                insertion_order: entry.insertion_order,
            })),
            scan_depth: lorebook.scan_depth,
            token_budget: lorebook.token_budget,
            recursive_scanning: lorebook.recursive_scanning,
        };

        const response = await fetch('/api/worldinfo/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(worldInfoData),
        });

        if (!response.ok) {
            throw new Error(`Failed to save lorebook: ${response.statusText}`);
        }

        const result = await response.json();
        return result.id || result.name || lorebook.name || 'generated-lorebook';
    }
}
