/**
 * @file LorebookEntry domain entity. A single keyword-triggered entry
 * in a character's embedded lorebook (Character Card V3 character_book).
 */

/**
 * A single lorebook entry with trigger keys and injected content.
 */
export class LorebookEntry {
    /** @type {string[]} trigger words that activate this entry */
    keys;

    /** @type {string} text injected when a key appears in chat */
    content;

    /** @type {string|undefined} optional entry name */
    name;

    /** @type {string|undefined} optional comment about the entry */
    comment;

    /** @type {number|undefined} optional priority value */
    priority;

    /** @type {number|undefined} optional insertion order */
    insertion_order;

    /**
     * Construct a LorebookEntry. Validates that keys is non-empty.
     *
     * @param {object} data - entry data object
     * @param {string[]} data.keys - trigger words that activate this entry
     * @param {string} data.content - text injected when a key appears in chat
     * @param {string} [data.name] - optional entry name
     * @param {string} [data.comment] - optional comment about the entry
     * @param {number} [data.priority] - optional priority value
     * @param {number} [data.insertion_order] - optional insertion order
     */
    constructor(data) {
        if (!Array.isArray(data.keys) || data.keys.length === 0) {
            throw new Error('LorebookEntry.keys must be a non-empty array');
        }
        Object.assign(this, data);
    }
}
