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
     * Get a config value.
     *
     * @param {string} key - configuration key
     * @param {*} [defaultValue] - default value if key not found
     * @returns {*} configuration value
     */
    get(key, defaultValue) {
        const moduleSettings = this.ctx?.extension_settings?.[this.moduleName];
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
        if (!this.ctx?.extension_settings) {
            throw new Error('SillyTavern context not available');
        }
        if (!this.ctx.extension_settings[this.moduleName]) {
            this.ctx.extension_settings[this.moduleName] = {};
        }
        this.ctx.extension_settings[this.moduleName][key] = value;
        await this.ctx.saveSettingsDebounced?.();
    }
}
