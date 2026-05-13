/**
 * @file Tests for LorebookEntry domain entity.
 */

import { describe, it, expect } from 'vitest';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

describe('LorebookEntry - construction', () => {
    it('should construct with required keys field', () => {
        const data = {
            keys: ['magic', 'spell'],
            content: 'Magic is powerful',
        };
        const entry = new LorebookEntry(data);
        expect(entry.keys).toEqual(['magic', 'spell']);
        expect(entry.content).toBe('Magic is powerful');
    });

    it('should allow optional fields to be undefined', () => {
        const data = {
            keys: ['magic'],
            content: 'Magic is powerful',
        };
        const entry = new LorebookEntry(data);
        expect(entry.name).toBeUndefined();
        expect(entry.comment).toBeUndefined();
        expect(entry.priority).toBeUndefined();
        expect(entry.insertion_order).toBeUndefined();
    });

    it('should accept optional fields when provided', () => {
        const data = {
            keys: ['magic'],
            content: 'Magic is powerful',
            name: 'Magic Entry',
            comment: 'About magic',
            priority: 5,
            insertion_order: 0,
        };
        const entry = new LorebookEntry(data);
        expect(entry.name).toBe('Magic Entry');
        expect(entry.comment).toBe('About magic');
        expect(entry.priority).toBe(5);
        expect(entry.insertion_order).toBe(0);
    });
});

describe('LorebookEntry - validation', () => {
    it('should throw when keys is missing', () => {
        const data = {
            content: 'Magic is powerful',
        };
        // @ts-expect-error intentionally passing invalid data
        expect(() => new LorebookEntry(data)).toThrow();
    });

    it('should throw when keys is an empty array', () => {
        const data = {
            keys: [],
            content: 'Magic is powerful',
        };
        expect(() => new LorebookEntry(data)).toThrow();
    });

    it('should throw when keys is not an array', () => {
        const data = {
            keys: 'magic',
            content: 'Magic is powerful',
        };
        // @ts-expect-error intentionally passing invalid data
        expect(() => new LorebookEntry(data)).toThrow();
    });

    it('should throw when keys contains non-string elements', () => {
        const data = {
            keys: ['magic', 123],
            content: 'Magic is powerful',
        };
        // @ts-expect-error intentionally passing invalid data
        expect(() => new LorebookEntry(data)).toThrow('all keys must be non-empty strings');
    });

    it('should throw when keys contains empty strings', () => {
        const data = {
            keys: ['magic', ''],
            content: 'Magic is powerful',
        };
        expect(() => new LorebookEntry(data)).toThrow('all keys must be non-empty strings');
    });

    it('should throw when content is missing', () => {
        const data = {
            keys: ['magic'],
        };
        // @ts-expect-error intentionally passing invalid data
        expect(() => new LorebookEntry(data)).toThrow();
    });

    it('should throw when content is not a string', () => {
        const data = {
            keys: ['magic'],
            content: 123,
        };
        // @ts-expect-error intentionally passing invalid data
        expect(() => new LorebookEntry(data)).toThrow();
    });

    it('should throw when content is an empty or whitespace-only string', () => {
        const data = {
            keys: ['magic'],
            content: '   ',
        };
        expect(() => new LorebookEntry(data)).toThrow('content cannot be empty');
    });
});
