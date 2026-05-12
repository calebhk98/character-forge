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
     * @param {object} data
     * @param {string} [data.name]
     * @param {string} [data.description]
     * @param {import('./LorebookEntry.js').LorebookEntry[]} [data.entries]
     * @param {number} [data.scan_depth]
     * @param {number} [data.token_budget]
     * @param {boolean} [data.recursive_scanning]
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
