/**
 * @file Abstract port for user-facing notifications. Shows toasts,
 * alerts, etc. Adapters in src/infrastructure/notifications/.
 */

/**
 * Abstract notifier. Subclass and implement notify methods.
 *
 * @abstract
 */
export class INotifier {
    /**
     * Show an info notification to the user.
     *
     * @param {string} _message - notification text
     * @returns {void}
     */
    info(_message) {
        throw new Error('INotifier.info must be implemented by subclass');
    }

    /**
     * Show a success notification to the user.
     *
     * @param {string} _message - notification text
     * @returns {void}
     */
    success(_message) {
        throw new Error('INotifier.success must be implemented by subclass');
    }

    /**
     * Show a warning notification to the user.
     *
     * @param {string} _message - notification text
     * @returns {void}
     */
    warning(_message) {
        throw new Error('INotifier.warning must be implemented by subclass');
    }

    /**
     * Show an error notification to the user.
     *
     * @param {string} _message - notification text
     * @returns {void}
     */
    error(_message) {
        throw new Error('INotifier.error must be implemented by subclass');
    }
}
