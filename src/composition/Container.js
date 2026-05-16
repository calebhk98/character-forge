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
import { AdvancedPromptBuilder } from '../infrastructure/prompts/AdvancedPromptBuilder.js';
import { ExtensionSettingsConfigStore } from '../infrastructure/config/ExtensionSettingsConfigStore.js';
import { ConsoleLogger } from '../infrastructure/logging/ConsoleLogger.js';
import { ToastrNotifier } from '../infrastructure/notifications/ToastrNotifier.js';
import { SillyTavernImageGenerator } from '../infrastructure/images/SillyTavernImageGenerator.js';
import { MockImageGenerator } from '../infrastructure/images/MockImageGenerator.js';
import { CatboxImageHost } from '../infrastructure/images/CatboxImageHost.js';
import { ConfigurableImageHost } from '../infrastructure/images/ConfigurableImageHost.js';
import { MockImageHost } from '../infrastructure/images/MockImageHost.js';
import { GenerateCharacterFromDescription } from '../application/use-cases/GenerateCharacterFromDescription.js';
import { GenerateLorebookForCharacter } from '../application/use-cases/GenerateLorebookForCharacter.js';
import { SaveCharacterToTavern } from '../application/use-cases/SaveCharacterToTavern.js';
import { RefineCharacterField } from '../application/use-cases/RefineCharacterField.js';
import { LoadCharacterForEditing } from '../application/use-cases/LoadCharacterForEditing.js';
import { GenerateCharacterImages } from '../application/use-cases/GenerateCharacterImages.js';
import { UploadGreetingImages } from '../application/use-cases/UploadGreetingImages.js';

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
 * Factory table for prompt builders. Maps promptTemplate config keys to constructors.
 *
 * @type {{[key: string]: Function}}
 */
const PROMPT_BUILDER_FACTORIES = {
    'default': () => new DefaultPromptBuilder(),
    'advanced': () => new AdvancedPromptBuilder(),
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
 * Factory table for image generators.
 *
 * @type {{[key: string]: Function}}
 */
const IMAGE_GEN_FACTORIES = {
    'silly-tavern': (ctx) => new SillyTavernImageGenerator(ctx),
    'mock': () => new MockImageGenerator(),
};

/**
 * Factory table for image host delegates, keyed by provider name.
 *
 * @type {{[key: string]: Function}}
 */
const IMAGE_HOST_DELEGATES = {
    'catbox': () => new CatboxImageHost(),
    'mock': () => new MockImageHost(),
};

/**
 * Build and wire all application services from config.
 *
 * @param {object} config configuration object with defaults applied
 * @param {string} config.llmProvider which LLM adapter to use
 * @param {string} config.cardFormat which card formatter to use
 * @param {string} [config.promptTemplate] which prompt builder to use ('default' | 'advanced')
 * @param {string} [config.imageGenerator] which image generator adapter to use
 * @param {object} stContext SillyTavern context object from getContext()
 * @returns {object} container with all wired services
 */
export function buildContainer(config, stContext) {
    // @ts-ignore - factory return types match port contracts
    const llm = LLM_FACTORIES[config.llmProvider || 'silly-tavern'](config, stContext);
    // @ts-ignore - factory return type matches port contract
    const formatter = FORMATTER_FACTORIES[config.cardFormat || 'v3']();
    // @ts-ignore - factory return type matches port contract
    const promptBuilder = PROMPT_BUILDER_FACTORIES[config.promptTemplate || 'default']();
    const charRepository = new SillyTavernCharacterRepository(stContext);
    const lorebookRepository = new SillyTavernLorebookRepository(stContext);
    const configStore = new ExtensionSettingsConfigStore('character-forge', stContext);
    const logger = new ConsoleLogger('CharacterForge');
    const notifier = new ToastrNotifier(stContext);
    // @ts-ignore - factory return type matches port contract
    const imageGenerator = IMAGE_GEN_FACTORIES[config.imageGenerator || 'silly-tavern'](stContext);

    const imageDelegates = Object.fromEntries(
        Object.entries(IMAGE_HOST_DELEGATES).map(([k, factory]) => [k, factory()]),
    );
    const imageHost = new ConfigurableImageHost(configStore, imageDelegates);

    // Wire use cases
    const generateCharacter = new GenerateCharacterFromDescription(promptBuilder, llm, logger);
    const generateLorebook = new GenerateLorebookForCharacter(promptBuilder, llm, logger);
    const saveCharacter = new SaveCharacterToTavern(formatter, charRepository, notifier, logger);
    const refineCharacterField = new RefineCharacterField(promptBuilder, llm, logger);
    const loadCharacterForEditing = new LoadCharacterForEditing(charRepository, logger);
    const generateCharacterImages = new GenerateCharacterImages(
        imageGenerator, charRepository, formatter, configStore, logger, notifier,
    );
    const uploadGreetingImages = new UploadGreetingImages(imageHost, logger);

    return {
        llm,
        formatter,
        promptBuilder,
        charRepository,
        lorebookRepository,
        configStore,
        logger,
        notifier,
        imageGenerator,
        imageHost,
        generateCharacter,
        generateLorebook,
        saveCharacter,
        refineCharacterField,
        loadCharacterForEditing,
        generateCharacterImages,
        uploadGreetingImages,
    };
}
