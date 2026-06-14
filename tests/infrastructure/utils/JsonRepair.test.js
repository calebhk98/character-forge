/**
 * @file Tests for JSON repair utility.
 */

import { describe, it, expect } from 'vitest';
import { repairJson } from '../../../src/infrastructure/utils/JsonRepair.js';

describe('JsonRepair - object handling', () => {
    it('parses valid JSON without modification', () => {
        const json = '{"name":"test","value":42}';
        expect(repairJson(json)).toEqual({ name: 'test', value: 42 });
    });

    it('removes markdown code block markers', () => {
        const json = '```json\n{"name":"test"}\n```';
        expect(repairJson(json)).toEqual({ name: 'test' });
    });

    it('removes trailing commas before closing brackets', () => {
        const json = '{"items":[1,2,3,],"name":"test",}';
        expect(repairJson(json)).toEqual({ items: [1, 2, 3], name: 'test' });
    });

    it('handles newlines within quoted strings', () => {
        const json = '{"text":"line1\nline2"}';
        expect(repairJson(json)).toEqual({ text: 'line1\nline2' });
    });

    it('handles tabs within quoted strings', () => {
        const json = '{"text":"col1\tcol2"}';
        expect(repairJson(json)).toEqual({ text: 'col1\tcol2' });
    });

    it('strips whitespace around JSON', () => {
        const json = '   \n{"name":"test"}\n   ';
        expect(repairJson(json)).toEqual({ name: 'test' });
    });

    it('handles complex nested structures', () => {
        const json = `{
            "name": "test",
            "nested": {
                "items": [1, 2, 3,],
                "value": "text"
            },
        }`;
        expect(repairJson(json)).toEqual({
            name: 'test',
            nested: { items: [1, 2, 3], value: 'text' },
        });
    });

    it('repairs JSON with single quotes when other repairs fail', () => {
        expect(repairJson("{'name':'test','value':42}")).toEqual({ name: 'test', value: 42 });
    });

    it('handles escaped quote followed by literal newline before closing quote', () => {
        // Buggy regex /"([^"]*?)"/g stops at \" and leaves the newline unescaped,
        // so JSON.parse never succeeds and repairJson returns null.
        const json = '{"a":"x\\"' + '\n' + 'y"}';
        expect(repairJson(json)).toEqual({ a: 'x"\ny' });
    });
});

describe('JsonRepair - array handling', () => {
    it('parses a plain JSON array', () => {
        const json = '["greeting one", "greeting two", "greeting three"]';
        expect(repairJson(json)).toEqual(['greeting one', 'greeting two', 'greeting three']);
    });

    it('extracts a JSON array when surrounded by preamble text', () => {
        const json = 'Here are the greetings:\n["greeting one", "greeting two", "greeting three"]';
        expect(repairJson(json)).toEqual(['greeting one', 'greeting two', 'greeting three']);
    });

    it('repairs a JSON array with literal newlines inside string values', () => {
        const json = '["line one\nline two", "greeting two", "greeting three"]';
        expect(repairJson(json)).toEqual(['line one\nline two', 'greeting two', 'greeting three']);
    });

    it('extracts a JSON array from markdown code block with preamble', () => {
        const json = 'Here you go:\n```json\n["a", "b", "c"]\n```';
        expect(repairJson(json)).toEqual(['a', 'b', 'c']);
    });
});

describe('JsonRepair - error cases', () => {
    it('returns null for unparseable input', () => {
        expect(repairJson('not valid json at all')).toBeNull();
    });

    it('returns null for null or undefined input', () => {
        expect(repairJson(/** @type {any} */ (null))).toBeNull();
        expect(repairJson(/** @type {any} */ (undefined))).toBeNull();
    });

    it('returns null for non-string input', () => {
        expect(repairJson(/** @type {any} */ (123))).toBeNull();
        expect(repairJson(/** @type {any} */ ({}))).toBeNull();
    });

    it('returns null when single quote repair also fails', () => {
        expect(repairJson("{'name':'test\\'value':42invalid}")).toBeNull();
    });
});
