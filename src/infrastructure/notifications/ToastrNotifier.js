/**
 * @file Notifier adapter that shows user-facing messages via Toastr
 * (SillyTavern's notification library).
 *
 * @typedef {object} Toastr
 * @property {(message: string) => void} info - show info notification
 * @property {(message: string) => void} success - show success notification
 * @property {(message: string) => void} warning - show warning notification
 * @property {(message: string) => void} error - show error notification
 */

import { INotifier } from '../../application/ports/INotifier.js';

/**
 * Notifier that uses SillyTavern's Toastr notifications.
 *
 * @augments INotifier
 */
export class ToastrNotifier extends INotifier {
    /**
     * Construct the notifier.
     *
     * @param {object} stContext - result of getContext()
     */
    constructor(stContext) {
        super();
        this.ctx = stContext;
    }

    /**
     * Show an info notification.
     *
     * @param {string} message - notification text
     * @returns {void}
     */
    info(message) {
        // @ts-ignore - window.toastr is provided by SillyTavern at runtime
        window.toastr.info(message);
    }

    /**
     * Show a success notification.
     *
     * @param {string} message - notification text
     * @returns {void}
     */
    success(message) {
        // @ts-ignore - window.toastr is provided by SillyTavern at runtime
        window.toastr.success(message);
    }

    /**
     * Show a warning notification.
     *
     * @param {string} message - notification text
     * @returns {void}
     */
    warning(message) {
        // @ts-ignore - window.toastr is provided by SillyTavern at runtime
        window.toastr.warning(message);
    }

    /**
     * Show an error notification.
     *
     * @param {string} message - notification text
     * @returns {void}
     */
    error(message) {
        // @ts-ignore - window.toastr is provided by SillyTavern at runtime
        window.toastr.error(message);
    }
}
