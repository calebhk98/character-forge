/**
 * @file Tests for SettingsPanel UI component.
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

describe('SettingsPanel', () => {
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

    describe('render()', () => {
        it('should render all settings fields', () => {
            panel.render(mockElement);
            expect(mockElement.querySelector('#settings-panel')).toBeDefined();
            expect(mockElement.querySelector('#prompt-template-select')).toBeDefined();
            expect(mockElement.querySelector('#lorebook-entry-count-input')).toBeDefined();
            expect(mockElement.querySelector('#generation-temperature-slider')).toBeDefined();
            expect(mockElement.querySelector('#auto-save-checkbox')).toBeDefined();
            expect(mockElement.querySelector('#custom-system-prompt-textarea')).toBeDefined();
        });

        it('should load default setting values on render', () => {
            panel.render(mockElement);
            const select = /** @type {HTMLSelectElement} */ (
                mockElement.querySelector('#prompt-template-select')
            );
            expect(select.value).toBe('default');
        });
    });

    describe('saving settings', () => {
        it('should save promptTemplate on change', async () => {
            let saved = {};
            mockContainer.configStore.set = async (key, value) => {
                saved = { key, value };
            };

            panel.render(mockElement);
            const select = /** @type {HTMLSelectElement} */ (
                mockElement.querySelector('#prompt-template-select')
            );
            select.value = 'advanced';
            select.dispatchEvent(new Event('change'));

            await new Promise(resolve => setTimeout(resolve, 10));
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

            await new Promise(resolve => setTimeout(resolve, 10));
            expect(saved.key).toBe('generationTemperature');
            expect(parseFloat(saved.value)).toBeCloseTo(0.75);
        });

        it('should save autoSaveOnGenerate checkbox state', async () => {
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

            await new Promise(resolve => setTimeout(resolve, 10));
            expect(saved.key).toBe('autoSaveOnGenerate');
            expect(saved.value).toBe(true);
        });
    });
});
