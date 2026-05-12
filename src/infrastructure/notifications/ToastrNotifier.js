/**
 * @file Notifier adapter that shows user-facing messages via Toastr
 * (SillyTavern's notification library).
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
     * @param _message
     */
    info(_message) {
        // TODO: implement - call window.toastr.info or similar
        throw new Error('ToastrNotifier.info not implemented');
    }

    /**
     * Show a success notification.
     *
     * @param {string} message
     * @param _message
     */
    success(_message) {
        // TODO: implement - call window.toastr.success or similar
        throw new Error('ToastrNotifier.success not implemented');
    }

    /**
     * Show a warning notification.
     *
     * @param {string} message
     * @param _message
     */
    warning(_message) {
        // TODO: implement - call window.toastr.warning or similar
        throw new Error('ToastrNotifier.warning not implemented');
    }

    /**
     * Show an error notification.
     *
     * @param {string} message
     * @param _message
     */
    error(_message) {
        // TODO: implement - call window.toastr.error or similar
        throw new Error('ToastrNotifier.error not implemented');
    }
}
