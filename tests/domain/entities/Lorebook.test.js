/**
 * @file Tests for Lorebook domain entity.
 */

import { describe, it, expect } from 'vitest';
import { Lorebook } from '../../../src/domain/entities/Lorebook.js';
import { LorebookEntry } from '../../../src/domain/entities/LorebookEntry.js';

describe('Lorebook - construction', () => {
    it('should construct with defaults', () => {
        const lorebook = new Lorebook();
        expect(lorebook.name).toBe('');
        expect(lorebook.description).toBe('');
        expect(lorebook.entries).toEqual([]);
        expect(lorebook.scan_depth).toBe(2);
        expect(lorebook.token_budget).toBe(0);
        expect(lorebook.recursive_scanning).toBe(false);
    });

    it('should accept entries array', () => {
        const entry = new LorebookEntry({
            keys: ['magic'],
            content: 'Magic system',
        });
        const data = {
            name: 'World Info',
            description: 'Main world info',
            entries: [entry],
        };
        const lorebook = new Lorebook(data);
        expect(lorebook.name).toBe('World Info');
        expect(lorebook.description).toBe('Main world info');
        expect(lorebook.entries).toEqual([entry]);
        expect(lorebook.entries[0].keys).toEqual(['magic']);
    });

    it('should apply custom scan_depth', () => {
        const lorebook = new Lorebook({ scan_depth: 4 });
        expect(lorebook.scan_depth).toBe(4);
    });

    it('should apply custom token_budget', () => {
        const lorebook = new Lorebook({ token_budget: 2000 });
        expect(lorebook.token_budget).toBe(2000);
    });

    it('should apply custom recursive_scanning', () => {
        const lorebook = new Lorebook({ recursive_scanning: true });
        expect(lorebook.recursive_scanning).toBe(true);
    });

    it('should handle partial data', () => {
        const data = {
            name: 'Custom Lorebook',
        };
        const lorebook = new Lorebook(data);
        expect(lorebook.name).toBe('Custom Lorebook');
        expect(lorebook.description).toBe('');
        expect(lorebook.entries).toEqual([]);
        expect(lorebook.scan_depth).toBe(2);
    });
});
