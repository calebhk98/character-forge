/**
 * @file Event listener tests for SettingsPanel UI component.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingsPanel } from '../../../src/ui/panels/SettingsPanel.js';

/**
 * Create a mock config store with default values.
 *
 * @returns {object} mock config store
 */
function createMockConfigStore() {
    const defaults = {
        promptTemplate: 'default',
        lorebookEntryCount: 'auto',
        generationTemperature: 0.85,
        autoSaveOnGenerate: false,
        customSystemPromptOverride: '',
    };
    return {
        get: (key, defaultValue) => defaults[key] ?? defaultValue,
        set: async () => {},
    };
}

/**
 * Create a mock container with config store and notifier.
 *
 * @returns {object} mock container
 */
function createMockContainer() {
    return {
        configStore: createMockConfigStore(),
        notifier: {
            success: () => {},
            error: () => {},
        },
    };
}

describe('SettingsPanel - Select/Slider Changes', () => {
    let panel;
    let mockContainer;
    let mockElement;

    beforeEach(() => {
        mockContainer = createMockContainer();
        mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
        panel = new SettingsPanel(mockContainer);
    });

    afterEach(() => {
        if (mockElement.parentNode) {
            mockElement.parentNode.removeChild(mockElement);
        }
    });

    it('should save promptTemplate on change', async () => {
        let saved = {};
        mockContainer.configStore.set = async (key, value) => {
            saved = { key, value };
            return Promise.resolve();
        };

        panel.render(mockElement);
        const select = /** @type {HTMLSelectElement} */ (
            mockElement.querySelector('#prompt-template-select')
        );
        select.value = 'advanced';
        select.dispatchEvent(new Event('change'));

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(saved.key).toBe('promptTemplate');
        expect(saved.value).toBe('advanced');
    });

    it('should save generationTemperature on slider change', async () => {
        let saved = {};
        mockContainer.configStore.set = async (key, value) => {
            saved = { key, value };
        };

        panel.render(mockElement);
        const slider = /** @type {HTMLInputElement} */ (
            mockElement.querySelector('#generation-temperature-slider')
        );
        slider.value = '0.75';
        slider.dispatchEvent(new Event('change'));

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(saved.key).toBe('generationTemperature');
        expect(parseFloat(saved.value)).toBeCloseTo(0.75);
    });
});

describe('SettingsPanel - Checkbox/Input Changes', () => {
    let panel;
    let mockContainer;
    let mockElement;

    beforeEach(() => {
        mockContainer = createMockContainer();
        mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
        panel = new SettingsPanel(mockContainer);
    });

    afterEach(() => {
        if (mockElement.parentNode) {
            mockElement.parentNode.removeChild(mockElement);
        }
    });

    it('should save autoSaveOnGenerate on checkbox change', async () => {
        let saved = {};
        mockContainer.configStore.set = async (key, value) => {
            saved = { key, value };
        };

        panel.render(mockElement);
        const checkbox = /** @type {HTMLInputElement} */ (
            mockElement.querySelector('#auto-save-checkbox')
        );
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(saved.key).toBe('autoSaveOnGenerate');
        expect(saved.value).toBe(true);
    });

    it('should save lorebookEntryCount on select change', async () => {
        let saved = {};
        mockContainer.configStore.set = async (key, value) => {
            saved = { key, value };
        };

        panel.render(mockElement);
        const input = /** @type {HTMLSelectElement} */ (
            mockElement.querySelector('#lorebook-entry-count-select')
        );
        input.value = '15';
        input.dispatchEvent(new Event('change'));

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(saved.key).toBe('lorebookEntryCount');
        expect(saved.value).toBe('15');
    });

    it('should save customSystemPromptOverride on textarea change', async () => {
        let saved = {};
        mockContainer.configStore.set = async (key, value) => {
            saved = { key, value };
        };

        panel.render(mockElement);
        const textarea = /** @type {HTMLTextAreaElement} */ (
            mockElement.querySelector('#custom-system-prompt-textarea')
        );
        textarea.value = 'Custom prompt text';
        textarea.dispatchEvent(new Event('change'));

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(saved.key).toBe('customSystemPromptOverride');
        expect(saved.value).toBe('Custom prompt text');
    });
});

describe('SettingsPanel - Error Handling', () => {
    let panel;
    let mockContainer;
    let mockElement;

    beforeEach(() => {
        mockContainer = createMockContainer();
        mockElement = document.createElement('div');
        document.body.appendChild(mockElement);
        panel = new SettingsPanel(mockContainer);
    });

    afterEach(() => {
        if (mockElement.parentNode) {
            mockElement.parentNode.removeChild(mockElement);
        }
    });

    it('should handle missing configStore gracefully', async () => {
        const panelNoStore = new SettingsPanel({ configStore: null, notifier: {} });
        panelNoStore.render(mockElement);
        const select = /** @type {HTMLSelectElement} */ (
            mockElement.querySelector('#prompt-template-select')
        );
        select.value = 'advanced';
        select.dispatchEvent(new Event('change'));

        // Should not throw
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(select.value).toBe('advanced');
    });

    it('should handle config store errors gracefully', async () => {
        let errorCaught = false;
        mockContainer.configStore.set = async () => {
            throw new Error('Save failed');
        };
        mockContainer.notifier.error = () => {
            errorCaught = true;
        };

        panel.render(mockElement);
        const select = /** @type {HTMLSelectElement} */ (
            mockElement.querySelector('#prompt-template-select')
        );
        select.value = 'advanced';
        select.dispatchEvent(new Event('change'));

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(errorCaught).toBe(true);
    });
});
