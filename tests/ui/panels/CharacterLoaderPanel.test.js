/**
 * @file Tests for CharacterLoaderPanel UI component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterLoaderPanel } from '../../../src/ui/panels/CharacterLoaderPanel.js';

/**
 * Create a mock container with required services.
 *
 * @param {object} [overrides] - service overrides
 * @returns {object} mock container
 */
function mockContainer(overrides = {}) {
    return {
        charRepository: { list: vi.fn().mockResolvedValue([]) },
        loadCharacterForEditing: {
            execute: vi.fn().mockResolvedValue({ character: { name: 'Aria' }, lorebook: null }),
        },
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
        notifier: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
        ...overrides,
    };
}

/**
 * Create a mock generator panel.
 *
 * @returns {object} mock generator panel
 */
function mockGeneratorPanel() {
    return { loadCharacterDraft: vi.fn() };
}

/**
 * Build a panel element with the required .controls-section child and append to body.
 *
 * @returns {HTMLElement} panel root element
 */
function buildPanelElement() {
    const el = document.createElement('div');
    const cs = document.createElement('div');
    cs.className = 'controls-section';
    el.appendChild(cs);
    document.body.appendChild(el);
    return el;
}

/**
 * Attach the panel and return the injected loader div.
 *
 * @param {CharacterLoaderPanel} panel - panel instance
 * @param {HTMLElement} panelElement - root element
 * @returns {HTMLElement} injected loader section
 */
function attachAndGetLoaderDiv(panel, panelElement) {
    panel.attach();
    return /** @type {HTMLElement} */ (panelElement.querySelector('.loader-section'));
}

afterEach(() => { document.body.innerHTML = ''; });

describe('CharacterLoaderPanel - attach()', () => {
    let panelElement;
    let panel;

    beforeEach(() => {
        panelElement = buildPanelElement();
        panel = new CharacterLoaderPanel(panelElement, mockContainer(), mockGeneratorPanel());
    });

    it('injects a loader section after the controls section', () => {
        panel.attach();
        expect(panelElement.querySelector('.loader-section')).not.toBeNull();
    });

    it('does nothing when controls-section is absent', () => {
        const bareEl = document.createElement('div');
        new CharacterLoaderPanel(bareEl, mockContainer(), mockGeneratorPanel()).attach();
        expect(bareEl.querySelector('.loader-section')).toBeNull();
    });

    it('renders the load button initially disabled', () => {
        panel.attach();
        const btn = /** @type {HTMLButtonElement} */ (panelElement.querySelector('#load-character-btn'));
        expect(btn.disabled).toBe(true);
    });

    it('renders the content area hidden initially', () => {
        panel.attach();
        const content = /** @type {HTMLElement} */ (panelElement.querySelector('#load-existing-content'));
        expect(content.style.display).toBe('none');
    });
});

describe('CharacterLoaderPanel - toggleOpen()', () => {
    let panelElement;
    let panel;
    let loaderDiv;

    beforeEach(() => {
        panelElement = buildPanelElement();
        panel = new CharacterLoaderPanel(panelElement, mockContainer(), mockGeneratorPanel());
        loaderDiv = attachAndGetLoaderDiv(panel, panelElement);
    });

    it('starts with isOpen false', () => {
        expect(panel.isOpen).toBe(false);
    });

    it('sets isOpen to true on first call and shows content', () => {
        panel.toggleOpen(loaderDiv);
        expect(panel.isOpen).toBe(true);
        const content = /** @type {HTMLElement} */ (loaderDiv.querySelector('#load-existing-content'));
        expect(content.style.display).toBe('block');
    });

    it('hides content when closing after open', () => {
        panel.toggleOpen(loaderDiv);
        panel.toggleOpen(loaderDiv);
        const content = /** @type {HTMLElement} */ (loaderDiv.querySelector('#load-existing-content'));
        expect(content.style.display).toBe('none');
    });

    it('updates toggle button text to ▲ when open and ▼ when closed', () => {
        panel.toggleOpen(loaderDiv);
        expect(loaderDiv.querySelector('#load-existing-toggle').textContent).toContain('▲');
        panel.toggleOpen(loaderDiv);
        expect(loaderDiv.querySelector('#load-existing-toggle').textContent).toContain('▼');
    });

    it('toggle button click opens and closes the panel', () => {
        const toggleBtn = panelElement.querySelector('#load-existing-toggle');
        toggleBtn.click();
        expect(panel.isOpen).toBe(true);
        toggleBtn.click();
        expect(panel.isOpen).toBe(false);
    });
});

