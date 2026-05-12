/**
 * @file Abstract port for diagnostic logging. Adapters in
 * src/infrastructure/logging/.
 */

/**
 * Abstract logger. Subclass and implement log methods.
 * @abstract
 */
export class ILogger {
    /**
     * Log a debug message.
     *
     * @param {string} message
     * @param {*} [data]
     * @returns {void}
     */
    debug(message, data) {
        throw new Error('ILogger.debug must be implemented by subclass');
    }

    /**
     * Log an info message.
     *
     * @param {string} message
     * @param {*} [data]
     * @returns {void}
     */
    info(message, data) {
        throw new Error('ILogger.info must be implemented by subclass');
    }

    /**
     * Log a warning message.
     *
     * @param {string} message
     * @param {*} [data]
     * @returns {void}
     */
    warn(message, data) {
        throw new Error('ILogger.warn must be implemented by subclass');
    }

    /**
     * Log an error message.
     *
     * @param {string} message
     * @param {*} [data]
     * @returns {void}
     */
    error(message, data) {
        throw new Error('ILogger.error must be implemented by subclass');
    }
}
