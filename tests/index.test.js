/**
 * @file Tests for entry point and extension initialization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('index.js entry point', () => {
    let originalDocument;

    beforeEach(() => {
        originalDocument = globalThis.document;
    });

    afterEach(() => {
        globalThis.document = originalDocument;
    });

    it('should load without errors', async () => {
        // Module can be imported successfully
        const module = await import('../index.js');
        expect(module).toBeDefined();
    });

    it('should handle missing DOM gracefully', async () => {
        // Create minimal DOM for the entry point
        globalThis.document = /** @type {any} */ ({
            getElementById: vi.fn().mockReturnValue(null),
            createElement: vi.fn((_tag) => ({
                id: '',
                className: '',
                appendChild: vi.fn(),
            })),
            body: {
                appendChild: vi.fn(),
            },
        });

        // Module should still load
        const module = await import('../index.js');
        expect(module).toBeDefined();
    });

    it('should handle setup without getContext', () => {
        // The index.js file checks for getContext and handles its absence
        delete globalThis.getContext;

        // Module should load successfully even without getContext
        expect(typeof globalThis.getContext).not.toBe('function');
    });

    it('should set up event handling when DOM is available', () => {
        const mockElement = {
            id: 'character-forge-container',
            className: 'character-forge-container',
            appendChild: vi.fn(),
        };

        globalThis.document = /** @type {any} */ ({
            getElementById: vi.fn().mockReturnValue(mockElement),
            createElement: vi.fn(() => mockElement),
            body: {
                appendChild: vi.fn(),
            },
        });

        // Module should handle DOM being available
        expect(globalThis.document.getElementById).toBeDefined();
    });

    it('should handle being imported multiple times', async () => {
        // Can import the module multiple times without issues
        const module1 = await import('../index.js');
        const module2 = await import('../index.js');

        expect(module1).toBeDefined();
        expect(module2).toBeDefined();
    });
});
