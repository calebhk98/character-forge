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
     * @param {string} _message - debug message text
     * @param {*} [_data] - optional context data to log
     * @returns {void}
     */
    debug(_message, _data) {
        // TODO: implement - console.debug with prefix
        throw new Error('ConsoleLogger.debug not implemented');
    }

    /**
     * Log an info message.
     *
     * @param {string} _message - info message text
     * @param {*} [_data] - optional context data to log
     * @returns {void}
     */
    info(_message, _data) {
        // TODO: implement - console.info with prefix
        throw new Error('ConsoleLogger.info not implemented');
    }

    /**
     * Log a warning message.
     *
     * @param {string} _message - warning message text
     * @param {*} [_data] - optional context data to log
     * @returns {void}
     */
    warn(_message, _data) {
        // TODO: implement - console.warn with prefix
        throw new Error('ConsoleLogger.warn not implemented');
    }

    /**
     * Log an error message.
     *
     * @param {string} _message - error message text
     * @param {*} [_data] - optional context data to log
     * @returns {void}
     */
    error(_message, _data) {
        // TODO: implement - console.error with prefix
        throw new Error('ConsoleLogger.error not implemented');
    }
}
