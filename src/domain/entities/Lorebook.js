/**
 * @file Lorebook domain entity. A collection of LorebookEntry objects
 * that gets embedded in a Character Card V3 as character_book.
 */

/**
 * A lorebook (World Info) for a character. Embedded in character_book field.
 */
export class Lorebook {
    /**
     * Construct a Lorebook.
     *
     * @param {object} data - lorebook data object
     * @param {string} [data.name] - lorebook name
     * @param {string} [data.description] - lorebook description
     * @param {import('./LorebookEntry.js').LorebookEntry[]} [data.entries] - array of lorebook entries
     * @param {number} [data.scan_depth] - depth for scanning context
     * @param {number} [data.token_budget] - token budget for lorebook
     * @param {boolean} [data.recursive_scanning] - whether to enable recursive scanning
     */
    constructor(data = {}) {
        this.name = data.name || '';
        this.description = data.description || '';
        this.entries = data.entries || [];
        this.scan_depth = data.scan_depth !== undefined ? data.scan_depth : 2;
        this.token_budget = data.token_budget || 0;
        this.recursive_scanning = data.recursive_scanning !== undefined ? data.recursive_scanning : false;
    }
}
