/**
 * @file Logger adapter that writes to the browser console.
 */

import { ILogger } from '../../application/ports/ILogger.js';

/**
 * Logger that outputs to console.
 *
 * @augments ILogger
 */
export class ConsoleLogger extends ILogger {
    /**
     * Construct the logger.
     *
     * @param {string} [prefix] - prefix for all log lines
     */
    constructor(prefix = 'CharacterForge') {
        super();
        this.prefix = prefix;
    }

    /**
     * Log a debug message.
     *
     * @param {string} message - debug message text
     * @param {*} [data] - optional context data to log
     * @returns {void}
     */
    debug(message, data) {
        console.debug(`[${this.prefix}] ${message}`, data);
    }

    /**
     * Log an info message.
     *
     * @param {string} message - info message text
     * @param {*} [data] - optional context data to log
     * @returns {void}
     */
    info(message, data) {
        console.info(`[${this.prefix}] ${message}`, data);
    }

    /**
     * Log a warning message.
     *
     * @param {string} message - warning message text
     * @param {*} [data] - optional context data to log
     * @returns {void}
     */
    warn(message, data) {
        console.warn(`[${this.prefix}] ${message}`, data);
    }

    /**
     * Log an error message.
     *
     * @param {string} message - error message text
     * @param {*} [data] - optional context data to log
     * @returns {void}
     */
    error(message, data) {
        console.error(`[${this.prefix}] ${message}`, data);
    }
}
