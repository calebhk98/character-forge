/**
 * @file Abstract port for diagnostic logging. Adapters in
 * src/infrastructure/logging/.
 */

/**
 * Abstract logger. Subclass and implement log methods.
 *
 * @abstract
 */
export class ILogger {
    /**
     * Log a debug message.
     *
     * @param {string} _message - debug message
     * @param {*} [_data] - optional data to log
     * @returns {void}
     */
    debug(_message, _data) {
        throw new Error('ILogger.debug must be implemented by subclass');
    }

    /**
     * Log an info message.
     *
     * @param {string} _message - info message
     * @param {*} [_data] - optional data to log
     * @returns {void}
     */
    info(_message, _data) {
        throw new Error('ILogger.info must be implemented by subclass');
    }

    /**
     * Log a warning message.
     *
     * @param {string} _message - warning message
     * @param {*} [_data] - optional data to log
     * @returns {void}
     */
    warn(_message, _data) {
        throw new Error('ILogger.warn must be implemented by subclass');
    }

    /**
     * Log an error message.
     *
     * @param {string} _message - error message
     * @param {*} [_data] - optional data to log
     * @returns {void}
     */
    error(_message, _data) {
        throw new Error('ILogger.error must be implemented by subclass');
    }
}
