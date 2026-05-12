/**
 * @file Abstract port for configuration storage. Reads and writes
 * extension settings. Adapters in src/infrastructure/config/.
 */

/**
 * Abstract config store. Subclass and implement get() and set().
 *
 * @abstract
 */
export class IConfigStore {
    /**
     * Get a config value by key.
     *
     * @param {string} _key - configuration key
     * @param {*} [_defaultValue] - default value if key not found
     * @returns {*} configuration value
     */
    get(_key, _defaultValue) {
        throw new Error('IConfigStore.get must be implemented by subclass');
    }

    /**
     * Set a config value by key.
     *
     * @param {string} _key - configuration key
     * @param {*} _value - configuration value to set
     * @returns {Promise<void>}
     */
    async set(_key, _value) {
        throw new Error('IConfigStore.set must be implemented by subclass');
    }
}
