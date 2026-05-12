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
        expect(() => new LorebookEntry(data)).toThrow();
    });
});
