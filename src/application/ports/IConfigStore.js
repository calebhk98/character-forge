/**
 * @file Abstract port for configuration storage. Reads and writes
 * extension settings. Adapters in src/infrastructure/config/.
 */

/**
 * Abstract config store. Subclass and implement get() and set().
 * @abstract
 */
export class IConfigStore {
    /**
     * Get a config value by key.
     *
     * @param {string} key
     * @param {*} [defaultValue]
     * @returns {*}
     */
    get(key, defaultValue) {
        throw new Error('IConfigStore.get must be implemented by subclass');
    }

    /**
     * Set a config value by key.
     *
     * @param {string} key
     * @param {*} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        throw new Error('IConfigStore.set must be implemented by subclass');
    }
}
