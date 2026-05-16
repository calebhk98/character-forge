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
     * @param {import('../ports/ICardFormatter.js').ICardFormatter} cardFormatter - port for formatting to card JSON
     * @param {import('../ports/ICardValidator.js').ICardValidator} cardValidator - port for validating card spec
     * @param {import('../ports/ICharacterRepository.js').ICharacterRepository} characterRepository - port for persisting characters
     * @param {import('../ports/INotifier.js').INotifier} notifier - port for user-facing notifications
     * @param {import('../ports/ILogger.js').ILogger} logger - port for diagnostic logging
     */
    constructor(cardFormatter, cardValidator, characterRepository, notifier, logger) {
        this.cardFormatter = cardFormatter;
        this.cardValidator = cardValidator;
        this.characterRepository = characterRepository;
        this.notifier = notifier;
        this.logger = logger;
    }

    /**
     * Execute the use case.
     *
     * @param {import('../../domain/entities/Character.js').Character} character - character to save
     * @param {import('../../domain/entities/Lorebook.js').Lorebook} [lorebook] - optional embedded lorebook
     * @returns {Promise<string>} identifier of saved character
     */
    async execute(character, lorebook) {
        try {
            this.logger.info('Formatting character card');
            const cardJson = this.cardFormatter.format(character, lorebook);

            this.logger.info('Validating character card against spec');
            this.cardValidator.validate(cardJson);

            this.logger.info('Saving character to SillyTavern', { characterName: character.name });
            const characterId = await this.characterRepository.save(cardJson);

            this.logger.info('Character saved successfully', { characterId });
            this.notifier.success(`Character "${character.name}" saved successfully!`);

            return characterId;
        } catch (error) {
            this.logger.error('Failed to save character', error);
            this.notifier.error(`Failed to save character: ${error.message}`);
            throw error;
        }
    }
}
