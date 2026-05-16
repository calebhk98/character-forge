/**
 * @file Abstract port for card spec validation. Validates a formatted card JSON
 * object against its spec schema. Adapters in src/infrastructure/validators/.
 */

/**
 * Abstract card validator. Subclass and implement validate().
 *
 * @abstract
 */
export class ICardValidator {
    /**
     * Validate a formatted card JSON object against its spec.
     * Throws a descriptive error listing all violations if invalid.
     *
     * @param {object} _cardJson - formatted card JSON to validate
     * @returns {void}
     */
    validate(_cardJson) {
        throw new Error('ICardValidator.validate must be implemented by subclass');
    }
}
