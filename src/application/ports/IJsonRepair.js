/**
 * @file Abstract port for JSON repair. Concrete adapters live in
 * src/infrastructure/utils/. Decouples use cases from the specific
 * repair implementation so the infrastructure import does not leak
 * into the application layer.
 */

/**
 * Abstract JSON repair provider. Subclass and implement repair().
 *
 * @abstract
 */
export class IJsonRepair {
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Attempt to repair malformed JSON and return the parsed object.
     *
     * @param {string} _input - raw LLM output that failed JSON.parse
     * @returns {object|null} parsed object, or null if repair is impossible
     */
    repair(_input) {
        throw new Error('IJsonRepair.repair must be implemented by subclass');
    }

    /**
     * Parse JSON directly, falling back to repair() if parsing fails.
     * Throws with an actionable message when both attempts fail.
     *
     * Subclasses may override to add capabilities such as truncation detection.
     *
     * @param {string} input - raw LLM output
     * @param {string} [context] - label for error messages (e.g. 'character generation')
     * @returns {object} successfully parsed or repaired object
     */
    parseOrRepair(input, context = '') {
        try {
            return JSON.parse(input);
        } catch (_e) {
            const result = this.repair(input);
            if (!result) {
                const suffix = context ? ` for ${context}` : '';
                throw new Error(`LLM returned invalid JSON${suffix} and repair failed. Please try again.`);
            }
            return result;
        }
    }
}
