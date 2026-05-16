/**
 * @file Notifier adapter that shows user-facing messages via Toastr
 * (SillyTavern's notification library).
 *
 * @typedef {object} Toastr
 * @property {(message: string) => void} info - show info notification
 * @property {(message: string) => void} success - show success notification
 * @property {(message: string) => void} warning - show warning notification
 * @property {Function} error - show error notification
 */

import { INotifier } from '../../application/ports/INotifier.js';

/**
 * Notifier that uses SillyTavern's Toastr notifications.
 *
 * Error toasts are sticky (timeOut: 0) and deduplicated: repeated calls with
 * the same message text update the existing toast with a ×N counter rather
 * than stacking identical toasts.
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
        /** @type {Map<string, object>} active error toast elements keyed by message */
        this._errorToasts = new Map();
        /** @type {Map<string, number>} display counts for active error toasts */
        this._errorCounts = new Map();
    }

    /**
     * Show an info notification.
     *
     * @param {string} message - notification text
     * @returns {void}
     */
    info(message) {
        // @ts-ignore - window.toastr is provided by SillyTavern at runtime
        if (!window.toastr) { console.info('[Character Forge]', message); return; }
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
        if (!window.toastr) { console.info('[Character Forge]', message); return; }
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
        if (!window.toastr) { console.warn('[Character Forge]', message); return; }
        window.toastr.warning(message);
    }

    /**
     * Show a sticky error notification, deduplicating repeated messages.
     *
     * If a toast with the same text is already visible, its text is updated
     * to "message ×N" instead of opening another toast.
     *
     * @param {string} message - notification text
     * @returns {void}
     */
    error(message) {
        // @ts-ignore - window.toastr is provided by SillyTavern at runtime
        if (!window.toastr) { console.error('[Character Forge]', message); return; }
        const existing = this._errorToasts.get(message);
        if (existing) {
            const count = (this._errorCounts.get(message) ?? 1) + 1;
            this._errorCounts.set(message, count);
            // @ts-ignore - jQuery-like object returned by toastr
            existing.find('.toast-message').text(`${message} ×${count}`);
            return;
        }

        // @ts-ignore - window.toastr is provided by SillyTavern at runtime
        const toast = window.toastr.error(message, 'Character Forge', {
            timeOut: 0,
            extendedTimeOut: 0,
            closeButton: true,
            onHidden: () => {
                this._errorToasts.delete(message);
                this._errorCounts.delete(message);
            },
        });

        this._errorCounts.set(message, 1);
        if (toast) {
            this._errorToasts.set(message, toast);
        }
    }
}
