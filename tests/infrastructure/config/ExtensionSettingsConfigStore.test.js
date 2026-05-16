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
            extensionSettings: {},
            saveSettingsDebounced: () => Promise.resolve(),
        };
        store = new ExtensionSettingsConfigStore('character-forge', mockContext);
    });

    describe('get()', () => {
        it('should return value if key exists', () => {
            mockContext.extensionSettings['character-forge'] = { promptTemplate: 'default' };
            const value = store.get('promptTemplate');
            expect(value).toBe('default');
        });

        it('should return default value if key does not exist', () => {
            mockContext.extensionSettings['character-forge'] = {};
            const value = store.get('promptTemplate', 'fallback');
            expect(value).toBe('fallback');
        });

        it('should return undefined if key does not exist and no default provided', () => {
            mockContext.extensionSettings['character-forge'] = {};
            const value = store.get('promptTemplate');
            expect(value).toBeUndefined();
        });

        it('should handle missing module settings object', () => {
            mockContext.extensionSettings = {};
            const value = store.get('promptTemplate', 'fallback');
            expect(value).toBe('fallback');
        });
    });

    describe('set()', () => {
        it('should set a value in extension_settings', async () => {
            mockContext.extensionSettings['character-forge'] = {};
            await store.set('promptTemplate', 'advanced');
            expect(mockContext.extensionSettings['character-forge'].promptTemplate).toBe('advanced');
        });

        it('should create module settings object if it does not exist', async () => {
            mockContext.extensionSettings = {};
            await store.set('promptTemplate', 'advanced');
            expect(mockContext.extensionSettings['character-forge'].promptTemplate).toBe('advanced');
        });

        it('should call saveSettingsDebounced after setting value', async () => {
            let saveSettingsDebouncedCalled = false;
            mockContext.saveSettingsDebounced = () => {
                saveSettingsDebouncedCalled = true;
                return Promise.resolve();
            };
            mockContext.extensionSettings['character-forge'] = {};

            await store.set('promptTemplate', 'advanced');
            expect(saveSettingsDebouncedCalled).toBe(true);
        });

        it('should handle numeric values', async () => {
            mockContext.extensionSettings['character-forge'] = {};
            await store.set('lorebookEntryCount', 5);
            expect(mockContext.extensionSettings['character-forge'].lorebookEntryCount).toBe(5);
        });

        it('should handle boolean values', async () => {
            mockContext.extensionSettings['character-forge'] = {};
            await store.set('autoSaveOnGenerate', true);
            expect(mockContext.extensionSettings['character-forge'].autoSaveOnGenerate).toBe(true);
        });

        it('should throw when context is not available', async () => {
            const storeNoContext = new ExtensionSettingsConfigStore('character-forge', null);
            await expect(storeNoContext.set('promptTemplate', 'advanced')).rejects.toThrow(
                'SillyTavern context not available',
            );
        });

        it('should throw when extension_settings is not available on context', async () => {
            const contextWithoutSettings = { saveSettingsDebounced: () => Promise.resolve() };
            const storeNoSettings = new ExtensionSettingsConfigStore('character-forge', contextWithoutSettings);
            await expect(storeNoSettings.set('promptTemplate', 'advanced')).rejects.toThrow(
                'SillyTavern context not available',
            );
        });
    });
});

describe('ExtensionSettingsConfigStore - real ST context shape (camelCase extensionSettings)', () => {
    it('should read from ctx.extensionSettings when ctx.extension_settings is absent', () => {
        // ST's st-context.js exposes extensionSettings (camelCase), not extension_settings
        const realShapedCtx = {
            extensionSettings: { 'character-forge': { promptTemplate: 'real' } },
            saveSettingsDebounced: () => Promise.resolve(),
        };
        const store = new ExtensionSettingsConfigStore('character-forge', realShapedCtx);
        expect(store.get('promptTemplate')).toBe('real');
    });

    it('should write to ctx.extensionSettings when ctx.extension_settings is absent', async () => {
        const realShapedCtx = {
            extensionSettings: {},
            saveSettingsDebounced: () => Promise.resolve(),
        };
        const store = new ExtensionSettingsConfigStore('character-forge', realShapedCtx);
        await store.set('promptTemplate', 'real');
        expect(realShapedCtx.extensionSettings['character-forge'].promptTemplate).toBe('real');
    });
});
