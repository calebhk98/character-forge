/**
 * @file Tests for JsonRepairAdapter port implementation.
 */

import { describe, it, expect } from 'vitest';
import { JsonRepairAdapter } from '../../../src/infrastructure/utils/JsonRepairAdapter.js';

describe('JsonRepairAdapter - parseOrRepair', () => {
    it('returns parsed object for valid JSON', () => {
        const adapter = new JsonRepairAdapter();
        expect(adapter.parseOrRepair('{"a":1}', 'test')).toEqual({ a: 1 });
    });

    it('repairs and returns object for markdown-wrapped JSON', () => {
        const adapter = new JsonRepairAdapter();
        expect(adapter.parseOrRepair('```json\n{"a":1}\n```', 'test')).toEqual({ a: 1 });
    });

    it('throws with context label on unrecoverable input', () => {
        const adapter = new JsonRepairAdapter();
        expect(() => adapter.parseOrRepair('totally invalid', 'scene')).toThrow('scene');
    });

    it('includes a raw response preview in the error message on failure', () => {
        const adapter = new JsonRepairAdapter();
        const raw = 'Here is some prose that is not JSON at all and cannot be repaired.';
        expect(() => adapter.parseOrRepair(raw, 'scene')).toThrow(raw.slice(0, 100));
    });
});
