/**
 * @file LorebookEntry domain entity. A single keyword-triggered entry
 * in a character's embedded lorebook (Character Card V3 character_book).
 */

/**
 * A single lorebook entry with trigger keys and injected content.
 */
export class LorebookEntry {
    /**
     * Construct a LorebookEntry. Validates that keys is non-empty.
     *
     * @param {object} data
     * @param {string[]} data.keys - trigger words that activate this entry
     * @param {string} data.content - text injected when a key appears in chat
     * @param {string} [data.name]
     * @param {string} [data.comment]
     * @param {number} [data.priority]
     * @param {number} [data.insertion_order]
     */
    constructor(data) {
        // TODO: validate keys is non-empty array
        Object.assign(this, data);
    }
}