describe('CharacterLoaderPanel - refreshCharacterList() happy path', () => {
    let panelElement;
    let container;
    let loaderDiv;
    let panel;

    beforeEach(() => {
        container = mockContainer();
        panelElement = buildPanelElement();
        panel = new CharacterLoaderPanel(panelElement, container, mockGeneratorPanel());
        loaderDiv = attachAndGetLoaderDiv(panel, panelElement);
    });

    it('calls charRepository.list()', async () => {
        await panel.refreshCharacterList(loaderDiv);
        expect(container.charRepository.list).toHaveBeenCalled();
    });

    it('populates the select with returned characters', async () => {
        container.charRepository.list.mockResolvedValue([
            { name: 'Aria', avatarUrl: 'aria.png' },
            { name: 'Zara', avatarUrl: 'zara.png' },
        ]);
        await panel.refreshCharacterList(loaderDiv);

        const options = loaderDiv.querySelector('#character-select').querySelectorAll('option');
        expect(options).toHaveLength(3); // placeholder + 2 characters
        expect(options[1].textContent).toBe('Aria');
        expect(options[1].value).toBe('aria.png');
    });

    it('shows a no-characters message when list is empty', async () => {
        await panel.refreshCharacterList(loaderDiv);
        expect(loaderDiv.querySelector('#character-select').innerHTML).toContain('no characters found');
    });

    it('sets success status with count and resets load button after loading', async () => {
        container.charRepository.list.mockResolvedValue([{ name: 'Aria', avatarUrl: 'aria.png' }]);
        const loadBtn = /** @type {HTMLButtonElement} */ (loaderDiv.querySelector('#load-character-btn'));
        loadBtn.disabled = false;

        await panel.refreshCharacterList(loaderDiv);

        const status = loaderDiv.querySelector('#loader-status');
        expect(status.textContent).toContain('1');
        expect(status.className).toContain('status-success');
        expect(loadBtn.disabled).toBe(true);
    });

    it('escapes HTML in character names to prevent XSS', async () => {
        container.charRepository.list.mockResolvedValue([
            { name: '<script>alert(1)</script>', avatarUrl: 'evil.png' },
        ]);
        await panel.refreshCharacterList(loaderDiv);
        expect(loaderDiv.querySelector('#character-select').innerHTML).not.toContain('<script>');
    });

    it('escapes quotes in avatarUrl attribute', async () => {
        container.charRepository.list.mockResolvedValue([
            { name: 'Aria', avatarUrl: 'aria"test.png' },
        ]);
        await panel.refreshCharacterList(loaderDiv);
        const html = loaderDiv.querySelector('#character-select').innerHTML;
        expect(html).not.toContain('"test.png"');
        expect(html).toContain('&quot;');
    });
});

describe('CharacterLoaderPanel - refreshCharacterList() errors and events', () => {
    let panelElement;
    let container;
    let loaderDiv;
    let panel;

    beforeEach(() => {
        container = mockContainer();
        panelElement = buildPanelElement();
        panel = new CharacterLoaderPanel(panelElement, container, mockGeneratorPanel());
        loaderDiv = attachAndGetLoaderDiv(panel, panelElement);
    });

    it('shows error status and logs when list call rejects', async () => {
        container.charRepository.list.mockRejectedValue(new Error('network failure'));
        await panel.refreshCharacterList(loaderDiv);

        const status = loaderDiv.querySelector('#loader-status');
        expect(status.textContent).toContain('network failure');
        expect(status.className).toContain('status-error');
        expect(container.logger.error).toHaveBeenCalled();
    });

    it('refresh button click triggers a list call', async () => {
        panelElement.querySelector('#refresh-characters-btn').click();
        await vi.waitFor(() => expect(container.charRepository.list).toHaveBeenCalled());
    });
});

