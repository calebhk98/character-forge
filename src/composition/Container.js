/**
 * @file Composition root. Reads config and wires concrete adapters to
 * abstract ports. The ONLY place in the codebase that imports from
 * src/infrastructure/. Factory tables allow swapping adapters by config.
 */

import { SillyTavernLlmProvider } from '../infrastructure/llm/SillyTavernLlmProvider.js';
import { MockLlmProvider } from '../infrastructure/llm/MockLlmProvider.js';
import { CardV3Formatter } from '../infrastructure/formatters/CardV3Formatter.js';
import { SillyTavernCharacterRepository } from '../infrastructure/repositories/SillyTavernCharacterRepository.js';
import { SillyTavernLorebookRepository } from '../infrastructure/repositories/SillyTavernLorebookRepository.js';
import { DefaultPromptBuilder } from '../infrastructure/prompts/DefaultPromptBuilder.js';
import { ExtensionSettingsConfigStore } from '../infrastructure/config/ExtensionSettingsConfigStore.js';
import { ConsoleLogger } from '../infrastructure/logging/ConsoleLogger.js';
import { ToastrNotifier } from '../infrastructure/notifications/ToastrNotifier.js';
import { GenerateCharacterFromDescription } from '../application/use-cases/GenerateCharacterFromDescription.js';
import { GenerateLorebookForCharacter } from '../application/use-cases/GenerateLorebookForCharacter.js';
import { SaveCharacterToTavern } from '../application/use-cases/SaveCharacterToTavern.js';

/**
 * @typedef {(cfg: object, ctx: object) => object} LlmFactory
 */

/**
 * Factory table for LLM providers. Maps config keys to constructor functions.
 *
 * @type {{[key: string]: LlmFactory}}
 */
const LLM_FACTORIES = {
    'silly-tavern': (cfg, _ctx) => new SillyTavernLlmProvider(_ctx),
    'mock': (cfg, _ctx) => new MockLlmProvider(cfg.mockResponses),
};

/**
 * Factory table for card formatters.
 *
 * @type {{[key: string]: Function}}
 */
const FORMATTER_FACTORIES = {
    'v3': () => new CardV3Formatter(),
};

/**
 * Build and wire all application services from config.
 *
 * @param {object} config configuration object
 * @param {string} config.llmProvider which LLM adapter to use
 * @param {string} config.cardFormat which card formatter to use
 * @param {object} stContext SillyTavern context object from getContext()
 * @returns {object} container with all wired services
 */
export function buildContainer(config, stContext) {
    // TODO: apply defaults to config
    // @ts-ignore - factory return types match port contracts
    const llm = LLM_FACTORIES[config.llmProvider || 'silly-tavern'](config, stContext);
    // @ts-ignore - factory return type matches port contract
    const formatter = FORMATTER_FACTORIES[config.cardFormat || 'v3']();
    const promptBuilder = new DefaultPromptBuilder();
    const charRepository = new SillyTavernCharacterRepository(stContext);
    const lorebookRepository = new SillyTavernLorebookRepository(stContext);
    const configStore = new ExtensionSettingsConfigStore('character-forge', stContext);
    const logger = new ConsoleLogger('CharacterForge');
    const notifier = new ToastrNotifier(stContext);

    // Wire use cases
    const generateCharacter = new GenerateCharacterFromDescription(promptBuilder, llm, logger);
    const generateLorebook = new GenerateLorebookForCharacter(promptBuilder, llm, logger);
    const saveCharacter = new SaveCharacterToTavern(formatter, charRepository, notifier, logger);

    return {
        llm,
        formatter,
        promptBuilder,
        charRepository,
        lorebookRepository,
        configStore,
        logger,
        notifier,
        generateCharacter,
        generateLorebook,
        saveCharacter,
    };
}
