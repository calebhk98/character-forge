/**
 * @file Use case: save a character and its lorebook to SillyTavern as a
 * saved character card.
 */

/**
 * Save a character to SillyTavern.
 */
export class SaveCharacterToTavern {
    /**
     * Construct the use case with its dependencies.
     *
     * @param {import('../ports/ICardFormatter.js').ICardFormatter} cardFormatter - port for formatting to V3 JSON
     * @param {import('../ports/ICharacterRepository.js').ICharacterRepository} characterRepository - port for persisting characters
     * @param {import('../ports/INotifier.js').INotifier} notifier - port for user-facing notifications
     * @param {import('../ports/ILogger.js').ILogger} logger - port for diagnostic logging
     */
    constructor(cardFormatter, characterRepository, notifier, logger) {
        this.cardFormatter = cardFormatter;
        this.characterRepository = characterRepository;
        this.notifier = notifier;
        this.logger = logger;
    }

    /**
     * Execute the use case.
     *
     * @param {import('../../domain/entities/Character.js').Character} _character - character to save
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} [_lorebook] - optional embedded lorebook
     * @returns {Promise<string>} identifier of saved character
     */
    async execute(_character, _lorebook) {
        // TODO: implement
        throw new Error('SaveCharacterToTavern.execute not implemented');
    }
}