describe('CharacterLoaderPanel - character select change', () => {
    let loaderDiv;
    let panel;

    beforeEach(() => {
        const panelElement = buildPanelElement();
        panel = new CharacterLoaderPanel(panelElement, mockContainer(), mockGeneratorPanel());
        loaderDiv = attachAndGetLoaderDiv(panel, panelElement);
    });

    it('enables load button when a non-empty value is selected', () => {
        const select = /** @type {HTMLSelectElement} */ (loaderDiv.querySelector('#character-select'));
        const opt = document.createElement('option');
        opt.value = 'aria.png';
        select.appendChild(opt);
        select.value = 'aria.png';
        select.dispatchEvent(new Event('change'));
        expect(/** @type {HTMLButtonElement} */ (loaderDiv.querySelector('#load-character-btn')).disabled).toBe(false);
    });

    it('disables load button when placeholder (empty) value is selected', () => {
        const select = /** @type {HTMLSelectElement} */ (loaderDiv.querySelector('#character-select'));
        const loadBtn = /** @type {HTMLButtonElement} */ (loaderDiv.querySelector('#load-character-btn'));
        loadBtn.disabled = false;
        select.value = '';
        select.dispatchEvent(new Event('change'));
        expect(loadBtn.disabled).toBe(true);
    });
});

describe('CharacterLoaderPanel - onLoadClick() success and guards', () => {
    let panelElement;
    let container;
    let generatorPanel;
    let panel;
    let loaderDiv;

    beforeEach(() => {
        container = mockContainer();
        generatorPanel = mockGeneratorPanel();
        panelElement = buildPanelElement();
        panel = new CharacterLoaderPanel(panelElement, container, generatorPanel);
        loaderDiv = attachAndGetLoaderDiv(panel, panelElement);
    });

    /**
     * Select a character in the dropdown so that onLoadClick will proceed.
     *
     * @param {string} [avatarUrl] - avatar URL to select
     */
    function selectCharacter(avatarUrl = 'aria.png') {
        const select = /** @type {HTMLSelectElement} */ (loaderDiv.querySelector('#character-select'));
        const opt = document.createElement('option');
        opt.value = avatarUrl;
        select.appendChild(opt);
        select.value = avatarUrl;
    }

    it('does nothing when no character is selected', async () => {
        await panel.onLoadClick(loaderDiv);
        expect(container.loadCharacterForEditing.execute).not.toHaveBeenCalled();
    });

    it('calls loadCharacterForEditing.execute with the selected avatarUrl', async () => {
        selectCharacter('aria.png');
        await panel.onLoadClick(loaderDiv);
        expect(container.loadCharacterForEditing.execute).toHaveBeenCalledWith('aria.png');
    });

    it('calls generatorPanel.loadCharacterDraft with the returned draft', async () => {
        const draft = { character: { name: 'Aria' }, lorebook: null };
        container.loadCharacterForEditing.execute.mockResolvedValue(draft);
        selectCharacter('aria.png');
        await panel.onLoadClick(loaderDiv);
        expect(generatorPanel.loadCharacterDraft).toHaveBeenCalledWith(draft);
    });

    it('does not execute a second load while one is in progress', async () => {
        selectCharacter('aria.png');
        /** @type {(value: any) => void} */
        let resolveFirst;
        container.loadCharacterForEditing.execute.mockReturnValue(
            new Promise((r) => { resolveFirst = r; }),
        );
        const first = panel.onLoadClick(loaderDiv);
        await panel.onLoadClick(loaderDiv);
        expect(container.loadCharacterForEditing.execute).toHaveBeenCalledTimes(1);
        resolveFirst({ character: { name: 'Aria' }, lorebook: null });
        await first;
    });

    it('resets isLoading to false after a successful load', async () => {
        selectCharacter('aria.png');
        await panel.onLoadClick(loaderDiv);
        expect(panel.isLoading).toBe(false);
    });

    it('load button click triggers onLoadClick', async () => {
        selectCharacter('aria.png');
        const loadBtn = panelElement.querySelector('#load-character-btn');
        loadBtn.disabled = false;
        loadBtn.click();
        await vi.waitFor(() => expect(container.loadCharacterForEditing.execute).toHaveBeenCalled());
    });
});

