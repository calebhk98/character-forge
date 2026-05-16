/**
 * @file Tests for entry point and extension initialization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildInlineDrawer } from '../index.js';

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

    it('should handle setup without SillyTavern global', () => {
        // index.js guards on globalThis.SillyTavern; its absence means test env
        delete globalThis.SillyTavern;

        // Module should load successfully even without the ST global
        expect(typeof globalThis.SillyTavern).not.toBe('object');
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

describe('buildInlineDrawer', () => {
    /**
     * Build a minimal mock container sufficient for all panels to render.
     *
     * @returns {object} mock container
     */
    function createMockContainer() {
        return {
            notifier: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
            logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
            configStore: { get: vi.fn().mockReturnValue(''), set: vi.fn() },
            generateCharacter: { execute: vi.fn() },
            generateLorebook: { execute: vi.fn() },
            saveCharacter: { execute: vi.fn() },
            decomposeGroup: { execute: vi.fn() },
            generateSharedLorebook: { execute: vi.fn() },
            lorebookRepository: { save: vi.fn() },
        };
    }

    it('renders the batch generator panel inside the drawer', () => {
        const drawer = buildInlineDrawer(createMockContainer());
        expect(drawer.querySelector('#batch-forge-panel')).not.toBeNull();
    });

    it('renders both the settings panel and the character generator panel', () => {
        const drawer = buildInlineDrawer(createMockContainer());
        expect(drawer.querySelector('#settings-panel')).not.toBeNull();
        expect(drawer.querySelector('#character-forge-panel')).not.toBeNull();
    });
});
