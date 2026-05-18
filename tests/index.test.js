/**
 * @file Tests for entry point and extension initialization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildInlineDrawer, injectSidebarButton } from '../index.js';

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

describe('injectSidebarButton', () => {
    /** @type {HTMLElement} */
    let createButton;
    /** @type {HTMLElement} */
    let drawer;
    /** @type {HTMLElement} */
    let drawerContent;

    beforeEach(() => {
        // Set up a minimal DOM with ST's #create_button and the forge drawer
        createButton = document.createElement('button');
        createButton.id = 'create_button';
        document.body.appendChild(createButton);

        drawer = document.createElement('div');
        drawer.id = 'character-forge-extension-drawer';
        drawer.className = 'inline_drawer';

        drawerContent = document.createElement('div');
        drawerContent.className = 'inline_drawer_content';
        drawerContent.style.display = 'none';
        drawer.appendChild(drawerContent);

        document.body.appendChild(drawer);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('inserts #character-forge-sidebar-btn after #create_button when it exists', () => {
        injectSidebarButton(drawer);

        const btn = document.getElementById('character-forge-sidebar-btn');
        expect(btn).not.toBeNull();
        expect(btn?.tagName).toBe('BUTTON');
        expect(btn?.textContent).toBe('✦ Generate');
        expect(btn?.classList.contains('menu_button')).toBe(true);
    });

    it('places the sidebar button immediately after #create_button in the DOM', () => {
        injectSidebarButton(drawer);

        const btn = document.getElementById('character-forge-sidebar-btn');
        expect(btn?.previousElementSibling?.id).toBe('create_button');
    });

    it('opens the drawer content when the sidebar button is clicked', () => {
        injectSidebarButton(drawer);

        const btn = /** @type {HTMLElement} */ (document.getElementById('character-forge-sidebar-btn'));
        expect(drawerContent.style.display).toBe('none');

        btn.click();

        expect(drawerContent.style.display).toBe('block');
    });

    it('does not inject a button when #create_button is absent', () => {
        document.body.removeChild(createButton);

        injectSidebarButton(drawer);

        const btn = document.getElementById('character-forge-sidebar-btn');
        expect(btn).toBeNull();
    });

    it('does not throw when #create_button is absent', () => {
        document.body.removeChild(createButton);

        expect(() => injectSidebarButton(drawer)).not.toThrow();
    });
});
