/**
 * @file Config store adapter that reads/writes to SillyTavern's
 * extension_settings[moduleName] bucket.
 */

import { IConfigStore } from '../../application/ports/IConfigStore.js';

/**
 * Config store using SillyTavern's extension settings.
 * @extends IConfigStore
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
     * @param {string} key
     * @param {*} [defaultValue]
     * @returns {*}
     */
    get(key, defaultValue) {
        // TODO: implement - return from ST extension_settings
        throw new Error('ExtensionSettingsConfigStore.get not implemented');
    }

    /**
     * Set a config value.
     *
     * @param {string} key
     * @param {*} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        // TODO: implement - write to ST extension_settings
        throw new Error('ExtensionSettingsConfigStore.set not implemented');
    }
}
