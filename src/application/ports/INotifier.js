/**
 * @file Abstract port for user-facing notifications. Shows toasts,
 * alerts, etc. Adapters in src/infrastructure/notifications/.
 */

/**
 * Abstract notifier. Subclass and implement notify methods.
 * @abstract
 */
export class INotifier {
    /**
     * Show an info notification to the user.
     *
     * @param {string} message
     * @returns {void}
     */
    info(message) {
        throw new Error('INotifier.info must be implemented by subclass');
    }

    /**
     * Show a success notification to the user.
     *
     * @param {string} message
     * @returns {void}
     */
    success(message) {
        throw new Error('INotifier.success must be implemented by subclass');
    }

    /**
     * Show a warning notification to the user.
     *
     * @param {string} message
     * @returns {void}
     */
    warning(message) {
        throw new Error('INotifier.warning must be implemented by subclass');
    }

    /**
     * Show an error notification to the user.
     *
     * @param {string} message
     * @returns {void}
     */
    error(message) {
        throw new Error('INotifier.error must be implemented by subclass');
    }
}
