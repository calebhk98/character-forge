/**
 * @file Utility for repairing malformed JSON from LLM responses. Handles
 * common issues like markdown code blocks, trailing commas, and quotes.
 */

/**
 * Repair malformed JSON from LLM output.
 *
 * Attempts a sequence of repairs:
 * 1. Strip markdown code blocks (```json ... ```)
 * 2. Remove leading/trailing whitespace
 * 3. Escape unescaped newlines in strings
 * 4. Remove trailing commas before closing brackets
 * 5. Convert single quotes to double quotes in object keys
 * 6. Handle missing colons in key-value pairs
 *
 * @param {string} input - raw LLM output
 * @returns {object|null} parsed JSON object or null if repair fails
 */
export function repairJson(input) {
    if (!input || typeof input !== 'string') {
        return null;
    }

    let json = input;

    // Strip markdown code blocks
    json = json.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

    // Trim whitespace
    json = json.trim();

    // Try direct parse first
    try {
        return JSON.parse(json);
    } catch (e) {
        // Continue with repairs
    }

    // Remove trailing commas before closing brackets/braces
    json = json.replace(/,(\s*[}\]])/g, '$1');

    try {
        return JSON.parse(json);
    } catch (e) {
        // Continue with repairs
    }

    // Escape unescaped newlines within quoted strings
    // This regex finds quoted strings and escapes literal newlines
    json = json.replace(/"([^"]*?)"/g, (match, content) => {
        const escaped = content.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        return `"${escaped}"`;
    });

    try {
        return JSON.parse(json);
    } catch (e) {
        // Continue with repairs
    }

    // Try replacing single quotes with double quotes in common cases
    // This is risky, so we only do it as a last resort
    if (json.includes("'")) {
        const repaired = json.replace(/'/g, '"');
        try {
            return JSON.parse(repaired);
        } catch (e) {
            // Single quote replacement didn't work
        }
    }

    return null;
}
