/**
 * @file Tests for JSON repair utility.
 */

import { describe, it, expect } from 'vitest';
import { repairJson } from '../../../src/infrastructure/utils/JsonRepair.js';

describe('JsonRepair', () => {
    it('parses valid JSON without modification', () => {
        const json = '{"name":"test","value":42}';
        const result = repairJson(json);
        expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('removes markdown code block markers', () => {
        const json = '```json\n{"name":"test"}\n```';
        const result = repairJson(json);
        expect(result).toEqual({ name: 'test' });
    });

    it('removes trailing commas before closing brackets', () => {
        const json = '{"items":[1,2,3,],"name":"test",}';
        const result = repairJson(json);
        expect(result).toEqual({ items: [1, 2, 3], name: 'test' });
    });

    it('handles newlines within quoted strings', () => {
        const json = '{"text":"line1\nline2"}';
        const result = repairJson(json);
        expect(result).toEqual({ text: 'line1\nline2' });
    });

    it('handles tabs within quoted strings', () => {
        const json = '{"text":"col1\tcol2"}';
        const result = repairJson(json);
        expect(result).toEqual({ text: 'col1\tcol2' });
    });

    it('strips whitespace around JSON', () => {
        const json = '   \n{"name":"test"}\n   ';
        const result = repairJson(json);
        expect(result).toEqual({ name: 'test' });
    });

    it('returns null for unparseable input', () => {
        const json = 'not valid json at all';
        const result = repairJson(json);
        expect(result).toBeNull();
    });

    it('returns null for null or undefined input', () => {
        expect(repairJson(/** @type {any} */ (null))).toBeNull();
        expect(repairJson(/** @type {any} */ (undefined))).toBeNull();
    });

    it('returns null for non-string input', () => {
        expect(repairJson(/** @type {any} */ (123))).toBeNull();
        expect(repairJson(/** @type {any} */ ({}))).toBeNull();
    });

    it('handles complex nested structures', () => {
        const json = `{
            "name": "test",
            "nested": {
                "items": [1, 2, 3,],
                "value": "text"
            },
        }`;
        const result = repairJson(json);
        expect(result).toEqual({
            name: 'test',
            nested: {
                items: [1, 2, 3],
                value: 'text',
            },
        });
    });

    it('repairs JSON with single quotes when other repairs fail', () => {
        const json = "{'name':'test','value':42}";
        const result = repairJson(json);
        expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('returns null when single quote repair also fails', () => {
        const json = "{'name':'test\\'value':42invalid}";
        const result = repairJson(json);
        expect(result).toBeNull();
    });

    it('handles escaped quote followed by literal newline before closing quote', () => {
        // Buggy regex /"([^"]*?)"/g stops at \" and leaves the newline unescaped,
        // so JSON.parse never succeeds and repairJson returns null.
        const json = '{"a":"x\\"' + '\n' + 'y"}';
        const result = repairJson(json);
        expect(result).toEqual({ a: 'x"\ny' });
    });
});
