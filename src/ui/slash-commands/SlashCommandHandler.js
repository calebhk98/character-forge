/**
 * @file Slash command handler for Character Forge. Registers /forge and
 * /forge-from-chat commands with SillyTavern's slash command registry so
 * users can generate character cards without leaving the chat interface.
 */

// @ts-check

/**
 * Registers Character Forge slash commands with SillyTavern.
 */
export class SlashCommandHandler {
    /**
     * Construct the handler.
     *
     * @param {object} container - wired DI container with use cases and notifier
     * @param {object|null} stContext - SillyTavern context from getContext(), or null in tests
     */
    constructor(container, stContext) {
        this.container = container;
        this.stContext = stContext;
    }

    /**
     * Register /forge and /forge-from-chat with SillyTavern.
     * No-ops silently when the context or its registry is unavailable.
     *
     * @returns {void}
     */
    register() {
        if (!this.stContext?.registerSlashCommand) {
            return;
        }

        this.stContext.registerSlashCommand(
            'forge',
            (args) => this._handleForge(args),
            [],
            'Generate a character card from a description. Usage: /forge A grizzled detective',
        );

        this.stContext.registerSlashCommand(
            'forge-from-chat',
            (args) => this._handleForgeFromChat(args),
            [],
            'Extract a character from the current chat and save as a card. Usage: /forge-from-chat Bob',
        );
    }

    /**
     * Handle the /forge command.
     *
     * @param {{value?: string}} args - slash command arguments
     * @returns {Promise<void>}
     */
    async _handleForge(args) {
        const description = args?.value?.trim();
        if (!description) {
            this.container.notifier.error('Usage: /forge <character description>');
            return;
        }

        try {
            this.container.notifier.info(`Generating character: "${description}"…`);
            const character = await this.container.generateCharacter.execute(description, {});
            const lorebook = await this.container.generateLorebook.execute(description, {});
            await this.container.saveCharacter.execute(character, lorebook);
        } catch (error) {
            this.container.notifier.error(`/forge failed: ${error.message}`);
        }
    }

    /**
     * Handle the /forge-from-chat command.
     *
     * @param {{value?: string}} args - slash command arguments
     * @returns {Promise<void>}
     */
    async _handleForgeFromChat(args) {
        const characterName = args?.value?.trim();
        if (!characterName) {
            this.container.notifier.error('Usage: /forge-from-chat <character name>');
            return;
        }

        const chat = this.stContext?.chat ?? [];

        try {
            this.container.notifier.info(`Extracting "${characterName}" from chat…`);
            const description = await this.container.extractCharacterFromChat.execute(characterName, chat);
            const character = await this.container.generateCharacter.execute(description, {});
            const lorebook = await this.container.generateLorebook.execute(description, {});
            await this.container.saveCharacter.execute(character, lorebook);
        } catch (error) {
            this.container.notifier.error(`/forge-from-chat failed: ${error.message}`);
        }
    }
}