describe('CharacterLoaderPanel - onLoadClick() failure handling', () => {
    let panelElement;
    let container;
    let panel;
    let loaderDiv;

    beforeEach(() => {
        container = mockContainer();
        container.loadCharacterForEditing.execute = vi.fn().mockRejectedValue(new Error('bad file'));
        panelElement = buildPanelElement();
        panel = new CharacterLoaderPanel(panelElement, container, mockGeneratorPanel());
        loaderDiv = attachAndGetLoaderDiv(panel, panelElement);
    });

    /**
     * Select a character in the dropdown.
     */
    function selectCharacter() {
        const select = /** @type {HTMLSelectElement} */ (loaderDiv.querySelector('#character-select'));
        const opt = document.createElement('option');
        opt.value = 'aria.png';
        select.appendChild(opt);
        select.value = 'aria.png';
    }

    it('resets isLoading to false after a failed load', async () => {
        selectCharacter();
        await panel.onLoadClick(loaderDiv);
        expect(panel.isLoading).toBe(false);
    });

    it('shows error status, notifies, and logs on load failure', async () => {
        selectCharacter();
        await panel.onLoadClick(loaderDiv);
        const status = loaderDiv.querySelector('#loader-status');
        expect(status.textContent).toContain('bad file');
        expect(status.className).toContain('status-error');
        expect(container.notifier.error).toHaveBeenCalled();
        expect(container.logger.error).toHaveBeenCalled();
    });

    it('re-enables load button after a failed load', async () => {
        selectCharacter();
        const loadBtn = /** @type {HTMLButtonElement} */ (loaderDiv.querySelector('#load-character-btn'));
        await panel.onLoadClick(loaderDiv);
        expect(loadBtn.disabled).toBe(false);
    });
});

describe('CharacterLoaderPanel - setLoaderStatus()', () => {
    let panel;

    beforeEach(() => {
        panel = new CharacterLoaderPanel(document.createElement('div'), mockContainer(), mockGeneratorPanel());
    });

    it('sets text content and className using the type', () => {
        const el = document.createElement('div');
        panel.setLoaderStatus(el, 'All good', 'success');
        expect(el.textContent).toBe('All good');
        expect(el.className).toBe('loader-status status-success');
    });

    it('does nothing when statusEl is null', () => {
        expect(() => panel.setLoaderStatus(null, 'message', 'info')).not.toThrow();
    });
});

describe('CharacterLoaderPanel - escape helpers', () => {
    let panel;

    beforeEach(() => {
        panel = new CharacterLoaderPanel(document.createElement('div'), mockContainer(), mockGeneratorPanel());
    });

    it('escapeHtml: escapes angle brackets and ampersands', () => {
        expect(panel.escapeHtml('<script>')).toBe('&lt;script&gt;');
        expect(panel.escapeHtml('a & b')).toBe('a &amp; b');
        expect(panel.escapeHtml('plain')).toBe('plain');
    });

    it('escapeAttr: escapes double and single quotes', () => {
        expect(panel.escapeAttr('foo"bar')).toBe('foo&quot;bar');
        expect(panel.escapeAttr("foo'bar")).toBe('foo&#39;bar');
        expect(panel.escapeAttr('aria.png')).toBe('aria.png');
    });
});
