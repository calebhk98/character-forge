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
     * @param {import('../ports/ICardFormatter.js').ICardFormatter} cardFormatter
     * @param {import('../ports/ICharacterRepository.js').ICharacterRepository} characterRepository
     * @param {import('../ports/INotifier.js').INotifier} notifier
     * @param {import('../ports/ILogger.js').ILogger} logger
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
     * @param {import('../../domain/entities/Character.js').Character} character
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} [lorebook]
     * @returns {Promise<string>} identifier of saved character
     */
    async execute(character, lorebook) {
        // TODO: implement
        throw new Error('SaveCharacterToTavern.execute not implemented');
    }
}
