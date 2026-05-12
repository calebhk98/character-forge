/**
 * @file Notifier adapter that shows user-facing messages via Toastr
 * (SillyTavern's notification library).
 */

import { INotifier } from '../../application/ports/INotifier.js';

/**
 * Notifier that uses SillyTavern's Toastr notifications.
 * @extends INotifier
 */
export class ToastrNotifier extends INotifier {
    /**
     * Construct the notifier.
     *
     * @param {object} stContext result of getContext()
     */
    constructor(stContext) {
        super();
        this.ctx = stContext;
    }

    /**
     * Show an info notification.
     *
     * @param {string} message
     */
    info(message) {
        // TODO: implement - call window.toastr.info or similar
        throw new Error('ToastrNotifier.info not implemented');
    }

    /**
     * Show a success notification.
     *
     * @param {string} message
     */
    success(message) {
        // TODO: implement - call window.toastr.success or similar
        throw new Error('ToastrNotifier.success not implemented');
    }

    /**
     * Show a warning notification.
     *
     * @param {string} message
     */
    warning(message) {
        // TODO: implement - call window.toastr.warning or similar
        throw new Error('ToastrNotifier.warning not implemented');
    }

    /**
     * Show an error notification.
     *
     * @param {string} message
     */
    error(message) {
        // TODO: implement - call window.toastr.error or similar
        throw new Error('ToastrNotifier.error not implemented');
    }
}
