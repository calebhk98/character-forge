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
     * Save a lorebook to SillyTavern via the /api/worldinfo/edit endpoint.
     *
     * Uses /edit (not /import) because /import requires a multipart file upload.
     * ST world info entries are keyed by numeric string index.
     *
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} lorebook - lorebook to save
     * @returns {Promise<string>} lorebook name used as identifier
     */
    async save(lorebook) {
        const lorebookName = lorebook.name || 'Generated Lorebook';
        const entries = (lorebook.entries || []).map((entry, i) => ({
            uid: i,
            key: entry.keys || [],
            keysecondary: [],
            comment: entry.name || '',
            content: entry.content || '',
            insertion_order: entry.insertion_order ?? i,
            enabled: true,
            extensions: {},
        }));

        const worldInfoData = {
            entries: Object.fromEntries(entries.map((e, i) => [String(i), e])),
        };

        const response = await fetch('/api/worldinfo/edit', {
            method: 'POST',
            headers: this.ctx?.getRequestHeaders?.() ?? { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: lorebookName, data: worldInfoData }),
        });

        if (!response.ok) {
            throw new Error(`Failed to save lorebook: ${response.statusText}`);
        }

        return lorebookName;
    }
}
