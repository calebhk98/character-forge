/**
 * @file Tests for ExtensionSettingsConfigStore adapter.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionSettingsConfigStore } from '../../../src/infrastructure/config/ExtensionSettingsConfigStore.js';

describe('ExtensionSettingsConfigStore', () => {
    let store;
    let mockContext;

    beforeEach(() => {
        mockContext = {
            extension_settings: {},
            saveSettings: () => Promise.resolve(),
        };
        store = new ExtensionSettingsConfigStore('character-forge', mockContext);
    });

    describe('get()', () => {
        it('should return value if key exists', () => {
            mockContext.extension_settings['character-forge'] = { promptTemplate: 'default' };
            const value = store.get('promptTemplate');
            expect(value).toBe('default');
        });

        it('should return default value if key does not exist', () => {
            mockContext.extension_settings['character-forge'] = {};
            const value = store.get('promptTemplate', 'fallback');
            expect(value).toBe('fallback');
        });

        it('should return undefined if key does not exist and no default provided', () => {
            mockContext.extension_settings['character-forge'] = {};
            const value = store.get('promptTemplate');
            expect(value).toBeUndefined();
        });

        it('should handle missing module settings object', () => {
            mockContext.extension_settings = {};
            const value = store.get('promptTemplate', 'fallback');
            expect(value).toBe('fallback');
        });
    });

    describe('set()', () => {
        it('should set a value in extension_settings', async () => {
            mockContext.extension_settings['character-forge'] = {};
            await store.set('promptTemplate', 'advanced');
            expect(mockContext.extension_settings['character-forge'].promptTemplate).toBe('advanced');
        });

        it('should create module settings object if it does not exist', async () => {
            mockContext.extension_settings = {};
            await store.set('promptTemplate', 'advanced');
            expect(mockContext.extension_settings['character-forge'].promptTemplate).toBe('advanced');
        });

        it('should call saveSettings after setting value', async () => {
            let saveSettingsCalled = false;
            mockContext.saveSettings = () => {
                saveSettingsCalled = true;
                return Promise.resolve();
            };
            mockContext.extension_settings['character-forge'] = {};

            await store.set('promptTemplate', 'advanced');
            expect(saveSettingsCalled).toBe(true);
        });

        it('should handle numeric values', async () => {
            mockContext.extension_settings['character-forge'] = {};
            await store.set('lorebookEntryCount', 5);
            expect(mockContext.extension_settings['character-forge'].lorebookEntryCount).toBe(5);
        });

        it('should handle boolean values', async () => {
            mockContext.extension_settings['character-forge'] = {};
            await store.set('autoSaveOnGenerate', true);
            expect(mockContext.extension_settings['character-forge'].autoSaveOnGenerate).toBe(true);
        });

        it('should throw when context is not available', async () => {
            const storeNoContext = new ExtensionSettingsConfigStore('character-forge', null);
            await expect(storeNoContext.set('promptTemplate', 'advanced')).rejects.toThrow(
                'SillyTavern context not available',
            );
        });

        it('should throw when extension_settings is not available on context', async () => {
            const contextWithoutSettings = { saveSettings: () => Promise.resolve() };
            const storeNoSettings = new ExtensionSettingsConfigStore('character-forge', contextWithoutSettings);
            await expect(storeNoSettings.set('promptTemplate', 'advanced')).rejects.toThrow(
                'SillyTavern context not available',
            );
        });
    });
});
