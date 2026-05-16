/**
 * @file Config store adapter that reads/writes to SillyTavern's
 * extension_settings[moduleName] bucket.
 */

import { IConfigStore } from '../../application/ports/IConfigStore.js';

/**
 * Config store using SillyTavern's extension settings.
 *
 * @augments IConfigStore
 */
export class ExtensionSettingsConfigStore extends IConfigStore {
    /**
     * Construct with module name and SillyTavern context.
     *
     * @param {string} moduleName extension module name
     * @param {object} stContext result of getContext()
     */
    constructor(moduleName, stContext) {
        super();
        this.moduleName = moduleName;
        this.ctx = stContext;
    }

    /**
     * Resolve the live ST context, re-fetching if the stored one is stale.
     *
     * @returns {object|null} SillyTavern context or null
     */
    resolveContext() {
        return this.ctx ?? globalThis.SillyTavern?.getContext?.() ?? null;
    }

    /**
     * Get a config value.
     *
     * @param {string} key - configuration key
     * @param {*} [defaultValue] - default value if key not found
     * @returns {*} configuration value
     */
    get(key, defaultValue) {
        const ctx = this.resolveContext();
        const moduleSettings = ctx?.extensionSettings?.[this.moduleName];
        if (!moduleSettings) {
            return defaultValue;
        }
        const value = moduleSettings[key];
        return value !== undefined ? value : defaultValue;
    }

    /**
     * Set a config value.
     *
     * @param {string} key - configuration key
     * @param {*} value - configuration value to set
     * @returns {Promise<void>}
     */
    async set(key, value) {
        const ctx = this.resolveContext();
        // ST exposes extension settings as extensionSettings on the context object.
        // The globalThis fallback is kept as a safety net but is never populated by ST.
        const extSettings = ctx?.extensionSettings ?? globalThis.extension_settings;
        if (!extSettings) {
            throw new Error('SillyTavern context not available');
        }
        if (!extSettings[this.moduleName]) {
            extSettings[this.moduleName] = {};
        }
        extSettings[this.moduleName][key] = value;
        const saveSettingsDebounced =
            ctx?.saveSettingsDebounced ?? globalThis.saveSettingsDebounced;
        await saveSettingsDebounced?.();
    }
}
