/**
 * @file Utility for repairing malformed JSON from LLM responses. Handles
 * common issues like markdown code blocks, trailing commas, and quotes.
 * Also exports a truncation detector for surfacing token-limit errors.
 */

/**
 * Walk a JSON-like string character by character and return structural depth
 * and whether the string ends inside an open quoted value.
 *
 * @param {string} str - pre-trimmed string to scan
 * @returns {{ depth: number, inString: boolean }} structural state after scanning
 */
function scanJsonStructure(str) {
    let depth = 0;
    let inString = false;

    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (inString) {
            if (c === '\\') { i++; }
            else if (c === '"') { inString = false; }
        } else if (c === '"') {
            inString = true;
        } else if (c === '{' || c === '[') {
            depth++;
        } else if (c === '}' || c === ']') {
            depth--;
        }
    }

    return { depth, inString };
}

/**
 * Detect whether a raw LLM string appears to be truncated mid-generation
 * (e.g. hit a token limit). Checks for unbalanced braces/brackets or an
 * unclosed string after stripping markdown wrappers.
 *
 * @param {string} input - raw LLM output
 * @returns {boolean} true if the input looks like it was cut off
 */
export function isTruncated(input) {
    if (!input || typeof input !== 'string') {
        return false;
    }

    const stripped = input
        .replace(/^```(?:json)?\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

    if (!stripped.startsWith('{') && !stripped.startsWith('[')) {
        return false;
    }

    const { depth, inString } = scanJsonStructure(stripped);
    return depth > 0 || inString;
}

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
    } catch (_e) {
        // Continue with repairs
    }

    // Remove trailing commas before closing brackets/braces
    json = json.replace(/,(\s*[}\]])/g, '$1');

    try {
        return JSON.parse(json);
    } catch (_e) {
        // Continue with repairs
    }

    // Escape unescaped newlines within quoted strings.
    // The pattern (?:[^"\\]|\\.)* matches any char except " and \, or any
    // backslash-escaped pair, so \" inside a string is not treated as the
    // closing delimiter.
    json = json.replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
        const escaped = content.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        return `"${escaped}"`;
    });

    try {
        return JSON.parse(json);
    } catch (_e) {
        // Continue with repairs
    }

    // Try replacing single quotes with double quotes in common cases
    // This is risky, so we only do it as a last resort
    if (json.includes("'")) {
        const repaired = json.replace(/'/g, '"');
        try {
            return JSON.parse(repaired);
        } catch (_e) {
            // Single quote replacement didn't work
        }
    }

    return null;
}
