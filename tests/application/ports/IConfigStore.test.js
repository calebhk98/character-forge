/**
 * @file Tests for IConfigStore port contract.
 */

import { describe, it, expect } from 'vitest';
import { IConfigStore } from '../../../src/application/ports/IConfigStore.js';

describe('IConfigStore (port)', () => {
    it('should throw on base class get()', () => {
        const store = new IConfigStore();
        expect(() => store.get('key')).toThrow('IConfigStore.get must be implemented by subclass');
    });

    it('should throw on base class get() with default value', () => {
        const store = new IConfigStore();
        expect(() => store.get('key', 'default')).toThrow('IConfigStore.get must be implemented by subclass');
    });

    it('should throw on base class set()', async () => {
        const store = new IConfigStore();
        await expect(store.set('key', 'value')).rejects.toThrow('IConfigStore.set must be implemented by subclass');
    });
});
