/**
 * @file Use case: generate and save a character portrait (and optionally
 * expression sprites) in the background after a card is saved. All failures
 * are caught and logged — this use case must never block or error-out the
 * primary save flow.
 */

/**
 * Orchestrate background image generation for a saved character card.
 */
export class GenerateCharacterImages {
    /**
     * Construct the use case with its dependencies.
     *
     * @param {import('../ports/IImageGenerator.js').IImageGenerator} imageGenerator - image generation port
     * @param {import('../ports/ICharacterRepository.js').ICharacterRepository} characterRepository - character persistence port
     * @param {import('../ports/ICardFormatter.js').ICardFormatter} cardFormatter - card formatting port
     * @param {import('../ports/IConfigStore.js').IConfigStore} configStore - user settings port
     * @param {import('../ports/ILogger.js').ILogger} logger - diagnostic logging port
     * @param {import('../ports/INotifier.js').INotifier} notifier - user notification port
     */
    constructor(imageGenerator, characterRepository, cardFormatter, configStore, logger, notifier) {
        this.imageGenerator = imageGenerator;
        this.characterRepository = characterRepository;
        this.cardFormatter = cardFormatter;
        this.configStore = configStore;
        this.logger = logger;
        this.notifier = notifier;
    }

    /**
     * Execute background image generation for a character.
     * Checks user settings and backend availability before generating.
     * All errors are swallowed after logging — callers should not await
     * this method on the primary save path.
     *
     * @param {import('../../domain/entities/Character.js').Character} character - saved character
     * @param {import('../../domain/entities/Lorebook.js').Lorebook|null} [lorebook] - optional lorebook
     * @returns {Promise<void>}
     */
    async execute(character, lorebook) {
        const avatarEnabled = this.configStore.get('generateAvatarAfterSave', true);
        if (!avatarEnabled) {
            return;
        }

        const available = await this.imageGenerator.isAvailable();
        if (!available) {
            this.logger.info('Image generation backend not available — skipping avatar generation');
            return;
        }

        await this._generateAvatar(character, lorebook);
        await this._maybeGenerateSprites(character);
    }

    /**
     * Generate a portrait and re-save the card with the new image.
     *
     * @param {import('../../domain/entities/Character.js').Character} character - character
     * @param {import('../../domain/entities/Lorebook.js').Lorebook|null} [lorebook] - lorebook
     * @returns {Promise<void>}
     */
    async _generateAvatar(character, lorebook) {
        try {
            this.logger.info('Generating avatar portrait', { characterName: character.name });
            const promptText = `${character.description} ${character.personality || ''}`.trim();
            const portraitPng = await this.imageGenerator.generatePortrait(promptText);

            const cardJson = this.cardFormatter.format(character, lorebook);
            await this.characterRepository.save(cardJson, portraitPng);

            this.logger.info('Avatar portrait saved', { characterName: character.name });
            this.notifier.success(`Avatar generated for "${character.name}"`);
        } catch (error) {
            this.logger.warn('Avatar generation failed — card already saved with placeholder', {
                characterName: character.name,
                error: error.message,
            });
        }
    }

    /**
     * Optionally generate a neutral expression sprite when sprites are enabled.
     *
     * @param {import('../../domain/entities/Character.js').Character} character - character
     * @returns {Promise<void>}
     */
    async _maybeGenerateSprites(character) {
        const spritesEnabled = this.configStore.get('generateSpritesAfterSave', false);
        if (!spritesEnabled) {
            return;
        }

        try {
            this.logger.info('Generating neutral expression sprite', { characterName: character.name });
            await this.imageGenerator.generateExpression(character.description, 'neutral');
            this.logger.info('Neutral expression sprite generated', { characterName: character.name });
        } catch (error) {
            this.logger.warn('Expression sprite generation failed', {
                characterName: character.name,
                error: error.message,
            });
        }
    }
}
