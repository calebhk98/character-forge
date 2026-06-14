/**
 * @file Adapter that wraps the repairJson utility as an IJsonRepair port.
 * Also detects token-limit truncation and surfaces an actionable error
 * instead of the generic "invalid JSON" message.
 */

import { IJsonRepair } from '../../application/ports/IJsonRepair.js';
import { repairJson, isTruncated } from './JsonRepair.js';

/**
 * Concrete JSON repair adapter. Wraps the repairJson utility and adds
 * truncation detection so callers receive an actionable error message
 * when the LLM hits its token limit.
 *
 * @augments IJsonRepair
 */
export class JsonRepairAdapter extends IJsonRepair {
    /**
     * Attempt to repair malformed JSON.
     *
     * @param {string} input - raw LLM output that failed JSON.parse
     * @returns {object|null} parsed object or null if repair is impossible
     */
    repair(input) {
        return repairJson(input);
    }

    /**
     * Parse JSON, falling back to repair. Throws with an actionable message
     * on failure, distinguishing token-limit truncation from other corruption.
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
                const preview = input.slice(0, 300).replace(/\n/g, ' ');
                if (isTruncated(input)) {
                    throw new Error(
                        `LLM response was cut off mid-generation${suffix} (token limit reached). ` +
                        'Try reducing context length or increasing the max-tokens setting.',
                    );
                }
                throw new Error(
                    `LLM returned invalid JSON${suffix} and repair failed. ` +
                    `Raw response: "${preview}"`,
                );
            }
            return result;
        }
    }
}
